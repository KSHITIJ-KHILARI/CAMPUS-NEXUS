"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Edit3, Search, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { AddUserModal } from "@/components/campus/AddUserModal";
import { EditUserModal } from "@/components/campus/EditUserModal";

import { useDebounce } from "@/hooks/use-debounce";

interface UserRecord {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  is_active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<UserRecord[]>(`/admin/users${debouncedQuery ? `?q=${encodeURIComponent(debouncedQuery)}` : ""}`);
      setUsers(data);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedQuery]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <BackButton label="Back to Admin Dashboard" fallbackPath="/admin/dashboard" />
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Add New User
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-1">User Account Management</h1>
        <p className="text-gray-400">View, create, and manage student, faculty, and administrative accounts in PostgreSQL</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter users by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
        />
      </div>

      <Card className="border-white/10">
        <div className="space-y-3">
          {loading && (
            <div className="p-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-red-500" /> Loading users from PostgreSQL...
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-400">No user accounts found matching query.</div>
          )}

          {!loading &&
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold uppercase">
                    {user.full_name ? user.full_name[0] : user.email[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{user.full_name || user.email}</h3>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={user.role === "admin" ? "warning" : user.role === "faculty" ? "success" : "info"}>
                    {user.role}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedUser(user)}
                    className="border-white/10 text-xs text-gray-300 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Modals */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={fetchUsers}
      />

      <EditUserModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
}
