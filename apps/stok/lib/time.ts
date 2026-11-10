// Times are stored in UTC and always shown in Istanbul, whatever zone the server runs in.
const istanbulTime = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "long",
  timeStyle: "short",
});

export function formatIstanbulTime(date: Date): string {
  return istanbulTime.format(date);
}

const istanbulDay = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" });

// The Istanbul calendar day of an instant, as YYYY-MM-DD.
export function istanbulDate(date: Date): string {
  return istanbulDay.format(date);
}

// An Istanbul wall time on a YYYY-MM-DD day (Istanbul is UTC+3 all year).
export function istanbulTimeOn(day: string, time = "00:00:00"): Date {
  return new Date(`${day}T${time}+03:00`);
}

const isDay = (day: string | undefined): day is string => !!day && /^\d{4}-\d{2}-\d{2}$/.test(day);

// ?baslangic=&bitis= as instants covering whole Istanbul days; a malformed day is left out. `key` resets a table when it changes.
export function dayRange(params: { baslangic?: string; bitis?: string }) {
  const from = isDay(params.baslangic) ? istanbulTimeOn(params.baslangic) : undefined;
  const to = isDay(params.bitis) ? istanbulTimeOn(params.bitis, "23:59:59.999") : undefined;
  return { from, to, bounded: Boolean(from || to), key: `${params.baslangic ?? ""}|${params.bitis ?? ""}` };
}

// A YYYY-MM-DD day moved by whole days.
export function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

// A YYYY-MM month moved by whole months.
export function addMonths(month: string, months: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + months, 1));
  return d.toISOString().slice(0, 7);
}

// A YYYY-MM-DD day moved forward by working days (Monday to Friday; holidays are not known).
export function addWorkingDays(day: string, days: number): string {
  let d = day;
  for (let left = days; left > 0; ) {
    d = addDays(d, 1);
    const dow = new Date(`${d}T12:00:00Z`).getUTCDay();
    if (dow !== 0 && dow !== 6) left--;
  }
  return d;
}

// The Monday of a YYYY-MM-DD day's week.
export function weekStart(day: string): string {
  return addDays(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7));
}
