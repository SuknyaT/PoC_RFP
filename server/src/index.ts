import app from './app.js';
import { env } from './config/environment.js';
import { connectDatabase } from './config/database.js';

async function main() {
  await connectDatabase();

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
}

main().catch(console.error);
