import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, RefreshCw, MoreVertical, Edit, Trash2
} from 'lucide-react';
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
import { formatToIST } from './AdminLayout';
import { AdminPagination } from '../../components/admin/AdminPagination';
import { AdminSelect } from '../../components/admin/AdminSelect';

const AdminTeams: React.FC = () => {
  const perpage_value = 10;
  const { toast } = useToast();
  const statusOptions = [
    { value: '', label: 'All' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  const [teamPage, setTeamPage] = useState(1);
  const [teamSearch, setTeamSearch] = useState('');
  const [debouncedTeamSearch, setDebouncedTeamSearch] = useState('');
  const [teamActiveFilter, setTeamActiveFilter] = useState<boolean | null>(null);

  // Add/Edit Team Form States
  const [teamName, setTeamName] = useState('');
  const [teamShortName, setTeamShortName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTeamSearch(teamSearch);
      setTeamPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [teamSearch]);

  const { data: paginatedTeamsData, isLoading: isTeamsLoading, refetch: refetchTeams } = useQuery({
    queryKey: ['adminTeams', teamPage, debouncedTeamSearch, teamActiveFilter],
    queryFn: () => api.adminGetTeams(teamPage, perpage_value, debouncedTeamSearch, teamActiveFilter),
  });

  const queryClient = useQueryClient();

  // Clear states when dialog closes
  useEffect(() => {
    if (!teamDialogOpen) {
      setEditingTeam(null);
      setTeamName('');
      setTeamShortName('');
      setTeamLogo('');
    }
  }, [teamDialogOpen]);

  const handleCreateTeam = async () => {
    if (!teamName || !teamShortName || !teamLogo) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    try {
      if (editingTeam) {
        await api.adminUpdateTeam(editingTeam.id, teamName, teamShortName, teamLogo);
        toast({ title: "Team Updated", description: `Successfully updated ${teamName}!` });
      } else {
        await api.adminCreateTeam(teamName, teamShortName, teamLogo);
        toast({ title: "Team Created", description: `Successfully added ${teamName}!` });
      }
      setTeamDialogOpen(false);
      refetchTeams();
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    } catch (err: any) {
      toast({ title: editingTeam ? "Update Team Failed" : "Create Team Failed", description: err.message || "Could not save team.", variant: "destructive" });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await api.adminDeleteTeam(id);
      toast({ title: "Team Deleted", description: "Successfully removed team." });
      refetchTeams();
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message || "Could not delete team.", variant: "destructive" });
    }
  };

  const teams = paginatedTeamsData?.teams || [];
  const total = paginatedTeamsData?.total || 0;
  const pages = paginatedTeamsData?.pages || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Teams Management</h2>
        <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-500 neon-glow">
              <Plus className="w-4 h-4 mr-2" /> Add Team
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-white/10 text-white rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">{editingTeam ? 'Edit Team' : 'Add New Team'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Team Name</Label>
                <Input
                  placeholder="Real Madrid"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Short Name</Label>
                <Input
                  placeholder="RMA"
                  value={teamShortName}
                  onChange={e => setTeamShortName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Logo URL</Label>
                <Input
                  placeholder="https://upload.wikimedia.org/...logo.png"
                  value={teamLogo}
                  onChange={e => setTeamLogo(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500/50"
                />
              </div>
              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-500 neon-glow py-6 text-white font-bold rounded-xl mt-2" onClick={handleCreateTeam}>
                {editingTeam ? 'Update Team' : 'Save Team'}
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
              placeholder="Search teams by name..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Status:</span>
              <AdminSelect
                options={statusOptions}
                value={teamActiveFilter === null ? "" : String(teamActiveFilter)}
                onChange={(val) => {
                  setTeamActiveFilter(val === "" ? null : val === "true");
                  setTeamPage(1);
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
                <th className="text-left p-4 text-sm font-medium text-gray-400">Team</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Short Name</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Created At</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isTeamsLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-green-400" />
                      Loading teams...
                    </div>
                  </td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No teams found.
                  </td>
                </tr>
              ) : (
                teams.map((row: any, idx: number) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 text-sm text-gray-300">
                      <div className="flex items-center gap-3">
                        <img src={row.logo_url || ''} alt="" className="w-8 h-8 object-contain bg-white/5 rounded p-1" />
                        <span className="font-medium text-white">{row.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">{row.short_name}</td>
                    <td className="p-4 text-sm text-gray-300">
                      <Badge className={row.active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-white/10'}>
                        {row.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-gray-400">{formatToIST(row.created_at)}</td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-white/10">
                          <DropdownMenuItem
                            className="text-blue-400 focus:bg-blue-500/10 focus:text-blue-400"
                            onClick={() => {
                              setEditingTeam(row);
                              setTeamName(row.name);
                              setTeamShortName(row.short_name);
                              setTeamLogo(row.logo_url);
                              setTeamDialogOpen(true);
                            }}
                          >
                            <Edit className="w-3.5 h-3.5 mr-2" /> Edit Team
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                            onClick={() => handleDeleteTeam(row.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Team
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
          currentPage={teamPage}
          totalPages={pages}
          totalItems={total}
          itemsPerPage={perpage_value}
          onPageChange={setTeamPage}
          itemNamePlural="teams"
        />
      </Card>
    </div>
  );
};

export default AdminTeams;
