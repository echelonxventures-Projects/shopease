import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnvOrExit } = await import("@/lib/env-validation");
    validateEnvOrExit();

    if (process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.01,
        replaysOnErrorSampleRate: 1.0,
        beforeSend(event) {
          if (event.request?.headers) {
            delete (event.request.headers as Record<string, unknown>).cookie;
          }
          return event;
        },
      });
    }
  }
}
