"use client";

import { VacantRoomsView } from "@/components/features/vacant-rooms-view";
import { BackButton } from "@/components/ui/back-button";

export default function StudentRoomsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <VacantRoomsView />
    </div>
  );
}
