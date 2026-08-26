export type CalculationInput = {
  currentSalary: number;
  targetSalary: number;
  hoursPerDay: number;
  daysPerWeek: number;
  weeksPerYear?: number;
  vacationWeeks?: number;
  paidHolidays?: number;
  currentExtraComp?: number;
};

export type SalaryCalculation = {
  adjustedDay: number; dailyReduction: number; adjustedWeek: number;
  weeklyReduction: number; salaryGap: number; percentDifference: number;
  currentHourly: number; targetHourly: number; adjustedHourly: number; meetsTarget: boolean;
};

const valid = (n: number) => Number.isFinite(n) && n >= 0;

export function calculateSalary(input: CalculationInput): SalaryCalculation {
  const { currentSalary, targetSalary, hoursPerDay, daysPerWeek } = input;
  const weeks = input.weeksPerYear ?? 52;
  if (![currentSalary, targetSalary, hoursPerDay, daysPerWeek, weeks].every(valid) || targetSalary <= 0 || hoursPerDay <= 0 || daysPerWeek <= 0 || weeks <= 0) {
    throw new Error("Salary and schedule values must be valid positive numbers.");
  }
  const currentComp = currentSalary + (input.currentExtraComp ?? 0);
  const meetsTarget = currentComp >= targetSalary;
  const adjustedDay = Math.min(hoursPerDay, (currentComp / targetSalary) * hoursPerDay);
  const normalWeek = hoursPerDay * daysPerWeek;
  const adjustedWeek = adjustedDay * daysPerWeek;
  const workedWeeks = Math.max(1 / daysPerWeek, weeks - (input.vacationWeeks ?? 0) - (input.paidHolidays ?? 0) / daysPerWeek);
  const annualNormalHours = normalWeek * workedWeeks;
  const annualAdjustedHours = adjustedWeek * workedWeeks;
  return {
    adjustedDay,
    dailyReduction: Math.max(0, hoursPerDay - adjustedDay),
    adjustedWeek,
    weeklyReduction: Math.max(0, normalWeek - adjustedWeek),
    salaryGap: Math.max(0, targetSalary - currentComp),
    percentDifference: ((currentComp - targetSalary) / targetSalary) * 100,
    currentHourly: currentComp / annualNormalHours,
    targetHourly: targetSalary / annualNormalHours,
    adjustedHourly: annualAdjustedHours ? currentComp / annualAdjustedHours : 0,
    meetsTarget,
  };
}

export function hoursMinutes(decimalHours: number): string {
  const totalMinutes = Math.max(0, Math.round(decimalHours * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h${minutes ? ` ${minutes}m` : ""}`;
}

export function formatHours(value: number): string {
  return Number(value.toFixed(1)).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function formatCurrency(value: number, currency: string, decimals = 0): string {
  if (currency === "OTHER") return `${value.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}`;
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value);
}

export function endTime(start: string, durationHours: number): string {
  if (!/^\d{2}:\d{2}$/.test(start)) return "";
  const [hour, minute] = start.split(":").map(Number);
  const total = (hour * 60 + minute + Math.round(durationHours * 60)) % 1440;
  const date = new Date(2000, 0, 1, Math.floor(total / 60), total % 60);
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}
