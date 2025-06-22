import React from 'react';
import { Settings, Bell, HelpCircle, CheckCircle2, Zap, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SewingNeedleIcon } from './icons/SewingNeedleIcon';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  currentProjectTitle?: string;
  showProjectInfo?: boolean;
  onSignOut?: () => void;
}

export function Header({ currentProjectTitle, showProjectInfo = false, onSignOut }: HeaderProps) {
  const { user, userDisplayName } = useAuth();

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative z-50">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left Section - Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <SewingNeedleIcon className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                TailorFrame
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Project Info */}
        {showProjectInfo && currentProjectTitle && (
          <div className="flex items-center gap-3">
            <div className="h-4 w-px bg-border" />
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">{currentProjectTitle}</div>
              <div className="text-xs text-muted-foreground">Video Transcription</div>
            </div>
            <div className="h-4 w-px bg-border" />
          </div>
        )}

        {/* Right Section - Actions & User */}
        <div className="flex items-center gap-3">
         

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full border-border/50 hover:border-border hover:bg-accent/50 transition-all duration-200 p-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center text-sm font-medium ring-2 ring-background shadow-sm">
                  {userDisplayName.charAt(0).toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{userDisplayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              {/* <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </DropdownMenuItem> */}
              {/* <DropdownMenuItem>
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </DropdownMenuItem> */}
              {/* <DropdownMenuItem>
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}