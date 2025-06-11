import { format, isToday, isYesterday } from "date-fns";

export const formatDate = (date: Date): string =>
  isToday(date)
    ? format(date, "HH:mm")
    : isYesterday(date)
      ? "Hier"
      : format(date, "dd/MM/yyyy");
