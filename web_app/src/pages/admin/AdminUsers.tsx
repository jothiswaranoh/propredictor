import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, RefreshCw, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/use-toast';
import { AdminPagination } from '../../components/admin/AdminPagination';
import { AdminSelect } from '../../components/admin/AdminSelect';

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' }
];

const roleFilterOptions = [
  { value: '', label: 'All' },
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' }
];

const activeFilterOptions = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Suspended' }
];

const AdminUsers: React.FC = () => {
  const perpage_value = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userActiveFilter, setUserActiveFilter] = useState<boolean | null>(null);


  // Add/Edit User Form States
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);



  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
      setUserPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const { data: paginatedUsersData, isLoading: isUsersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['adminUsers', userPage, debouncedUserSearch, userRoleFilter, userActiveFilter],
    queryFn: () => api.adminGetUsers(userPage, perpage_value, debouncedUserSearch, userRoleFilter, userActiveFilter),
  });

  // Clear states when dialog closes
  useEffect(() => {
    if (!userDialogOpen) {
      setEditingUser(null);
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserRole('user');
    }
  }, [userDialogOpen]);

  const handleCreateUser = async () => {
    if (!newUserName || !newUserUsername || !newUserPassword) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    try {
      if (editingUser) {
        await api.adminUpdateUser(editingUser.id, {
          name: newUserName,
          username: newUserUsername,
          password: newUserPassword,
          role: newUserRole,
        });
        toast({ title: "User Updated", description: `Successfully updated ${newUserName}!` });
      } else {
        await api.adminCreateUser({
          name: newUserName,
          username: newUserUsername,
          password: newUserPassword,
          role: newUserRole,
        });
        toast({ title: "User Created", description: `Successfully added ${newUserName}!` });
      }
      setUserDialogOpen(false);
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    } catch (err: any) {
      toast({ title: editingUser ? "Update User Failed" : "Create User Failed", description: err.message || "Could not add user.", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.adminDeleteUser(id);
      toast({ title: "User Deleted", description: "Successfully removed user." });
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message || "Could not delete user.", variant: "destructive" });
    }
  };

  const users = paginatedUsersData?.users || [];
  const total = paginatedUsersData?.total || 0;
  const pages = paginatedUsersData?.pages || 0;

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (value: any, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-sm font-bold text-white">
            {value?.charAt(0) || ''}
          </div>
          <div>
            <span className="text-white font-medium">{value}</span>
            <p className="text-xs text-gray-500">{row.username}</p>
          </div>
        </div>
      )
    },

    {
      key: 'role',
      label: 'Role',
      render: (value: any) => (
        <Badge className={value === 'admin' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}>
          {value}
        </Badge>
      )
    },
    {
      key: 'active',
      label: 'Active',
      render: (value: any) => (
        <Badge className={value ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}>
          {value ? 'Active' : 'Suspended'}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Users Management</h2>
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-500 neon-glow">
              <Plus className="w-4 h-4 mr-2" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-white/10 text-white rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Full Name</Label>
                <Input
                  placeholder="John Doe"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Username</Label>
                <Input
                  type="text"
                  placeholder="john_doe"
                  value={newUserUsername}
                  onChange={e => setNewUserUsername(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Password</Label>
                <Input
                  placeholder="password123"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Role</Label>
                <AdminSelect
                  options={roleOptions}
                  value={newUserRole}
                  onChange={setNewUserRole}
                />
              </div>
              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-500 neon-glow py-6 text-white font-bold rounded-xl mt-2" onClick={handleCreateUser}>
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or username..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Role:</span>
              <AdminSelect
                options={roleFilterOptions}
                value={userRoleFilter}
                onChange={(val) => {
                  setUserRoleFilter(val);
                  setUserPage(1);
                }}
                className="w-32"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Status:</span>
              <AdminSelect
                options={activeFilterOptions}
                value={userActiveFilter === null ? "" : String(userActiveFilter)}
                onChange={(val) => {
                  setUserActiveFilter(val === "" ? null : val === "true");
                  setUserPage(1);
                }}
                className="w-32"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="text-left p-4 text-sm font-medium text-gray-400">
                    {col.label}
                  </th>
                ))}
                <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isUsersLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-green-400" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((row: any, idx: number) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="p-4 text-sm text-gray-300">
                        {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                      </td>
                    ))}
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-white/10">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingUser(row);
                              setNewUserName(row.name);
                              setNewUserUsername(row.username);
                              setNewUserPassword(row.password);
                              setNewUserRole(row.role);
                              setUserDialogOpen(true);
                            }}
                            className="text-blue-400 focus:bg-blue-500/10 focus:text-blue-400"
                          >
                            <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(row.id)}
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Bar */}
        <AdminPagination
          currentPage={userPage}
          totalPages={pages}
          totalItems={total}
          itemsPerPage={perpage_value}
          onPageChange={setUserPage}
          itemNamePlural="users"
        />
      </Card>
    </div>
  );
};

export default AdminUsers;
