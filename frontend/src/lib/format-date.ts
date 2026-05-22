export function formatWorkoutDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}