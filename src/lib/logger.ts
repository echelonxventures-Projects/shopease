import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: isProduction ? "info" : "debug",
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
        },
      },
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
    ? { pid: process.pid, host: require("os").hostname() }
    : undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;
