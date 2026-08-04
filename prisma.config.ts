import 'dotenv/config';

const config = {
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
};

export default config;