import { NextRequest, NextResponse } from "next/server";
import { getPickSummaries } from "@/lib/data";

// Returns per-pick layer-cohesion scores + token summaries for the user's
// four picks. The client uses these to compute the 追星靈魂 archetype and to
// drive the adaptive questionnaire — without ever loading the catalog.
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
  const summaries = await getPickSummaries(pickIds as string[]);
  return NextResponse.json({ summaries });
}
