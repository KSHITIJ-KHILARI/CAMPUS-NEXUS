"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { api } from "@/lib/api-client";
import {
  GraduationCap,
  BookOpen,
  Mail,
  Award,
  Briefcase,
  Users,
  Github,
  ExternalLink,
  Sparkles,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { LocationTrackingControl } from "@/components/ui/location-tracking-control";

interface PortfolioData {
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
  projects: Array<{
    id: string;
    title: string;
    role: string;
    tech: string;
    description: string;
    github?: string;
    live_url?: string;
    featured: boolean;
  }>;
  internships: Array<{
    id: string;
    company: string;
    role: string;
    duration: string;
    location: string;
    description: string;
  }>;
  clubs: Array<{
    id: string;
    name: string;
    role: string;
    duration: string;
    description: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issue_date: string;
    credential_id?: string;
  }>;
}

const TABS = ["overview", "skills", "projects", "internships", "clubs", "certifications"] as const;

export default function ProfilePage() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("overview");

  useEffect(() => {
    const fetchPortfolio = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const data = await api.students.getPortfolio() as PortfolioData;
        setPortfolio(data);
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        </div>
        <div className="p-12 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 animate-spin text-red-500" /> Loading portfolio from PostgreSQL...
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        <Card className="p-6 text-center text-red-400 border-red-500/20">
          <AlertCircle className="w-5 h-5 mx-auto mb-2" />
          {errorMsg}
        </Card>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
        <Card className="p-8 text-center text-gray-400 border-white/10">No portfolio data found.</Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Back to Student Dashboard" fallbackPath="/student/dashboard" />
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">
          {portfolio.full_name || "Student Profile"}
        </h1>
        <p className="text-gray-400">
          {portfolio.program} | Semester {portfolio.semester} | CGPA: {portfolio.cgpa}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <TabContent tab={activeTab} portfolio={portfolio} />
    </div>
  );
}

function TabContent({ tab, portfolio }: { tab: string; portfolio: PortfolioData }) {
  switch (tab) {
    case "overview":
      return (
        <Card className="p-6 border-white/10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center font-bold text-2xl uppercase">
              {portfolio.full_name ? portfolio.full_name[0] : "A"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{portfolio.full_name || "Student"}</h2>
              <p className="text-sm text-gray-400">{portfolio.student_id_number}</p>
              <Badge variant="success" className="mt-1">Verified Account</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/5 rounded-xl">
              <Mail className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-xs text-gray-400">Somaiya Email</p>
                <p className="text-sm font-medium text-white">{portfolio.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/5 rounded-xl">
              <GraduationCap className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Program / Department</p>
                <p className="text-sm font-medium text-white">{portfolio.program}</p>
                <p className="text-xs text-gray-500">{portfolio.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/5 rounded-xl">
              <BookOpen className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-xs text-gray-400">Student ID</p>
                <p className="text-sm font-medium text-white">{portfolio.student_id_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/5 rounded-xl">
              <Award className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-xs text-gray-400">CGPA / Credits</p>
                <p className="text-sm font-medium text-white">{portfolio.cgpa} / {portfolio.total_credits} credits</p>
              </div>
            </div>
          </div>

          {portfolio.bio && (
            <div className="mt-6">
              <h3 className="font-bold text-white mb-2">Bio</h3>
              <p className="text-sm text-gray-300">{portfolio.bio}</p>
            </div>
          )}

          {/* Location Tracking */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-campus-primary" />
              <h3 className="font-bold text-white">Location Privacy</h3>
            </div>
            <LocationTrackingControl />
          </div>
        </Card>
      );

    case "skills":
      return (
        <Card className="p-6 border-white/10">
          <h3 className="font-bold text-white mb-4">Skills & Technologies</h3>
          <div className="flex flex-wrap gap-2">
            {portfolio.skills?.map((skill, idx) => (
              <Badge key={idx} variant="default" className="px-3 py-1 text-sm">
                {skill}
              </Badge>
            ))}
          </div>
          {(!portfolio.skills || portfolio.skills.length === 0) && (
            <p className="text-gray-500 text-sm">No skills listed.</p>
          )}
        </Card>
      );

    case "projects":
      return (
        <div className="space-y-4">
          {portfolio.projects?.map((proj) => (
            <Card key={proj.id} className="p-5 border-white/10">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-white text-lg">{proj.title}</h3>
                  <p className="text-xs text-gray-400 mb-1">{proj.role}</p>
                </div>
                {proj.featured && (
                  <Badge variant="default" className="text-xs">
                    Featured
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-300 mb-3">{proj.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                <span className="px-2 py-1 bg-white/5 rounded">{proj.tech}</span>
              </div>
              <div className="flex gap-3">
                {proj.github && (
                  <a
                    href={proj.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"
                  >
                    <Github className="w-3.5 h-3.5" /> GitHub
                  </a>
                )}
                {proj.live_url && (
                  <a
                    href={proj.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                  </a>
                )}
              </div>
            </Card>
          ))}
          {(!portfolio.projects || portfolio.projects.length === 0) && (
            <Card className="p-8 text-center text-gray-500 border-white/10">
              No projects added yet.
            </Card>
          )}
        </div>
      );

    case "internships":
      return (
        <div className="space-y-4">
          {portfolio.internships?.map((intern) => (
            <Card key={intern.id} className="p-5 border-white/10">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-white text-lg">{intern.company}</h3>
                  <p className="text-xs text-gray-400 mb-1">{intern.role}</p>
                </div>
                <Badge variant="info" className="text-xs">
                  {intern.duration}
                </Badge>
              </div>
              <p className="text-xs text-gray-300 mb-2">{intern.description}</p>
              <p className="text-xs text-gray-500">Location: {intern.location}</p>
            </Card>
          ))}
          {(!portfolio.internships || portfolio.internships.length === 0) && (
            <Card className="p-8 text-center text-gray-500 border-white/10">
              No internships added yet.
            </Card>
          )}
        </div>
      );

    case "clubs":
      return (
        <div className="space-y-4">
          {portfolio.clubs?.map((club) => (
            <Card key={club.id} className="p-5 border-white/10">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-white text-lg">{club.name}</h3>
                  <p className="text-xs text-gray-400 mb-1">{club.role}</p>
                </div>
                <Badge variant="default" className="text-xs">
                  {club.duration}
                </Badge>
              </div>
              <p className="text-xs text-gray-300">{club.description}</p>
            </Card>
          ))}
          {(!portfolio.clubs || portfolio.clubs.length === 0) && (
            <Card className="p-8 text-center text-gray-500 border-white/10">
              No clubs added yet.
            </Card>
          )}
        </div>
      );

    case "certifications":
      return (
        <div className="space-y-4">
          {portfolio.certifications?.map((cert) => (
            <Card key={cert.id} className="p-5 border-white/10">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-white text-lg">{cert.name}</h3>
                  <p className="text-xs text-gray-400 mb-1">{cert.issuer}</p>
                </div>
                <Award className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-xs text-gray-500">
                Issued: {cert.issue_date}
                {cert.credential_id && ` | Credential ID: ${cert.credential_id}`}
              </p>
            </Card>
          ))}
          {(!portfolio.certifications || portfolio.certifications.length === 0) && (
            <Card className="p-8 text-center text-gray-500 border-white/10">
              No certifications added yet.
            </Card>
          )}
        </div>
      );

    default:
      return null;
  }
}
