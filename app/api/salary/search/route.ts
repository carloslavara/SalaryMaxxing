import { NextRequest, NextResponse } from "next/server";
import { providerById, providersFor } from "@/lib/providers";
import { parseLocation, type OccupationMatch } from "@/lib/salary-provider";

export const revalidate = 86400;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { occupation?: OccupationMatch; location?: string; hoursPerWeek?: number; weeksPerYear?: number };
    if (!body.occupation || !body.location) return NextResponse.json({ error: "An occupation and location are required." }, { status: 400 });
    const location = parseLocation(body.location);
    const primary = providerById(body.occupation.providerId);
    if (!primary || !primary.countries.includes(location.country)) return NextResponse.json({ error: "The selected occupation is not valid for this country." }, { status: 400 });
    const options = { hoursPerWeek: Math.max(1, body.hoursPerWeek || 40), weeksPerYear: Math.max(1, body.weeksPerYear || 52) };
    const selected = providersFor(location.country).filter((provider) => provider.id === primary.id || provider.category === "market");
    const settled = await Promise.allSettled(selected.map((provider) => provider.getSalaryData(body.occupation!, location, options)));
    const results = settled.flatMap((entry) => entry.status === "fulfilled" ? entry.value : []);
    return NextResponse.json({ results, failures: settled.filter((entry) => entry.status === "rejected").length, message: results.length ? undefined : "We couldn't retrieve salary data right now. You can still enter a target salary manually." });
  } catch {
    return NextResponse.json({ results: [], message: "We couldn't retrieve salary data right now. You can still enter a target salary manually." }, { status: 503 });
  }
}
