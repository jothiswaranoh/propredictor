import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, LogOut, User, Crown, CheckCircle2, ArrowLeft,
  Clock, Flame, CircleDot, LayoutList,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Match, Prediction } from '../types';
import { api } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import loginWallpaper from '../assets/login_wallpaper.jpg';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../components/ui/dialog';
import { ProfileDialog } from '../components/ProfileDialog';

// ─── mappers (same as Dashboard) ────────────────────────────────────────────

const mapBackendMatchToFrontend = (m: any): Match => {
  const dateObj = new Date(m.match_date);
  const dateStr = dateObj.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

  let userPrediction: Prediction | undefined = undefined;
  if (m.user_prediction) {
    let predictedWinner: 'home' | 'away' | 'draw' = 'draw';
    if (m.user_prediction.winning_team_id === m.team1_id) {
      predictedWinner = 'home';
    } else if (m.user_prediction.winning_team_id === m.team2_id) {
      predictedWinner = 'away';
    }
    userPrediction = {
      id: m.user_prediction.id,
      matchId: m.id,
      userId: '',
      predictedWinner,
      createdAt: m.user_prediction.submitted_at,
      isCorrect: m.status === 'completed'
        ? (m.user_prediction.winning_team_id === m.winning_team_id)
        : undefined,
      points: m.status === 'completed'
        ? ((m.user_prediction.winning_team_id === m.winning_team_id) ? 10 : 0)
        : 0,
    };
  }

  return {
    id: m.id,
    homeTeam: {
      id: m.team1_id,
      name: m.team1?.name || 'Home Team',
      shortName: m.team1?.short_name || 'HOME',
      logo: m.team1?.logo_url || '',
      country: '',
      founded: 0,
      stadium: '',
    },
    awayTeam: {
      id: m.team2_id,
      name: m.team2?.name || 'Away Team',
      shortName: m.team2?.short_name || 'AWAY',
      logo: m.team2?.logo_url || '',
      country: '',
      founded: 0,
      stadium: '',
    },
    date: dateStr,
    time: timeStr,
    venue: '',
    competition: 'FIFA World Cup 2026',
    status: m.status as any,
    homeScore: m.status === 'completed' ? (m.winning_team_id === m.team1_id ? 1 : 0) : undefined,
    awayScore: m.status === 'completed' ? (m.winning_team_id === m.team2_id ? 1 : 0) : undefined,
    rawDate: m.match_date,
    userPrediction,
  };
};


// ─── Tab config ──────────────────────────────────────────────────────────────

type TabKey = 'all' | 'upcoming' | 'live' | 'completed';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'all',       label: 'All',       icon: <LayoutList className="w-3.5 h-3.5" /> },
  { key: 'upcoming',  label: 'Upcoming',  icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'live',      label: 'Live',      icon: <CircleDot className="w-3.5 h-3.5" /> },
  { key: 'completed', label: 'Completed', icon: <Flame className="w-3.5 h-3.5" /> },
];

// ─── MatchCard ───────────────────────────────────────────────────────────────

interface MatchCardProps {
  match: Match;
  existingPrediction: Prediction | undefined;
  onPredict: (match: Match, selection: 'home' | 'away' | 'draw') => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, existingPrediction, onPredict }) => {
  const [localSelection, setLocalSelection] = useState<'home' | 'away' | 'draw' | null>(
    existingPrediction?.predictedWinner ?? null
  );

  // keep in sync when predHistory refreshes
  useEffect(() => {
    setLocalSelection(existingPrediction?.predictedWinner ?? null);
  }, [existingPrediction]);

  const saved = existingPrediction?.predictedWinner ?? null;
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const canPredict = !isCompleted;

  const selectionChanged = localSelection !== null && localSelection !== saved;

  const statusBadge = isCompleted ? (
    <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 text-[11px]">Completed</Badge>
  ) : isLive ? (
    <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block" />
      Live
    </Badge>
  ) : (
    <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[11px]">Upcoming</Badge>
  );

  // result badge for completed matches
  const resultBadge = isCompleted && existingPrediction ? (
    existingPrediction.isCorrect ? (
      <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[11px] flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Correct · +10 pts
      </Badge>
    ) : (
      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[11px]">
        Wrong · +0 pts
      </Badge>
    )
  ) : null;

  const teamBtn = (side: 'home' | 'away') => {
    const team = side === 'home' ? match.homeTeam : match.awayTeam;
    const isSelected = localSelection === side;
    const isSaved = saved === side;
    const accentClass = side === 'home'
      ? 'border-green-500/60 bg-green-500/10 shadow-green-500/20'
      : 'border-blue-500/60 bg-blue-500/10 shadow-blue-500/20';

    return (
      <motion.button
        whileHover={canPredict ? { scale: 1.04 } : {}}
        whileTap={canPredict ? { scale: 0.97 } : {}}
        onClick={() => canPredict && setLocalSelection(side)}
        disabled={!canPredict}
        className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
          ${isSelected ? `${accentClass} border shadow-lg` : 'border-white/10 bg-white/5 hover:bg-white/10'}
          ${!canPredict ? 'cursor-default' : 'cursor-pointer'}
        `}
      >
        <img src={team.logo} alt={team.name} className="w-14 h-14 object-contain" />
        <span className="text-sm font-semibold text-white">{team.shortName}</span>
        <span className="text-[11px] text-gray-400 text-center leading-tight">{team.name}</span>
        {isSelected && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-0.5">
            <CheckCircle2 className={`w-4 h-4 ${side === 'home' ? 'text-green-400' : 'text-blue-400'}`} />
            <span className={`text-[9px] font-bold uppercase tracking-wider ${isSaved ? (side === 'home' ? 'text-green-400' : 'text-blue-400') : 'text-yellow-400'}`}>
              {isSaved ? 'Saved' : 'Unsaved'}
            </span>
          </motion.div>
        )}
      </motion.button>
    );
  };

  return (
    <Card className="glass-card border border-white/10 p-5 flex flex-col gap-4 hover:border-white/20 transition-all h-full">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusBadge}
          <span className="text-[11px] text-gray-500">{match.competition}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">{match.date}</p>
          <p className="text-xs text-gray-500">{match.time}</p>
        </div>
      </div>

      {/* team selectors */}
      <div className="flex items-center gap-3">
        {teamBtn('home')}

        <div className="flex flex-col items-center gap-2 shrink-0">
          <span className="text-lg font-bold text-gray-400">VS</span>
          <motion.button
            whileHover={canPredict ? { scale: 1.05 } : {}}
            whileTap={canPredict ? { scale: 0.95 } : {}}
            onClick={() => canPredict && setLocalSelection('draw')}
            disabled={!canPredict}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-all duration-200
              ${localSelection === 'draw'
                ? 'bg-yellow-500/10 border-yellow-500/60 shadow-lg shadow-yellow-500/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10'}
              ${!canPredict ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <span className={`text-sm font-semibold ${localSelection === 'draw' ? 'text-yellow-400' : 'text-gray-400'}`}>
              Draw
            </span>
            {localSelection === 'draw' && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="flex flex-col items-center gap-0.5"
              >
                <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                <span className={`text-[9px] font-bold uppercase tracking-wider ${saved === 'draw' ? 'text-yellow-400' : 'text-orange-400'}`}>
                  {saved === 'draw' ? 'Saved' : 'Unsaved'}
                </span>
              </motion.div>
            )}
          </motion.button>
        </div>

        {teamBtn('away')}
      </div>

      {/* footer: result badge OR predict button */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-auto">
        <div>
          {resultBadge}
          {!isCompleted && saved && !selectionChanged && (
            <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Predicted: {saved === 'home' ? match.homeTeam.shortName : saved === 'away' ? match.awayTeam.shortName : 'Draw'}
            </Badge>
          )}
        </div>

        <AnimatePresence>
          {canPredict && selectionChanged && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <Button
                size="sm"
                onClick={() => onPredict(match, localSelection!)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-xs px-4 neon-glow"
              >
                {saved ? 'Update' : 'Confirm'} Prediction
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
};

const getPageNumbers = (current: number, total: number) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | string)[] = [];
  if (current <= 3) {
    pages.push(1, 2, 3, 4, '...', total);
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
};

const Matches: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [confirmState, setConfirmState] = useState<{ match: Match; selection: 'home' | 'away' | 'draw' } | null>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const limit = 6;

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => api.getCurrentUser(),
  });


  // Query paginated matches
  const { data: matchesData, isLoading, isFetching } = useQuery({
    queryKey: ['userMatchesList', activeTab, page],
    queryFn: async () => {
      const raw = await api.getMatches(page, limit, activeTab);
      return {
        matches: (raw.matches || []).map(mapBackendMatchToFrontend) as Match[],
        total: (raw.total || 0) as number,
        pages: (raw.pages || 0) as number,
        tabCounts: (raw.tab_counts || {}) as Record<TabKey, number>
      };
    },
    placeholderData: (prev) => prev,
  });

  const matchesList = matchesData?.matches || [];
  const totalMatches = matchesData?.total || 0;
  const totalPages = matchesData?.pages || 0;
  const apiTabCounts = matchesData?.tabCounts;

  const { data: leaderboardList = [] } = useQuery({
    queryKey: ['leaderboardList'],
    queryFn: async () => {
      const raw = await api.getLeaderboard();
      return raw.leaderboard;
    },
  });

  const userRank = leaderboardList.find((e: any) => e.user_id === userProfile?.id) ||
    leaderboardList.find((e: any) => e.name === userProfile?.name);

  const submitPredictionMutation = useMutation({
    mutationFn: async ({ matchId, teamId }: { matchId: string; teamId: string | null }) => {
      await api.submitPrediction(matchId, teamId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userMatchesList'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboardList'] });
      const { match, selection } = confirmState!;
      const label = selection === 'home' ? match.homeTeam.shortName
        : selection === 'away' ? match.awayTeam.shortName : 'Draw';
      toast({ title: 'Prediction Saved!', description: `You predicted: ${label}` });
      setConfirmState(null);
    },
    onError: (err: any) => {
      toast({ title: 'Failed', description: err.message || 'Could not submit prediction.', variant: 'destructive' });
    },
  });

  const handleConfirm = () => {
    if (!confirmState) return;
    const { match, selection } = confirmState;
    const teamId = selection === 'draw' ? null
      : selection === 'home' ? match.homeTeam.id : match.awayTeam.id;
    submitPredictionMutation.mutate({ matchId: match.id, teamId });
  };

  const handleUpdateProfile = async (newName: string, avatar?: string) => {
    const updated = await api.updateProfile(newName, avatar);
    queryClient.setQueryData(['userProfile'], updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const filtered = matchesList;

  const tabCounts: Record<TabKey, number> = {
    all:       apiTabCounts?.all ?? 0,
    upcoming:  apiTabCounts?.upcoming ?? 0,
    live:      apiTabCounts?.live ?? 0,
    completed: apiTabCounts?.completed ?? 0,
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${loginWallpaper})` }}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] pointer-events-none" />
      <div className="relative z-10 min-h-screen football-pattern flex flex-col">

        {/* Nav */}
        <nav className="glass-card border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-400 hover:text-white mr-1 -ml-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-xl font-bold text-gradient">ProPredictor</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 glass-card px-4 py-2 rounded-full">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{((userRank?.points || 0) * 10)} pts</span>
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
                        className="w-full h-full object-cover"
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

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

          {/* Page title */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl font-bold text-white">All Matches</h1>
            <p className="text-sm text-gray-400 mt-1">Select a team to lock in your prediction before the match starts.</p>
          </motion.div>

          {/* Filter tabs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex gap-2 mb-8 flex-wrap"
          >
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200
                  ${activeTab === tab.key
                    ? 'bg-green-500/20 text-green-400 border-green-500/40 shadow shadow-green-500/10'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {tab.icon}
                {tab.label}
                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold
                  ${activeTab === tab.key ? 'bg-green-500/30 text-green-300' : 'bg-white/10 text-gray-500'}`}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </motion.div>

          {/* Top loader bar */}
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-6 relative">
            <AnimatePresence>
              {isFetching && (
                <motion.div
                  initial={{ left: '-100%' }}
                  animate={{ left: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-green-500 to-transparent shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Match grid with snatch transition */}
          <div className={`transition-opacity duration-300 ${isFetching ? 'opacity-85' : 'opacity-100'}`}>
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full"
                />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 text-gray-500">
                <LayoutList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No {activeTab !== 'all' ? activeTab : ''} matches found.</p>
              </div>
            ) : (
              <>
                <motion.div
                  key={`${activeTab}-${page}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  {filtered.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      existingPrediction={match.userPrediction}
                      onPredict={(m, s) => setConfirmState({ match: m, selection: s })}
                    />
                  ))}
                </motion.div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10 w-full">
                    <p className="text-xs text-gray-400">
                      Showing <span className="font-semibold text-white">{((page - 1) * limit) + 1}</span> to{' '}
                      <span className="font-semibold text-white">
                        {Math.min(page * limit, totalMatches)}
                      </span>{' '}
                      of <span className="font-semibold text-white">{totalMatches}</span> matches
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        className="text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 h-9 px-3 rounded-xl disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1.5">
                        {getPageNumbers(page, totalPages).map((pageNum, idx) => {
                          if (pageNum === '...') {
                            return (
                              <span key={`dots-${idx}`} className="w-9 h-9 flex items-center justify-center text-gray-500 text-xs">
                                ...
                              </span>
                            );
                          }
                          const isSelected = pageNum === page;
                          return (
                            <button
                              key={`page-${pageNum}`}
                              onClick={() => setPage(pageNum as number)}
                              className={`w-9 h-9 rounded-xl text-xs font-semibold border transition-all duration-200 flex items-center justify-center
                                ${isSelected
                                  ? 'bg-green-500/20 text-green-400 border-green-500/40 shadow shadow-green-500/10'
                                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                        className="text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 h-9 px-3 rounded-xl disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Confirm prediction dialog */}
        <Dialog open={!!confirmState} onOpenChange={open => { if (!open) setConfirmState(null); }}>
          <DialogContent className="bg-gray-900 border border-white/10 text-white rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Confirm Prediction
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Double-check your selection before submitting.
              </DialogDescription>
            </DialogHeader>

            {confirmState && (
              <div className="py-4 flex flex-col items-center gap-4">
                {confirmState.selection === 'draw' ? (
                  <div className="flex flex-col items-center">
                    <div className="flex -space-x-4 mb-2">
                      <img src={confirmState.match.homeTeam.logo} alt="" className="w-14 h-14 object-contain bg-gray-800 rounded-full p-1 border border-white/10" />
                      <img src={confirmState.match.awayTeam.logo} alt="" className="w-14 h-14 object-contain bg-gray-800 rounded-full p-1 border border-white/10" />
                    </div>
                    <span className="font-bold text-lg">Draw (No Winner)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <img
                      src={confirmState.selection === 'home' ? confirmState.match.homeTeam.logo : confirmState.match.awayTeam.logo}
                      alt="" className="w-16 h-16 object-contain mb-2"
                    />
                    <span className="font-bold text-lg">
                      {confirmState.selection === 'home' ? confirmState.match.homeTeam.name : confirmState.match.awayTeam.name}
                    </span>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 w-full text-left space-y-1.5">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Match:</span>
                    <span className="text-white font-medium">
                      {confirmState.match.homeTeam.shortName} vs {confirmState.match.awayTeam.shortName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Date & Time:</span>
                    <span className="text-white font-medium">{confirmState.match.date} {confirmState.match.time}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Selection:</span>
                    <span className="text-green-400 font-bold">
                      {confirmState.selection === 'draw'
                        ? 'Draw Match'
                        : `${confirmState.selection === 'home' ? confirmState.match.homeTeam.name : confirmState.match.awayTeam.name} to Win`}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-yellow-500/80 italic">
                  You can update this prediction any time before the match window closes.
                </p>
              </div>
            )}

            <DialogFooter className="flex gap-2 justify-end mt-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmState(null)}
                className="text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
                disabled={submitPredictionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-6"
                disabled={submitPredictionMutation.isPending}
              >
                {submitPredictionMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Confirm & Submit'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Logout dialog */}
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
              <Button variant="ghost" onClick={() => setLogoutConfirmOpen(false)} className="text-gray-400 hover:text-white hover:bg-white/5 border border-white/10">
                Cancel
              </Button>
              <Button onClick={() => { api.logout(); navigate('/'); }} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6">
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
          onResetPassword={async (pw) => { await api.updatePassword(pw); }}
        />
      </div>
    </div>
  );
};

export default Matches;