"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Edit3, Search, Sparkles } from "lucide-react";
import { api } from "@/lib/api-client";
import { BackButton } from "@/components/ui/back-button";
import { AddUserModal } from "@/components/campus/AddUserModal";
import { EditUserModal } from "@/components/campus/EditUserModal";

import { useDebounce } from "@/hooks/use-debounce";
import { motion } from "framer-motion";

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
      const data = await api.admin.getUsers(debouncedQuery);
      setUsers(data as unknown as UserRecord[]);
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
        <p className="text-gray-400">View, create, and manage student, faculty, and administrative accounts in Firestore</p>
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

      <Card className="border-white/10 overflow-hidden bg-white/[0.02]">
        <div className="space-y-0 divide-y divide-white/5">
          {loading && (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                <Sparkles className="w-8 h-8 animate-spin text-red-500 relative z-10" />
              </div>
              <p className="text-gray-400 font-medium tracking-wide">Syncing users from Database...</p>
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">No Users Found</h3>
              <p className="text-sm text-gray-400 max-w-sm">
                We couldn&apos;t find any user accounts matching &quot;{query}&quot;. Try adjusting your search or add a new user.
              </p>
            </div>
          )}

          {!loading &&
            users.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-4 hover:bg-white/[0.04] transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold uppercase text-lg shadow-[0_0_15px_rgba(239,68,68,0.1)] group-hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-shadow">
                    {user.full_name ? user.full_name[0] : user.email[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base group-hover:text-red-400 transition-colors">
                      {user.full_name || "Unknown User"}
                    </h3>
                    <p className="text-sm text-gray-400 font-mono">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant={user.role === "admin" ? "warning" : user.role === "faculty" ? "success" : "info"} className="px-3 py-1 bg-opacity-20 border-opacity-30">
                    {user.role}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedUser(user)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 h-8"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
                  </Button>
                </div>
              </motion.div>
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
