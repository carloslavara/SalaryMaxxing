import { NextRequest, NextResponse } from "next/server";
import { providersFor } from "@/lib/providers";
import { parseLocation } from "@/lib/salary-provider";

export const revalidate = 86400;

export async function GET(request: NextRequest) {
  const jobTitle = request.nextUrl.searchParams.get("jobTitle")?.trim();
  const rawLocation = request.nextUrl.searchParams.get("location")?.trim();
  if (!jobTitle || !rawLocation) return NextResponse.json({ error: "Job title and a country-qualified location are required." }, { status: 400 });
  const location = parseLocation(rawLocation);
  if (location.country === "OTHER") return NextResponse.json({ matches: [], country: "OTHER", message: "Government lookup currently supports locations in Canada and the United States. You can still enter a target manually." });
  const primary = providersFor(location.country).find((provider) => provider.category === "government");
  const matches = primary ? await primary.searchOccupations(jobTitle) : [];
  return NextResponse.json({ matches, country: location.country, provider: primary?.name, message: matches.length ? undefined : "No confident occupation match was found. Try a broader job title or enter a target manually." });
}
