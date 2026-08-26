# SalaryMaxxing

A Next.js compensation-to-workday calculator with optional, server-side salary research.

## Salary data

Manual target entry is always available. Government sources are selected first by country:

- Canada → Canada Job Bank (NOC 2021)
- United States → BLS OEWS (SOC 2018)
- Other/ambiguous countries → manual entry

Job Bank and OEWS distribute official wage data through bulk releases rather than a stable title-search API. To avoid scraping their presentation websites, set `JOB_BANK_DATA_URL` and/or `BLS_OEWS_DATA_URL` to an approved normalized JSON adapter backed by the agencies' current bulk data. The server adds `occupationCode` and `location` query parameters and caches successful requests for 24 hours.

The adapter returns an array of salary records using the `SalaryResult` fields from `lib/salary-provider.ts` (excluding server-populated provider metadata). It should return available geographies together; SalaryMaxxing selects metro, then province/state, then national data and labels any fallback. Hourly Job Bank results are annualized using the schedule submitted by the calculator.

Adzuna is optional secondary market context. Configure `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`; credentials remain in the Route Handler and are never sent to the browser. Government and market estimates remain separate and are never averaged.

See `.env.example` for configuration.

## Development

```bash
npm install
npm test
npm run build
```
