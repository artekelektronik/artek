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

// A YYYY-MM-DD day moved by whole days.
export function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
