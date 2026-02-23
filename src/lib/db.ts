import { neon } from "@neondatabase/serverless";

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }
  return neon(databaseUrl);
}

export async function initDb() {
  const sql = getDb();
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS prompt_history (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMP DEFAULT NOW(),
      images_count INTEGER,
      prompts JSONB,
      results JSONB
    )
  `;
}

export async function saveToHistory(
  id: string,
  imagesCount: number,
  prompts: { imageIndex: number; description: string }[],
  results: { imageIndex: number; result: string }[]
) {
  const sql = getDb();
  if (!sql) return;

  try {
    await sql`
      INSERT INTO prompt_history (id, images_count, prompts, results)
      VALUES (${id}, ${imagesCount}, ${JSON.stringify(prompts)}, ${JSON.stringify(results)})
    `;
  } catch (e) {
    console.error("Failed to save to history:", e);
  }
}

export async function getHistory(limit = 20) {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT * FROM prompt_history ORDER BY created_at DESC LIMIT ${limit}
    `;
    return rows;
  } catch {
    return [];
  }
}
