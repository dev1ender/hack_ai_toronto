import { apiClient } from './client';
import { convertObjectKeys, toCamelCase } from '@/lib/utils';
import type {
  ApiResponse,
  Transcription,
  TranscriptionRequest,
  TranscriptionChange,
  TranscriptionExport,
  AudioReplacement,
} from '@/types';

export class TranscriptionApi {
  async getTranscription(projectId: string): Promise<ApiResponse<Transcription>> {
    const response = await apiClient.get<any>(`/projects/${projectId}/transcripts`);
    
    if (response.success && response.data) {
      // Convert snake_case to camelCase for the entire response
      const convertedData = convertObjectKeys(response.data, toCamelCase);
      return {
        ...response,
        data: convertedData as Transcription
      };
    }
    
    return response;
  }

  async createTranscription(data: TranscriptionRequest): Promise<ApiResponse<Transcription>> {
    return apiClient.post<Transcription>('/transcriptions', data);
  }

  async updateTranscription(id: string, data: Partial<Transcription>): Promise<ApiResponse<Transcription>> {
    return apiClient.put<Transcription>(`/transcriptions/${id}`, data);
  }

  async getTranscriptionChanges(transcriptionId: string): Promise<ApiResponse<TranscriptionChange[]>> {
    return apiClient.get<TranscriptionChange[]>(`/transcriptions/${transcriptionId}/changes`);
  }

  async saveTranscriptionChange(data: Omit<TranscriptionChange, 'id' | 'timestamp'>): Promise<ApiResponse<TranscriptionChange>> {
    return apiClient.post<TranscriptionChange>('/transcription-changes', data);
  }

  async exportTranscription(transcriptionId: string, options: TranscriptionExport): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.post<{ downloadUrl: string }>(`/transcriptions/${transcriptionId}/export`, options);
  }

  async replaceAudio(projectId: string, audioFile: File): Promise<ApiResponse<AudioReplacement>> {
    const formData = new FormData();
    formData.append('audioFile', audioFile);
    return apiClient.upload<AudioReplacement>(`/projects/${projectId}/replace-audio`, formData);
  }

  async getAudioReplacementStatus(id: string): Promise<ApiResponse<AudioReplacement>> {
    return apiClient.get<AudioReplacement>(`/audio-replacements/${id}`);
  }
}

export const transcriptionApi = new TranscriptionApi(); 