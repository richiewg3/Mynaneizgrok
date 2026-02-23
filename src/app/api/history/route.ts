import { NextResponse } from "next/server";
import { getHistory, initDb } from "@/lib/db";

export async function GET() {
  try {
    await initDb();
    const history = await getHistory();
    return NextResponse.json({ history });
  } catch {
    return NextResponse.json({ history: [] });
  }
}
