import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Trophy, Calendar, TrendingUp, LogOut, Menu, X, Shield, ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { LogoutConfirmDialog } from '../../components/admin/LogoutConfirmDialog';
import loginWallpaper from '../../assets/login_wallpaper.jpg';

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

/**
 * Converts a datetime-local string ("YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss")
 * entered as IST to a UTC ISO string for the backend.
 */
export const parseDatetimeKolkata = (localString: string): string => {
  if (!localString) return '';
  // Strip any trailing seconds or timezone info — keep only YYYY-MM-DDTHH:mm
  const clean = localString.slice(0, 16); // e.g. "2026-06-13T20:30"
  // Treat as Asia/Kolkata (UTC+5:30). Subtract 5h30m (330min) to get UTC.
  const [datePart, timePart] = clean.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  // Create UTC date by subtracting IST offset
  const utcMs = Date.UTC(year, month - 1, day, hour - 5, minute - 30);
  return new Date(utcMs).toISOString();
};

/**
 * Converts a UTC ISO string from the backend to a datetime-local string
 * displayed as IST ("YYYY-MM-DDTHH:mm") for the <input type="datetime-local">.
 * Uses pure UTC arithmetic (+5:30) — avoids browser Intl locale quirks.
 */
export const formatDatetimeLocal = (isoString?: string): string => {
  if (!isoString) return '';
  const utcMs = new Date(isoString).getTime();
  if (isNaN(utcMs)) return '';
  // IST = UTC + 5h30m = UTC + 330 minutes
  const istMs = utcMs + 330 * 60 * 1000;
  const d = new Date(istMs);
  const yyyy = d.getUTCFullYear();
  const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
};

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const getActiveTab = (pathname: string): TabType => {
    if (pathname === '/admin' || pathname === '/admin/') return 'dashboard';
    if (pathname.startsWith('/admin/team')) return 'teams';
    if (pathname.startsWith('/admin/match')) return 'matches';
    if (pathname.startsWith('/admin/user')) return 'users';
    if (pathname.startsWith('/admin/prediction')) return 'predictions';
    return 'dashboard';
  };

  const activeTab = getActiveTab(location.pathname);

  const sidebarItems: { id: TabType; label: string; icon: React.ElementType; path: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'teams', label: 'Teams', icon: Trophy, path: '/admin/teams' },
    { id: 'matches', label: 'Matches', icon: Calendar, path: '/admin/matches' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp, path: '/admin/predictions' },
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${loginWallpaper})` }}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] pointer-events-none" />
      <div className="relative z-10 min-h-screen football-pattern flex flex-col">
        {/* Mobile Sticky Header */}
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

        <div className="flex flex-1">
          {/* Sidebar */}
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
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id
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

          {/* Overlay background for sidebar mobile view */}
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            />
          )}

          {/* Main Content Area */}
          <main className="flex-1 p-4 lg:p-8 min-h-screen lg:ml-0 overflow-y-auto">
            <Outlet />
          </main>
        </div>

        {/* Logout Confirmation Dialog */}
        <LogoutConfirmDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen} />
      </div>
    </div>
  );
};

export default AdminLayout;
