import { useState, useEffect, useCallback } from "react";
import { ScheduleEntry } from "@/lib/types";
import { getDemoTimetable } from "@/lib/campus-data";

export function useSchedule() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = getDemoTimetable();
      setSchedule(data.entries ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schedule");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const getTodaySchedule = useCallback(() => {
    const today = new Date();
    const todayName = dayNames[today.getDay()] as any;
    return schedule.filter((entry) => entry.day === todayName);
  }, [schedule]);

  const getNextClass = useCallback(() => {
    const now = new Date();
    const todaySchedule = getTodaySchedule();

    for (const entry of todaySchedule) {
      const [hours, minutes] = (entry.startTime || "00:00").split(":").map(Number);
      const classTime = new Date(now);
      classTime.setHours(hours, minutes, 0, 0);

      if (classTime > now) {
        return entry;
      }
    }

    return todaySchedule[0] ?? null;
  }, [schedule, getTodaySchedule]);

  const getCurrentClass = useCallback(() => {
    const now = new Date();
    const todaySchedule = getTodaySchedule();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    for (const entry of todaySchedule) {
      const [startHours, startMinutes] = (entry.startTime || "00:00")
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = (entry.endTime || "00:00").split(":").map(Number);

      const start = startHours * 60 + startMinutes;
      const end = endHours * 60 + endMinutes;

      if (currentTime >= start && currentTime <= end) {
        return entry;
      }
    }

    return null;
  }, [schedule, getTodaySchedule]);

  const getUpcomingClasses = useCallback(
    (count: number = 3): ScheduleEntry[] => {
      const todaySchedule = getTodaySchedule();
      const now = new Date();
      const upcoming = todaySchedule.filter((entry) => {
        const [hours, minutes] = (entry.startTime || "00:00").split(":").map(Number);
        const classTime = new Date(now);
        classTime.setHours(hours, minutes, 0, 0);
        return classTime > now;
      });
      return upcoming.slice(0, count);
    },
    [getTodaySchedule]
  );

  return {
    schedule,
    todaySchedule: getTodaySchedule(),
    nextClass: getNextClass(),
    currentClass: getCurrentClass(),
    upcomingClasses: getUpcomingClasses(3),
    isLoading,
    error,
    refetch: fetchSchedule,
  };
}
