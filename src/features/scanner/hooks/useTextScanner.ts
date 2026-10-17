import { useState, useCallback } from 'react';
import { apiClient } from '../../../core/infrastructure/api.client';
import type { TextAnalysisResponse } from '../../../core/domain/models';

export function useTextScanner() {
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TextAnalysisResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const analyzeText = useCallback(async (overrideText?: string) => {
    const content = (overrideText !== undefined ? overrideText : textInput).trim();
    if (!content) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await apiClient.analyzeText(content);
      setResult(data);
      if (overrideText !== undefined) setTextInput(overrideText);
    } finally {
      setLoading(false);
    }
  }, [textInput]);

  const copyAdvice = useCallback(() => {
    if (!result) return;
    const text = `🛡️ Analyse TrustLens :\nScore de confiance : ${result.score}/100 (${result.riskLevel})\n${result.recommendations.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  return {
    textInput,
    setTextInput,
    loading,
    result,
    copied,
    analyzeText,
    copyAdvice,
  };
}
