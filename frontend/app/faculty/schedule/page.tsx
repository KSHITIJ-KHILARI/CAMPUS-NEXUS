"use client";

import { TimetableCalendar } from "@/components/features/timetable-calendar";
import { BackButton } from "@/components/ui/back-button";

export default function FacultySchedulePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Faculty Dashboard" fallbackPath="/faculty/dashboard" />
      </div>

      <TimetableCalendar initialRole="faculty" defaultFacultyId="fac-smith" />
    </div>
  );
}
