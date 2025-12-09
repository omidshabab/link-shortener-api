import { defineConfig } from '@prisma/config';

// DATABASE_URL will be provided via environment variables (from docker-compose)
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});
