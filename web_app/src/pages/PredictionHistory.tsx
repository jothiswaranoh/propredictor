import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Flame, Trophy, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Match, Prediction } from '../types';
import { api } from '../lib/api';
import loginWallpaper from '../assets/login_wallpaper.jpg';
import { useToast } from '../hooks/use-toast';

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

const PredictionHistory: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: predHistory = [], isLoading: isLoadingHistory, error: historyError } = useQuery({
    queryKey: ['predictionHistory'],
    queryFn: async () => {
      const rawHistory = await api.getPredictionHistory();
      return rawHistory.map(mapBackendPredictionToFrontend);
    }
  });

  const { data: matchesList = [], isLoading: isLoadingMatches, error: matchesError } = useQuery({
    queryKey: ['matchesList'],
    queryFn: async () => {
      const rawAll = await api.getMatches();
      return rawAll.map(mapBackendMatchToFrontend);
    }
  });

  const loading = isLoadingHistory || isLoadingMatches;

  useEffect(() => {
    if (historyError || matchesError) {
      toast({
        title: "Error loading data",
        description: (historyError as any)?.message || (matchesError as any)?.message || "Failed to load prediction history.",
        variant: "destructive",
      });
    }
  }, [historyError, matchesError, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full"
          />
          <p className="text-gray-400 text-sm">Loading History...</p>
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
            <Card className="glass-card p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Prediction History</h2>
                  <p className="text-sm text-gray-400">View all your past and upcoming predictions</p>
                </div>
              </div>

              {predHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No predictions made yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {predHistory.map((pred, idx) => {
                    const match = matchesList.find(m => m.id === pred.matchId);
                    if (!match) return null;

                    return (
                      <motion.div
                        key={pred.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors gap-4"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="flex -space-x-3">
                            <img src={match.homeTeam.logo} alt="" className="w-10 h-10 rounded-full bg-gray-800 p-1 border-2 border-gray-900 z-10" />
                            <img src={match.awayTeam.logo} alt="" className="w-10 h-10 rounded-full bg-gray-800 p-1 border-2 border-gray-900" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-[10px] px-2 py-0">
                                {match.competition}
                              </Badge>
                              <span className="text-xs text-gray-400">{match.date}</span>
                            </div>
                            <p className="text-base font-semibold text-gray-200">
                              {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8 bg-gray-900/50 p-3 rounded-lg sm:bg-transparent sm:p-0">
                          <div className="flex flex-col items-start sm:items-end">
                            <span className="text-xs text-gray-500 mb-1">Your Pick</span>
                            <span className="text-sm font-medium text-white flex items-center gap-1">
                              {pred.predictedWinner === 'home'
                                ? match.homeTeam.shortName
                                : pred.predictedWinner === 'away'
                                  ? match.awayTeam.shortName
                                  : 'Draw'}
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                            </span>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500 mb-1">Status</span>
                            {pred.isCorrect === undefined ? (
                              <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                Pending
                              </Badge>
                            ) : (
                              <Badge className={pred.isCorrect ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                                {pred.isCorrect ? '+10 Pts' : '0 Pts'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default PredictionHistory;
