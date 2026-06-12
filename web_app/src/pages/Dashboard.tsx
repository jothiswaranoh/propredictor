import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Clock, Calendar, TrendingUp, ChevronRight,
  LogOut, User, Target, Flame, Crown, ArrowUpRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Match, Prediction, LeaderboardEntry } from '../types';
import { api } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import loginWallpaper from '../assets/login_wallpaper.jpg';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '../components/ui/dialog';
import { ProfileDialog } from '../components/ProfileDialog';

const mapBackendMatchToFrontend = (m: any): Match => {
  const dateObj = new Date(m.match_date);
  const dateStr = dateObj.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

  return {
    id: m.id,
    homeTeam: {
      id: m.team1_id,
      name: m.team1?.name || 'Home Team',
      shortName: m.team1?.short_name || 'HOME',
      logo: m.team1?.logo_url || '',
      country: 'Spain',
      founded: 1902,
      stadium: 'Santiago Bernabeu',
    },
    awayTeam: {
      id: m.team2_id,
      name: m.team2?.name || 'Away Team',
      shortName: m.team2?.short_name || 'AWAY',
      logo: m.team2?.logo_url || '',
      country: 'England',
      founded: 1880,
      stadium: 'Etihad Stadium',
    },
    date: dateStr,
    time: timeStr,
    venue: 'Santiago Bernabeu, Madrid',
    competition: 'UEFA Champions League',
    status: m.status as any,
    homeScore: m.status === 'completed' ? (m.winning_team_id === m.team1_id ? 1 : 0) : undefined,
    awayScore: m.status === 'completed' ? (m.winning_team_id === m.team2_id ? 1 : 0) : undefined,
    rawDate: m.match_date,
  };
};

const mapBackendPredictionToFrontend = (p: any): Prediction => {
  const match = p.match;
  let predictedWinner: 'home' | 'away' | 'draw' = 'draw';
  if (match) {
    if (p.winning_team_id === match.team1_id) {
      predictedWinner = 'home';
    } else if (p.winning_team_id === match.team2_id) {
      predictedWinner = 'away';
    }
  }
  return {
    id: p.id,
    matchId: p.match_id,
    userId: p.user_id,
    predictedWinner,
    createdAt: p.submitted_at,
    points: p.is_correct ? 10 : 0,
    isCorrect: p.is_correct ?? undefined,
  };
};

const mapBackendLeaderboardToFrontend = (l: any): LeaderboardEntry => {
  return {
    rank: l.rank,
    userId: l.user_id,
    userName: l.name,
    points: l.points,
    predictions: 10,
    accuracy: 70,
  };
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [prediction, setPrediction] = useState<'home' | 'away' | 'draw' | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Prediction selection & Confirmation states
  const [pendingSelection, setPendingSelection] = useState<'home' | 'away' | 'draw' | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => api.getCurrentUser(),
  });

  const { data: predHistory = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['predictionHistory'],
    queryFn: async () => {
      const rawHistory = await api.getPredictionHistory();
      return rawHistory.map(mapBackendPredictionToFrontend);
    }
  });

  const { data: matchesData, isLoading: isMatchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const [rawActive, rawAll] = await Promise.all([
        api.getActiveMatches(),
        api.getMatches()
      ]);
      return {
        activeMapped: rawActive.map(mapBackendMatchToFrontend),
        allMapped: rawAll.map(mapBackendMatchToFrontend)
      };
    }
  });

  const matchesList = matchesData?.allMapped || [];

  const { data: leaderboardList = [], isLoading: isLeaderboardLoading } = useQuery({
    queryKey: ['leaderboardList'],
    queryFn: async () => {
      const rawLeaderboard = await api.getLeaderboard();
      return rawLeaderboard.leaderboard.map(mapBackendLeaderboardToFrontend);
    }
  });

  const loading = isProfileLoading || isHistoryLoading || isMatchesLoading || isLeaderboardLoading;

  useEffect(() => {
    if (!selectedMatch && matchesData) {
      if (matchesData.activeMapped.length > 0) {
        setSelectedMatch(matchesData.activeMapped[0]);
      } else if (matchesData.allMapped.length > 0) {
        setSelectedMatch(matchesData.allMapped[0]);
      }
    }
  }, [matchesData, selectedMatch]);

  const handleUpdateProfile = async (newName: string, avatar?: string) => {
    const updatedUser = await api.updateProfile(newName, avatar);
    queryClient.setQueryData(['userProfile'], updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleResetPassword = async (newPassword: string) => {
    await api.updatePassword(newPassword);
  };

  // Synchronize prediction and pendingSelection with selectedMatch
  useEffect(() => {
    if (!selectedMatch) return;
    const histPred = predHistory.find(p => p.matchId === selectedMatch.id);
    if (histPred) {
      setPrediction(histPred.predictedWinner);
      setPendingSelection(histPred.predictedWinner);
    } else {
      setPrediction(null);
      setPendingSelection(null);
    }
  }, [selectedMatch, predHistory]);

  useEffect(() => {
    if (!selectedMatch) return;
    const targetDate = new Date(selectedMatch.rawDate);

    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedMatch]);

  const submitPredictionMutation = useMutation({
    mutationFn: async ({ matchId, teamId }: { matchId: string, teamId: string | null }) => {
      await api.submitPrediction(matchId, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predictionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboardList'] });
      
      const isUpdate = prediction !== null;
      setPrediction(pendingSelection);
      toast({
        title: isUpdate ? "Prediction Updated!" : "Prediction Recorded!",
        description: `Your prediction has been set to ${pendingSelection === 'home'
          ? selectedMatch?.homeTeam.shortName
          : pendingSelection === 'away'
            ? selectedMatch?.awayTeam.shortName
            : 'Draw'
          }.`,
      });
      setConfirmOpen(false);
    },
    onError: (err: any) => {
      toast({
        title: "Prediction Failed",
        description: err.message || "Failed to submit prediction.",
        variant: "destructive",
      });
    }
  });

  const submittingPrediction = submitPredictionMutation.isPending;

  const handleConfirmPredict = () => {
    if (!selectedMatch || !pendingSelection) return;
    const predictedTeamId = pendingSelection === 'draw'
      ? null
      : pendingSelection === 'home'
        ? selectedMatch.homeTeam.id
        : selectedMatch.awayTeam.id;
        
    submitPredictionMutation.mutate({ matchId: selectedMatch.id, teamId: predictedTeamId });
  };

  const upcomingMatches = matchesList.filter(m => m.status === 'upcoming').slice(0, 3);
  const userRank = leaderboardList.find(e => e.userId === userProfile?.id) ||
    leaderboardList.find(e => e.userName === userProfile?.name) ||
    { rank: '-', points: 0, predictions: 0, accuracy: 0 };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full"
          />
          <p className="text-gray-400 text-sm">Loading ProPredictor...</p>
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
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-xl font-bold text-gradient">ProPredictor</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 glass-card px-4 py-2 rounded-full">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{(userRank?.points || 0) * 10} pts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/50 transition-all border border-white/10 shrink-0"
                    onClick={() => setProfileOpen(true)}
                  >
                    {userProfile?.avatar ? (
                      <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
                    ) : userProfile?.name ? (
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userProfile.name)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`}
                        alt={userProfile.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLogoutConfirmOpen(true)}
                    className="text-gray-400 hover:text-white"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="glass-card-strong rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600/10 via-transparent to-blue-600/10 p-1">
                <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-3xl p-6 md:p-10">
                  <div className="flex flex-col lg:flex-row items-center gap-8">
                    <div className="flex-1 text-center lg:text-left">
                      <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/30">
                        <span className="pulse-dot inline-block w-2 h-2 rounded-full bg-green-400 mr-2" />
                        LIVE PREDICTIONS OPEN
                      </Badge>
                      <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                        {selectedMatch?.competition}
                      </h2>
                      <p className="text-gray-400 mb-6">{selectedMatch?.venue}</p>

                      <div className="flex justify-center lg:justify-start gap-3 mb-6">
                        {[
                          { value: countdown.days, label: 'Days' },
                          { value: countdown.hours, label: 'Hours' },
                          { value: countdown.minutes, label: 'Min' },
                          { value: countdown.seconds, label: 'Sec' },
                        ].map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="countdown-segment rounded-xl p-3 min-w-[60px] text-center"
                          >
                            <div className="text-2xl md:text-3xl font-bold text-gradient">
                              {String(item.value).padStart(2, '0')}
                            </div>
                            <div className="text-xs text-gray-500">{item.label}</div>
                          </motion.div>
                        ))}
                      </div>

                      <Button className="gap-2 bg-gradient-to-r from-green-600 to-emerald-500 neon-glow">
                        <Calendar className="w-4 h-4" />
                        Add to Calendar
                      </Button>
                    </div>

                    <div className="flex-1 w-full max-w-2xl">
                      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPendingSelection('home')}
                          className={`team-card glass-card rounded-2xl p-6 md:p-8 w-full md:w-auto min-w-[150px] text-center cursor-pointer transition-all border ${pendingSelection === 'home' ? 'selected neon-glow border-green-500/50' : 'border-white/10'
                            }`}
                        >
                          <img
                            src={selectedMatch?.homeTeam.logo}
                            alt={selectedMatch?.homeTeam.name}
                            className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 object-contain"
                          />
                          <h3 className="font-semibold text-white mb-1">{selectedMatch?.homeTeam.shortName}</h3>
                          <p className="text-xs text-gray-400">{selectedMatch?.homeTeam.name}</p>
                          {pendingSelection === 'home' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="mt-3 flex flex-col items-center gap-1"
                            >
                              <CheckCircle2 className="w-5 h-5 mx-auto text-green-400" />
                              {prediction === 'home' ? (
                                <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">Saved</span>
                              ) : (
                                <span className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider">Unsaved</span>
                              )}
                            </motion.div>
                          )}
                        </motion.button>

                        <div className="flex flex-col items-center gap-3">
                          <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10">
                            <span className="text-2xl font-bold text-gray-300">VS</span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setPendingSelection('draw')}
                            className={`px-6 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all border flex flex-col items-center gap-1 min-w-[100px] ${pendingSelection === 'draw' ? 'selected neon-glow-yellow bg-yellow-500/10 text-yellow-400 border-yellow-500/50' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                              }`}
                          >
                            <span>Draw</span>
                            {pendingSelection === 'draw' && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`text-[9px] font-semibold uppercase tracking-wider ${prediction === 'draw' ? 'text-yellow-400' : 'text-orange-400'}`}
                              >
                                {prediction === 'draw' ? 'Saved' : 'Unsaved'}
                              </motion.span>
                            )}
                          </motion.button>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setPendingSelection('away')}
                          className={`team-card glass-card rounded-2xl p-6 md:p-8 w-full md:w-auto min-w-[150px] text-center cursor-pointer transition-all border ${pendingSelection === 'away' ? 'selected neon-glow-blue border-blue-500/50' : 'border-white/10'
                            }`}
                        >
                          <img
                            src={selectedMatch?.awayTeam.logo}
                            alt={selectedMatch?.awayTeam.name}
                            className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 object-contain"
                          />
                          <h3 className="font-semibold text-white mb-1">{selectedMatch?.awayTeam.shortName}</h3>
                          <p className="text-xs text-gray-400">{selectedMatch?.awayTeam?.name}</p>
                          {pendingSelection === 'away' && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="mt-3 flex flex-col items-center gap-1"
                            >
                              <CheckCircle2 className="w-5 h-5 mx-auto text-blue-400" />
                              {prediction === 'away' ? (
                                <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Saved</span>
                              ) : (
                                <span className="text-[10px] text-yellow-400 font-semibold uppercase tracking-wider">Unsaved</span>
                              )}
                            </motion.div>
                          )}
                        </motion.button>
                      </div>
                      {pendingSelection !== null && pendingSelection !== prediction && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-8 flex justify-center"
                        >
                          <Button
                            onClick={() => setConfirmOpen(true)}
                            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all scale-105 duration-200 neon-glow"
                          >
                            {prediction !== null ? "Update Prediction" : "Confirm Prediction"}
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {upcomingMatches.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-400" />
                  Upcoming Matches
                </h3>
                <Button variant="outline" size="sm" className="border-white/10 text-gray-300">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((match, idx) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                  >
                    <Card
                      onClick={() => setSelectedMatch(match)}
                      className={`glass-card p-5 group hover:border-green-500/30 transition-all cursor-pointer border ${selectedMatch?.id === match.id ? 'border-green-500/50 ring-1 ring-green-500/30' : 'border-white/10'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400">
                          {match.competition}
                        </Badge>
                        <span className="text-xs text-gray-500">{match.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <img src={match.homeTeam.logo} alt="" className="w-12 h-12 mx-auto mb-2 object-contain" />
                          <p className="text-sm font-medium text-gray-200">{match.homeTeam.shortName}</p>
                        </div>
                        <div className="px-4">
                          <span className="text-lg font-bold text-gray-400">VS</span>
                        </div>
                        <div className="text-center flex-1">
                          <img src={match.awayTeam.logo} alt="" className="w-12 h-12 mx-auto mb-2 object-contain" />
                          <p className="text-sm font-medium text-gray-200">{match.awayTeam.shortName}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-gray-500">{match.time}</span>
                        {predHistory.find(p => p.matchId === match.id) ? (
                          <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Predicted
                          </Badge>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-green-400 group-hover:text-green-300">
                            Predict <ArrowUpRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-card p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-400" />
                    Your Prediction Stats
                  </h3>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                    Top 30%
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-xl bg-white/5">
                    <div className="text-2xl font-bold text-gradient">{userRank?.accuracy || 0}%</div>
                    <p className="text-xs text-gray-400">Accuracy</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white/5">
                    <div className="text-2xl font-bold text-blue-400">{userRank?.predictions || 0}</div>
                    <p className="text-xs text-gray-400">Predictions</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress to next rank</span>
                    <span className="text-green-400">15 pts away</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-card p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    Prediction History
                  </h3>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-400" onClick={() => navigate('/predictions')}>
                    View All <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-3">
                  {predHistory.map((pred) => {
                    const match = matchesList.find(m => m.id === pred.matchId);
                    return (
                      <div key={pred.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <img src={match?.homeTeam.logo} alt="" className="w-6 h-6 rounded-full bg-gray-800 p-0.5" />
                            <img src={match?.awayTeam.logo} alt="" className="w-6 h-6 rounded-full bg-gray-800 p-0.5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">
                              {match?.homeTeam.shortName} vs {match?.awayTeam.shortName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {pred.predictedWinner === 'home'
                                ? match?.homeTeam.shortName
                                : pred.predictedWinner === 'away'
                                  ? match?.awayTeam.shortName
                                  : 'Draw'}
                            </p>
                          </div>
                        </div>
                        {pred.isCorrect === undefined ? (
                          <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30">
                            Pending
                          </Badge>
                        ) : (
                          <Badge className={pred.isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {pred.isCorrect ? '+10' : '0'}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-card p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    Leaderboard
                  </h3>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-400" onClick={() => navigate('/leaderboard')}>
                    Full Rankings <ArrowUpRight className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {leaderboardList.slice(0, 5).map((entry, idx) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between p-3 rounded-lg ${(entry.userId === userProfile?.id || entry.userName === userProfile?.name) ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20' : 'bg-white/5'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' :
                          idx === 1 ? 'bg-gray-300 text-black' :
                            idx === 2 ? 'bg-amber-600 text-black' :
                              'bg-gray-700 text-white'
                          }`}>
                          {entry.rank}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                          {entry.avatar ? (
                            <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{entry.userName}</p>
                          <p className="text-xs text-gray-500">{entry.accuracy}% accuracy</p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-400">{entry.points * 10} pts</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </main>

        {/* Confirmation Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="bg-gray-900 border border-white/10 text-white rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Confirm Prediction
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Please double check your selection before submitting.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 flex flex-col items-center text-center gap-4">
              <div className="flex items-center gap-6">
                {pendingSelection === 'draw' ? (
                  <div className="flex flex-col items-center">
                    <div className="flex -space-x-4 mb-2">
                      <img
                        src={selectedMatch?.homeTeam.logo}
                        alt=""
                        className="w-14 h-14 object-contain bg-gray-800 rounded-full p-1 border border-white/10"
                      />
                      <img
                        src={selectedMatch?.awayTeam.logo}
                        alt=""
                        className="w-14 h-14 object-contain bg-gray-800 rounded-full p-1 border border-white/10"
                      />
                    </div>
                    <span className="font-bold text-lg">Draw (No Winner)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <img
                      src={pendingSelection === 'home' ? selectedMatch?.homeTeam.logo : selectedMatch?.awayTeam.logo}
                      alt=""
                      className="w-16 h-16 object-contain mb-2"
                    />
                    <span className="font-bold text-lg">
                      {pendingSelection === 'home' ? selectedMatch?.homeTeam.name : selectedMatch?.awayTeam.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-2 p-4 rounded-xl bg-white/5 border border-white/5 w-full text-left">
                <div className="flex justify-between text-sm mb-1 text-gray-400">
                  <span>Match:</span>
                  <span className="text-white font-medium">
                    {selectedMatch?.homeTeam.shortName} vs {selectedMatch?.awayTeam.shortName}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-1 text-gray-400">
                  <span>Date & Time:</span>
                  <span className="text-white font-medium">{selectedMatch?.date} {selectedMatch?.time}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Selection:</span>
                  <span className="text-green-400 font-bold">
                    {pendingSelection === 'draw'
                      ? 'Draw Match'
                      : `${pendingSelection === 'home' ? selectedMatch?.homeTeam.name : selectedMatch?.awayTeam.name} to Win`}
                  </span>
                </div>
              </div>

              <p className="text-xs text-yellow-500/80 italic mt-1">
                You can modify this prediction at any time before the match prediction window closes.
              </p>
            </div>

            <DialogFooter className="flex gap-2 justify-end mt-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
                disabled={submittingPrediction}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPredict}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-6"
                disabled={submittingPrediction}
              >
                {submittingPrediction ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Confirm & Submit"
                )}
              </Button>
            </DialogFooter>
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
                Are you sure you want to sign out of ProPredictor?
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

        <ProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
          onResetPassword={handleResetPassword}
        />
      </div>
    </div>
  );
};

export default Dashboard;
