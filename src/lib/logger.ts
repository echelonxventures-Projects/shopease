import pino from "pino";
import * as os from "node:os";

const isProduction = process.env.NODE_ENV === "production";

/** Use pino-pretty only in non-production AND only if it is installed. */
function prettyTransport() {
  if (isProduction) return undefined;
  try {
    require.resolve("pino-pretty");
    return {
      target: "pino-pretty",
      options: { colorize: true, ignore: "pid,hostname" },
    };
  } catch {
    return undefined; // fall back to default JSON output
  }
}

export const logger = pino({
  level: isProduction ? "info" : "debug",
  transport: prettyTransport(),
  redact: {
    paths: [
      "password",
      "token",
      "secret",
      "authorization",
      "*.authorization",
      "*.token",
      "*.password",
      "*.secret",
    ],
    remove: true,
  },
  base: isProduction
    ? { pid: process.pid, host: os.hostname() }
    : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
