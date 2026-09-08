import { server } from "./index";

const parsePort = (value: string | undefined) => {
  const port = Number(value ?? 2567);
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error(`Invalid PORT: ${value ?? ""}`);
  }
  return port;
};

const port = parsePort(process.env.PORT);
const host = process.env.HOST?.trim() || "0.0.0.0";
let shuttingDown = false;

const shutdown = async (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`[blind-run-match] ${signal}: shutting down`);
  await server.gracefullyShutdown(false);
};

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));

const main = async () => {
  await server.listen(port, host);
  console.info(`[blind-run-match] listening on ${host}:${port}`);
};

void main().catch((error: unknown) => {
  console.error("[blind-run-match] failed to start", error);
  process.exitCode = 1;
});
