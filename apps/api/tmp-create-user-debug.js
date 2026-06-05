const dotenv = require('dotenv');
const path = require('path');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

dotenv.config({ path: path.resolve(__dirname, '.env') });
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL startsWith postgres:', process.env.DATABASE_URL?.startsWith('postgres'));
console.log('resolved env path', path.resolve(__dirname, '.env'));
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
console.log('pool created');
