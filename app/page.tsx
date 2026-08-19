"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { calculateSalary, endTime, formatCurrency, formatHours, hoursMinutes } from "@/lib/calculations";

const currencies = ["CAD", "USD", "GBP", "EUR", "AUD", "OTHER"];
const number = (value: string) => Math.max(0, Number(value) || 0);

export default function Home() {
  const [salary, setSalary] = useState("120000");
  const [targets, setTargets] = useState(["150000"]);
  const [currency, setCurrency] = useState("USD");
  const [hours, setHours] = useState("8");
  const [days, setDays] = useState("5");
  const [weeks, setWeeks] = useState("52");
  const [vacation, setVacation] = useState("0");
  const [holidays, setHolidays] = useState("0");
  const [start, setStart] = useState("09:00");
  const [bonus, setBonus] = useState("0");
  const [equity, setEquity] = useState("0");
  const [other, setOther] = useState("0");
  const [job, setJob] = useState("");
  const [location, setLocation] = useState("");
  const [years, setYears] = useState("");
  const [lookup, setLookup] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("salary")) setSalary(p.get("salary")!);
    if (p.get("target")) setTargets(p.get("target")!.split(",").slice(0, 5));
    if (p.get("hours")) setHours(p.get("hours")!);
    if (p.get("days")) setDays(p.get("days")!);
    if (p.get("currency") && currencies.includes(p.get("currency")!.toUpperCase())) setCurrency(p.get("currency")!.toUpperCase());
  }, []);

  const calculations = useMemo(() => targets.map((target) => calculateSalary({
    currentSalary: number(salary), targetSalary: Math.max(1, number(target)), hoursPerDay: Math.max(.1, number(hours)),
    daysPerWeek: Math.max(1, number(days)), weeksPerYear: Math.max(1, number(weeks)), vacationWeeks: number(vacation), paidHolidays: number(holidays), currentExtraComp: number(bonus) + number(equity) + number(other),
  })), [salary, targets, hours, days, weeks, vacation, holidays, bonus, equity, other]);
  const result = calculations[0];

  async function findSalary(event: FormEvent) {
    event.preventDefault(); setLookup("Dialing salary data providers...");
    const response = await fetch(`/api/salary?jobTitle=${encodeURIComponent(job)}&location=${encodeURIComponent(location)}&currency=${currency}&years=${years}`);
    const data = await response.json();
    setLookup(data.message || data.error || `${data.results.length} estimate(s) found.`);
  }

  function share() {
    const p = new URLSearchParams({ salary, target: targets.join(","), hours, days, currency });
    navigator.clipboard.writeText(`${locationOrigin()}?${p}`).then(() => setLookup("Scenario URL copied to clipboard!"));
  }
  const locationOrigin = () => `${window.location.origin}${window.location.pathname}`;
  const paidPercent = Math.min(100, (number(salary) + number(bonus) + number(equity) + number(other)) / Math.max(1, number(targets[0])) * 100);

  return <main className="site-shell">
    <header className="masthead">
      <div className="brand-row"><span className="logo-money">$</span><div><h1>SalaryMaxxing</h1><p>The World Wide Web&apos;s Premier Salary-to-Work Ratio Calculator</p></div><span className="badge">56K<br/>APPROVED</span></div>
      <div className="ticker"><span>★★★ CALCULATE HOW MUCH OF YOUR WORKDAY MATCHES YOUR MARKET RATE! ★★★ &nbsp; BOOKMARK THIS PAGE! &nbsp; ★★★</span></div>
      <nav aria-label="Page links"><a href="#calculator">Calculator</a> | <a href="#compare">Compare salaries</a> | <a href="#about">What is this?</a></nav>
    </header>

    <section className="welcome"><strong>Welcome, compensation surfer!</strong> Enter your numbers below. No account, database, or animated paperclip required.</section>
    <div className="layout">
      <div>
        <section className="window" id="calculator"><h2><span>1</span> Current employment information</h2><div className="form-grid">
          <label>Current annual salary<input type="number" min="0" step="100" value={salary} onChange={(e) => setSalary(e.target.value)} /></label>
          <label>Currency<select value={currency} onChange={(e) => setCurrency(e.target.value)}>{currencies.map(c => <option key={c}>{c}</option>)}</select></label>
        </div></section>

        <section className="window"><h2><span>2</span> Choose your target salary</h2>
          <div className="tabs"><strong>● Manual target</strong><span>○ Market lookup</span></div>
          <label className="wide-label">What salary should this job pay?<input type="number" min="1" step="100" value={targets[0]} onChange={(e) => setTargets([e.target.value, ...targets.slice(1)])} /></label>
          <p className="hint">Manual entry always works—even if the Information Superhighway has traffic.</p>
          <form className="lookup" onSubmit={findSalary}><h3>🔎 Find a market salary <small>(optional beta)</small></h3><div className="form-grid">
            <label>Job title<input required value={job} placeholder="Software Development Manager" onChange={e => setJob(e.target.value)} /></label>
            <label>City / region / country<input required value={location} placeholder="Vancouver, BC, Canada" onChange={e => setLocation(e.target.value)} /></label>
            <label>Years in role (optional)<input type="number" min="0" value={years} onChange={e => setYears(e.target.value)} /></label>
          </div><button type="submit">Find my market rate</button>{lookup && <p className="status" role="status">{lookup}</p>}</form>
        </section>

        <details className="window advanced"><summary>⚙ Advanced settings</summary><div className="form-grid">
          <label>Hours / day<input type="number" min="0.1" max="24" step="0.25" value={hours} onChange={e => setHours(e.target.value)} /></label>
          <label>Days / week<input type="number" min="1" max="7" step="1" value={days} onChange={e => setDays(e.target.value)} /></label>
          <label>Paid weeks / year<input type="number" min="1" max="53" value={weeks} onChange={e => setWeeks(e.target.value)} /></label>
          <label>Vacation weeks<input type="number" min="0" max="52" step="0.5" value={vacation} onChange={e => setVacation(e.target.value)} /></label>
          <label>Paid holidays<input type="number" min="0" max="50" value={holidays} onChange={e => setHolidays(e.target.value)} /></label>
          <label>Workday start<input type="time" value={start} onChange={e => setStart(e.target.value)} /></label>
          <label>Annual bonus<input type="number" min="0" value={bonus} onChange={e => setBonus(e.target.value)} /></label>
          <label>Equity / RSUs<input type="number" min="0" value={equity} onChange={e => setEquity(e.target.value)} /></label>
          <label>Other compensation<input type="number" min="0" value={other} onChange={e => setOther(e.target.value)} /></label>
        </div><p className="hint">Extra compensation is included in current annual compensation. Vacation and holidays reduce hours worked for the hourly-rate illustration.</p></details>
      </div>

      <aside className="results" aria-live="polite"><div className="result-title">YOUR SALARYMAXXED WORK DAY:</div>
        {result.meetsTarget ? <><div className="big-time">{hoursMinutes(result.adjustedDay)}</div><strong>Your current compensation already meets or exceeds the selected target salary.</strong></> : <><div className="big-time">{hoursMinutes(result.adjustedDay)}</div><strong>Your salary-adjusted workday</strong><p>{hoursMinutes(result.dailyReduction)} less than a {hoursMinutes(number(hours))} workday</p></>}
        <div className="bars"><div className="bar-label"><b>Normal workday</b><span>{hoursMinutes(number(hours))}</span></div><div className="bar normal"><i /></div><div className="bar-label"><b>SalaryMaxxed</b><span>{hoursMinutes(result.adjustedDay)}</span></div><div className="bar adjusted"><i style={{ width: `${paidPercent}%` }} /></div><div className="legend"><i/> matched portion <i/> salary gap</div></div>
        {!result.meetsTarget && <p className="coverage">Your salary covers approximately <b>{Math.round(paidPercent)}%</b> of an equivalent {formatCurrency(number(targets[0]), currency)} workday.</p>}
        <dl className="stats">
          <div><dt>Current compensation</dt><dd>{formatCurrency(number(salary) + number(bonus) + number(equity) + number(other), currency)}</dd></div><div><dt>Target salary</dt><dd>{formatCurrency(number(targets[0]), currency)}</dd></div>
          <div><dt>Compensation gap</dt><dd>{formatCurrency(result.salaryGap, currency)}</dd></div><div><dt>Salary vs. target</dt><dd>{Math.abs(result.percentDifference).toFixed(1)}% {result.percentDifference >= 0 ? "above" : "below"}</dd></div>
          <div><dt>Current schedule</dt><dd>{formatHours(number(hours) * number(days))} hrs/week</dd></div><div><dt>Adjusted schedule</dt><dd>{formatHours(result.adjustedWeek)} hrs/week</dd></div>
          <div><dt>Weekly difference</dt><dd>{formatHours(result.weeklyReduction)} hrs</dd></div><div><dt>Illustrated end time</dt><dd>{endTime(start, result.adjustedDay)}</dd></div>
          <div><dt>Current hourly</dt><dd>{formatCurrency(result.currentHourly, currency, 2)}</dd></div><div><dt>Target hourly</dt><dd>{formatCurrency(result.targetHourly, currency, 2)}</dd></div>
        </dl><p className="math-check">✓ Adjusted effective rate: <b>{formatCurrency(result.adjustedHourly, currency, 2)}/hr</b></p><p className="hint">End time is a mathematical illustration, not workplace advice.</p>
        <button onClick={share}>🔗 Copy shareable scenario</button>
      </aside>
    </div>

    <section className="window compare" id="compare"><h2><span>3</span> Comparison mode</h2><div className="table-wrap"><table><thead><tr><th>Target</th><th>Workday</th><th>Weekly hours</th><th>Weekly reduction</th><th><span className="sr-only">Remove</span></th></tr></thead><tbody>{targets.map((target, index) => <tr key={index}><td><input aria-label={`Target salary ${index + 1}`} type="number" min="1" value={target} onChange={e => setTargets(targets.map((v, i) => i === index ? e.target.value : v))}/></td><td>{hoursMinutes(calculations[index].adjustedDay)}</td><td>{formatHours(calculations[index].adjustedWeek)}h</td><td>{formatHours(calculations[index].weeklyReduction)}h</td><td>{index > 0 && <button className="tiny" aria-label={`Remove target ${index + 1}`} onClick={() => setTargets(targets.filter((_, i) => i !== index))}>×</button>}</td></tr>)}</tbody></table></div><button disabled={targets.length >= 5} onClick={() => setTargets([...targets, "175000"])}>＋ Add another salary</button></section>

    <section className="about" id="about"><h2>💾 What do these numbers mean?</h2><p>SalaryMaxxing compares annual compensation at the same baseline schedule. It scales your entered workday by <code>current compensation ÷ target salary</code>, capped at your normal day. Hourly estimates assume your selected paid weeks per year.</p></section>
    <footer><div className="counter">YOU ARE VISITOR <b>00120487</b></div><p>Last updated: August 2026 · Best experienced at 800×600 · Optimized for Netscape Navigator 4.0*</p><p className="disclaimer"><b>Disclaimer:</b> SalaryMaxxing provides compensation comparisons and mathematical estimates for informational purposes. Actual working hours are governed by employment agreements, workplace policies, and applicable employment law. Third-party salary estimates may be incomplete or inaccurate.</p><small>*Just kidding. This site uses modern, accessible web standards.</small></footer>
  </main>;
}
