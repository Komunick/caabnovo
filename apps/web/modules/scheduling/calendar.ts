export const calendarViews = { list: "Lista", day: "Dia", week: "Semana", month: "Mês" } as const;
export type CalendarView = keyof typeof calendarViews;
export function calendarView(value: string | null): CalendarView {
  return value === "day" || value === "week" || value === "month" ? value : "list";
}
const isoDay = (date: Date) => date.toISOString().slice(0, 10);
export function calendarRange(date: string, view: CalendarView) {
  const start = new Date(`${date}T00:00:00Z`);
  if (view === "month") start.setUTCDate(1);
  if (view === "month" || view === "week") start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + (view === "month" ? 42 : view === "week" ? 7 : 1));
  return { start: isoDay(start), end: isoDay(end) };
}
export function moveCalendarDate(date: string, view: CalendarView, direction: number) {
  const next = new Date(`${date}T00:00:00Z`);
  if (view === "month") {
    next.setUTCDate(1);
    next.setUTCMonth(next.getUTCMonth() + direction);
  } else next.setUTCDate(next.getUTCDate() + direction * (view === "week" ? 7 : 1));
  return isoDay(next);
}
