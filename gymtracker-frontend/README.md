# GymTracker Frontend

Application React + TypeScript pour le suivi d'entraînements avec authentification sécurisée et protection CSRF.

## 🚀 Fonctionnalités

- ✅ **Authentification complète** (connexion, inscription, déconnexion)
- 🔐 **Protection CSRF automatique** sur tous les formulaires
- 🔄 **Refresh automatique des tokens** (JWT + CSRF)
- 📱 **Interface responsive** et moderne
- 🏋️ **Gestion des entraînements** et routines
- 📊 **Statistiques** et suivi des progrès

## 🔧 Installation

### Prérequis

- Node.js (v16+)
- API Backend démarrée sur `https://localhost:3000`

### Étapes

1. **Installer les dépendances**

   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement**

   Créez un fichier `.env` à la racine du projet :

   ```env
   PORT=3001
   VITE_API_URL=https://localhost:3000
   VITE_GEMINI_API_KEY=votre_clé_api
   ```

3. **Démarrer l'application**

   ```bash
   npm run dev
   ```

4. **Accéder à l'application**

   Ouvrez votre navigateur : `http://localhost:3001`

## 🔐 Sécurité

### Protection CSRF

Tous les formulaires sont automatiquement protégés contre les attaques CSRF :

- ✅ Tokens CSRF automatiques sur POST/PUT/PATCH/DELETE
- ✅ Refresh automatique des tokens expirés
- ✅ Retry transparent en cas d'erreur

**Voir** : [CSRF_QUICKSTART.md](./CSRF_QUICKSTART.md) pour plus d'informations.

### Authentification

- JWT avec access/refresh tokens
- Routes protégées avec redirection automatique
- Déconnexion sécurisée

**Voir** : [AUTH_README.md](./AUTH_README.md) pour la documentation complète.

## 📚 Documentation

- **[AUTH_README.md](./AUTH_README.md)** - Authentification et sécurité
- **[CSRF_README.md](./CSRF_README.md)** - Protection CSRF en détail
- **[CSRF_QUICKSTART.md](./CSRF_QUICKSTART.md)** - Guide rapide CSRF

## 🏗️ Structure du projet

```
gymtracker-frontend/
├── components/          # Composants réutilisables
│   ├── BottomNav.tsx
│   ├── Layout.tsx
│   └── ProtectedRoute.tsx
├── context/            # Context API pour état global
│   └── AppContext.tsx
├── screens/            # Pages de l'application
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Profile.tsx
│   └── ...
├── services/           # Services pour API et auth
│   ├── apiService.ts      # Client API avec auto-CSRF
│   ├── authService.ts     # Authentification
│   └── csrfService.ts     # Gestion tokens CSRF
└── tests/              # Tests unitaires
```

## 🧪 Tests

```bash
# Lancer les tests
npm test

# Tests avec coverage
npm run test:coverage
```

## 🛠️ Développement

### Scripts disponibles

```bash
npm run dev          # Démarrage en mode développement
npm run build        # Build pour production
npm run preview      # Prévisualiser le build
npm run test         # Lancer les tests
npm run lint         # Vérifier le code
```

### Services

#### API Service

```typescript
import apiService from "./services/apiService";

// Toutes les requêtes incluent automatiquement :
// - Le token JWT (Authorization header)
// - Le token CSRF (X-CSRF-Token header) pour POST/PUT/PATCH/DELETE

const workouts = await apiService.get("/api/workouts");
const newWorkout = await apiService.post("/api/workouts", data);
```

#### Auth Service

```typescript
import authService from "./services/authService";

await authService.login({ email, password });
await authService.register({ pseudonym, email, password });
await authService.logout();
```

## 🔒 Bonnes pratiques de sécurité

1. ✅ **HTTPS en production** : Obligatoire pour la sécurité des tokens
2. ✅ **Variables d'environnement** : Ne jamais commiter de secrets
3. ✅ **CSRF activé** : Protection automatique sur tous les formulaires
4. ✅ **Routes protégées** : Authentification requise
5. ✅ **Validation côté serveur** : Ne jamais faire confiance au client

## 📝 Licence

Ce projet fait partie du projet de sécurité B3 EFREI.

---

**Pour toute question sur l'authentification ou la sécurité** : Consultez [AUTH_README.md](./AUTH_README.md) et [CSRF_README.md](./CSRF_README.md)
