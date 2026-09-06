"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit3, Trash2, Sparkles, CheckCircle, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { AddFacultyModal } from "@/components/campus/AddFacultyModal";

import { useDebounce } from "@/hooks/use-debounce";

interface FacultyRecord {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  employee_id: string;
  designation: string;
  department?: string;
  office_location?: string;
  is_available: boolean;
  is_active: boolean;
}

export default function AdminFacultyPage() {
  const [faculty, setFaculty] = useState<FacultyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editing, setEditing] = useState<FacultyRecord | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const fetchFaculty = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const data = await api.admin.getFaculty(debouncedQuery || undefined);
      setFaculty(data as FacultyRecord[]);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to load faculty.");
      } else {
        setErrorMsg("Something went wrong while loading faculty.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [debouncedQuery]);

  const handleUpdate = async (id: string, data: any) => {
    setErrorMsg("");
    try {
      await api.admin.updateFaculty(id, data);
      setSuccessMsg("Faculty updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      setIsEditOpen(false);
      setEditing(null);
      fetchFaculty();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to update faculty.");
      } else {
        setErrorMsg("Something went wrong while updating faculty.");
      }
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Archive this faculty member? This deactivates the account but preserves all records.")) return;
    setArchivingId(id);
    setErrorMsg("");
    try {
      await api.admin.deleteFaculty(id);
      setSuccessMsg("Faculty archived successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchFaculty();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Failed to archive faculty.");
      } else {
        setErrorMsg("Something went wrong while archiving faculty.");
      }
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <BackButton label="Back to Admin Dashboard" fallbackPath="/admin/dashboard" />
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Faculty
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Faculty Management</h1>
        <p className="text-gray-400">View and manage faculty profiles and assignments</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search faculty by name, email, or employee ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
        />
      </div>

      <Card className="border-white/10">
        <div className="space-y-3">
          {loading && (
            <div className="p-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-red-500" /> Loading faculty...
            </div>
          )}

          {!loading && faculty.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No faculty found.</div>
          )}

          {!loading &&
            faculty.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold uppercase">
                    {f.full_name?.[0] || f.email[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{f.full_name}</h3>
                    <p className="text-xs text-gray-400">{f.email}</p>
                    <p className="text-xs text-gray-400">
                      {f.designation} | {f.department || "N/A"} | {f.employee_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={f.is_available ? "success" : "danger"}>
                    {f.is_available ? "Available" : "Unavailable"}
                  </Badge>
                  <Badge variant={f.is_active ? "success" : "danger"}>
                    {f.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setEditing(f); setIsEditOpen(true); }}
                    className="border-white/10 text-xs text-gray-300 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  {f.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleArchive(f.id)}
                      disabled={archivingId === f.id}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </Card>

      <AddFacultyModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onFacultyAdded={fetchFaculty}
      />

      {isEditOpen && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 border-white/10 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Edit Faculty</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdate(editing.id, {
                  employee_id_number: formData.get("employee_id") as string,
                  designation: formData.get("designation") as string,
                  office_location: formData.get("office_location") as string,
                  is_available: formData.get("is_available") === "true",
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-gray-400 block mb-1">Employee ID</label>
                <Input name="employee_id" defaultValue={editing.employee_id} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Designation</label>
                <Input name="designation" defaultValue={editing.designation} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Office Location</label>
                <Input name="office_location" defaultValue={editing.office_location || ""} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Available</label>
                <select name="is_available" defaultValue={editing.is_available ? "true" : "false"} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm">
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setEditing(null); }} className="border-white/10 text-xs text-gray-300">
                  Cancel
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}