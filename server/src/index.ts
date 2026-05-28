import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { createApp } from "./app.js";

async function main() {
  await connectDatabase();
  const app = createApp();
  app.listen(env.port, () => {
    console.info(`[api] http://localhost:${env.port}/api`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
