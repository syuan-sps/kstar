import { NextRequest, NextResponse } from "next/server";
import { getConstellation } from "@/lib/data";

// Returns the 星圖 force-graph (nodes + edges) for the user's four picks.
// Computed server-side so the catalog never reaches the client.
export async function POST(req: NextRequest) {
  let pickIds: unknown;
  try {
    ({ pickIds } = await req.json());
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!Array.isArray(pickIds) || pickIds.some((x) => typeof x !== "string")) {
    return NextResponse.json({ error: "invalid pickIds" }, { status: 400 });
  }
  const graph = await getConstellation(pickIds as string[]);
  return NextResponse.json(graph);
}
