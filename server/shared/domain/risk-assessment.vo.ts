export type RiskLevel = 'SAFE' | 'WARNING' | 'DANGER' | 'UNKNOWN';
export type FlagSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface RiskFlag {
  type: string;
  severity: FlagSeverity;
  title: string;
  detail?: string;
  snippet?: string;
}

export interface SafeSignal {
  title: string;
  detail: string;
}

export class RiskAssessment {
  constructor(
    public readonly score: number,
    public readonly riskLevel: RiskLevel,
    public readonly redFlags: RiskFlag[],
    public readonly warningFlags: RiskFlag[],
    public readonly safeFlags: SafeSignal[],
    public readonly recommendations: string[]
  ) {}

  static computeLevel(score: number, redFlagsCount: number, warningFlagsCount: number): RiskLevel {
    if (score <= 35 || redFlagsCount >= 2) return 'DANGER';
    if (score <= 70 || redFlagsCount === 1 || warningFlagsCount >= 2) return 'WARNING';
    return 'SAFE';
  }

  static clampScore(rawScore: number, min = 0): number {
    return Math.max(min, Math.min(100, rawScore));
  }
}
