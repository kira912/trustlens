# 🛡️ TrustLens — PWA Anti-Arnaque & Vérification Marketplace

**TrustLens** est une application web progressive (PWA) conçue pour redonner confiance aux acheteurs sur les plateformes de commerce en ligne et de seconde main (Leboncoin, Vinted, Facebook Marketplace, Amazon, boutiques Shopify indépendantes).

---

## 🚀 Fonctionnalités Clés du MVP

1. **Scanner d'URL & Détection de Phishing**
   - Analyse d'adresses d'annonces ou de boutiques e-commerce.
   - Détection des noms de domaine usurpés (typosquattage ciblant Vinted, Leboncoin, DHL, Mondial Relay...).
   - Interrogation RDAP / WHOIS en direct : calcul de l'ancienneté du domaine (les domaines de moins de 30 jours représentent plus de 90% des escroqueries éphémères).
   - Inspection du chiffrement SSL/HTTPS, détection des boutiques Shopify en dropshipping et des bannières d'urgence artificielles.

2. **Scanner de Messages & Détecteur de Scripts NLP**
   - Détection automatique des scripts d'escroquerie notoires :
     - Arnaque au faux coursier / transporteur DHL / FedEx / GLS.
     - Demande de paiement par coupons ou recharges intraçables (PCS Mastercard, Transcash, Neosurf).
     - Piège PayPal "Entre proches / amis" désactivant la Protection des Achats.
     - Incitation à quitter la messagerie officielle vers WhatsApp, SMS ou email direct.
     - Faux prétextes d'urgence ou d'absence géographique.

3. **Simulateur Interactif "Scam-O-Meter"**
   - Diagnostic guidé en 6 questions (marketplace, moyen de paiement, canal d'échange, mode de remise, décote du prix, réputation du vendeur).
   - Calcul en temps réel d'un **TrustScore (0 à 100)** avec identification des drapeaux rouges éliminatoires, points d'attention et garanties conformes.

4. **Vérification SIRET / SIREN Officielle (API Gouv & Insee)**
   - Interrogation sans clé de l'API officielle française `recherche-entreprises.api.gouv.fr`.
   - Affichage immédiat du statut juridique : **ACTIVE** vs **CESSÉE / RADIÉE** (signal d'escroquerie critique).
   - Extraction de la date de création, du siège social, du code NAF et des dirigeants officiels.

5. **ScamWatch — Base Communautaire de Vigilance**
   - Moteur de recherche d'éléments signalés par la communauté (numéros de portable 07/06, IBANs fraudeurs, faux sites, emails, pseudos).
   - Formulaire d'ajout de signalement avec persistance locale et sur le serveur.
   - Système de vote d'utilité ("Upvote").

6. **Guides Pratiques & Checklist Anti-Arnaque**
   - Fiches détaillées sur les 5 techniques d'escroqueries les plus dévastatrices.
   - Procédures de recours d'urgence (Procédure de rétrofacturation Chargeback, plainte THÉSÉE / PERCEVAL, signalement PHAROS).
   - Checklist en 5 points indispensables avant tout achat.

7. **PWA (Progressive Web App) Native**
   - Fichier de manifeste `manifest.webmanifest` avec icônes haute résolution.
   - Service Worker `sw.js` assurant la mise en cache et le fonctionnement hors-ligne.
   - Bouton d'installation intégré sur mobile (Android Chrome, iOS Safari) et desktop.

---

## 🗄️ Base de Données Intégrée (SQLite Native)

TrustLens intègre une base de données **SQLite native (WAL Mode)** assurant la persistance et des performances instantanées :
- **Table `scam_reports`** : Fichage communautaire des numéros de téléphone (06/07), faux sites, emails, IBANs frauduleux et pseudos.
- **Table `scan_history`** : Journalisation et historique des vérifications réalisées en direct.
- **Table `domain_cache`** : Mise en cache 24h des interrogations RDAP/WHOIS pour des réponses en 2 ms.
- **Indexation SQL & Normalisation Téléphonique** : Recherche intelligente gérant les indicatifs français (+33 / 0).

## 🛠️ Stack Technique

- **Frontend** : React 18, TypeScript, Tailwind CSS, Lucide React, Vite.
- **Backend API & Proxy** : Node.js Express.
- **APIs Externes Intégrées** :
  - *API Recherche Entreprises (Gouv.fr)* : vérification légale des entreprises françaises.
  - *RDAP ICANN* : vérification de l'ancienneté et du registrar des noms de domaine.

---

## 💻 Démarrage & Exécution

### 1. Démarrer le serveur complet (Frontend PWA + API)
```bash
node server/index.js
```
L'application est disponible sur : `http://localhost:3001`

### 2. Mode Développement avec rechargement à chaud (Hot Reload)
```bash
bun run dev:all
# ou npm run dev:all
```
