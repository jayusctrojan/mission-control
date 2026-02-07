import { NextRequest, NextResponse } from "next/server";

export function authenticateRequest(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  const apiKey = process.env.INGEST_API_KEY;

  if (!apiKey || token !== apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
