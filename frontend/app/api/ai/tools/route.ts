import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    tools: [
      { name: "getStudentSchedule", description: "Get upcoming student lecture schedule and room" },
      { name: "getFacultySchedule", description: "Get faculty teaching schedule and enrolled students" },
      { name: "getVacantRooms", description: "Check vacant classrooms, computing labs, and library study pods" },
      { name: "getLibraryCatalog", description: "Search textbooks, study guides, and physical shelf copies" },
      { name: "checkFacultyAvailability", description: "Check professor office hours and availability" },
      { name: "getActiveIssues", description: "Check active campus infrastructure maintenance reports" },
    ],
  });
}
