export function todayString(): string {
  return formatDateString(new Date());
}

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getPastDateStrings(count: number, endDate: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, index) => {
    const offset = count - 1 - index;
    return formatDateString(addDays(endDate, -offset));
  });
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseDateString(dateStr);
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

export function formatRelativeDay(
  dateStr: string,
  today: string = todayString(),
): string | null {
  if (dateStr === today) return "Today";
  if (dateStr === formatDateString(addDays(parseDateString(today), -1))) {
    return "Yesterday";
  }
  return null;
}

export function formatShortDate(dateStr: string): string {
  return parseDateString(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatLongDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
