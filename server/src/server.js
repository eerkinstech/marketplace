import http from "http";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { initSocketServer } from "./sockets/index.js";

const start = async () => {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);
  initSocketServer(server);

  server.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
