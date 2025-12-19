const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.PGPASSWORD) {
  console.warn("⚠️  Attention: PGPASSWORD n'est pas défini dans le fichier .env");
}

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGNAME || process.env.PGDATABASE, // Support both names
  password: process.env.PGPASSWORD || "", // Prevent 'must be a string' error
  port: process.env.PGPORT,
  ssl: process.env.PGHOST !== 'localhost' ? { rejectUnauthorized: false } : false, // Enable SSL for remote hosts (Supabase)
});

exports.pool = pool;
