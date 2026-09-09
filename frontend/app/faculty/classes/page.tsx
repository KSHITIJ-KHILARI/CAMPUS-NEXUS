"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Users, BookOpen, AlertTriangle, MapPin, Clock, FileText } from "lucide-react"
import { api } from "@/lib/api-client"

interface ScheduleEntry {
  id: number | string
  day?: string
  day_of_week?: string
  start?: string
  start_time?: string
  end?: string
  end_time?: string
  course?: string
  course_name?: string
  course_code?: string
  section?: string
  room?: string
  room_number?: string
  type?: string
}

interface Student {
  id: string
  user_id: string
  full_name: string
  email: string
  roll_number: string | null
  semester: number | null
  cgpa: number | null
}

const fallbackClasses = [
  { id: "1", name: "SY BCA - Java Programming", room: "Lab 304", students: 45, time: "10:00 AM - 11:00 AM", day: "Monday", section: "A", type: "lecture" },
  { id: "2", name: "SY BCA - Database Management Systems", room: "Room 302", students: 38, time: "11:00 AM - 12:00 PM", day: "Monday", section: "B", type: "lecture" },
  { id: "3", name: "SY BCA - Java Practical", room: "Lab 304", students: 32, time: "2:00 PM - 4:00 PM", day: "Monday", section: "A", type: "lab" },
]

export default function FacultyClassesPage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ScheduleEntry | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schedRes, studRes] = await Promise.all([
          api.faculty.getSchedule(),
          api.faculty.getStudents(),
        ])
        setSchedule((schedRes.entries || []) as unknown as ScheduleEntry[])
        setStudents((studRes || []) as unknown as Student[])
      } catch (err) {
        console.error("Failed to fetch data:", err)
      }
    }
    fetchData()
  }, [])

  const viewDetails = (entry: ScheduleEntry) => {
    setSelectedClass(entry)
    setDetailsOpen(true)
  }

  const displayClasses: ScheduleEntry[] = schedule.length > 0
    ? schedule
    : fallbackClasses.map(c => ({
        id: parseInt(c.id),
        day: c.day,
        day_of_week: c.day,
        start: c.time.split(" - ")[0],
        start_time: c.time.split(" - ")[0],
        end: c.time.split(" - ")[1],
        end_time: c.time.split(" - ")[1],
        course: c.name,
        course_name: c.name,
        course_code: c.name.split(" - ")[0] || "CSC",
        section: c.section,
        room: c.room,
        room_number: c.room,
        type: c.type,
      }));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Classes</h1>
        <p className="text-gray-400">manage your classes and students</p>
      </div>

      <div className="space-y-4">
        {displayClasses.map((cls) => (
          <Card key={cls.id} className="card-hover">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">
                  {cls.course || (cls.course_code ? `${cls.course_code} — ${cls.course_name}` : cls.course_name) || "Academic Course Lecture"}
                </h3>
                <p className="text-sm text-gray-400">{cls.day || cls.day_of_week || "Monday"} • {cls.start || cls.start_time} - {cls.end || cls.end_time}</p>
              </div>
              <Badge variant="info">Active</Badge>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {cls.room || cls.room_number || "Room TBA"}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {students.length} students
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {cls.type}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => viewDetails(cls)}>
                <FileText className="h-3 w-3 mr-1" />
                View Details
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.location.href = "/faculty/students"}>
                <Users className="h-3 w-3 mr-1" />
                View Students
              </Button>
              <Button size="sm" variant="outline">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Report Issue
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedClass && (
        <Modal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          title={selectedClass.course}
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Section {selectedClass.section} • {selectedClass.type}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500">Faculty</p>
                <p className="text-sm font-medium text-white">Dr. Priya Sharma</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500">Day</p>
                <p className="text-sm font-medium text-white">{selectedClass.day}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-medium text-white">
                  {selectedClass.start} - {selectedClass.end}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xs text-gray-500">Room</p>
                <p className="text-sm font-medium text-white">{selectedClass.room}</p>
              </div>
            </div>
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-sm font-semibold text-white mb-3">
                Enrolled Students ({students.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {students.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                    <div>
                      <p className="text-sm font-medium text-white">{s.full_name}</p>
                      <p className="text-xs text-gray-500">
                        Roll: {s.roll_number || "N/A"} • {s.email}
                      </p>
                    </div>
                    {s.cgpa !== null && (
                      <Badge variant="info" className="text-xs">CGPA: {s.cgpa}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
