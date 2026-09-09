"use client";

import { useState } from "react";
import { UserPlus, CheckCircle, AlertCircle, X } from "lucide-react";
import { api } from "@/lib/api-client";

const DESIGNATIONS = [
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Lecturer",
  "Head of Department",
  "Director",
];

export function AddFacultyModal({
  isOpen,
  onClose,
  onFacultyAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onFacultyAdded?: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("demo123");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [department, setDepartment] = useState("CS");
  const [phone, setPhone] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [qualification, setQualification] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [isHod, setIsHod] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("");
    setErrorMsg("");

    try {
      await api.admin.createFaculty({
        full_name: fullName,
        email,
        password,
        employee_id_number: employeeId,
        designation,
        department_code: department,
        phone: phone || undefined,
        office_location: officeLocation || undefined,
        qualification: qualification || undefined,
        experience_years: experienceYears ? parseInt(experienceYears) : undefined,
        is_hod: isHod,
      });
      setStatusMsg("Faculty " + fullName + " created successfully in Firestore!");
      if (onFacultyAdded) onFacultyAdded();
      setTimeout(() => {
        onClose();
        setFullName("");
        setEmail("");
        setEmployeeId("");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create faculty");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Add New Faculty</h3>
            <p className="text-xs text-gray-400">Creates User + Faculty profile directly in Firestore</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dr. Priya Sharma"
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Somaiya Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. priya.sharma@somaiya.edu"
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Employee ID</label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. FAC-CS-102"
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                defaultValue={password}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Designation</label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
              >
                {DESIGNATIONS.map((d) => (
                  <option key={d} value={d} className="bg-neutral-900">{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Department Code</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. CS"
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91-9876543210"
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Office Location</label>
              <input
                type="text"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                placeholder="e.g. CSB-305"
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Qualification</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. Ph.D. Computer Science"
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Experience (Years)</label>
              <input
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="e.g. 8"
                className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_hod"
              checked={isHod}
              onChange={(e) => setIsHod(e.target.checked)}
              className="w-4 h-4 rounded bg-white/5 border-white/20 text-red-600 focus:ring-red-600"
            />
            <label htmlFor="is_hod" className="text-xs text-gray-300 cursor-pointer">
              Head of Department
            </label>
          </div>

          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> {statusMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-red-600/20"
            >
              {loading ? "Creating..." : "Create Faculty"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}