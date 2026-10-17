import { Injectable } from '@nestjs/common';
import { CompanyEntity, ICompanyGateway } from '../domain/company.entity';

@Injectable()
export class InseeApiAdapter implements ICompanyGateway {
  async searchCompanies(query: string): Promise<CompanyEntity[]> {
    const cleanQuery = query.trim().replace(/\s+/g, '');
    const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(cleanQuery)}&page=1&per_page=5`;

    const response = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la requête API Insee/Gouv');
    }

    const data = await response.json();
    return (data.results || []).map((item: any) => CompanyEntity.fromRawInsee(item));
  }
}
