import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, RefreshCw, MoreVertical, Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/use-toast';
import { formatToIST } from './AdminLayout';
import { AdminPagination } from '../../components/admin/AdminPagination';
import { AdminSelect } from '../../components/admin/AdminSelect';

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'correct', label: 'Correct' },
  { value: 'incorrect', label: 'Incorrect' },
  { value: 'pending', label: 'Pending' }
];

const AdminPredictions: React.FC = () => {
  const perpage_value = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  });

  const handleDeletePrediction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prediction?")) return;
    try {
      await api.adminDeletePrediction(id);
      toast({ title: "Prediction Deleted", description: "Successfully removed prediction." });
      refetchPredictions();
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message || "Could not delete prediction.", variant: "destructive" });
    }
  };

  const predictions = paginatedPredictionsData?.predictions || [];
  const total = paginatedPredictionsData?.total || 0;
  const pages = paginatedPredictionsData?.pages || 0;

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
              <AdminSelect
                options={statusOptions}
                value={predStatusFilter}
                onChange={(val) => {
                  setPredStatusFilter(val);
                  setPredPage(1);
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
        <AdminPagination
          currentPage={predPage}
          totalPages={pages}
          totalItems={total}
          itemsPerPage={perpage_value}
          onPageChange={setPredPage}
          itemNamePlural="predictions"
        />
      </Card>
    </div>
  );
};

export default AdminPredictions;
