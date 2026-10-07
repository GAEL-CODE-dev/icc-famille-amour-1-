# ICC Famille Amour

Application de gestion pour la communauté ICC Famille Amour.

Stack : Node.js/Express · PostgreSQL (Neon) · HTML/Tailwind CSS/JS vanilla · icônes Lucide.

## Démarrage — backend

```bash
cd backend
cp .env.example .env   # puis remplir DATABASE_URL (Neon), JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
npm install
npm run migrate        # applique migrations/001_init.sql
node src/seedSuperAdmin.js "Votre Nom" admin@iccfamilleamour.org "MotDePasseSolide123!"
npm run dev             # démarre sur http://localhost:4000
```

## Démarrage — frontend

Le frontend est statique (pas de build). Servez le dossier `frontend/` avec n'importe quel serveur statique, par exemple :

```bash
cd frontend
npx serve . -l 4173
```

Ouvrir `http://localhost:4173` pour le formulaire d'enregistrement. L'espace admin est accessible via le bouton de la barre de navigation.
Par défaut, l'API est attendue sur `http://localhost:4000/api/v1` (modifiable via `window.ICC_API_BASE` avant le chargement de `js/api.js`).
En développement, le backend accepte les origines locales `4173` et `5173`. En production, définir `FRONTEND_ORIGINS` avec l'origine exacte du frontend.

## Déploiement sur Render

Le Blueprint `render.yaml` prépare deux services : une API Node.js et un site statique. Il conserve la base Neon existante et ne crée pas de nouvelle base.

1. Pousser le projet vers un dépôt GitHub et le connecter à Render via **New > Blueprint**.
2. Au premier provisionnement, renseigner `DATABASE_URL` avec la nouvelle URL Neon et `FRONTEND_ORIGINS` avec une origine provisoire comme `https://icc-famille-amour-site.onrender.com`. Render génère séparément les deux secrets JWT.
3. Attendre le déploiement de l’API et du site, puis copier l’URL exacte attribuée au site statique.
4. Dans les variables d’environnement du service API, remplacer `FRONTEND_ORIGINS` par cette origine exacte, sans chemin final, puis redéployer l’API.
5. Vérifier `https://<url-api>/health`, ouvrir le site publié, puis tester une inscription publique et une connexion administrateur.

Le build statique injecte l’URL HTTPS de l’API à partir de `RENDER_EXTERNAL_URL`. L’offre gratuite n’ayant pas de commande pré-déploiement, `npm run migrate` est exécuté au démarrage de l’API avant son écoute ; le registre `schema_migrations` évite de réappliquer les fichiers déjà exécutés. L’API gratuite peut s’endormir après une période sans trafic et être lente à sa première requête.

Avant publication, faire tourner le mot de passe Neon : une ancienne chaîne de connexion avec identifiants a été présente dans `.env.example` et a été remplacée par un placeholder. Ne jamais pousser `backend/.env`; les variables du vrai environnement doivent rester dans le gestionnaire de secrets Render.

Le démarrage effectif du déploiement demande encore l’accès au dépôt GitHub et la saisie de l’URL Neon renouvelée dans Render. Ces valeurs ne doivent pas être envoyées dans le chat.

## État du projet

- ✅ Phase 0 — squelette backend/frontend, connexion Neon, migration initiale
- ✅ Phase 1 (partiel) — authentification admin (login/logout/me), verrouillage après échecs, audit des connexions
- ✅ Phase 1 (suite) — gestion des administrateurs (liste, création, rôle, activation/désactivation, protection du dernier super_admin), page `pages/administrateurs.html`
- ⏳ Phase 2 — Membres
- ⏳ Phase 3 — Caisse
- ⏳ Phase 4 — Activités + présences + programmes de prière
- ⏳ Phase 5 — Sauvegarde 3 couches
- ⏳ Phase 6 — Durcissement, tests, déploiement

Voir `specs/icc_famille_amour_design.md` pour le design technique complet.
