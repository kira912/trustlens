import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../core/infrastructure/api.client';
import type { ScamReport, CreateReportPayload } from '../../../core/domain/models';

export function useScamWatch() {
  const [reports, setReports] = useState<ScamReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  const [formState, setFormState] = useState<CreateReportPayload>({
    targetType: 'phone',
    targetValue: '',
    platform: 'Leboncoin',
    sellerAlias: '',
    scamType: 'Faux transporteur / Coupons',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getScamReports(searchQuery, selectedType);
      setReports(data.reports || []);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType]);

  useEffect(() => {
    fetchReports();
  }, [selectedType]);

  const upvote = useCallback(async (id: string) => {
    const res = await apiClient.upvoteReport(id);
    if (res.success) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, upvotes: res.upvotes } : r)));
    }
  }, []);

  const updateForm = useCallback(<K extends keyof CreateReportPayload>(key: K, val: CreateReportPayload[K]) => {
    setFormState((prev) => ({ ...prev, [key]: val }));
  }, []);

  const submitReport = useCallback(async () => {
    if (!formState.targetValue.trim() || !formState.description.trim()) return;

    setSubmitting(true);
    setFormMessage(null);

    try {
      await apiClient.createScamReport(formState);
      setFormMessage('Signalement enregistré et partagé avec la communauté !');
      setTimeout(() => {
        setShowModal(false);
        setFormState((prev) => ({ ...prev, targetValue: '', description: '', sellerAlias: '' }));
        setFormMessage(null);
        fetchReports();
      }, 1200);
    } catch (err: any) {
      setFormMessage(err.message || 'Erreur lors de l’enregistrement');
    } finally {
      setSubmitting(false);
    }
  }, [formState, fetchReports]);

  return {
    reports,
    loading,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    showModal,
    setShowModal,
    formState,
    updateForm,
    submitting,
    formMessage,
    fetchReports,
    upvote,
    submitReport,
  };
}
