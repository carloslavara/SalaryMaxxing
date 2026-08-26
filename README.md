# SalaryMaxxing

A Next.js compensation-to-workday calculator with optional, server-side salary research.

## Salary data

Manual target entry is always available. Government sources are selected first by country:

- Canada → Canada Job Bank (NOC 2021)
- United States → BLS OEWS (SOC 2018)
- Other/ambiguous countries → manual entry

Job Bank and OEWS distribute official wage data through bulk releases rather than one stable API for every occupation/geography combination. SalaryMaxxing therefore reads normalized, server-only JSON snapshots from `data/salary`; runtime lookups never call a government website or download a spreadsheet.

The separate country pipelines select metro → state → national for OEWS and economic region → province → national for Job Bank. Hourly Job Bank results are annualized using the schedule submitted by the calculator, and the UI labels the conversion.

To refresh a snapshot, download an official CSV extract, set `OEWS_SOURCE_CSV` or `JOB_BANK_SOURCE_CSV` to its local path (or official download URL), and run `npm run update:oews` or `npm run update:jobbank`. `npm run update:salary-data` runs both imports. The ingestion script handles quoted CSV fields and suppressed values, trims unused columns, and writes geography-specific application data.

See `.env.example` for configuration.

## Development

```bash
npm install
npm test
npm run build
```

`POST /api/salary/search` is the sole wage-result endpoint. In development it includes lookup diagnostics on errors; production diagnostics are written only to server logs.
