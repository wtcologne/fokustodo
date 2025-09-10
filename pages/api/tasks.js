import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { sql } from "@vercel/postgres";

async function ensure() {
  await sql`CREATE TABLE IF NOT EXISTS focus_tasks (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    text TEXT NOT NULL, done BOOLEAN DEFAULT FALSE,
    pomodoros INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
  );`;
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) return res.status(401).json({ error: "not_authenticated" });
  const userId = session.user.email;
  await ensure();

  try {
    if (req.method === "GET") {
      const { rows } = await sql`SELECT id,text,done,pomodoros FROM focus_tasks WHERE user_id=${userId} ORDER BY created_at DESC;`;
      return res.json({ tasks: rows });
    }
    if (req.method === "POST") {
      const { id, text, done=false, pomodoros=0 } = req.body || {};
      if (!id || !text) return res.status(400).json({ error: "missing_fields" });
      await sql`INSERT INTO focus_tasks (id,user_id,text,done,pomodoros)
                VALUES (${id},${userId},${text},${done},${pomodoros})
                ON CONFLICT (id) DO UPDATE SET text=excluded.text, done=excluded.done, pomodoros=excluded.pomodoros, updated_at=now();`;
      return res.json({ ok: true });
    }
    if (req.method === "PUT") {
      const { id, updates } = req.body || {};
      if (!id || !updates) return res.status(400).json({ error: "missing_fields" });
      const fields = [];
      if (typeof updates.text === "string") fields.push(sql`text=${updates.text}`);
      if (typeof updates.done === "boolean") fields.push(sql`done=${updates.done}`);
      if (typeof updates.pomodoros === "number") fields.push(sql`pomodoros=${updates.pomodoros}`);
      if (fields.length) await sql`UPDATE focus_tasks SET ${sql.join(fields, sql`, `)}, updated_at=now() WHERE id=${id} AND user_id=${userId};`;
      return res.json({ ok: true });
    }
    if (req.method === "DELETE") {
      const { id, clearDone, eraseAll } = req.query;
      if (eraseAll) await sql`DELETE FROM focus_tasks WHERE user_id=${userId};`
      else if (clearDone) await sql`DELETE FROM focus_tasks WHERE user_id=${userId} AND done=true;`
      else if (id) await sql`DELETE FROM focus_tasks WHERE id=${id} AND user_id=${userId};`
      else return res.status(400).json({ error: "missing_params" });
      return res.json({ ok: true });
    }
    res.setHeader("Allow","GET,POST,PUT,DELETE"); res.status(405).end("Method Not Allowed");
  } catch (e) { console.error(e); res.status(500).json({ error: "server_error" }); }
}