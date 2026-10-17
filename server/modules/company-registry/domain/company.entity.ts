export class CompanyEntity {
  constructor(
    public readonly siren: string,
    public readonly siretSiege: string | undefined,
    public readonly nomComplet: string,
    public readonly activitePrincipale: string | undefined,
    public readonly dateCreation: string | undefined,
    public readonly ageAnnees: number,
    public readonly etatAdministratif: string,
    public readonly isCessée: boolean,
    public readonly adresse: string,
    public readonly dirigeants: string[],
    public readonly trustScore: number,
    public readonly redFlags: string[],
    public readonly positivePoints: string[]
  ) {}

  static fromRawInsee(item: any): CompanyEntity {
    const isCessée = item.etat_administratif === 'C' || item.siege?.etat_administratif === 'F';
    const creationDate = item.date_creation || item.date_debut_activite;

    let companyAgeYears = 0;
    if (creationDate) {
      const diff = Date.now() - new Date(creationDate).getTime();
      companyAgeYears = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 365)));
    }

    let trustScore = 80;
    const redFlags: string[] = [];
    const positivePoints: string[] = [];

    if (isCessée) {
      trustScore = 15;
      redFlags.push(
        'ENTREPRISE RADIÉE OU CESSÉE : Activité officiellement fermée, le vendeur utilise un SIREN inactif illégalement.'
      );
    } else {
      positivePoints.push('Entreprise en activité normale enregistrée au répertoire national');
    }

    if (companyAgeYears >= 3) {
      trustScore += 15;
      positivePoints.push(`Ancienneté établie (${companyAgeYears} ans d'existence légale)`);
    } else if (companyAgeYears === 0) {
      trustScore -= 15;
      redFlags.push("Entreprise créée très récemment (moins d'un an)");
    }

    const dirigeants = (item.dirigeants || [])
      .map((d: any) => `${d.prenoms || ''} ${d.nom || ''}`.trim())
      .filter(Boolean);

    return new CompanyEntity(
      item.siren,
      item.siege?.siret,
      item.nom_complet || item.nom_raison_sociale,
      item.activite_principale,
      creationDate,
      companyAgeYears,
      isCessée ? 'CESSÉE (Fermée)' : 'ACTIVE',
      isCessée,
      item.siege?.geo_adresse || item.siege?.adresse || 'Non renseignée',
      dirigeants,
      Math.min(100, Math.max(5, trustScore)),
      redFlags,
      positivePoints
    );
  }
}

export const COMPANY_GATEWAY = 'COMPANY_GATEWAY';

export interface ICompanyGateway {
  searchCompanies(query: string): Promise<CompanyEntity[]>;
}
