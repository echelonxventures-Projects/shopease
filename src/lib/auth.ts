import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const providers: NextAuthOptions["providers"] = [
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })]
    : []),
  ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
    ? [GitHubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
        allowDangerousEmailAccountLinking: true,
      })]
    : []),
  ...(process.env.EMAIL_SERVER
    ? [EmailProvider({
        server: process.env.EMAIL_SERVER,
        from: process.env.EMAIL_FROM || "noreply@shopease.com",
      })]
    : []),
  CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) throw new Error("Invalid credentials");
        if (user.isBlocked) throw new Error("Account is blocked");

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid credentials");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatar,
        };
      },
    }),
];

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
        (token as any).role = (user as any).role;
        token.id = user.id;

        try {
          // Load dynamic role permissions and platform tags
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { platforms: true, roleId: true, dynamicRole: { select: { name: true, permissions: true, routes: true } } },
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
          (token as any).platforms = dbUser?.platforms ?? [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
          (token as any).permissions = dbUser?.dynamicRole?.permissions ?? [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
          (token as any).allowedRoutes = dbUser?.dynamicRole?.routes ?? [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
          (token as any).roleName = dbUser?.dynamicRole?.name ?? (user as any).role?.toLowerCase();

          // Attach the site this admin manages (if any)
          const siteAdmin = await prisma.siteAdmin.findFirst({
            where: { userId: user.id },
            select: { siteId: true },
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
          (token as any).siteId = siteAdmin?.siteId ?? null;
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).permissions = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).allowedRoutes = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).roleName = (user as any).role?.toLowerCase();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).siteId = null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
        (session.user as any).role = token.role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
        (session.user as any).id = token.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
        (session.user as any).siteId = (token as any).siteId ?? null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
        (session.user as any).permissions = (token as any).permissions ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
        (session.user as any).allowedRoutes = (token as any).allowedRoutes ?? [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
        (session.user as any).roleName = (token as any).roleName ?? null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth type augmentation needed outside scope
        (session.user as any).platforms = (token as any).platforms ?? [];
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const getSession = () => getServerSession(authOptions);

/** Returns true if the role is ADMIN or SUPER_ADMIN (backward compat with enum) */
export function isAdminRole(role: string | undefined | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/** Check if the session has a specific permission (from dynamic role) */
export function hasPermission(session: { user?: { permissions?: string[]; role?: string } } | null, permission: string): boolean {
  if (!session?.user) return false;
  if (session.user.role === "SUPER_ADMIN") return true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perms = (session.user as any).permissions as string[] | undefined;
  return perms?.includes(permission) ?? false;
}
