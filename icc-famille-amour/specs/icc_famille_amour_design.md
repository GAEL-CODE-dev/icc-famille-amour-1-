# ICC Famille Amour — Design technique

Version 0.1 · 28 septembre 2026 · Statut : à valider avant de coder

## 1. Contexte et hypothèses

Application web de gestion pour la communauté ICC Famille Amour : membres, caisse, administrateurs, activités/événements, programmes de prière, sauvegarde en 3 couches.

**Stack retenue** : Node.js + Express · PostgreSQL sur Neon · frontend HTML + Tailwind CSS + JavaScript vanilla + icônes Lucide · hébergement en ligne, multi-appareils.

**Hypothèses (à corriger si faux)**
- Seuls les administrateurs se connectent. Les membres n'ont pas de compte (ils sont des fiches gérées par les admins).
- Monnaie unique : FCFA (XAF), stockée en entier (pas de décimales).
- Interface en français, utilisable sur téléphone en priorité (mobile-first).
- Volume modeste (quelques centaines de membres) : pas besoin de microservices, un monolithe Express suffit.
- L'API (Express) est hébergée sur un service type Render/Railway, le frontend statique sur Netlify ou servi par Express.

## 2. Rôles et permissions

| Action | super_admin | tresorier | secretaire |
|---|---|---|---|
| Gérer les administrateurs | ✅ | ❌ | ❌ |
| Membres (CRUD) | ✅ | lecture | ✅ |
| Caisse (saisie, annulation, export) | ✅ | ✅ | lecture seule |
| Activités / événements | ✅ | lecture | ✅ |
| Programmes de prière | ✅ | lecture | ✅ |
| Lancer / restaurer une sauvegarde | ✅ | ❌ | ❌ |
| Consulter le journal d'audit | ✅ | ❌ | ❌ |

Les droits sont vérifiés côté serveur à chaque requête (middleware `requireRole`). Le frontend ne fait que masquer des boutons.

## 3. Critères d'acceptation

**Authentification**
- Un admin se connecte avec email + mot de passe ; 5 échecs consécutifs verrouillent le compte 15 min.
- Une session expire après inactivité ; la déconnexion invalide la session côté serveur.
- Toute route hors `/auth/login` renvoie 401 sans session valide.

**Membres**
- Créer, modifier, rechercher (nom, téléphone) et archiver un membre. Pas de suppression définitive : archivage (`deleted_at`).
- Le téléphone est unique par membre actif. Les champs sont validés côté client et serveur.

**Caisse**
- Enregistrer une cotisation, un don ou une dépense (montant > 0, date, catégorie, membre optionnel).
- Une transaction n'est jamais modifiée ni supprimée : on l'**annule** avec un motif obligatoire (écriture tracée). Le solde exclut les annulées.
- Le solde, le total des entrées/sorties par période et l'historique par membre sont corrects. Export CSV.

**Administrateurs**
- Le super_admin crée, désactive et change le rôle d'un admin. Il ne peut pas se retirer le dernier rôle super_admin.
- Aucun mot de passe ni hash n'apparaît dans les réponses API.

**Activités et prières**
- Créer/modifier/annuler une activité (titre, date, lieu, description) et marquer la présence des membres.
- Créer des programmes de prière (titre, date, heure, responsable, description) avec affichage à venir / passés.

**Sauvegarde**
- Une sauvegarde complète quotidienne et une différentielle plus fréquente s'exécutent automatiquement, chiffrées, avec somme de contrôle.
- Une restauration testée sur une base vide reconstitue les données à l'identique.
- Un échec de sauvegarde est visible dans l'interface admin (`backup_runs`).

## 4. Architecture

```
Navigateur (HTML + Tailwind + JS vanilla + Lucide)
        │  HTTPS, cookie httpOnly + en-tête CSRF
        ▼
Express API  ── routes → validation (zod) → services → repositories (pg)
        │                                              │
        ├── middlewares : helmet, cors strict, rate-limit, auth, rôles, audit
        ▼
PostgreSQL (Neon)  ──►  Jobs de sauvegarde (cron)  ──►  Stockage externe chiffré
```

Arborescence proposée :

```
icc-famille-amour/
├── backend/
│   ├── src/{config,routes,middlewares,services,repositories,validators,jobs,utils}
│   ├── migrations/            # SQL versionné
│   └── .env.example
├── frontend/
│   ├── index.html, login.html
│   ├── pages/                 # membres, caisse, admins, activites, prieres
│   └── js/{api.js,auth.js,ui.js,pages/*}
├── specs/
└── README.md
```

## 5. Modèle de données (PostgreSQL)

- `admins` : id, nom, email (unique), password_hash, role, actif, tentatives_echec, verrouille_jusqua, created_at, updated_at
- `members` : id, nom, prenom, telephone, email, adresse, date_naissance, date_adhesion, statut, notes, created_at, updated_at, deleted_at
- `cash_transactions` : id, type (`cotisation` | `don` | `depense` | `autre`), montant (bigint, CHECK > 0), date_operation, categorie, description, member_id (nullable), created_by, annulee (bool), annulee_par, motif_annulation, created_at
- `activities` : id, titre, type, description, lieu, date_debut, date_fin, statut, created_by, created_at, updated_at, deleted_at
- `activity_attendance` : activity_id, member_id, present (PK composite)
- `prayer_programs` : id, titre, description, date_prog, heure, lieu_ou_mode, responsable_member_id, recurrence, created_by, created_at, updated_at, deleted_at
- `audit_log` : id, admin_id, action, entite, entite_id, ip, details (jsonb), created_at
- `sessions` : id, admin_id, expire_le, revoquee (si sessions serveur)
- `backup_runs` : id, type (`full` | `diff` | `sync`), statut, taille, checksum, debut, fin, message

Toutes les tables modifiables portent `updated_at` (trigger) : c'est ce qui permet la sauvegarde différentielle. Index sur `members(nom, prenom)`, `cash_transactions(date_operation)`, `activities(date_debut)`.

## 6. API REST (préfixe `/api/v1`)

- `POST /auth/login` · `POST /auth/logout` · `GET /auth/me`
- `/members` : GET (liste, recherche, pagination), POST, GET/:id, PUT/:id, DELETE/:id (archivage)
- `/cash/transactions` : GET (filtres période/type/membre), POST, POST/:id/annuler · `GET /cash/summary` · `GET /cash/export.csv`
- `/admins` : GET, POST, PUT/:id (rôle, actif), POST/:id/reset-password (super_admin)
- `/activities` : CRUD + `PUT /:id/attendance`
- `/prayers` : CRUD
- `/backups` : GET (historique), POST (lancement manuel), restauration par procédure documentée (pas d'endpoint public)
- `/audit` : GET (super_admin)

Format d'erreur unique : `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }`. Aucune trace de pile ni détail SQL en production.

## 7. Sécurité (checkpoint avant code)

**Authentification**
- Mots de passe hachés avec argon2id (ou bcrypt coût ≥ 12), politique minimale de longueur (≥ 10 caractères).
- Session via cookie `httpOnly`, `Secure`, `SameSite=Strict` (JWT court + refresh, ou session en base). Aucun jeton dans `localStorage`.
- Verrouillage après échecs répétés, message de login générique (pas d'énumération d'emails).

**Autorisation**
- `requireAuth` puis `requireRole` sur chaque route. Contrôle côté serveur uniquement.

**Validation et injection**
- Validation zod de chaque entrée côté serveur (doublée côté client pour l'UX).
- Requêtes SQL **paramétrées** exclusivement (`$1, $2…`), jamais de concaténation.

**XSS / sortie**
- Le frontend insère les données avec `textContent`, jamais `innerHTML` sur des données utilisateur.
- En-têtes via `helmet` + CSP stricte (Tailwind et Lucide chargés depuis une origine autorisée ou compilés en local, de préférence avec versions épinglées).

**CSRF / CORS / abus**
- CORS limité à l'origine du frontend ; en-tête personnalisé exigé sur les requêtes modifiantes.
- Rate limiting global et plus strict sur `/auth/login`.

**Données**
- Réponses via schémas explicites (jamais `SELECT *` renvoyé tel quel). Aucun secret dans le code : `.env` hors dépôt, `.env.example` fourni.
- Connexion Neon en SSL, utilisateur BD à droits limités pour l'application.
- Journal d'audit sur : connexions (réussies/échouées), toute écriture caisse, gestion des admins, sauvegardes/restaurations.
- Données personnelles des membres : accès limité aux rôles nécessaires, export tracé.

## 8. Stratégie de sauvegarde 3 couches (adaptée à PostgreSQL)

1. **Complète (full)** : `pg_dump` format custom, quotidien, compressé et chiffré, envoyé vers un stockage **hors Neon**. Rétention : 30 jours.
2. **Différentielle (diff)** : PostgreSQL n'a pas de dump différentiel natif ; on exporte les lignes dont `updated_at` (ou `created_at`) est postérieur à la dernière sauvegarde complète, en NDJSON chiffré, toutes les 6 h. La suppression logique (`deleted_at`) garantit que les suppressions apparaissent dans le diff. Restauration = full + diff le plus récent.
3. **Synchronisation (sync)** : réplication périodique vers une base secondaire.
   > ⚠️ Le cahier des charges initial parle de « sync MySQL ». Le principal étant maintenant PostgreSQL, la cible de la couche 3 est à trancher : (a) un second PostgreSQL indépendant (recommandé, schéma identique) ou (b) un MySQL (nécessite une conversion de schéma et de types).

En complément, Neon offre la restauration à un instant donné et les branches : utile comme filet de sécurité, mais **ne remplace pas** une copie hors fournisseur.

Chaque exécution écrit une ligne dans `backup_runs` avec taille et checksum ; une restauration d'essai mensuelle est prévue.

## 9. Plan par phases (validation à chaque jalon)

| Phase | Contenu | Livrable vérifiable |
|---|---|---|
| P0 | Squelette backend/frontend, connexion Neon, migrations, config, helmet/CORS/rate-limit | `GET /health` OK, migration appliquée |
| P1 | Auth + gestion des admins + rôles + audit | Connexion/déconnexion, verrouillage, tests de rôles |
| P2 | Membres | CRUD + recherche + archivage |
| P3 | Caisse | Transactions, annulation tracée, solde, export CSV |
| P4 | Activités + présences + programmes de prière | CRUD + pages |
| P5 | Sauvegarde 3 couches | Full + diff + sync + restauration testée |
| P6 | Durcissement, tests, déploiement | Checklist sécurité passée, app en ligne |

## 10. Questions ouvertes

1. Cible de la couche 3 : second PostgreSQL ou MySQL ?
2. Stockage externe des sauvegardes (Google Drive, Backblaze B2, S3…) ?
3. Champs exacts de la fiche membre (famille, quartier, baptême, département…) ?
4. Catégories de cotisations/dépenses à prévoir ?
5. Faut-il des rappels (SMS/WhatsApp) pour les événements et prières, ou hors périmètre pour l'instant ?
