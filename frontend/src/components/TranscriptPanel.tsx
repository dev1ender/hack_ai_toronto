import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { ArrowLeft, Clock, User, Mic, Save, X, FileText, Wand2, Trash2, RotateCcw } from 'lucide-react';
import { Project } from '@/types/project';
import { useTranscriptionStore } from '@/store/transcription-store';
import { useProjectStore } from '@/store/project-store';
import { TranscriptSegment, ProjectResponse } from '@/types';
import { projectApi } from '@/lib/api';
import { toast } from 'sonner';

interface TranscriptItem {
  id: string;
  speaker: string;
  timestamp: string;
  text: string;
  isHighlighted?: boolean;
  startTime?: number | null;
  endTime?: number | null;
}

interface TextChange {
  id: string;
  transcriptId: string;
  timestamp: string;
  oldText: string;
  newText: string;
  startIndex: number;
  endIndex: number;
  changeTime: string;
}

interface EditingState {
  transcriptId: string;
  selectedText: string;
  startIndex: number;
  endIndex: number;
  newText: string;
  position: { x: number; y: number };
}

interface TextSegment {
  text: string;
  isChanged: boolean;
  changeId?: string;
}

interface TranscriptPanelProps {
  onBack?: () => void;
  selectedProject: Project | null;
}

const formatTimestamp = (seconds: number): string => {
  if (isNaN(seconds) || seconds == null) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatTimeRange = (startTime: number | null | undefined, endTime: number | null | undefined): string => {
  if (!startTime && !endTime) return "00:00";
  if (!startTime) return `- ${formatTimestamp(endTime || 0)}`;
  if (!endTime) return `${formatTimestamp(startTime)} -`;
  return `${formatTimestamp(startTime)} - ${formatTimestamp(endTime)}`;
};



export function TranscriptPanel({ onBack, selectedProject }: TranscriptPanelProps) {
  const { 
    currentTranscription, 
    fetchTranscription, 
    isLoading, 
    error 
  } = useTranscriptionStore();
  
  const [changes, setChanges] = useState<TextChange[]>([]);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [activeTab, setActiveTab] = useState('transcript');
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const { setUpdatedProject, refreshCurrentProject } = useProjectStore();

  useEffect(() => {
    if (selectedProject?.id) {
      fetchTranscription(selectedProject.id);
    }
  }, [selectedProject, fetchTranscription]);

  const transcripts: TranscriptItem[] = React.useMemo(() => {
    if (!currentTranscription?.segments) return [];
    
    return currentTranscription.segments.map((segment: TranscriptSegment) => ({
      id: segment.id,
      speaker: segment.speaker || "Speaker",
      timestamp: formatTimeRange(segment.startTime, segment.endTime),
      text: segment.text,
      isHighlighted: false, // Set your logic for highlighting
      startTime: segment.startTime,
      endTime: segment.endTime,
    }));
  }, [currentTranscription]);

  const handleTextSelection = (transcriptId: string, _event: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') return;

    const selectedText = selection.toString();
    const currentText = getCurrentText(transcripts.find(t => t.id === transcriptId)!);
    const startIndex = currentText.indexOf(selectedText);
    const endIndex = startIndex + selectedText.length;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const position = {
      x: rect.left + (rect.width / 2),
      y: rect.top - 10
    };

    setEditingState({
      transcriptId,
      selectedText,
      startIndex,
      endIndex,
      newText: selectedText,
      position
    });

    selection.removeAllRanges();
  };

  const handleSaveEdit = () => {
    if (!editingState) return;

    const transcript = transcripts.find(t => t.id === editingState.transcriptId);
    if (!transcript) return;

    const change: TextChange = {
      id: Date.now().toString(),
      transcriptId: editingState.transcriptId,
      timestamp: transcript.timestamp,
      oldText: editingState.selectedText,
      newText: editingState.newText,
      startIndex: editingState.startIndex,
      endIndex: editingState.endIndex,
      changeTime: new Date().toLocaleTimeString()
    };

    setChanges(prev => [...prev, change]);
    setEditingState(null);
  };

  const handleApplyChanges = async () => {
    if (!selectedProject?.id || changes.length === 0) return;

    setIsApplyingChanges(true);
    const toastId = toast.loading('Applying changes and generating new video...', {
      description: 'This may take a few moments. Please wait.',
    });

    try {
      const response = await projectApi.applyTranscriptChanges(selectedProject.id, changes);
      if (response.success && response.data) {
        setUpdatedProject(response.data as unknown as ProjectResponse);
        await refreshCurrentProject();
        toast.success('Video updated successfully!', {
          id: toastId,
          description: 'The new video is now available.',
        });
        setChanges([]); // Clear changes after successful application
      } else {
        const errorMessage = typeof response.error === 'string' ? response.error : 'Failed to apply changes.';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error applying changes:', error);
      toast.error('Failed to apply changes.', {
        id: toastId,
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsApplyingChanges(false);
    }
  };

  const handleDeleteChange = (changeId: string) => {
    setChanges(prev => prev.filter(change => change.id !== changeId));
    toast.success('Change deleted successfully');
  };

  const handleClearAllChanges = () => {
    setChanges([]);
    toast.success('All changes cleared');
  };

  const handleCancelEdit = () => {
    setEditingState(null);
  };

  const getCurrentText = (transcript: TranscriptItem): string => {
    const transcriptChanges = changes.filter(c => c.transcriptId === transcript.id);
    if (transcriptChanges.length === 0) {
      return transcript.text;
    }

    let workingText = transcript.text;
    const sortedChanges = [...transcriptChanges].sort((a, b) => a.startIndex - b.startIndex);
    let offset = 0;

    sortedChanges.forEach(change => {
      const adjustedStartIndex = change.startIndex + offset;
      const adjustedEndIndex = change.endIndex + offset;

      workingText = 
        workingText.substring(0, adjustedStartIndex) +
        change.newText +
        workingText.substring(adjustedEndIndex);

      offset += change.newText.length - (change.endIndex - change.startIndex);
    });

    return workingText;
  };

  const applyChangesToText = (originalText: string, transcriptChanges: TextChange[]): TextSegment[] => {
    if (transcriptChanges.length === 0) {
      return [{ text: originalText, isChanged: false }];
    }

    const sortedChanges = [...transcriptChanges].sort((a, b) => a.startIndex - b.startIndex);
    const segments: TextSegment[] = [];
    let currentIndex = 0;
    let workingText = originalText;
    let offset = 0;

    sortedChanges.forEach((change) => {
      const adjustedStartIndex = change.startIndex + offset;
      const adjustedEndIndex = change.endIndex + offset;

      if (currentIndex < adjustedStartIndex) {
        const unchangedText = workingText.substring(currentIndex, adjustedStartIndex);
        if (unchangedText) {
          segments.push({ text: unchangedText, isChanged: false });
        }
      }

      segments.push({ 
        text: change.newText, 
        isChanged: true, 
        changeId: change.id 
      });

      workingText = 
        workingText.substring(0, adjustedStartIndex) +
        change.newText +
        workingText.substring(adjustedEndIndex);

      offset += change.newText.length - (change.endIndex - change.startIndex);
      currentIndex = adjustedStartIndex + change.newText.length;
    });

    if (currentIndex < workingText.length) {
      const remainingText = workingText.substring(currentIndex);
      if (remainingText) {
        segments.push({ text: remainingText, isChanged: false });
      }
    }

    return segments;
  };

  const renderTextWithChanges = (transcript: TranscriptItem) => {
    // This function needs to be adapted since `changes` state is local
    // and `transcripts` are now derived from the store.
    // For now, this might not reflect edits correctly.
    const transcriptChanges = changes.filter(c => c.transcriptId === transcript.id);
    const segments = applyChangesToText(transcript.text, transcriptChanges);

    return (
      <span 
        className="cursor-text select-text"
        onMouseUp={(e) => handleTextSelection(transcript.id, e)}
      >
        {segments.map((segment, index) => (
          <span 
            key={index}
            className={segment.isChanged ? "bg-primary/10 text-primary px-1 rounded" : ""}
          >
            {segment.text}
          </span>
        ))}
      </span>
    );
  };

  const changesJson = JSON.stringify(changes.map(change => ({
    timestamp: change.timestamp,
    change_id: change.id,
    old_text: change.oldText,
    new_text: change.newText,
    change_time: change.changeTime
  })), null, 2);

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Editing Tooltip */}
      {editingState && (
        <div 
          className="fixed z-50 bg-white border border-border rounded-lg shadow-lg p-3 min-w-[300px]"
          style={{
            left: `${editingState.position.x - 150}px`,
            top: `${editingState.position.y - 80}px`,
          }}
        >
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              <span className="line-through text-destructive bg-destructive/10 px-2 py-1 rounded">
                {editingState.selectedText}
              </span>
            </div>
            <Input
              value={editingState.newText}
              onChange={(e) => setEditingState(prev => 
                prev ? { ...prev, newText: e.target.value } : null
              )}
              className="text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  handleCancelEdit();
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" onClick={handleSaveEdit} className="h-7 px-3 text-xs">
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-7 px-3 text-xs">
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border"></div>
        </div>
      )}

      {/* Fixed Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b bg-background z-10">
        {/* Compact Header with Back Button and Tabs */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="outline"
                size="icon"
                onClick={onBack}
                className="h-8 w-8 rounded-full bg-white/95 hover:bg-white border-gray-200 text-gray-700 hover:text-gray-900 shadow-sm backdrop-blur-sm transition-all duration-200 dark:bg-gray-800/95 dark:hover:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                title="Go back"
              >
                <ArrowLeft className="h-4 w-4 flex-shrink-0" />
              </Button>
            )}
            <div>
              <h2 className="text-lg font-semibold">Transcripts</h2>
              <p className="text-xs text-muted-foreground">
                Edit and manage your video transcription
              </p>
            </div>
          </div>
        </div>
        
        {/* Custom Tabs Navigation */}
        <Tabs 
          className="w-full max-w-sm"
          tabs={[
            { id: 'transcript', label: 'Transcript' },
            { 
              id: 'changes', 
              label: changes.length > 0 ? (
                <div className="relative flex items-center">
                  Changes
                  <span className="ml-2 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px] leading-none">
                    {changes.length}
                  </span>
                </div>
              ) : 'Changes'
            }
          ]}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Transcript Content */}
          {activeTab === 'transcript' && (
            <div className="space-y-6 pb-6">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <p>Loading transcripts...</p>
                </div>
              )}
              {error && (
                <div className="flex items-center justify-center py-8">
                  <p>Error: {error}</p>
                </div>
              )}
              {!isLoading && !error && transcripts.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <p>No transcripts available</p>
                </div>
              )}
              {!isLoading && !error && transcripts.map((item) => (
                <Card 
                  key={item.id} 
                  className={`transition-all duration-200 hover:shadow-md cursor-pointer min-h-[120px] ${
                    item.isHighlighted ? 'ring-2 ring-primary/20 bg-primary/5' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="secondary" className="text-sm font-medium px-3 py-1">
                            <Mic className="w-4 h-4 mr-2" />
                            {item.speaker}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="font-mono">{item.timestamp}</span>
                          </div>
                        </div>
                        <p className="text-base leading-relaxed text-foreground mb-4">
                          {renderTextWithChanges(item)}
                        </p>

                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Changes Content */}
          {activeTab === 'changes' && (
            <div className='space-y-4 pb-6'>
              {changes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <FileText className="w-8 h-8 mb-2" />
                  <p className="text-sm">No changes made yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Change History ({changes.length} changes)
                        </div>
                        <div className="flex items-center gap-2">
                          {changes.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleClearAllChanges}
                              className="h-8"
                            >
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Clear All
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={handleApplyChanges}
                            disabled={isApplyingChanges}
                          >
                            <Wand2 className="w-4 h-4 mr-2" />
                            {isApplyingChanges ? 'Generating...' : 'Generate New Video'}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {changes.map((change) => (
                        <div key={change.id} className="border rounded-lg p-3 bg-accent/20">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {change.timestamp}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {change.changeTime}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteChange(change.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">Old:</span>
                              <span className="line-through text-destructive bg-destructive/10 px-2 py-1 rounded">
                                {change.oldText}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">New:</span>
                              <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                                {change.newText}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">JSON Export</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-64 text-muted-foreground font-mono">
                        {changesJson}
                      </pre>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => navigator.clipboard.writeText(changesJson)}
                      >
                        Copy JSON
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}