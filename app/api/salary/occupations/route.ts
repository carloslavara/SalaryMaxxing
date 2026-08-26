import { NextRequest, NextResponse } from "next/server";
import { providerFor } from "@/lib/providers";
import { parseLocation } from "@/lib/salary-provider";

export const revalidate = 86400;

export async function GET(request: NextRequest) {
  const jobTitle = request.nextUrl.searchParams.get("jobTitle")?.trim();
  const rawLocation = request.nextUrl.searchParams.get("location")?.trim();
  if (!jobTitle || !rawLocation) return NextResponse.json({ error: "Job title and a country-qualified location are required." }, { status: 400 });
  const location = parseLocation(rawLocation);
  if (!location) return NextResponse.json({ matches: [], message: "Automatic government salary lookup currently supports country-qualified Canadian and United States locations. You can still enter your target salary manually." });
  const primary = providerFor(location.country);
  const matches = await primary.searchOccupations(jobTitle);
  return NextResponse.json({ matches, country: location.country, provider: primary.name, message: matches.length ? undefined : "No confident occupation match was found. Try a broader job title or enter a target manually." });
}
