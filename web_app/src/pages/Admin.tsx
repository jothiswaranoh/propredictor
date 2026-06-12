import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Trophy, Calendar, TrendingUp, LogOut, Menu, X, Shield,
  ChevronRight, Search, Plus, Edit, Trash2, Download, Filter, MoreVertical, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { api } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import loginWallpaper from '../assets/login_wallpaper.jpg';

type TabType = 'dashboard' | 'teams' | 'matches' | 'users' | 'predictions';

export const formatToIST = (dateTime: string | Date) => {
  return new Date(dateTime).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

const parseDatetimeKolkata = (localString: string) => {
  if (!localString) return '';
  return new Date(`${localString}:00+05:30`).toISOString();
};

const formatDatetimeLocal = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  } as const;
  
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(date);
  
  const yyyy = parts.find(p => p.type === 'year')?.value || '1970';
  const MM = parts.find(p => p.type === 'month')?.value || '01';
  const dd = parts.find(p => p.type === 'day')?.value || '01';
  const hh = parts.find(p => p.type === 'hour')?.value || '00';
  const mm = parts.find(p => p.type === 'minute')?.value || '00';
  
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
};

const Admin: React.FC = () => {
  const perpage_value = 10;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [matchesList, setMatchesList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [predictionsList, setPredictionsList] = useState<any[]>([]);

  // Paginated Users list states
  const [totalUsers, setTotalUsers] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userActiveFilter, setUserActiveFilter] = useState<boolean | null>(null);
  const [userPage, setUserPage] = useState(1);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

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
    enabled: activeTab === 'users',
  });

  // Paginated Predictions list states
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [predPage, setPredPage] = useState(1);
  const [predSearch, setPredSearch] = useState('');
  const [debouncedPredSearch, setDebouncedPredSearch] = useState('');
  const [predStatusFilter, setPredStatusFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPredSearch(predSearch);
      setPredPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [predSearch]);

  const { data: paginatedPredictionsData, isLoading: isPredictionsLoading, refetch: refetchPredictions } = useQuery({
    queryKey: ['adminPredictions', predPage, debouncedPredSearch, predStatusFilter],
    queryFn: () => api.adminGetPredictions(predPage, perpage_value, debouncedPredSearch, predStatusFilter),
    enabled: activeTab === 'predictions',
  });

  // Paginated Teams list states
  const [teamPage, setTeamPage] = useState(1);
  const [teamSearch, setTeamSearch] = useState('');
  const [debouncedTeamSearch, setDebouncedTeamSearch] = useState('');
  const [teamActiveFilter, setTeamActiveFilter] = useState<boolean | null>(null);

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
    enabled: activeTab === 'teams',
  });

  // Paginated Matches list states
  const [matchPage, setMatchPage] = useState(1);
  const [matchSearch, setMatchSearch] = useState('');
  const [debouncedMatchSearch, setDebouncedMatchSearch] = useState('');
  const [matchStatusFilter, setMatchStatusFilter] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMatchSearch(matchSearch);
      setMatchPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [matchSearch]);

  const { data: paginatedMatchesData, isLoading: isMatchesLoading, refetch: refetchMatches } = useQuery({
    queryKey: ['adminMatches', matchPage, debouncedMatchSearch, matchStatusFilter],
    queryFn: () => api.adminGetMatches(matchPage, perpage_value, debouncedMatchSearch, matchStatusFilter),
    enabled: activeTab === 'matches',
  });

  // Dashboard Stats query
  const { data: dashboardStatsData, isLoading: isDashboardStatsLoading, refetch: refetchDashboardStats } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: () => api.adminGetDashboardStats(),
    enabled: activeTab === 'dashboard',
  });

  // Add Team Form States
  const [teamName, setTeamName] = useState('');
  const [teamShortName, setTeamShortName] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);

  // Add Match Form States
  const [matchTeam1, setMatchTeam1] = useState('');
  const [matchTeam2, setMatchTeam2] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchOpenTime, setMatchOpenTime] = useState('');
  const [matchCloseTime, setMatchCloseTime] = useState('');
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [matchStatus, setMatchStatus] = useState('upcoming');

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Clear states when dialogs close
  useEffect(() => {
    if (!teamDialogOpen) {
      setEditingTeam(null);
      setTeamName('');
      setTeamShortName('');
      setTeamLogo('');
    }
  }, [teamDialogOpen]);

  useEffect(() => {
    if (!userDialogOpen) {
      setEditingUser(null);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
    }
  }, [userDialogOpen]);

  useEffect(() => {
    if (!matchDialogOpen) {
      setEditingMatch(null);
      setMatchTeam1('');
      setMatchTeam2('');
      setMatchDate('');
      setMatchOpenTime('');
      setMatchCloseTime('');
      setMatchStatus('upcoming');
    }
  }, [matchDialogOpen]);

  // Declare Winner States
  const [selectedMatchForWinner, setSelectedMatchForWinner] = useState<any>(null);
  const [winningTeamSelection, setWinningTeamSelection] = useState<string>(''); // 'home', 'away', 'draw'
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const fetchTabEntries = async () => {
    try {
      setLoading(true);
      if (activeTab === 'matches') {
        const t = await api.adminGetTeams(1, 1000, '', true);
        setTeamsList(t.teams);
      }
    } catch (err: any) {
      toast({
        title: "Failed to fetch data",
        description: err.message || "Failed to load admin records.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabEntries();
  }, [activeTab]);

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
      setTeamName('');
      setTeamShortName('');
      setTeamLogo('');
      setEditingTeam(null);
      refetchTeams();
      refetchDashboardStats();
    } catch (err: any) {
      toast({ title: editingTeam ? "Update Team Failed" : "Create Team Failed", description: err.message || "Could not save team.", variant: "destructive" });
    }
  };

  const handleCreateMatch = async () => {
    if (!matchTeam1 || !matchTeam2 || !matchDate || !matchOpenTime || !matchCloseTime) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    try {
      if (editingMatch) {
        await api.adminUpdateMatch(editingMatch.id, {
          team1_id: matchTeam1,
          team2_id: matchTeam2,
          match_date: parseDatetimeKolkata(matchDate),
          prediction_open_time: parseDatetimeKolkata(matchOpenTime),
          prediction_close_time: parseDatetimeKolkata(matchCloseTime),
          status: matchStatus,
        });
        toast({ title: "Match Updated", description: "Successfully updated match!" });
      } else {
        await api.adminCreateMatch({
          team1_id: matchTeam1,
          team2_id: matchTeam2,
          match_date: parseDatetimeKolkata(matchDate),
          prediction_open_time: parseDatetimeKolkata(matchOpenTime),
          prediction_close_time: parseDatetimeKolkata(matchCloseTime),
        });
        toast({ title: "Match Scheduled", description: "Successfully created match!" });
      }
      setMatchDialogOpen(false);
      setMatchTeam1('');
      setMatchTeam2('');
      setMatchDate('');
      setMatchOpenTime('');
      setMatchCloseTime('');
      setMatchStatus('upcoming');
      setEditingMatch(null);
      refetchMatches();
      refetchDashboardStats();
    } catch (err: any) {
      toast({ title: editingMatch ? "Update Match Failed" : "Create Match Failed", description: err.message || "Could not save match.", variant: "destructive" });
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName || !newUserEmail || !newUserPassword) {
      toast({ title: "Validation Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    try {
      if (editingUser) {
        await api.adminUpdateUser(editingUser.id, {
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        });
        toast({ title: "User Updated", description: `Successfully updated ${newUserName}!` });
      } else {
        await api.adminCreateUser({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        });
        toast({ title: "User Created", description: `Successfully added ${newUserName}!` });
      }
      setUserDialogOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setEditingUser(null);
      refetchUsers();
      refetchDashboardStats();
    } catch (err: any) {
      toast({ title: editingUser ? "Update User Failed" : "Create User Failed", description: err.message || "Could not add user.", variant: "destructive" });
    }
  };

  const handleDeclareWinner = async () => {
    if (!selectedMatchForWinner) return;
    try {
      const matchId = selectedMatchForWinner.id;
      let winningTeamId: string | null = null;
      if (winningTeamSelection === 'home') {
        winningTeamId = selectedMatchForWinner.team1_id;
      } else if (winningTeamSelection === 'away') {
        winningTeamId = selectedMatchForWinner.team2_id;
      }

      await api.adminDeclareMatchResult(matchId, winningTeamId);
      await api.adminGenerateLeaderboard();

      toast({ title: "Winner Declared", description: "Outcome updated and leaderboard regenerated." });
      setWinnerDialogOpen(false);
      setSelectedMatchForWinner(null);
      setWinningTeamSelection('');
      refetchMatches();
      refetchDashboardStats();
    } catch (err: any) {
      toast({ title: "Action Failed", description: err.message || "Could not save match result.", variant: "destructive" });
    }
  };

  const handleRecalculateLeaderboard = async () => {
    try {
      await api.adminGenerateLeaderboard();
      toast({ title: "Leaderboard Rebuilt", description: "Successfully updated rankings." });
    } catch (err: any) {
      toast({ title: "Leaderboard Update Failed", description: err.message || "Failed to generate.", variant: "destructive" });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await api.adminDeleteTeam(id);
      toast({ title: "Team Deleted", description: "Successfully removed team." });
      refetchTeams();
      refetchDashboardStats();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message || "Could not delete team.", variant: "destructive" });
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this match?")) return;
    try {
      await api.adminDeleteMatch(id);
      toast({ title: "Match Deleted", description: "Successfully removed match." });
      refetchMatches();
      refetchDashboardStats();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message || "Could not delete match.", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.adminDeleteUser(id);
      toast({ title: "User Deleted", description: "Successfully removed user." });
      refetchUsers();
      refetchDashboardStats();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message || "Could not delete user.", variant: "destructive" });
    }
  };

  const handleDeletePrediction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prediction?")) return;
    try {
      await api.adminDeletePrediction(id);
      toast({ title: "Prediction Deleted", description: "Successfully removed prediction." });
      refetchPredictions();
      refetchDashboardStats();
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message || "Could not delete prediction.", variant: "destructive" });
    }
  };


  const stats = [
    { label: 'Total Users', value: String(dashboardStatsData?.total_users ?? 0), icon: Users, color: 'from-green-500 to-emerald-500', change: 'Live' },
    { label: 'Total Teams', value: String(dashboardStatsData?.total_teams ?? 0), icon: Trophy, color: 'from-blue-500 to-cyan-500', change: 'Live' },
    { label: 'Active Matches', value: String(dashboardStatsData?.active_matches ?? 0), icon: Calendar, color: 'from-orange-500 to-amber-500', change: 'Live' },
    { label: 'Predictions', value: String(dashboardStatsData?.total_predictions ?? 0), icon: TrendingUp, color: 'from-purple-500 to-pink-500', change: 'Live' },
  ];

  const sidebarItems: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'teams', label: 'Teams', icon: Trophy },
    { id: 'matches', label: 'Matches', icon: Calendar },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
  ];

  const renderDashboard = () => {
    const recentPredictions = dashboardStatsData?.recent_predictions || [];

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">System Administration</h2>
          <Button
            onClick={handleRecalculateLeaderboard}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Recalculate Leaderboard
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="glass-card p-6 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color}`} />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-400">
                      {stat.change}
                    </Badge>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentPredictions.map((activity: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                      {activity.user_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm text-gray-200">
                        <span className="font-medium">{activity.user_name || `User ${activity.user_id.slice(-6)}`}</span> predicted {activity.match?.team1?.short_name || 'Home'} vs {activity.match?.team2?.short_name || 'Away'}
                      </p>
                      <p className="text-xs text-gray-500">{formatToIST(activity.submitted_at)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              {recentPredictions.length === 0 && (
                <p className="text-gray-500 text-sm">No recent prediction activity.</p>
              )}
            </div>
          </Card>

          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              System Status
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Total Selections Submitted</span>
                  <span className="text-green-400">{dashboardStatsData?.total_predictions ?? 0}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Registered Teams</span>
                  <span className="text-blue-400">{dashboardStatsData?.total_teams ?? 0} / 32</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderDataTable = (
    columns: { key: string; label: string; render?: (value: Record<string, unknown>, row: Record<string, unknown>) => React.ReactNode }[],
    data: Record<string, unknown>[]
  ) => (
    <Card className="glass-card overflow-hidden">
      <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-gray-300">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 text-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
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
            {data.map((row, idx) => (
              <motion.tr
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="hover:bg-white/5 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="p-4 text-sm text-gray-300">
                    {col.render ? col.render(row[col.key] as Record<string, unknown>, row) : String(row[col.key] ?? '')}
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
                      {activeTab === 'matches' && (row.status === 'upcoming' || row.status === 'live') && (
                        <DropdownMenuItem
                          className="text-green-400 focus:bg-green-500/10 focus:text-green-400"
                          onClick={() => {
                            setSelectedMatchForWinner(row);
                            setWinningTeamSelection('');
                            setWinnerDialogOpen(true);
                          }}
                        >
                          <Trophy className="w-4 h-4 mr-2" /> Declare Winner
                        </DropdownMenuItem>
                      )}
                      {activeTab === 'teams' && (
                        <>
                          <DropdownMenuItem
                            className="text-blue-400 focus:bg-blue-500/10 focus:text-blue-400"
                            onClick={() => {
                              setEditingTeam(row);
                              setTeamName(String((row as any)?.name ?? ''));
                              setTeamShortName(String((row as any)?.short_name ?? ''));
                              setTeamLogo(String((row as any)?.logo_url ?? (row as any)?.logo ?? ''));
                              setTeamDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" /> Edit Team
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                            onClick={() => handleDeleteTeam(String(row.id))}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Team
                          </DropdownMenuItem>
                        </>
                      )}
                      {activeTab === 'users' && (
                        <>
                          <DropdownMenuItem
                            className="text-blue-400 focus:bg-blue-500/10 focus:text-blue-400"
                            onClick={() => {
                              setEditingUser(row);
                              setNewUserName(String((row as any)?.name ?? ''));
                              setNewUserEmail(String((row as any)?.email ?? ''));
                              setNewUserPassword(String((row as any)?.password ?? (row as any)?.password ?? ''));
                              setNewUserRole(String((row as any)?.role ?? 'user'));
                              setUserDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                            onClick={() => handleDeleteUser(String(row.id))}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete User
                          </DropdownMenuItem>
                        </>
                      )}
                      {activeTab === 'predictions' && (
                        <DropdownMenuItem
                          className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                          onClick={() => handleDeletePrediction(String(row.id))}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Prediction
                        </DropdownMenuItem>
                      )}
                      {activeTab === 'matches' && (
                        <>
                          <DropdownMenuItem
                            className="text-blue-400 focus:bg-blue-500/10 focus:text-blue-400"
                            onClick={() => {
                              setEditingMatch(row);
                              setMatchTeam1(String((row as any)?.team1_id ?? ''));
                              setMatchTeam2(String((row as any)?.team2_id ?? ''));
                              setMatchDate(formatDatetimeLocal((row as any)?.match_date));
                              setMatchOpenTime(formatDatetimeLocal((row as any)?.prediction_open_time));
                              setMatchCloseTime(formatDatetimeLocal((row as any)?.prediction_close_time));
                              setMatchStatus(String((row as any)?.status ?? 'upcoming'));
                              setMatchDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" /> Edit Match
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                            onClick={() => handleDeleteMatch(String(row.id))}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Match
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const renderTeams = () => {
    const teams = paginatedTeamsData?.teams || [];
    const total = paginatedTeamsData?.total || 0;
    const pages = paginatedTeamsData?.pages || 0;
    const startIdx = total === 0 ? 0 : (teamPage - 1) * perpage_value + 1;
    const endIdx = Math.min(teamPage * perpage_value, total);

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
                <select
                  value={teamActiveFilter === null ? "" : String(teamActiveFilter)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTeamActiveFilter(val === "" ? null : val === "true");
                    setTeamPage(1);
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 outline-none hover:bg-white/10 cursor-pointer"
                >
                  <option value="" className="bg-gray-900">All</option>
                  <option value="true" className="bg-gray-900">Active</option>
                  <option value="false" className="bg-gray-900">Inactive</option>
                </select>
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
          {pages > 1 && (
            <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <span className="text-xs text-gray-400">
                Showing <span className="font-semibold text-white">{startIdx}</span> to{" "}
                <span className="font-semibold text-white">{endIdx}</span> of{" "}
                <span className="font-semibold text-white">{total}</span> teams
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTeamPage(prev => Math.max(prev - 1, 1))}
                  disabled={teamPage === 1}
                  className="border-white/10 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={teamPage === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTeamPage(p)}
                    className={
                      teamPage === p
                        ? "bg-green-600 hover:bg-green-700 text-white font-bold"
                        : "border-white/10 text-gray-300"
                    }
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTeamPage(prev => Math.min(prev + 1, pages))}
                  disabled={teamPage === pages}
                  className="border-white/10 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderMatches = () => {
    const matches = paginatedMatchesData?.matches || [];
    const total = paginatedMatchesData?.total || 0;
    const pages = paginatedMatchesData?.pages || 0;
    const startIdx = total === 0 ? 0 : (matchPage - 1) * perpage_value + 1;
    const endIdx = Math.min(matchPage * perpage_value, total);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Matches Management</h2>
          <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-emerald-500 neon-glow">
                <Plus className="w-4 h-4 mr-2" /> Add Match
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-white/10 text-white rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">{editingMatch ? 'Edit Match' : 'Schedule New Match'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Home Team</Label>
                    <select
                      value={matchTeam1}
                      onChange={e => setMatchTeam1(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:border-green-500/50 outline-none cursor-pointer"
                    >
                      <option value="" className="bg-gray-900 text-white">Select Team...</option>
                      {teamsList.map(t => (
                        <option key={t.id} value={t.id} className="bg-gray-900 text-white">{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Away Team</Label>
                    <select
                      value={matchTeam2}
                      onChange={e => setMatchTeam2(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:border-green-500/50 outline-none cursor-pointer"
                    >
                      <option value="" className="bg-gray-900 text-white">Select Team...</option>
                      {teamsList.map(t => (
                        <option key={t.id} value={t.id} className="bg-gray-900 text-white">{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Match Kickoff Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={matchDate}
                    onChange={e => setMatchDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Prediction Open</Label>
                    <Input
                      type="datetime-local"
                      value={matchOpenTime}
                      onChange={e => setMatchOpenTime(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Prediction Close</Label>
                    <Input
                      type="datetime-local"
                      value={matchCloseTime}
                      onChange={e => setMatchCloseTime(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-green-500/50"
                    />
                  </div>
                </div>
                {editingMatch && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Status</Label>
                    <select
                      value={matchStatus}
                      onChange={e => setMatchStatus(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:border-green-500/50 outline-none cursor-pointer"
                    >
                      <option value="upcoming" className="bg-gray-900 text-white">Upcoming</option>
                      <option value="live" className="bg-gray-900 text-white">Live</option>
                      <option value="completed" className="bg-gray-900 text-white">Completed</option>
                    </select>
                  </div>
                )}
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-500 neon-glow py-6 text-white font-bold rounded-xl mt-2" onClick={handleCreateMatch}>
                  {editingMatch ? 'Update Match' : 'Schedule Match'}
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
                placeholder="Search matches by team names..."
                value={matchSearch}
                onChange={(e) => setMatchSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Status:</span>
                <select
                  value={matchStatusFilter}
                  onChange={(e) => {
                    setMatchStatusFilter(e.target.value);
                    setMatchPage(1);
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 outline-none hover:bg-white/10 cursor-pointer"
                >
                  <option value="" className="bg-gray-900">All</option>
                  <option value="upcoming" className="bg-gray-900">Upcoming</option>
                  <option value="live" className="bg-gray-900">Live</option>
                  <option value="completed" className="bg-gray-900">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Match</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Kickoff Time</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Prediction Open</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Prediction Close</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Winner</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isMatchesLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-green-400" />
                        Loading matches...
                      </div>
                    </td>
                  </tr>
                ) : matches.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No matches scheduled.
                    </td>
                  </tr>
                ) : (
                  matches.map((row: any, idx: number) => {
                    const homeTeamShort = row.team1?.short_name || 'HOME';
                    const awayTeamShort = row.team2?.short_name || 'AWAY';
                    const homeTeamLogo = row.team1?.logo_url;
                    const awayTeamLogo = row.team2?.logo_url;

                    let winnerName = 'Draw / TBD';
                    if (row.winning_team_id) {
                      if (row.winning_team_id === row.team1_id) {
                        winnerName = row.team1?.name || 'Home';
                      } else if (row.winning_team_id === row.team2_id) {
                        winnerName = row.team2?.name || 'Away';
                      }
                    }

                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4 text-sm text-gray-300">
                          <div className="flex items-center gap-2">
                            {homeTeamLogo && <img src={homeTeamLogo} alt="" className="w-6 h-6 object-contain bg-white/5 rounded p-0.5" />}
                            <span className="font-medium text-white">{homeTeamShort}</span>
                            <span className="text-gray-500">vs</span>
                            <span className="font-medium text-white">{awayTeamShort}</span>
                            {awayTeamLogo && <img src={awayTeamLogo} alt="" className="w-6 h-6 object-contain bg-white/5 rounded p-0.5" />}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-300">{formatToIST(row.match_date)}</td>
                        <td className="p-4 text-sm text-gray-300">{formatToIST(row.prediction_open_time)}</td>
                        <td className="p-4 text-sm text-gray-300">{formatToIST(row.prediction_close_time)}</td>
                        <td className="p-4 text-sm text-gray-300">
                          <Badge className={`${
                            row.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            row.status === 'live' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {row.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-300">
                          <Badge variant="secondary" className="bg-white/5 text-gray-300 border border-white/10">
                            {winnerName}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-900 border-white/10">
                              {(row.status === 'upcoming' || row.status === 'live') && (
                                <DropdownMenuItem
                                  className="text-green-400 focus:bg-green-500/10 focus:text-green-400"
                                  onClick={() => {
                                    setSelectedMatchForWinner(row);
                                    setWinningTeamSelection('');
                                    setWinnerDialogOpen(true);
                                  }}
                                >
                                  <Trophy className="w-3.5 h-3.5 mr-2" /> Declare Winner
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                className="text-blue-400 focus:bg-blue-500/10 focus:text-blue-400"
                                onClick={() => {
                                  setEditingMatch(row);
                                  setMatchTeam1(row.team1_id);
                                  setMatchTeam2(row.team2_id);
                                  setMatchDate(formatDatetimeLocal(row.match_date));
                                  setMatchOpenTime(formatDatetimeLocal(row.prediction_open_time));
                                  setMatchCloseTime(formatDatetimeLocal(row.prediction_close_time));
                                  setMatchStatus(row.status);
                                  setMatchDialogOpen(true);
                                }}
                              >
                                <Edit className="w-3.5 h-3.5 mr-2" /> Edit Match
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                                onClick={() => handleDeleteMatch(row.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Match
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Bar */}
          {pages > 1 && (
            <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <span className="text-xs text-gray-400">
                Showing <span className="font-semibold text-white">{startIdx}</span> to{" "}
                <span className="font-semibold text-white">{endIdx}</span> of{" "}
                <span className="font-semibold text-white">{total}</span> matches
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMatchPage(prev => Math.max(prev - 1, 1))}
                  disabled={matchPage === 1}
                  className="border-white/10 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={matchPage === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMatchPage(p)}
                    className={
                      matchPage === p
                        ? "bg-green-600 hover:bg-green-700 text-white font-bold"
                        : "border-white/10 text-gray-300"
                    }
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMatchPage(prev => Math.min(prev + 1, pages))}
                  disabled={matchPage === pages}
                  className="border-white/10 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderUsers = () => {
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
              <p className="text-xs text-gray-500">{row.email}</p>
            </div>
          </div>
        )
      },
      {
        key: 'password',
        label: 'Password',
        render: (value: any, row: any) => {
          const isVisible = visiblePasswords[row.id];
          return (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm tracking-wider">
                {isVisible ? String(value) : '••••••••'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/5"
                onClick={() => togglePasswordVisibility(row.id)}
              >
                {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          );
        }
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

    const users = paginatedUsersData?.users || [];
    const total = paginatedUsersData?.total || 0;
    const pages = paginatedUsersData?.pages || 0;
    const startIdx = total === 0 ? 0 : (userPage - 1) * perpage_value + 1;
    const endIdx = Math.min(userPage * perpage_value, total);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Users Management</h2>
          <Dialog open={userDialogOpen} onOpenChange={(open) => {
            setUserDialogOpen(open);
            if (!open) {
              setEditingUser(null);
              setNewUserName('');
              setNewUserEmail('');
              setNewUserPassword('');
              setNewUserRole('user');
            }
          }}>
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
                  <Label className="text-gray-300">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="john@gmail.com"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
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
                  <select
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white focus:border-green-500/50 outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-500 neon-glow py-6 text-white font-bold rounded-xl mt-2" onClick={handleCreateUser}>
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Custom DataTable with Server Pagination, Search & Filters, and NO Export button */}
        <Card className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Role:</span>
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 outline-none hover:bg-white/10 cursor-pointer"
                >
                  <option value="" className="bg-gray-900">All</option>
                  <option value="user" className="bg-gray-900">User</option>
                  <option value="admin" className="bg-gray-900">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Status:</span>
                <select
                  value={userActiveFilter === null ? "" : String(userActiveFilter)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUserActiveFilter(val === "" ? null : val === "true");
                    setUserPage(1);
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 outline-none hover:bg-white/10 cursor-pointer"
                >
                  <option value="" className="bg-gray-900">All</option>
                  <option value="true" className="bg-gray-900">Active</option>
                  <option value="false" className="bg-gray-900">Suspended</option>
                </select>
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
                                setNewUserEmail(row.email);
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
          {pages > 1 && (
            <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <span className="text-xs text-gray-400">
                Showing <span className="font-semibold text-white">{startIdx}</span> to{" "}
                <span className="font-semibold text-white">{endIdx}</span> of{" "}
                <span className="font-semibold text-white">{total}</span> users
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserPage(prev => Math.max(prev - 1, 1))}
                  disabled={userPage === 1}
                  className="border-white/10 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={userPage === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUserPage(p)}
                    className={
                      userPage === p
                        ? "bg-green-600 hover:bg-green-700 text-white font-bold"
                        : "border-white/10 text-gray-300"
                    }
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserPage(prev => Math.min(prev + 1, pages))}
                  disabled={userPage === pages}
                  className="border-white/10 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderPredictions = () => {
    const predictions = paginatedPredictionsData?.predictions || [];
    const total = paginatedPredictionsData?.total || 0;
    const pages = paginatedPredictionsData?.pages || 0;
    const startIdx = total === 0 ? 0 : (predPage - 1) * perpage_value + 1;
    const endIdx = Math.min(predPage * perpage_value, total);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Predictions Management</h2>
        </div>

        <Card className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by user or team names..."
                value={predSearch}
                onChange={(e) => setPredSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Status:</span>
                <select
                  value={predStatusFilter}
                  onChange={(e) => {
                    setPredStatusFilter(e.target.value);
                    setPredPage(1);
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300 outline-none hover:bg-white/10 cursor-pointer"
                >
                  <option value="" className="bg-gray-900">All</option>
                  <option value="correct" className="bg-gray-900">Correct</option>
                  <option value="incorrect" className="bg-gray-900">Incorrect</option>
                  <option value="pending" className="bg-gray-900">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Match</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">User</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Prediction</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Points</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Result</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-400">Submitted At</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isPredictionsLoading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-green-400" />
                        Loading predictions...
                      </div>
                    </td>
                  </tr>
                ) : predictions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No predictions found.
                    </td>
                  </tr>
                ) : (
                  predictions.map((p: any, idx: number) => {
                    const homeTeamShort = p.match?.team1?.short_name || 'HOME';
                    const awayTeamShort = p.match?.team2?.short_name || 'AWAY';
                    const homeTeamLogo = p.match?.team1?.logo_url;
                    const awayTeamLogo = p.match?.team2?.logo_url;

                    let predictedWinner = 'Draw';
                    if (p.winning_team_id === p.match?.team1_id) {
                      predictedWinner = p.match?.team1?.name || 'Home';
                    } else if (p.winning_team_id === p.match?.team2_id) {
                      predictedWinner = p.match?.team2?.name || 'Away';
                    }

                    const points = p.is_correct === true ? 10 : 0;

                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4 text-sm text-gray-300">
                          <div className="flex items-center gap-2">
                            {homeTeamLogo && <img src={homeTeamLogo} alt="" className="w-5 h-5 object-contain" />}
                            <span className="font-medium text-white">{homeTeamShort}</span>
                            <span className="text-gray-500">vs</span>
                            <span className="font-medium text-white">{awayTeamShort}</span>
                            {awayTeamLogo && <img src={awayTeamLogo} alt="" className="w-5 h-5 object-contain" />}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-300">
                          <span className="font-medium text-white">{p.user_name || `User ${p.user_id.slice(-6)}`}</span>
                        </td>
                        <td className="p-4 text-sm text-gray-300">
                          <Badge className="bg-white/5 text-gray-300 border border-white/10">
                            {predictedWinner}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-300">
                          <span className={p.is_correct === true ? 'text-green-400 font-semibold' : 'text-gray-400'}>
                            {p.is_correct === null || p.is_correct === undefined ? '-' : points}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-300">
                          {p.is_correct === null || p.is_correct === undefined ? (
                            <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30">TBD</Badge>
                          ) : (
                            <Badge className={p.is_correct ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}>
                              {p.is_correct ? 'Correct' : 'Incorrect'}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-sm text-gray-400">
                          {formatToIST(p.submitted_at)}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-900 border-white/10">
                              <DropdownMenuItem
                                onClick={() => handleDeletePrediction(p.id)}
                                className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Bar */}
          {pages > 1 && (
            <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <span className="text-xs text-gray-400">
                Showing <span className="font-semibold text-white">{startIdx}</span> to{" "}
                <span className="font-semibold text-white">{endIdx}</span> of{" "}
                <span className="font-semibold text-white">{total}</span> predictions
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPredPage(prev => Math.max(prev - 1, 1))}
                  disabled={predPage === 1}
                  className="border-white/10 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={predPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPredPage(pageNumber)}
                    className={
                      predPage === pageNumber
                        ? "bg-green-600 hover:bg-green-700 text-white font-bold"
                        : "border-white/10 text-gray-300"
                    }
                  >
                    {pageNumber}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPredPage(prev => Math.min(prev + 1, pages))}
                  disabled={predPage === pages}
                  className="border-white/10 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    if (loading || (activeTab === 'dashboard' && isDashboardStatsLoading)) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full"
            />
            <p className="text-gray-400 text-sm">Loading admin dashboard data...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'teams': return renderTeams();
      case 'matches': return renderMatches();
      case 'users': return renderUsers();
      case 'predictions': return renderPredictions();
      default: return renderDashboard();
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${loginWallpaper})` }}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] pointer-events-none" />
      <div className="relative z-10 min-h-screen football-pattern flex flex-col">
        <div className="lg:hidden glass-card border-b border-white/10 sticky top-0 z-50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xl font-bold text-gradient">Admin Panel</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <div className="flex">
          <aside className={`
          fixed lg:sticky top-0 lg:top-0 left-0 h-screen w-64 glass-card-strong
          transform transition-transform duration-300 z-40
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            <div className="p-6 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <span className="text-lg font-bold text-gradient">Admin Panel</span>
                  <p className="text-xs text-gray-500">ProPredictor</p>
                </div>
              </div>
            </div>

            <nav className="p-4 space-y-1">
              {sidebarItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                    ? 'bg-gradient-to-r from-green-500/20 to-blue-500/10 text-white border border-green-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {activeTab === item.id && (
                    <ChevronRight className="w-4 h-4 ml-auto text-green-400" />
                  )}
                </motion.button>
              ))}
            </nav>

            <div className="absolute bottom-4 left-4 right-4">
              <Button
                variant="ghost"
                onClick={() => setLogoutConfirmOpen(true)}
                className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </aside>

          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            />
          )}

          <main className="flex-1 p-4 lg:p-8 min-h-screen lg:ml-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </main>
        </div>

        {/* Declare Result Dialog */}
        <Dialog open={winnerDialogOpen} onOpenChange={setWinnerDialogOpen}>
          <DialogContent className="bg-gray-900 border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Declare Match Outcome</DialogTitle>
            </DialogHeader>
            {selectedMatchForWinner && (
              <div className="space-y-4 pt-4">
                <p className="text-sm text-gray-400">
                  Set result for match: <span className="font-semibold text-white">
                    {selectedMatchForWinner.team1?.short_name || 'HOME'} vs {selectedMatchForWinner.team2?.short_name || 'AWAY'}
                  </span>
                </p>
                <div className="space-y-2">
                  <Label className="text-gray-300">Select Winner</Label>
                  <select
                    value={winningTeamSelection}
                    onChange={e => setWinningTeamSelection(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white"
                  >
                    <option value="" className="bg-gray-900 text-white">Select Winner...</option>
                    <option value="home" className="bg-gray-900 text-white">{selectedMatchForWinner.team1?.name} (Home Winner)</option>
                    <option value="away" className="bg-gray-900 text-white">{selectedMatchForWinner.team2?.name} (Away Winner)</option>
                    <option value="draw" className="bg-gray-900 text-white">Draw (No Winner)</option>
                  </select>
                </div>
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-500" onClick={handleDeclareWinner}>Declare & Complete</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Logout Confirmation Dialog */}
        <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
          <DialogContent className="bg-gray-900 border border-white/10 text-white rounded-2xl max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <LogOut className="w-5 h-5 text-red-500" />
                Confirm Sign Out
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Are you sure you want to sign out of the Admin panel?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex gap-2 justify-end mt-4">
              <Button
                variant="ghost"
                onClick={() => setLogoutConfirmOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  api.logout();
                  navigate('/');
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-6"
              >
                Sign Out
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;

