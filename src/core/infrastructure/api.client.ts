import type {
  UrlAnalysisResponse,
  TextAnalysisResponse,
  PhoneAnalysisResponse,
  EmailAnalysisResponse,
  CryptoAnalysisResponse,
  SirenSearchResponse,
  ScamReport,
  CreateReportPayload,
  SystemStats,
  ScanRecord,
  ListingContextInput,
} from '../domain/models';
import { emitDatabaseMutation } from '../../features/dashboard/hooks/useDashboardMetrics';

function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${baseUrl}${cleanPath}`;

  const response = await fetch(fullUrl, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Erreur HTTP ${response.status}`);
  }
  return data as T;
}

export const apiClient = {
  async analyzeUrl(url: string, listingContext?: ListingContextInput): Promise<UrlAnalysisResponse> {
    const res = await request<UrlAnalysisResponse>('/api/analyze-url', {
      method: 'POST',
      body: JSON.stringify({ url, listingContext }),
    });
    emitDatabaseMutation();
    return res;
  },

  analyzeText(text: string): Promise<TextAnalysisResponse> {
    return request<TextAnalysisResponse>('/api/analyze-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async analyzePhone(phone: string): Promise<PhoneAnalysisResponse> {
    const res = await request<PhoneAnalysisResponse>('/api/analyze-phone', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    emitDatabaseMutation();
    return res;
  },

  async analyzeEmail(email: string): Promise<EmailAnalysisResponse> {
    const res = await request<EmailAnalysisResponse>('/api/analyze-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    emitDatabaseMutation();
    return res;
  },

  async analyzeCrypto(address: string): Promise<CryptoAnalysisResponse> {
    const res = await request<CryptoAnalysisResponse>('/api/analyze-crypto', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
    emitDatabaseMutation();
    return res;
  },

  async verifySiren(query: string): Promise<SirenSearchResponse> {
    const res = await request<SirenSearchResponse>(`/api/verify-siren?q=${encodeURIComponent(query)}`);
    emitDatabaseMutation();
    return res;
  },

  getScamReports(q?: string, type?: string): Promise<{ total: number; reports: ScamReport[] }> {
    const params = new URLSearchParams();
    if (q && q.trim()) params.append('q', q.trim());
    if (type && type !== 'all') params.append('type', type);
    const qs = params.toString();
    return request<{ total: number; reports: ScamReport[] }>(`/api/scam-reports${qs ? `?${qs}` : ''}`);
  },

  async createScamReport(payload: CreateReportPayload): Promise<{ message: string; report: ScamReport }> {
    const res = await request<{ message: string; report: ScamReport }>('/api/scam-reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    emitDatabaseMutation();
    return res;
  },

  async upvoteReport(id: string): Promise<{ success: boolean; upvotes: number }> {
    const res = await request<{ success: boolean; upvotes: number }>(`/api/scam-reports/${id}/upvote`, {
      method: 'POST',
    });
    emitDatabaseMutation();
    return res;
  },

  getStats(): Promise<SystemStats> {
    return request<SystemStats>('/api/stats');
  },

  getRecentScans(limit = 4): Promise<{ scans: ScanRecord[] }> {
    return request<{ scans: ScanRecord[] }>(`/api/scans/recent?limit=${limit}`);
  },
};

