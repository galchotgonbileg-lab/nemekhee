import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required in environment variables");
}

export const pool = new Pool({
  connectionString: databaseUrl
});

export async function query(text: string, params?: Array<unknown>) {
  const client = await pool.connect();

  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
