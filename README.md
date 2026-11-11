# Gestion Hôpital – Starter

Next.js 15 (App Router) · Prisma · PostgreSQL · Auth.js (NextAuth v5) · Tailwind v4 · shadcn/ui

## Setup
```bash
npm install
cp .env.example .env            # set DATABASE_URL, then: npx auth secret
npm run db:migrate
npm run db:seed
npm run dev
```
`package.json`, `tsconfig.json`, `next.config.ts` and `postcss.config.mjs` are included, so there is no need for create-next-app.
Optional: `npx shadcn@latest init` for the full shadcn/ui library.

Seed logins (password `ChangeMe123!`, change immediately): 
admin@hopital.mg, doctor@hopital.mg, nurse@hopital.mg, reception@hopital.mg

## Folder structure
```
app/
  (auth)/login/            login page + client form
  (dashboard)/             authenticated shell (layout = sidebar + header)
    page.tsx               KPI dashboard (Server Component, direct Prisma queries)
    patients/new/          page + form (useActionState -> Server Action)
    patients/              [next] list, [id] detail, discharge
    staff/                 [next] ADMIN only
  api/auth/[...nextauth]/  Auth.js route handlers
  forbidden/               RBAC denial page
components/
  ui/                      shadcn primitives
  dashboard/               stat-card, etc.
lib/
  actions/                 Server Actions (auth.ts, patient.ts)
  validations/             Zod schemas shared by form + action
  rbac.ts                  role -> route rules + nav (edge-safe)
  auth-guard.ts            requireRole() for Server Actions
  prisma.ts                singleton client
prisma/                    schema.prisma, seed.ts
auth.config.ts             edge-safe config (callbacks, authorized)
auth.ts                    Credentials provider + bcrypt (Node only)
middleware.ts              route protection + RBAC
```

## Key design decisions
- **Split auth config**: `auth.config.ts` has no Prisma/bcrypt so middleware can run on the Edge.
- **Two RBAC layers**: middleware blocks pages; `requireRole()` protects every Server Action (actions are public POST endpoints).
- **No double booking**: `Patient.litId @unique` + atomic `updateMany({status: AVAILABLE})` inside a transaction.
- **Occupancy rate** = occupied / (total - maintenance beds).

## Implementation plan
1. Foundations (this starter): schema, auth, RBAC, dashboard, admission form.
2. Patients: list with search/pagination, detail page, edit, **discharge** (set `DISCHARGED`, `litId = null`, bed -> `AVAILABLE` in one transaction).
3. Rooms & beds: CRUD, maintenance toggle, bed transfer between rooms.
4. Staff management (ADMIN): create users, reset password, deactivate.
5. Clinical: consultations/appointments, prescriptions (DOCTOR), care notes (NURSE).
6. Hardening: audit log table, rate-limit login, Vitest + Playwright, CI, Docker, backups.

## Paramètres & services
- **Paramètres** (`/parametres`, tous les rôles) : choix du thème *Maitso sy Fotsy* (défaut) ou *Manga sy Fotsy*. Stocké dans le cookie `theme`, appliqué via `data-theme` sur `<html>` ; le thème bleu redéfinit la palette emerald/teal dans `globals.css`.
- **Service** (table `services`) : une chambre STANDARD appartient à un service ; les chambres VIP et ICU n'en ont pas (`serviceId` NULL, imposé par un CHECK SQL dans la migration `20261111000000_add_services`).
- Le seed crée 6 services (Pédiatrie, Cardiologie, Chirurgie, Maternité, Médecine interne, Urgences) et répartit les chambres 101–110 entre eux.

## Dates de séjour, pagination, filtres, profil
- **Patient** : `admittedAt` (date d'entrée) et `dischargedAt` (date de sortie), colonnes `DATE` nullables (migration `20261111120000_patient_dates`, avec reprise des données existantes et un CHECK `sortie >= entrée`). Formulaire : lit attribué → date d'entrée (vide = aujourd'hui) ; statut « Sorti » → entrée (obligatoire) + sortie (vide = aujourd'hui). « Aujourd'hui » suit le fuseau `APP_TIMEZONE` (défaut `Indian/Antananarivo`).
- **Pagination** : 10 lignes par page (`PAGE_SIZE` dans `lib/pagination.ts`), paramètre `?page=`, page bornée automatiquement.
- **Filtres** (dans l'URL, donc partageables) : Patients `?q=` (nom/prénom) et `?lit=` (n° de lit ou de chambre) ; Personnel `?q=` (nom) et `?role=`.
- **Profil** (`/profil`, tous les rôles) : lien dans le bloc utilisateur de la sidebar. Modifie nom, email et mot de passe (ancien mot de passe exigé). Rôle et département restent réservés à l'ADMIN.

## Création de chambres / lits
- `/chambres/new` (bouton « Nouvelle chambre ») et `/lits/new` (bouton « Nouveau lit ») : réservés à l'ADMIN (middleware + `requireRole` dans `createChambre` / `createLit`).
- Chambre : n°, étage, type, service (obligatoire pour STANDARD, interdit pour VIP/ICU) et nombre de lits créés automatiquement (`111-1`, `111-2`…).
- Lit : un nouveau lit ne peut pas être « Occupé ».
- Libérer un lit occupé (édition du lit) renseigne maintenant aussi `dischargedAt` du patient.

## Services & pagination des lits
- Menu **Services** (Infrastructure, au-dessus de Chambres) : `/services` liste les services (nombre de chambres et de lits) ; bouton « Nouveau service » (`/services/new`, ADMIN).
- Lits : pagination de 10 par page ; les compteurs du haut (libres / occupés / maintenance) portent sur tous les lits.

## Performance
- **Chargement progressif** : `loading.tsx` (dashboard, chambres, services) + `<Suspense>` dans Patients / Personnel / Lits / Tableau de bord. Le titre, les filtres et la sidebar s'affichent tout de suite ; le tableau est remplacé par un squelette pendant la requête (y compris à chaque changement de filtre ou de page, grâce à `key`).
- **Filtres sans rechargement complet** : `FilterBar` utilise `next/form` (navigation côté client).
- **Moins de requêtes** : tableau de bord 8 → 4 (+1 pour les derniers patients) grâce à `groupBy` ; page + total chargés en parallèle (`fetchPage`) ; compteurs des lits via `groupBy`.
- **Moins de données** : `select` à la place de `include` (plus de dossiers patients complets, et plus jamais le hash du mot de passe dans les listes du personnel).
- Pour mesurer la vitesse réelle, utiliser `npm run build && npm start` : `next dev` recompile chaque page à la première visite et paraît beaucoup plus lent.
"# wgestion_hopital" 
