"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { api } from "@/lib/api-client";
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  Award,
  Briefcase,
  Code2,
  Users2,
  Trophy,
  Sparkles,
} from "lucide-react";

interface Portfolio {
  student_id: string;
  full_name: string;
  email: string;
  student_id_number: string;
  program: string;
  department: string;
  semester: number;
  academic_year: string;
  cgpa: number;
  total_credits: number;
  bio: string;
  skills: string[];
  projects: any[];
  internships: any[];
  clubs: any[];
  certifications: any[];
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects" },
  { id: "internships", label: "Internships" },
  { id: "clubs", label: "Clubs" },
  { id: "skills", label: "Skills" },
  { id: "certifications", label: "Certifications" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function StudentPortfolioPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  useEffect(() => {
    async function loadPortfolio() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.students.getPortfolio();
        setPortfolio(data as Portfolio);
      } catch (err: any) {
        setError(err?.message || "Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    }
    loadPortfolio();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        </div>
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading portfolio...
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        </div>
        <Card className="p-8 text-center text-sm text-red-400 border-white/10">
          {error || "Portfolio not found"}
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Student Portfolio</h1>
        <p className="text-gray-400">Academic record, projects, internships, and achievements</p>
      </div>

      {/* Profile Header */}
      <Card className="p-6 border-white/10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center font-bold text-2xl uppercase">
            {portfolio.full_name?.[0] || "A"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{portfolio.full_name}</h2>
            <p className="text-sm text-gray-400">
              {portfolio.program} | {portfolio.department}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="info">Semester {portfolio.semester}</Badge>
              <Badge variant="success">CGPA {portfolio.cgpa.toFixed(2)}</Badge>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-300">{portfolio.bio}</p>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-colors ${
              activeTab === tab.id
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <Card className="p-6 border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-red-400" /> Academic Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-gray-400">Student ID</div>
              <div className="text-white font-medium">{portfolio.student_id_number}</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-gray-400">Email</div>
              <div className="text-white font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-red-400" /> {portfolio.email}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-gray-400">Program</div>
              <div className="text-white font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-400" /> {portfolio.program}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-gray-400">Academic Year</div>
              <div className="text-white font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" /> {portfolio.academic_year}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-gray-400">CGPA</div>
              <div className="text-white font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400" /> {portfolio.cgpa.toFixed(2)} / 10.0
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <div className="text-xs text-gray-400">Total Credits</div>
              <div className="text-white font-medium">{portfolio.total_credits}</div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === "projects" && (
        <Card className="p-6 border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Code2 className="h-5 w-5 text-red-400" /> Projects
          </h3>
          {portfolio.projects?.length > 0 ? (
            <div className="space-y-3">
              {portfolio.projects.map((proj: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-white font-medium">{proj.title || proj.name}</h4>
                    {proj.tech_stack && <Badge variant="info">{proj.tech_stack}</Badge>}
                  </div>
                  <p className="text-xs text-gray-400">{proj.description}</p>
                  {proj.link && (
                    <a href={proj.link} target="_blank" rel="noreferrer" className="text-xs text-red-400 hover:underline mt-1 block">
                      View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No projects added yet.</p>
          )}
        </Card>
      )}

      {activeTab === "internships" && (
        <Card className="p-6 border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-red-400" /> Internships
          </h3>
          {portfolio.internships?.length > 0 ? (
            <div className="space-y-3">
              {portfolio.internships.map((intern: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-white font-medium">{intern.role || intern.title}</h4>
                    {intern.duration && <Badge variant="default">{intern.duration}</Badge>}
                  </div>
                  <p className="text-xs text-gray-400">{intern.company}</p>
                  {intern.description && (
                    <p className="text-xs text-gray-300 mt-1">{intern.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No internships added yet.</p>
          )}
        </Card>
      )}

      {activeTab === "clubs" && (
        <Card className="p-6 border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users2 className="h-5 w-5 text-red-400" /> Clubs & Societies
          </h3>
          {portfolio.clubs?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {portfolio.clubs.map((club: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <h4 className="text-white font-medium">{club.name}</h4>
                  {club.role && <p className="text-xs text-gray-400 mt-1">{club.role}</p>}
                  {club.description && (
                    <p className="text-xs text-gray-300 mt-1">{club.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No clubs added yet.</p>
          )}
        </Card>
      )}

      {activeTab === "skills" && (
        <Card className="p-6 border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Code2 className="h-5 w-5 text-red-400" /> Skills
          </h3>
          {portfolio.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {portfolio.skills.map((skill, idx) => (
                <Badge key={idx} variant="default" className="bg-red-500/10 text-red-400 border-red-500/20">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No skills added yet.</p>
          )}
        </Card>
      )}

      {activeTab === "certifications" && (
        <Card className="p-6 border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-red-400" /> Certifications & Achievements
          </h3>
          {portfolio.certifications?.length > 0 ? (
            <div className="space-y-3">
              {portfolio.certifications.map((cert: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">{cert.title || cert.name}</h4>
                    {cert.issuer && <p className="text-xs text-gray-400">{cert.issuer}</p>}
                  </div>
                  {cert.date && <Badge variant="default">{cert.date}</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No certifications added yet.</p>
          )}
        </Card>
      )}
    </div>
  );
}
