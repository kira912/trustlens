export type TargetType = 'phone' | 'iban' | 'email' | 'username' | 'url';

export class ScamReportEntity {
  constructor(
    public readonly id: string,
    public readonly targetType: TargetType,
    public readonly targetValue: string,
    public readonly platform: string,
    public readonly sellerAlias: string,
    public readonly scamType: string,
    public readonly description: string,
    public readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM',
    public readonly upvotes: number,
    public readonly reportedAt: string
  ) {}

  static matchesPhoneSearch(targetVal: string, query: string): boolean {
    const searchDigits = query.replace(/\D/g, '');
    const valDigits = targetVal.replace(/\D/g, '');
    if (searchDigits.length < 3 || valDigits.length < 4) return false;

    const normVal = valDigits.replace(/^33/, '0');
    const normSearch = searchDigits.replace(/^33/, '0');

    return valDigits.includes(searchDigits) || normVal.includes(normSearch) || normSearch.includes(normVal);
  }
}
