import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../core/infrastructure/api.client';
import type { SystemStats, ScanRecord } from '../../../core/domain/models';

export const DB_MUTATION_EVENT = 'trustlens:db-updated';

export function emitDatabaseMutation() {
  window.dispatchEvent(new CustomEvent(DB_MUTATION_EVENT));
}

export function useDashboardMetrics() {
  const [stats, setStats] = useState<SystemStats>({
    totalReports: 0,
    totalScans: 0,
    threatsNeutralized: 0,
  });
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);

  const refreshMetrics = useCallback(async () => {
    try {
      const [statsData, scansData] = await Promise.all([
        apiClient.getStats(),
        apiClient.getRecentScans(4),
      ]);
      setStats(statsData);
      setRecentScans(scansData.scans || []);
    } catch {
      // Offline resilient fallback
    }
  }, []);

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 10000);
    window.addEventListener(DB_MUTATION_EVENT, refreshMetrics);
    return () => {
      clearInterval(interval);
      window.removeEventListener(DB_MUTATION_EVENT, refreshMetrics);
    };
  }, [refreshMetrics]);

  return { stats, recentScans, refreshMetrics };
}
