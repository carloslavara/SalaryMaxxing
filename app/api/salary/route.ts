import { NextRequest, NextResponse } from "next/server";
import { salaryProviders } from "@/lib/salary-provider";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const jobTitle = query.get("jobTitle")?.trim();
  const location = query.get("location")?.trim();
  if (!jobTitle || !location) return NextResponse.json({ error: "Job title and location are required." }, { status: 400 });
  const results = (await Promise.allSettled(salaryProviders.map((p) => p.search({ jobTitle, location, currency: query.get("currency") || "USD" })))).flatMap((result) => result.status === "fulfilled" ? result.value : []);
  return NextResponse.json({ results, message: results.length ? undefined : "No licensed salary data provider is configured. Manual target entry remains available." });
}
