import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  urjaBaseUrl: process.env.URJA_BASE_URL || 'https://urja-ops.flockenergy.tech',
  urjaEmail: process.env.URJA_EMAIL || '',
  urjaPassword: process.env.URJA_PASSWORD || '',
};
