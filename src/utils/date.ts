export function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  const isNegative = seconds < 0;
  const absoluteSeconds = Math.abs(seconds);
  const mins = Math.floor(absoluteSeconds / 60);
  const secs = absoluteSeconds % 60;
  return `${isNegative ? "-" : ""}${mins}:${String(secs).padStart(2, "0")}`;
}
