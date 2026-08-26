import { NextRequest, NextResponse } from "next/server";
import { providersFor } from "@/lib/providers";
import { parseLocation } from "@/lib/salary-provider";

/**
 * Backwards-compatible entry point for clients using the original salary URL.
 * New clients should use /api/salary/occupations followed by /api/salary/search
 * so a user can confirm the standardized occupation before wages are requested.
 */
export async function GET(request: NextRequest) {
  const jobTitle = request.nextUrl.searchParams.get("jobTitle")?.trim();
  const rawLocation = request.nextUrl.searchParams.get("location")?.trim();

  if (!jobTitle || !rawLocation) {
    return NextResponse.json(
      { error: "Job title and a country-qualified location are required.", results: [] },
      { status: 400 },
    );
  }

  const location = parseLocation(rawLocation);
  const governmentProvider = providersFor(location.country).find(
    (provider) => provider.category === "government",
  );
  const matches = governmentProvider
    ? await governmentProvider.searchOccupations(jobTitle)
    : [];

  return NextResponse.json({
    results: [],
    matches,
    country: location.country,
    provider: governmentProvider?.name,
    message: matches.length
      ? "Choose an occupation, then submit it to /api/salary/search."
      : "No government occupation match was found. Manual target entry remains available.",
  });
}
