# GymTracker Frontend

Frontend React + TypeScript (Vite) pour GymFit, avec authentification JWT, rafraîchissement automatique, protection CSRF, et routes protégées.

## 🚀 Fonctionnalités

- Authentification complète (login, register, logout) avec refresh token.
- CSRF automatique sur les requêtes d'écriture (headers gérés par `apiService`).
- Routes protégées via `ProtectedRoute` + redirection vers login.
- Gestion des entraînements, routines, stats de progression.
- UI responsive (BottomNav, Layout) adaptée mobile/desktop.

## 📋 Prérequis

- Node.js 18+ (recommandé) et npm.
- Backend GymFit en cours d'exécution (par défaut `http://localhost:3000`).

## ⚙️ Installation & lancement

```bash
cd gymtracker-frontend
npm install
cp .env.example .env   # ou créer .env avec les valeurs ci-dessous
npm run dev
```

- Application : http://localhost:3001

### Variables d'environnement (.env)

```
PORT=3001
VITE_API_URL=http://localhost:3000   # URL de l'API GymFit
VITE_GEMINI_API_KEY=                 # optionnel, laisser vide si non utilisé
```

## 🛠️ Scripts

- `npm run dev` : démarrage développement (Vite).
- `npm run build` : build production.
- `npm run preview` : prévisualiser le build.

## 🗂️ Structure principale

```

├── components/          # Layout, navigation, protections de route
├── context/             # AppContext (état global, user, tokens)
├── screens/             # Pages (Login, Dashboard, Profile, etc.)
├── services/            # apiService (JWT+CSRF), authService, csrfService
├── tests/               # Tests (à compléter si besoin)
├── App.tsx / index.tsx  # Entrée React
└── vite.config.ts       # Config Vite/React
```

## 🔐 Sécurité (front)

- **CSRF** : token récupéré et envoyé automatiquement par `csrfService`/`apiService` pour POST/PUT/PATCH/DELETE.
- **JWT** : access/refresh gérés par `authService`, stockage mémoire, rafraîchissement transparent.
- **Routes protégées** : `ProtectedRoute` vérifie l'auth, redirige vers `/login`.
- **HTTPS en production** recommandé pour sécuriser les tokens.

Docs détaillées : [AUTH_README.md](./AUTH_README.md), [CSRF_README.md](./CSRF_README.md), [CSRF_QUICKSTART.md](./CSRF_QUICKSTART.md).

## 🤝 Dépannage rapide

- Assurez-vous que l'API tourne sur `VITE_API_URL` (CORS autorisé côté API).
- Erreur CSRF ? Rafraîchir la page pour régénérer le token et vérifier l'API `/api/csrf-token`.
- Port occupé ? Changer `PORT` dans `.env` et relancer `npm run dev`.

## 📝 Licence

Projet académique EFREI (voir licence du monorepo).

- Routes protégées avec redirection automatique
