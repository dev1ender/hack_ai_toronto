import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { transcriptionApi } from '@/lib/api';
import type {
  Transcription,
  TranscriptionChange,
  TranscriptionRequest,
  TranscriptionExport,
} from '@/types';

interface TranscriptionState {
  currentTranscription: Transcription | null;
  changes: TranscriptionChange[];
  isLoading: boolean;
  error: string | null;
  isProcessing: boolean;
}

interface TranscriptionActions {
  fetchTranscription: (projectId: string) => Promise<void>;
  createTranscription: (data: TranscriptionRequest) => Promise<boolean>;
  saveChange: (change: Omit<TranscriptionChange, 'id' | 'timestamp'>) => Promise<boolean>;
  fetchChanges: (transcriptionId: string) => Promise<void>;
  exportTranscription: (transcriptionId: string, options: TranscriptionExport) => Promise<string | null>;
  clearError: () => void;
  setCurrentTranscription: (transcription: Transcription | null) => void;
}

type TranscriptionStore = TranscriptionState & TranscriptionActions;

export const useTranscriptionStore = create<TranscriptionStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentTranscription: null,
      changes: [],
      isLoading: false,
      error: null,
      isProcessing: false,

      // Actions
      fetchTranscription: async (projectId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await transcriptionApi.getTranscription(projectId);
          
          if (response.success && response.data) {
            set({
              currentTranscription: response.data,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              error: response.error as string,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch transcription',
            isLoading: false,
          });
        }
      },

      createTranscription: async (data: TranscriptionRequest) => {
        set({ isLoading: true, isProcessing: true, error: null });
        
        try {
          const response = await transcriptionApi.createTranscription(data);
          
          if (response.success && response.data) {
            set({
              currentTranscription: response.data,
              isLoading: false,
              isProcessing: response.data.status === 'processing',
              error: null,
            });
            return true;
          } else {
            set({
              error: response.error as string,
              isLoading: false,
              isProcessing: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create transcription',
            isLoading: false,
            isProcessing: false,
          });
          return false;
        }
      },

      saveChange: async (changeData: Omit<TranscriptionChange, 'id' | 'timestamp'>) => {
        try {
          const response = await transcriptionApi.saveTranscriptionChange(changeData);
          
          if (response.success && response.data) {
            set((state) => ({
              changes: [...state.changes, response.data!],
            }));
            return true;
          } else {
            set({
              error: response.error as string,
            });
            return false;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to save change',
          });
          return false;
        }
      },

      fetchChanges: async (transcriptionId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await transcriptionApi.getTranscriptionChanges(transcriptionId);
          
          if (response.success && response.data) {
            set({
              changes: response.data,
              isLoading: false,
              error: null,
            });
          } else {
            set({
              error: response.error as string,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch changes',
            isLoading: false,
          });
        }
      },

      exportTranscription: async (transcriptionId: string, options: TranscriptionExport) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await transcriptionApi.exportTranscription(transcriptionId, options);
          
          if (response.success && response.data) {
            set({ isLoading: false, error: null });
            return response.data.downloadUrl;
          } else {
            set({
              error: response.error as string,
              isLoading: false,
            });
            return null;
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to export transcription',
            isLoading: false,
          });
          return null;
        }
      },

      clearError: () => set({ error: null }),

      setCurrentTranscription: (transcription: Transcription | null) => {
        set({ 
          currentTranscription: transcription,
          isProcessing: transcription?.status === 'processing' || false,
        });
      },
    }),
    {
      name: 'transcription-store',
    }
  )
); 