import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trophy, TrendingUp, Crown, Search, ArrowUpDown } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
    predictions: l.predictions || 10,
    accuracy: l.accuracy || 70,
    avatar: l.avatar,
  };
};

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'rank' | 'points' | 'predictions' | 'accuracy'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const perPage = 10;
  const { data: userProfile, isLoading: isLoadingProfile, error: profileError } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => api.getCurrentUser()
  });

  const { data: leaderboardList = [], isLoading: isLoadingLeaderboard, error: leaderboardError } = useQuery({
    queryKey: ['leaderboardList'],
    queryFn: async () => {
      const rawLeaderboard = await api.getLeaderboard();
      return rawLeaderboard.leaderboard.map(mapBackendLeaderboardToFrontend);
    }
  });

  const loading = isLoadingProfile || isLoadingLeaderboard;

  // reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, sortField, sortOrder]);

  const filteredList = useMemo(() => {
    let list = [...leaderboardList];
    if (search.trim()) {
      list = list.filter(e => e.userName?.toLowerCase().includes(search.toLowerCase()));
    }
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [leaderboardList, search, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / perPage));
  const paginatedList = filteredList.slice((page - 1) * perPage, page * perPage);

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
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${loginWallpaper})` }}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] pointer-events-none" />
      <div className="relative z-10 min-h-screen football-pattern flex flex-col">
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

                {userProfile && (() => {
                  const userRank = leaderboardList.find(e => e.userId === userProfile.id || e.userName === userProfile.name);
                  if (userRank) {
                    return (
                      <div className="glass-card px-6 py-3 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-blue-400 uppercase tracking-wider font-semibold">Your Rank</span>
                          <span className="text-2xl font-bold text-white flex items-center gap-2">
                            #{userRank.rank} <Crown className="w-4 h-4 text-yellow-500" />
                          </span>
                        </div>
                        <div className="h-10 w-px bg-white/20 mx-2" />
                        <div className="flex flex-col">
                          <span className="text-xs text-green-400 uppercase tracking-wider font-semibold">Points</span>
                          <span className="text-xl font-bold text-white">{userRank.points * 10}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
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
                      <SelectItem value="accuracy" className="hover:bg-white/5 focus:bg-white/10 focus:text-white cursor-pointer">Sort by Accuracy</SelectItem>
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

              {paginatedList.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No rankings available yet.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-1 text-center">Rank</div>
                    <div className="col-span-5">Player</div>
                    <div className="col-span-2 text-center">Predictions</div>
                    <div className="col-span-2 text-center">Accuracy</div>
                    <div className="col-span-2 text-right">Points</div>
                  </div>

                  {paginatedList.map((entry, idx) => {
                    const isCurrentUser = entry.userId === userProfile?.id || entry.userName === userProfile?.name;
                    return (
                      <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`grid grid-cols-1 md:grid-cols-12 items-center gap-4 px-4 py-4 md:px-6 rounded-xl transition-all ${isCurrentUser
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/40 neon-glow-blue'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                      >
                        <div className="col-span-1 flex items-center justify-between md:justify-center w-full md:w-auto mb-2 md:mb-0">
                          <span className="md:hidden text-xs text-gray-400 font-semibold uppercase tracking-wider">Rank</span>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-yellow-500/30' :
                            idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-gray-400/30' :
                              idx === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-amber-600/30' :
                                'bg-gray-800 text-white border border-gray-700'
                            }`}>
                            {entry.rank}
                          </div>
                        </div>

                        <div className="col-span-5 flex items-center gap-4">
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
                          <span className="md:hidden text-xs text-gray-400 font-semibold uppercase tracking-wider">Accuracy</span>
                          <span className="text-sm font-medium flex items-center gap-1.5">
                            <span className={entry.accuracy >= 70 ? 'text-green-400' : entry.accuracy >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                              {entry.accuracy}%
                            </span>
                          </span>
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
                        Showing <span className="font-semibold text-white">{(page - 1) * perPage + 1}</span> to{" "}
                        <span className="font-semibold text-white">{Math.min(page * perPage, filteredList.length)}</span> of{" "}
                        <span className="font-semibold text-white">{filteredList.length}</span> players
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
      </div>
    </div>
  );
};

export default LeaderboardPage;
