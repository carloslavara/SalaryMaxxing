import { NextRequest, NextResponse } from "next/server";
import { providerFor } from "@/lib/providers";
import { normalizeCountry, type LocationInput, type OccupationMatch } from "@/lib/salary-provider";

type SearchBody = { jobTitle?: string; occupation?: Partial<OccupationMatch>; location?: { city?: string; region?: string; country?: string }; hoursPerWeek?: number; weeksPerYear?: number };

export async function POST(request: NextRequest) {
  let debug: unknown;
  try {
    const body = await request.json() as SearchBody;
    const country = normalizeCountry(body.location?.country || "");
    if (!country) return NextResponse.json({ error: "UNSUPPORTED_COUNTRY", message: "Automatic government salary lookup currently supports Canada and the United States. You can still enter your target salary manually." }, { status: 400 });
    if (!body.location?.city || !body.location.region || !body.occupation?.code || !body.occupation.title) return NextResponse.json({ error: "INVALID_REQUEST", message: "Select an occupation and provide a city, state/province, and country." }, { status: 400 });
    const provider = providerFor(country); const expected = country === "US" ? "SOC" : "NOC";
    if (body.occupation.country !== country || body.occupation.classification !== expected) return NextResponse.json({ error: "CLASSIFICATION_MISMATCH", message: `${country} salary searches require a ${expected} occupation selected for that country.` }, { status: 400 });
    const occupation = body.occupation as OccupationMatch;
    const location: LocationInput = { city: body.location.city.trim(), region: body.location.region.trim().toUpperCase(), country };
    const lookup = await provider.lookup(occupation, location, Math.max(1, body.hoursPerWeek || 40), Math.max(1, body.weeksPerYear || 52)); debug = lookup.debug;
    if (!lookup.result) return NextResponse.json({ error: lookup.reason, message: "We found the occupation, but the government dataset does not publish a usable wage estimate for it. Try another occupation match or enter a target salary manually.", ...(process.env.NODE_ENV === "development" ? { debug } : {}) }, { status: 404 });
    return NextResponse.json({ results: [lookup.result], message: lookup.result.fallbackMessage });
  } catch (error) {
    console.error("salary_lookup_failed", { debug, exception: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "SALARY_LOOKUP_FAILED", message: "We couldn't retrieve salary data right now. You can still enter a target salary manually.", ...(process.env.NODE_ENV === "development" ? { debug } : {}) }, { status: 500 });
  }
}
