import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Trophy, TrendingUp, Crown, Search, ArrowUpDown } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent } from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { LeaderboardEntry } from '../types';
import { api } from '../lib/api';
import loginWallpaper from '../assets/login_wallpaper.jpg';
import { useToast } from '../hooks/use-toast';

const mapBackendLeaderboardToFrontend = (l: any): LeaderboardEntry => {
  return {
    rank: l.rank,
    userId: l.user_id,
    userName: l.name,
    points: l.points,
    predictions: l.predictions ?? 0,
    accuracy: l.accuracy ?? 0,
    avatar: l.avatar,
  };
};

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState<'rank' | 'points' | 'predictions' | 'accuracy'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const perPage = 10;

  const { data: userProfile, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => api.getCurrentUser()
  });

  // Fetch logged in user's statistics (rank and points)
  const { data: currentUserStats } = useQuery({
    queryKey: ['currentUserStats', userProfile?.id],
    queryFn: () => userProfile?.id ? api.getUserPublicProfile(userProfile.id) : null,
    enabled: !!userProfile?.id
  });

  // Fetch paginated, searched, and sorted leaderboard list
  const { data: leaderboardData, isLoading: isLoadingLeaderboard, error: leaderboardError } = useQuery({
    queryKey: ['leaderboardList', page, debouncedSearch, sortField, sortOrder],
    queryFn: async () => {
      const raw = await api.getLeaderboard(page, perPage, debouncedSearch, sortField, sortOrder);
      return {
        leaderboard: raw.leaderboard.map(mapBackendLeaderboardToFrontend),
        total: raw.total,
        pages: raw.pages
      };
    }
  });

  const { data: selectedUserProfileData, isLoading: isLoadingSelectedProfile } = useQuery({
    queryKey: ['publicProfile', selectedUserId],
    queryFn: () => selectedUserId ? api.getUserPublicProfile(selectedUserId) : null,
    enabled: !!selectedUserId && isProfileOpen
  });

  const loading = isLoadingProfile || isLoadingLeaderboard;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page to 1 when sorting changes
  useEffect(() => {
    setPage(1);
  }, [sortField, sortOrder]);

  const leaderboardList = leaderboardData?.leaderboard || [];
  const totalPages = leaderboardData?.pages || 1;
  const totalItems = leaderboardData?.total || 0;

  useEffect(() => {
    if (profileError || leaderboardError) {
      toast({
        title: "Error loading data",
        description: (profileError as any)?.message || (leaderboardError as any)?.message || "Failed to load leaderboard.",
        variant: "destructive",
      });
    }
  }, [profileError, leaderboardError, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
          />
          <p className="text-gray-400 text-sm">Loading Rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={isAdminView ? "space-y-6 w-full" : "min-h-screen bg-cover bg-center relative"}
      style={isAdminView ? {} : { backgroundImage: `url(${loginWallpaper})` }}
    >
      {!isAdminView && <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] pointer-events-none" />}
      <div className={isAdminView ? "space-y-6 w-full" : "relative z-10 min-h-screen football-pattern flex flex-col"}>
        {!isAdminView && (
          <nav className="glass-card border-b border-white/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 h-16">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5 mr-1" />
                  Back to Dashboard
                </Button>
                <div className="flex-1" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-xl font-bold text-gradient hidden sm:block">ProPredictor</span>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="glass-card p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-white/10 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white">Global Rankings</h2>
                    <p className="text-sm text-gray-400 mt-1">See how you stack up against the competition</p>
                  </div>
                </div>

                {currentUserStats?.profile && (
                  <div className="glass-card px-6 py-3 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-blue-400 uppercase tracking-wider font-semibold">Your Rank</span>
                      <span className="text-2xl font-bold text-white flex items-center gap-2">
                        #{currentUserStats.profile.rank} <Crown className="w-4 h-4 text-yellow-500" />
                      </span>
                    </div>
                    <div className="h-10 w-px bg-white/20 mx-2" />
                    <div className="flex flex-col">
                      <span className="text-xs text-green-400 uppercase tracking-wider font-semibold">Points</span>
                      <span className="text-xl font-bold text-white">{currentUserStats.profile.points * 10}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search players..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={sortField} onValueChange={(val: any) => setSortField(val)}>
                    <SelectTrigger className="w-[180px] bg-slate-800 border-white/10 text-gray-300 focus:ring-0 focus:border-white/20">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-gray-300">
                      <SelectItem value="rank" className="hover:bg-white/5 focus:bg-white/10 focus:text-white cursor-pointer">Sort by Rank</SelectItem>
                      <SelectItem value="points" className="hover:bg-white/5 focus:bg-white/10 focus:text-white cursor-pointer">Sort by Points</SelectItem>
                      <SelectItem value="predictions" className="hover:bg-white/5 focus:bg-white/10 focus:text-white cursor-pointer">Sort by Predictions</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {leaderboardList.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No rankings available yet.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-5">Player</div>
                    <div className="col-span-2 text-center">Predictions</div>
                    <div className="col-span-2 text-center">Won</div>
                    <div className="col-span-2 text-right">Points</div>
                  </div>

                  {leaderboardList.map((entry, idx) => {
                    const isCurrentUser = entry.userId === userProfile?.id || entry.userName === userProfile?.name;
                    return (
                      <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => {
                          setSelectedUserId(entry.userId);
                          setIsProfileOpen(true);
                        }}
                        className={`grid grid-cols-1 md:grid-cols-12 items-center gap-4 px-4 py-4 md:px-6 rounded-xl transition-all cursor-pointer hover:scale-[0.99] active:scale-[0.985] ${isCurrentUser
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 neon-glow-blue'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                      >
                        <div className="col-span-1 flex items-center justify-between md:justify-center w-full md:w-auto mb-2 md:mb-0">
                          <span className="md:hidden text-xs text-gray-400 font-semibold uppercase tracking-wider">Rank</span>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-yellow-500/30' :
                            entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-gray-400/30' :
                              entry.rank === 3 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-amber-600/30' :
                                'bg-gray-800 text-white border border-gray-700'
                            }`}>
                            {entry.rank}
                          </div>
                        </div>

                        <div className="col-span-5 flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                            {entry.avatar ? (
                              <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                                {entry.userName[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className={`font-bold ${isCurrentUser ? 'text-white' : 'text-gray-200'}`}>
                              {entry.userName}
                              {isCurrentUser && <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">YOU</span>}
                            </p>
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center justify-between md:justify-center">
                          <span className="md:hidden text-xs text-gray-400 font-semibold uppercase tracking-wider">Predictions</span>
                          <span className="text-sm text-gray-300 font-medium">{entry.predictions}</span>
                        </div>

                        <div className="col-span-2 flex items-center justify-between md:justify-center">
                          <span className="md:hidden text-xs text-gray-400 font-semibold uppercase tracking-wider">Won</span>
                          <span className="text-sm text-gray-300 font-medium">{entry.points}</span>
                        </div>

                        <div className="col-span-2 flex items-center justify-between md:justify-end border-t border-white/10 md:border-t-0 pt-3 md:pt-0 mt-3 md:mt-0">
                          <span className="md:hidden text-xs text-gray-400 font-semibold uppercase tracking-wider">Points</span>
                          <span className={`text-lg font-bold ${isCurrentUser ? 'text-blue-400' : 'text-green-400'}`}>
                            {entry.points * 10}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="p-4 mt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Showing <span className="font-semibold text-white">{Math.min((page - 1) * perPage + 1, totalItems)}</span> to{" "}
                        <span className="font-semibold text-white">{Math.min(page * perPage, totalItems)}</span> of{" "}
                        <span className="font-semibold text-white">{totalItems}</span> players
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                          disabled={page === 1}
                          className="border-white/10 text-gray-300 disabled:opacity-50"
                        >
                          Previous
                        </Button>
                        <span className="text-gray-400 text-sm mx-2">Page {page} of {totalPages}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={page === totalPages}
                          className="border-white/10 text-gray-300 disabled:opacity-50"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        </main>

        {/* Public Profile Dialog */}
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogContent className="bg-gray-900 border border-white/10 text-white rounded-2xl max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto p-6">
            {isLoadingSelectedProfile ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
                />
                <p className="text-xs text-gray-400">Fetching player profile...</p>
              </div>
            ) : selectedUserProfileData ? (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {selectedUserProfileData.profile.avatar ? (
                      <img src={selectedUserProfileData.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-500/20 flex items-center justify-center text-xl font-bold text-blue-400">
                        {selectedUserProfileData.profile.name[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedUserProfileData.profile.name}</h3>
                    <p className="text-sm text-gray-400">@{selectedUserProfileData.profile.username}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Rank</span>
                    <p className="text-xl font-bold text-yellow-400 mt-1">#{selectedUserProfileData.profile.rank}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Points</span>
                    <p className="text-xl font-bold text-green-400 mt-1">{selectedUserProfileData.profile.points * 10}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Accuracy</span>
                    <p className="text-xl font-bold text-blue-400 mt-1">{selectedUserProfileData.profile.accuracy}%</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Predictions</span>
                    <p className="text-xl font-bold text-purple-400 mt-1">{selectedUserProfileData.profile.predictions}</p>
                  </div>
                </div>

                {/* Prediction History */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Prediction History</h4>
                  
                  {selectedUserProfileData.prediction_history.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-500 bg-white/5 rounded-xl border border-white/10">
                      No closed predictions yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {selectedUserProfileData.prediction_history.map((pred: any) => {
                        const match = pred.match;
                        if (!match) return null;

                        // Map predictedWinner
                        let predictedWinnerShort = 'Draw';
                        if (pred.winning_team_id === match.team1_id) {
                          predictedWinnerShort = match.team1?.short_name || 'HOME';
                        } else if (pred.winning_team_id === match.team2_id) {
                          predictedWinnerShort = match.team2?.short_name || 'AWAY';
                        }

                        // Formatting dates
                        const dateObj = new Date(match.match_date);
                        const formattedDate = dateObj.toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: '2-digit',
                          month: 'short'
                        });

                        return (
                          <div key={pred.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-2 shrink-0">
                                <img src={match.team1?.logo_url} alt="" className="w-6 h-6 rounded-full bg-gray-800 p-0.5 border border-gray-900" />
                                <img src={match.team2?.logo_url} alt="" className="w-6 h-6 rounded-full bg-gray-800 p-0.5 border border-gray-900" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-200">
                                  {match.team1?.short_name} vs {match.team2?.short_name}
                                </p>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                  Pick: <span className="text-white font-medium">{predictedWinnerShort}</span> • {formattedDate}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              {pred.is_correct === null ? (
                                <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 text-[10px]">
                                  Pending
                                </Badge>
                              ) : (
                                <Badge className={pred.is_correct ? 'bg-green-500/20 text-green-400 border border-green-500/30 text-[10px]' : 'bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]'}>
                                  {pred.is_correct ? '+10 Pts' : '0 Pts'}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-gray-400">Failed to load profile.</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LeaderboardPage;
