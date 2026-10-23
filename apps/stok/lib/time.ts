// Times are stored in UTC and always shown in Istanbul, whatever zone the server runs in.
const istanbulTime = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  dateStyle: "long",
  timeStyle: "short",
});

export function formatIstanbulTime(date: Date): string {
  return istanbulTime.format(date);
}
