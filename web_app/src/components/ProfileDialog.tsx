import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { User, Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile?: { name: string; email: string } | null;
  onUpdateProfile?: (name: string) => Promise<void>;
  onResetPassword: (password: string) => Promise<void>;
  isAdmin?: boolean;
}

export function ProfileDialog({
  open,
  onOpenChange,
  userProfile,
  onUpdateProfile,
  onResetPassword,
  isAdmin = false
}: ProfileDialogProps) {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      if (userProfile) {
        setNewName(userProfile.name);
      }
      setShowPasswordInput(false);
      setEditingName(false);
      setNewPassword('');
      setShowPassword(false);
    }
  }, [open, userProfile]);

  const handleUpdateProfile = async () => {
    if (!onUpdateProfile || !newName.trim()) return;
    try {
      setIsUpdatingProfile(true);
      await onUpdateProfile(newName);
      setEditingName(false);
      toast({ title: "Profile Updated", description: "Your name has been updated successfully." });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) return;
    try {
      setIsResetting(true);
      await onResetPassword(newPassword);
      toast({ title: "Success", description: "Password updated successfully!" });
      setNewPassword('');
      setShowPasswordInput(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border border-white/10 text-white rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {isAdmin ? <Shield className="w-5 h-5 text-blue-400" /> : <User className="w-5 h-5 text-blue-400" />}
            {isAdmin ? "Admin Profile" : "My Profile"}
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            {isAdmin ? "Reset your admin account password." : "Your profile details and account settings."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {userProfile && (
            <>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-gray-400">Full Name</p>
                  {!editingName ? (
                    <Button variant="ghost" size="sm" onClick={() => setEditingName(true)} className="h-6 text-xs text-blue-400 hover:text-blue-300 px-2">Edit</Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setEditingName(false); setNewName(userProfile.name); }} className="h-6 text-xs text-gray-400 hover:text-gray-300 px-2">Cancel</Button>
                      <Button variant="ghost" size="sm" onClick={handleUpdateProfile} disabled={isUpdatingProfile || !newName.trim()} className="h-6 text-xs text-green-400 hover:text-green-300 px-2">{isUpdatingProfile ? "Saving..." : "Save"}</Button>
                    </div>
                  )}
                </div>
                {editingName ? (
                  <Input value={newName} onChange={e => setNewName(e.target.value)} className="bg-black/20 border-white/10 text-white h-8 text-sm" autoFocus />
                ) : (
                  <p className="font-semibold text-white">{userProfile.name}</p>
                )}
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <p className="text-sm text-gray-400">Username (Email)</p>
                <p className="font-semibold text-white">{userProfile.email}</p>
              </div>
            </>
          )}
          
          <div className={userProfile ? "pt-4 border-t border-white/10" : ""}>
            {userProfile && !showPasswordInput ? (
              <Button variant="outline" onClick={() => setShowPasswordInput(true)} className="w-full border-white/10 text-white bg-white/5 hover:bg-white/10">
                Reset Password
              </Button>
            ) : (
              <div className="space-y-3">
                {userProfile && (
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm">Reset Password</h4>
                    <Button variant="ghost" size="sm" onClick={() => { setShowPasswordInput(false); setNewPassword(''); setShowPassword(false); }} className="h-6 text-xs text-gray-400 hover:text-gray-300 px-2">Cancel</Button>
                  </div>
                )}
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  onClick={handleResetPassword}
                  disabled={!newPassword || isResetting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isResetting ? "Updating..." : "Update Password"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
