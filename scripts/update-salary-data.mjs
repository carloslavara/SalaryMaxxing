import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const country = process.argv[2];
if (!['us', 'ca'].includes(country)) throw new Error("Usage: node scripts/update-salary-data.mjs <us|ca>");
const source = process.env[country === 'us' ? 'OEWS_SOURCE_CSV' : 'JOB_BANK_SOURCE_CSV'];
if (!source) throw new Error(`Set ${country === 'us' ? 'OEWS_SOURCE_CSV' : 'JOB_BANK_SOURCE_CSV'} to an official downloaded/hosted CSV export.`);

const text = /^https?:/.test(source) ? await fetch(source).then((response) => {
  if (!response.ok) throw new Error(`Download failed: ${response.status}`); return response.text();
}) : await readFile(source, 'utf8');

function parseCsv(input) {
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (char === '"' && quoted && input[index + 1] === '"') { field += '"'; index++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && input[index + 1] === '\n') index++; row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift().map((header) => header.trim());
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ''])));
}

const missing = /^(?:|\*|\*\*|#|N\/?A|—|–|-)$/i;
const numeric = (value) => {
  if (missing.test(String(value ?? '').trim())) return undefined;
  const parsed = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
};
const value = (row, ...names) => names.map((name) => row[name]).find((item) => item !== undefined);
const rows = parseCsv(text);
const normalized = rows.map((row) => ({
  occupationCode: String(value(row, 'occupationCode', 'OCC_CODE', 'noc_code') || '').trim(),
  occupationTitle: value(row, 'occupationTitle', 'OCC_TITLE', 'noc_title'), geographyType: value(row, 'geographyType', 'AREA_TYPE', 'geography_type'),
  geographyCode: value(row, 'geographyCode', 'AREA', 'geography_code'), geographyName: value(row, 'geographyName', 'AREA_TITLE', 'geography_name'), regionCode: value(row, 'regionCode', 'PRIM_STATE', 'province_code'),
  medianAnnual: numeric(value(row, 'medianAnnual', 'A_MEDIAN', 'median_annual')), meanAnnual: numeric(value(row, 'meanAnnual', 'A_MEAN', 'mean_annual')),
  lowAnnual: numeric(value(row, 'lowAnnual', 'A_PCT10', 'low_annual')), highAnnual: numeric(value(row, 'highAnnual', 'A_PCT90', 'high_annual')),
  medianHourly: numeric(value(row, 'medianHourly', 'H_MEDIAN', 'median_hourly', 'median_wage')), meanHourly: numeric(value(row, 'meanHourly', 'H_MEAN', 'mean_hourly')),
  lowHourly: numeric(value(row, 'lowHourly', 'H_PCT10', 'low_hourly', 'low_wage')), highHourly: numeric(value(row, 'highHourly', 'H_PCT90', 'high_hourly', 'high_wage')),
  dataYear: numeric(value(row, 'dataYear', 'YEAR', 'data_year')), sourceUrl: value(row, 'sourceUrl', 'source_url') || (country === 'us' ? 'https://www.bls.gov/oes/' : 'https://www.jobbank.gc.ca/trend-analysis/search-wages'),
})).filter((row) => row.occupationCode && row.geographyType && row.geographyName);

const groups = country === 'us' ? { metros: ['metro'], states: ['state'], national: ['national'] } : { regions: ['economic_region'], provinces: ['province'], national: ['national'] };
const destination = path.join(process.cwd(), 'data', 'salary', country); await mkdir(destination, { recursive: true });
for (const [name, types] of Object.entries(groups)) await writeFile(path.join(destination, `${name}.json`), `${JSON.stringify(normalized.filter((row) => types.includes(row.geographyType)), null, 2)}\n`);
const occupations = [...new Map(normalized.map((row) => [row.occupationCode, { code: row.occupationCode, title: row.occupationTitle, aliases: [] }])).values()];
await writeFile(path.join(destination, 'occupations.json'), `${JSON.stringify(occupations, null, 2)}\n`);
const cities = Object.fromEntries(rows.flatMap((raw) => {
  const city = value(raw, 'city', 'CITY', 'city_alias');
  const code = value(raw, 'geographyCode', 'AREA', 'geography_code'); const name = value(raw, 'geographyName', 'AREA_TITLE', 'geography_name'); const region = value(raw, 'regionCode', 'PRIM_STATE', 'province_code');
  return city && code ? [[`${String(city).toLowerCase()}|${region}`, { code, name }]] : [];
}));
const regionKey = country === 'us' ? 'states' : 'provinces';
const regionTypes = country === 'us' ? ['state'] : ['province'];
const regions = Object.fromEntries(normalized.filter((row) => regionTypes.includes(row.geographyType) && row.regionCode).map((row) => [row.regionCode, { code: row.geographyCode, name: row.geographyName }]));
await writeFile(path.join(destination, 'geographies.json'), `${JSON.stringify({ cities, [regionKey]: regions }, null, 2)}\n`);
console.log(`Imported ${normalized.length} normalized ${country.toUpperCase()} wage records from ${source}.`);
