import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, Trophy, Calendar, TrendingUp, RefreshCw
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/use-toast';
import { formatToIST } from './AdminLayout';

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query 1: Counts & Stats Card data
  const { data: dashboardStatsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: () => api.adminGetDashboardStats(),
  });

  // Query 2: Recent Activity Predictions (loaded separately for maximum speed)
  const { data: recentPredictionsResponse, isLoading: isRecentLoading } = useQuery({
    queryKey: ['adminRecentPredictions'],
    queryFn: () => api.adminGetPredictions(1, 5, '', ''),
  });

  const handleRecalculateLeaderboard = async () => {
    try {
      await api.adminGenerateLeaderboard();
      toast({ title: "Leaderboard Rebuilt", description: "Successfully updated rankings." });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminRecentPredictions'] });
    } catch (err: any) {
      toast({ title: "Leaderboard Update Failed", description: err.message || "Failed to generate.", variant: "destructive" });
    }
  };

  const stats = [
    { label: 'Total Users', value: String(dashboardStatsData?.total_users ?? 0), icon: Users, color: 'from-green-500 to-emerald-500', change: 'Live' },
    { label: 'Total Teams', value: String(dashboardStatsData?.total_teams ?? 0), icon: Trophy, color: 'from-blue-500 to-cyan-500', change: 'Live' },
    { label: 'Active Matches', value: String(dashboardStatsData?.active_matches ?? 0), icon: Calendar, color: 'from-orange-500 to-amber-500', change: 'Live' },
    { label: 'Predictions', value: String(dashboardStatsData?.total_predictions ?? 0), icon: TrendingUp, color: 'from-purple-500 to-pink-500', change: 'Live' },
  ];

  const recentPredictions = recentPredictionsResponse?.predictions || [];

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

      {/* Stats Cards Section */}
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
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                  {isStatsLoading ? (
                    <div className="h-9 w-20 bg-white/10 rounded animate-pulse mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  )}
                  <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-400">
                    {stat.change}
                  </Badge>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80 shrink-0`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Section */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-400" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {isRecentLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 animate-pulse">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-white/10" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                        <div className="h-3 bg-white/10 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {recentPredictions.map((activity: any, idx: number) => {
                  const homeTeamShort = activity.match?.team1?.short_name || 'Home';
                  const awayTeamShort = activity.match?.team2?.short_name || 'Away';
                  const userNameStr = activity.user_name || (activity.user_id ? `User ${activity.user_id.slice(-6)}` : 'User');
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                          {userNameStr.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm text-gray-200">
                            <span className="font-medium">{userNameStr}</span> predicted {homeTeamShort} vs {awayTeamShort}
                          </p>
                          <p className="text-xs text-gray-500">{formatToIST(activity.submitted_at)}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {recentPredictions.length === 0 && (
                  <p className="text-gray-500 text-sm">No recent prediction activity.</p>
                )}
              </>
            )}
          </div>
        </Card>

        {/* System Status Section */}
        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            System Status
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Total Selections Submitted</span>
                {isStatsLoading ? (
                  <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
                ) : (
                  <span className="text-green-400">{dashboardStatsData?.total_predictions ?? 0}</span>
                )}
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Registered Teams</span>
                {isStatsLoading ? (
                  <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
                ) : (
                  <span className="text-blue-400">{dashboardStatsData?.total_teams ?? 0} / 32</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
