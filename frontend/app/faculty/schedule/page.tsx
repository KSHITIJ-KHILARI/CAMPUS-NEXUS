"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Users } from "lucide-react"

const schedule = [
  { day: "Monday", time: "10:00 AM - 11:00 AM", course: "SY BCA - Java Programming", room: "Lab 304", students: 45, status: "completed" },
  { day: "Monday", time: "11:00 AM - 12:00 PM", course: "SY BCA - Database Management Systems", room: "Room 302", students: 38, status: "completed" },
  { day: "Monday", time: "2:00 PM - 4:00 PM", course: "SY BCA - Java Practical", room: "Lab 304", students: 32, status: "upcoming" },
]

export default function FacultySchedulePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Schedule</h1>
        <p className="text-gray-400">Your teaching schedule</p>
      </div>

      <div className="space-y-4">
        {schedule.map((item, idx) => (
          <Card key={idx} className={`card-hover ${item.status === "upcoming" ? "ring-2 ring-campus-blue" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{item.course}</h3>
                <p className="text-sm text-gray-400">{item.day} • {item.time}</p>
              </div>
              <Badge variant={item.status === "completed" ? "default" : "info"}>
                {item.status}
              </Badge>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {item.room}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {item.students} students
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
