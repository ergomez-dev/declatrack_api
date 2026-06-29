import app from './app';
import { env } from './config/env';
import prisma from './config/database';
import logger from './config/logger';

async function main() {
  await prisma.$connect();
  logger.info('📦 Conectado a PostgreSQL');

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 DECLATRACK Multitenant Server running on port ${env.PORT}`);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM recibido, cerrando servidor...');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  });
}

main().catch((err) => {
  console.error('Error fatal al iniciar servidor:', err);
  process.exit(1);
});
