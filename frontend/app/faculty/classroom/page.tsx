"use client";

import { ClassroomView } from "@/components/features/classroom-view";
import { BackButton } from "@/components/ui/back-button";

export default function FacultyClassroomPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Faculty Dashboard" fallbackPath="/faculty/dashboard" />
      </div>

      <ClassroomView initialRole="faculty" />
    </div>
  );
}
