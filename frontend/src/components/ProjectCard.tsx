import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit2, Trash2, Play, Calendar, Clock, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { ProjectResponse } from '@/types/project';
import { buildMediaUrl } from '@/lib/utils';

interface ProjectCardProps {
  project: ProjectResponse;
  onProjectClick: (project: ProjectResponse) => void;
  onUpdateProject: (id: string, updates: Partial<ProjectResponse>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export function ProjectCard({ project, onProjectClick, onUpdateProject, onDeleteProject }: ProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Build full URLs using the utility function
  const videoUrl = project.videoUrl ? buildMediaUrl(project.videoUrl) : undefined;

  const handleSaveEdit = async () => {
    if (editTitle.trim() && editTitle !== project.title) {
      setIsUpdating(true);
      try {
        await onUpdateProject(project.id, { 
          title: editTitle.trim()
        });
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to update project:', error);
        // Reset to original title on error
        setEditTitle(project.title);
      } finally {
        setIsUpdating(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(project.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteProject(project.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete project:', error);
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: ProjectResponse['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'uploading':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status: ProjectResponse['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-3 h-3" />;
      case 'processing':
      case 'uploading':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return null;
    
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-200 border hover:border-primary/20">
        <CardContent className="p-0">
          {/* Video Thumbnail/Preview */}
          <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/20 rounded-t-lg overflow-hidden">
            {videoUrl ? (
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                preload="metadata"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                <Play className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            
            {/* Play Overlay */}
            {/* <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-6 h-6 text-gray-900 ml-1" />
                </div>
              </div>
            </div> */}

            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <Badge 
                variant="outline" 
                className={`text-xs font-medium ${getStatusColor(project.status)}`}
              >
                {getStatusIcon(project.status)}
                <span className="ml-1 capitalize">{project.status}</span>
              </Badge>
            </div>

            {/* Actions Menu */}
            <div className="absolute top-3 right-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-white/95 hover:bg-white border-gray-200 text-gray-700 hover:text-gray-900 shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 dark:bg-gray-800/95 dark:hover:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                    disabled={isUpdating || isDeleting}
                    title="More options"
                  >
                    <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={() => setIsEditing(true)}
                    disabled={isUpdating || isDeleting}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Title
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                    disabled={isUpdating || isDeleting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Project Info */}
          <div className="p-4 space-y-3">
            {/* Title */}
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8"
                  autoFocus
                  disabled={isUpdating}
                />
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={handleSaveEdit} 
                  className="h-8 w-8 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
                  disabled={isUpdating}
                  title="Save changes"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  )}
                </Button>
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={handleCancelEdit} 
                  className="h-8 w-8 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                  disabled={isUpdating}
                  title="Cancel changes"
                >
                  <X className="w-4 h-4 flex-shrink-0" />
                </Button>
              </div>
            ) : (
              <h3 
                className="font-semibold text-lg leading-tight cursor-pointer hover:text-primary transition-colors"
                onClick={() => onProjectClick(project)}
              >
                {project.title}
              </h3>
            )}

            {/* Description */}
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(project.createdAt)}
              </div>
              {project.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(project.duration)}
                </div>
              )}
            </div>

            {/* Action Button */}
            <Button 
              className="w-full mt-4" 
              onClick={() => onProjectClick(project)}
              disabled={project.status === 'error' || project.status === 'uploading' || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : project.status === 'uploading' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : project.status === 'processing' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : project.status === 'error' ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Error
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Open Transcription
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}