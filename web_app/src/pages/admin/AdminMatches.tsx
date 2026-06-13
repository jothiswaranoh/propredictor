import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus, Search, RefreshCw, MoreVertical, Edit, Trash2, Trophy, X
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
import { DateTimePicker } from '../../components/admin/DateTimePicker';

const matchStatusOptions = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live' },
  { value: 'completed', label: 'Completed' },
];

const statusFilterOptions = [
  { value: '', label: 'All Status' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'live', label: 'Live' },
  { value: 'completed', label: 'Completed' },
];

const AdminMatches: React.FC = () => {
  const perpage_value = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Table filter states
  const [matchPage, setMatchPage] = useState(1);
  const [matchSearch, setMatchSearch] = useState('');
  const [debouncedMatchSearch, setDebouncedMatchSearch] = useState('');
  const [matchStatusFilter, setMatchStatusFilter] = useState('');
  const [matchTeamFilter, setMatchTeamFilter] = useState('');
  const [matchDateFilter, setMatchDateFilter] = useState('');

  // Form states — all dates as datetime-local strings ("YYYY-MM-DDTHH:mm")
  const [matchTeam1, setMatchTeam1] = useState('');
  const [matchTeam2, setMatchTeam2] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchOpenTime, setMatchOpenTime] = useState('');
  const [matchCloseTime, setMatchCloseTime] = useState('');
  const [matchStatus, setMatchStatus] = useState('upcoming');
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Declare Winner states
  const [selectedMatchForWinner, setSelectedMatchForWinner] = useState<any>(null);
  const [winningTeamSelection, setWinningTeamSelection] = useState<string>('');
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
  const [isDeclaring, setIsDeclaring] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMatchSearch(matchSearch);
      setMatchPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [matchSearch]);

  const { data: paginatedMatchesData, isLoading: isMatchesLoading, refetch: refetchMatches } = useQuery({
    queryKey: ['adminMatches', matchPage, debouncedMatchSearch, matchStatusFilter, matchTeamFilter, matchDateFilter],
    queryFn: () => api.adminGetMatches(matchPage, perpage_value, debouncedMatchSearch, matchStatusFilter, matchTeamFilter, matchDateFilter),
  });

  const { data: activeTeamsResponse } = useQuery({
    queryKey: ['adminTeamsAllActive'],
    queryFn: () => api.adminGetTeams(1, 100, '', true),
  });
  const teamsList = activeTeamsResponse?.teams || [];

  const teamOptions = teamsList.map((t: any) => ({
    value: t.id,
    label: t.name,
  }));

  const teamFilterOptions = [
    { value: '', label: 'All Teams' },
    ...teamOptions,
  ];

  const winnerOptions = selectedMatchForWinner ? [
    { value: '', label: 'Select winner...' },
    { value: 'home', label: `🏠 ${selectedMatchForWinner.team1?.name || 'Home Team'} (Home)` },
    { value: 'away', label: `✈️ ${selectedMatchForWinner.team2?.name || 'Away Team'} (Away)` },
    { value: 'draw', label: '🤝 Draw' },
  ] : [];

  const resetForm = () => {
    setEditingMatch(null);
    setMatchTeam1('');
    setMatchTeam2('');
    setMatchDate('');
    setMatchOpenTime('');
    setMatchCloseTime('');
    setMatchStatus('upcoming');
  };

  useEffect(() => {
    if (!matchDialogOpen) resetForm();
  }, [matchDialogOpen]);

  const handleCreateMatch = async () => {
    if (!matchTeam1 || !matchTeam2 || !matchDate || !matchOpenTime || !matchCloseTime) {
      toast({ title: 'Validation Error', description: 'All fields are required.', variant: 'destructive' });
      return;
    }
    if (matchTeam1 === matchTeam2) {
      toast({ title: 'Validation Error', description: 'Home and Away teams must be different.', variant: 'destructive' });
      return;
    }
    // Frontend time-ordering validation (mirrors backend rules)
    const openMs = new Date(matchOpenTime).getTime();
    const closeMs = new Date(matchCloseTime).getTime();
    const kickoffMs = new Date(matchDate).getTime();
    if (openMs >= closeMs) {
      toast({ title: 'Invalid Times', description: 'Prediction Open time must be before Prediction Close time.', variant: 'destructive' });
      return;
    }
    if (closeMs > kickoffMs) {
      toast({ title: 'Invalid Times', description: 'Prediction Close time must be before or equal to the Match Kickoff time.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        team1_id: matchTeam1,
        team2_id: matchTeam2,
        match_date: matchDate,
        prediction_open_time: matchOpenTime,
        prediction_close_time: matchCloseTime,
        status: matchStatus,
      };

      if (editingMatch) {
        await api.adminUpdateMatch(editingMatch.id, payload);
        toast({ title: 'Match Updated', description: 'Match details saved successfully!' });
      } else {
        await api.adminCreateMatch(payload);
        toast({ title: 'Match Scheduled', description: 'New match created successfully!' });
      }
      setMatchDialogOpen(false);
      refetchMatches();
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    } catch (err: any) {
      toast({ title: editingMatch ? 'Update Failed' : 'Create Failed', description: err.message || 'Could not save match.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeclareWinner = async () => {
    if (!selectedMatchForWinner || !winningTeamSelection) {
      toast({ title: 'Selection Required', description: 'Please select a winner or draw.', variant: 'destructive' });
      return;
    }
    setIsDeclaring(true);
    try {
      let winningTeamId: string | null = null;
      if (winningTeamSelection === 'home') winningTeamId = selectedMatchForWinner.team1_id;
      else if (winningTeamSelection === 'away') winningTeamId = selectedMatchForWinner.team2_id;

      await api.adminDeclareMatchResult(selectedMatchForWinner.id, winningTeamId);
      await api.adminGenerateLeaderboard();

      toast({ title: 'Winner Declared! 🏆', description: 'Match outcome saved and leaderboard updated.' });
      setWinnerDialogOpen(false);
      setSelectedMatchForWinner(null);
      setWinningTeamSelection('');
      refetchMatches();
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    } catch (err: any) {
      toast({ title: 'Action Failed', description: err.message || 'Could not save match result.', variant: 'destructive' });
    } finally {
      setIsDeclaring(false);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return;
    try {
      await api.adminDeleteMatch(id);
      toast({ title: 'Match Deleted', description: 'Successfully removed match.' });
      refetchMatches();
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    } catch (err: any) {
      toast({ title: 'Delete Failed', description: err.message || 'Could not delete match.', variant: 'destructive' });
    }
  };

  const openEditDialog = (row: any) => {
    setEditingMatch(row);
    setMatchTeam1(row.team1_id);
    setMatchTeam2(row.team2_id);
    setMatchDate(row.match_date);
    setMatchOpenTime(row.prediction_open_time);
    setMatchCloseTime(row.prediction_close_time);
    setMatchStatus(row.status);
    setMatchDialogOpen(true);
  };

  const matches = paginatedMatchesData?.matches || [];
  const total = paginatedMatchesData?.total || 0;
  const pages = paginatedMatchesData?.pages || 0;

  const statusBadgeClass = (status: string) => {
    if (status === 'completed') return 'bg-green-500/20 text-green-400 border border-green-500/30';
    if (status === 'live') return 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse';
    return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Matches Management</h2>

        {/* Add / Edit Match Dialog */}
        <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-500 neon-glow">
              <Plus className="w-4 h-4 mr-2" /> Add Match
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border border-white/10 text-white rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-semibold">
                {editingMatch ? '✏️ Edit Match' : '📅 Schedule New Match'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              {/* Teams */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs uppercase tracking-wide">Home Team</Label>
                  <AdminSelect
                    options={teamOptions}
                    value={matchTeam1}
                    onChange={setMatchTeam1}
                    placeholder="Search & select..."
                    isSearchable={true}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs uppercase tracking-wide">Away Team</Label>
                  <AdminSelect
                    options={teamOptions}
                    value={matchTeam2}
                    onChange={setMatchTeam2}
                    placeholder="Search & select..."
                    isSearchable={true}
                  />
                </div>
              </div>

              {/* Selected teams preview */}
              {(matchTeam1 || matchTeam2) && (
                <div className="flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-white font-medium text-sm">
                    {teamOptions.find(t => t.value === matchTeam1)?.label || '—'}
                  </span>
                  <span className="text-gray-500 text-xs font-bold">VS</span>
                  <span className="text-white font-medium text-sm">
                    {teamOptions.find(t => t.value === matchTeam2)?.label || '—'}
                  </span>
                </div>
              )}

              {/* Match Kickoff */}
              <div className="space-y-1.5">
                <Label className="text-gray-400 text-xs uppercase tracking-wide">
                  Match Kickoff Date & Time <span className="text-gray-600">(IST)</span>
                </Label>
                <DateTimePicker value={matchDate} onChange={setMatchDate} />
              </div>

              {/* Prediction Window */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs uppercase tracking-wide">
                    Prediction Opens <span className="text-gray-600">(IST)</span>
                  </Label>
                  <DateTimePicker value={matchOpenTime} onChange={setMatchOpenTime} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs uppercase tracking-wide">
                    Prediction Closes <span className="text-gray-600">(IST)</span>
                  </Label>
                  <DateTimePicker value={matchCloseTime} onChange={setMatchCloseTime} />
                </div>
              </div>

              {/* Time ordering hint */}
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="text-blue-400 text-xs mt-0.5">ℹ️</span>
                <p className="text-xs text-blue-300">
                  <span className="font-semibold">Time order required:</span> Prediction Open → Prediction Close → Match Kickoff
                </p>
              </div>


              {editingMatch && (
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs uppercase tracking-wide">Match Status</Label>
                  <AdminSelect
                    options={matchStatusOptions}
                    value={matchStatus}
                    onChange={setMatchStatus}
                  />
                </div>
              )}

              {/* Action Button */}
              <Button
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 neon-glow py-6 text-white font-bold rounded-xl"
                onClick={handleCreateMatch}
                disabled={isSaving}
              >
                {isSaving ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : editingMatch ? (
                  '💾 Update Match'
                ) : (
                  '📅 Schedule Match'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Matches Table Card */}
      <Card className="glass-card overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by team name..."
              value={matchSearch}
              onChange={(e) => setMatchSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 whitespace-nowrap">Team:</span>
              <AdminSelect
                options={teamFilterOptions}
                value={matchTeamFilter}
                onChange={(val) => { setMatchTeamFilter(val); setMatchPage(1); }}
                className="w-40"
                isSearchable={true}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 whitespace-nowrap">Date:</span>
              <div className="relative">
                <input
                  type="date"
                  value={matchDateFilter}
                  onChange={(e) => { setMatchDateFilter(e.target.value); setMatchPage(1); }}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 outline-none hover:border-white/20 focus:border-green-500/50 [color-scheme:dark] cursor-pointer transition-colors"
                />
                {matchDateFilter && (
                  <button
                    onClick={() => { setMatchDateFilter(''); setMatchPage(1); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 whitespace-nowrap">Status:</span>
              <AdminSelect
                options={statusFilterOptions}
                value={matchStatusFilter}
                onChange={(val) => { setMatchStatusFilter(val); setMatchPage(1); }}
                className="w-36"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Match</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Kickoff (IST)</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Pred. Open</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Pred. Close</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Winner</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isMatchesLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-green-400" />
                      Loading matches...
                    </div>
                  </td>
                </tr>
              ) : matches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    No matches found.
                  </td>
                </tr>
              ) : (
                matches.map((row: any, idx: number) => {
                  const homeShort = row.team1?.short_name || row.team1?.name || 'HOME';
                  const awayShort = row.team2?.short_name || row.team2?.name || 'AWAY';
                  const homeLogoUrl = row.team1?.logo_url;
                  const awayLogoUrl = row.team2?.logo_url;

                  let winnerName = '—';
                  if (row.status === 'completed') {
                    if (!row.winning_team_id) {
                      winnerName = 'Draw';
                    } else if (row.winning_team_id === row.team1_id) {
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
                      {/* Match column */}
                      <td className="p-4 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          {homeLogoUrl
                            ? <img src={homeLogoUrl} alt={homeShort} className="w-6 h-6 object-contain bg-white/5 rounded p-0.5" />
                            : <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs text-gray-400">{homeShort[0]}</div>
                          }
                          <span className="font-semibold text-white">{homeShort}</span>
                          <span className="text-gray-600 text-xs font-bold">vs</span>
                          <span className="font-semibold text-white">{awayShort}</span>
                          {awayLogoUrl
                            ? <img src={awayLogoUrl} alt={awayShort} className="w-6 h-6 object-contain bg-white/5 rounded p-0.5" />
                            : <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs text-gray-400">{awayShort[0]}</div>
                          }
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="p-4 text-sm text-gray-300 whitespace-nowrap">{formatToIST(row.match_date)}</td>
                      <td className="p-4 text-sm text-gray-400 whitespace-nowrap">{formatToIST(row.prediction_open_time)}</td>
                      <td className="p-4 text-sm text-gray-400 whitespace-nowrap">{formatToIST(row.prediction_close_time)}</td>

                      {/* Status */}
                      <td className="p-4 text-sm">
                        <Badge className={statusBadgeClass(row.status)}>
                          {row.status === 'live' && '● '}{row.status}
                        </Badge>
                      </td>

                      {/* Winner */}
                      <td className="p-4 text-sm text-gray-300">
                        {row.status === 'completed' ? (
                          <Badge className={winnerName === 'Draw' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}>
                            {winnerName === 'Draw' ? '🤝 Draw' : `🏆 ${winnerName}`}
                          </Badge>
                        ) : (
                          <span className="text-gray-600 text-xs">TBD</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-900 border-white/10">
                            {(row.status === 'upcoming' || row.status === 'live') && (
                              <DropdownMenuItem
                                className="text-yellow-400 focus:bg-yellow-500/10 focus:text-yellow-400"
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
                              onClick={() => openEditDialog(row)}
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

        {/* Pagination */}
        <AdminPagination
          currentPage={matchPage}
          totalPages={pages}
          totalItems={total}
          itemsPerPage={perpage_value}
          onPageChange={setMatchPage}
          itemNamePlural="matches"
        />
      </Card>

      {/* Declare Winner Dialog */}
      <Dialog open={winnerDialogOpen} onOpenChange={(open) => {
        setWinnerDialogOpen(open);
        if (!open) { setSelectedMatchForWinner(null); setWinningTeamSelection(''); }
      }}>
        <DialogContent className="bg-gray-900 border border-white/10 text-white rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-semibold">🏆 Declare Match Result</DialogTitle>
          </DialogHeader>
          {selectedMatchForWinner && (
            <div className="space-y-5 pt-2">
              {/* Match preview */}
              <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                {selectedMatchForWinner.team1?.logo_url && (
                  <img src={selectedMatchForWinner.team1.logo_url} className="w-8 h-8 object-contain" alt="" />
                )}
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">
                    {selectedMatchForWinner.team1?.name || 'Home'} vs {selectedMatchForWinner.team2?.name || 'Away'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatToIST(selectedMatchForWinner.match_date)}</p>
                </div>
                {selectedMatchForWinner.team2?.logo_url && (
                  <img src={selectedMatchForWinner.team2.logo_url} className="w-8 h-8 object-contain" alt="" />
                )}
              </div>

              {/* Winner select */}
              <div className="space-y-1.5">
                <Label className="text-gray-400 text-xs uppercase tracking-wide">Select Outcome</Label>
                <AdminSelect
                  options={winnerOptions}
                  value={winningTeamSelection}
                  onChange={setWinningTeamSelection}
                  placeholder="Select winner..."
                />
              </div>

              <Button
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 neon-glow py-5 text-white font-bold rounded-xl"
                onClick={handleDeclareWinner}
                disabled={isDeclaring || !winningTeamSelection}
              >
                {isDeclaring ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  '🏆 Declare & Complete'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMatches;
