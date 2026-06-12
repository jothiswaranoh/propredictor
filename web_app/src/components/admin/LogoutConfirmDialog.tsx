import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { api } from '../../lib/api';

interface LogoutConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border border-white/10 text-white rounded-2xl max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <LogOut className="w-5 h-5 text-red-500" />
            Confirm Sign Out
          </DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Are you sure you want to sign out of the Admin panel?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 justify-end mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
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
  );
};

export default LogoutConfirmDialog;
