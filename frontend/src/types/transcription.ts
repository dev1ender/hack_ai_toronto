export interface TranscriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  speaker: string;
  text: string;
  confidence?: number;
}

export interface Transcription {
  id: string;
  projectId: string;
  segments: TranscriptSegment[];
  status: 'processing' | 'completed' | 'error';
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptionChange {
  id: string;
  transcriptionId: string;
  segmentId: string;
  oldText: string;
  newText: string;
  startIndex: number;
  endIndex: number;
  timestamp: string;
  userId: string;
}

export interface TranscriptionRequest {
  projectId: string;
  language?: string;
  speakerDetection?: boolean;
  customVocabulary?: string[];
}

export interface TranscriptionExport {
  format: 'srt' | 'vtt' | 'txt' | 'json';
  includeTimestamps: boolean;
  includeSpeakers: boolean;
}

export interface AudioReplacement {
  id: string;
  projectId: string;
  originalAudioUrl: string;
  newAudioUrl: string;
  status: 'processing' | 'completed' | 'error';
  createdAt: string;
} 