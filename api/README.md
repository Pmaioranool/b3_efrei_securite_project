# 🏋️ GymFit API - Fitness Workout Manager

Une API REST complète et hautement sécurisée pour la gestion d'exercices de fitness, de programmes d'entraînement (workouts), de routines planifiées et d'utilisateurs. Construite avec **Node.js**, **Express**, **MongoDB** et **PostgreSQL**, cette application met l'accent sur les meilleures pratiques de sécurité modernes avec authentification JWT, protection CSRF, sanitisation XSS, rate limiting et conformité RGPD.

> 🎯 **Projet académique EFREI - Sécurité des Applications**  
> Ce projet démontre l'implémentation de mécanismes de sécurité avancés dans une API RESTful moderne.

---

## 📑 Table des matières

- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Stack Technique](#️-stack-technique)
- [Prérequis](#-prérequis)
- [Installation](#️-installation)
- [Démarrage](#-démarrage)
- [API Endpoints](#-api-endpoints)
- [Modèles de Données](#️-modèles-de-données)
- [Architecture de Sécurité](#-architecture-de-sécurité)
- [Tests](#-tests)
- [Documentation](#-documentation)
- [Structure du Projet](#️-structure-du-projet)

---

## 🚀 Fonctionnalités Principales

### 💪 Gestion des Exercices

- Base de données de **1000+ exercices** avec détails complets
- Recherche et filtrage avancés (titre, partie du corps, équipement, niveau)
- Classification par type, niveau de difficulté et rating
- CRUD complet avec validation des données
- Dataset importable au format CSV (`megaGymDataset.csv`)

### 🎯 Programmes d'Entraînement (Workouts)

- Création de workouts personnalisés avec exercices multiples
- **Système de sets détaillés** pour chaque exercice :
  - `rep` : Nombre de répétitions (obligatoire, min: 1)
  - `rest` : Temps de repos en secondes (obligatoire, défaut: 60s)
  - `weight` : Charge/poids en kg (optionnel, pour suivi personnel)
  - `duration` : Durée en secondes (optionnel, pour exercices chronométrés)
- **Mode Template** : Workouts partageables entre utilisateurs sans données personnelles
- Workouts personnels rattachés à un utilisateur via `userId`
- Population automatique des exercices avec leurs détails complets
- Gestion des workouts par utilisateur : `GET /api/workouts/user/me`

### 📅 Routines Planifiées (CRON)

- Planification automatique des workouts avec **expressions CRON**
- Validation des expressions CRON avec `cron-parser`
- Gestion des fuseaux horaires personnalisables (défaut: `Europe/Paris`)
- Routines récurrentes personnalisables
- Association à des workouts existants via `workoutId`
- Suivi par utilisateur avec routes dédiées

### 👥 Gestion des Utilisateurs

- Système d'authentification complet avec **JWT double token**
- Gestion des rôles : **USER** et **ADMIN**
- Profils utilisateurs avec historique complet
- Suivi de la dernière connexion (`last_login`)
- Compteur de workouts complétés
- Modification sécurisée du mot de passe avec vérification de l'ancien mot de passe
- Route personnelle : `GET /api/users/me` pour l'utilisateur connecté
- Changement de mot de passe : `PUT /api/users/me/password`

### 🔐 Authentification & Sécurité

#### Authentification JWT Double Token

- **Access Token** : Courte durée (15 minutes), pour les requêtes API
- **Refresh Token** : Longue durée (7 jours), pour renouveler l'access token
- **Versioning des refresh tokens** (`refresh_token_version`) pour révocation instantanée
- **Bcrypt avec salt (12 rounds) et pepper** pour le hachage sécurisé des mots de passe
- Extraction du token depuis header `Authorization: Bearer <token>`
- Middleware `authenticateToken` pour protéger les routes

#### Protection CSRF (Cross-Site Request Forgery)

- Génération de tokens CSRF uniques et sécurisés (32 bytes hex)
- Validation obligatoire sur toutes les opérations de modification (POST/PUT/DELETE)
- Tokens expirables (30 minutes)
- Stockage en mémoire avec Map (identifier par IP)
- Header requis : `X-CSRF-Token`
- Endpoint dédié : `GET /api/csrf-token`

#### Protection XSS (Cross-Site Scripting)

- Sanitisation automatique de **tous** les inputs (body, query, params)
- Nettoyage récursif des objets et tableaux
- Configuration stricte : **aucun tag HTML autorisé** (`whiteList: {}`)
- Suppression des tags ignorés et des espaces superflus
- Middleware appliqué globalement sur toutes les routes

#### Rate Limiting

- **Authentication endpoints** (`authLimiter`) : 100 requêtes / 15 minutes
- **API générale** (`apiLimiter`) : 1000 requêtes / 15 minutes
- Messages d'erreur explicites avec délai de retry
- Limitation par adresse IP

#### Protection MongoDB Injection

- Validation stricte des ObjectId MongoDB
- Middleware `validateMongoId` sur toutes les routes MongoDB
- Rejet automatique des identifiants invalides avec erreur 400
- Protection contre les injections NoSQL

#### En-têtes de Sécurité HTTP (Helmet.js)

- **HSTS** : Force HTTPS pendant 1 an avec subdomains et preload
- **Content Security Policy (CSP)** : Politique de contenu stricte
  - `default-src: 'self'`
  - `script-src: 'self' 'unsafe-inline'` (pour Swagger uniquement)
  - `frame-ancestors: 'none'` (clickjacking)
- **X-Frame-Options** : `DENY` - Protection contre le clickjacking
- **X-Content-Type-Options** : `nosniff` - Prévention du MIME sniffing
- **Referrer-Policy** : Contrôle des informations de référence
- **crossOriginResourcePolicy** : `cross-origin`

#### Support HTTPS/TLS

- Configuration SSL/TLS avec certificats personnalisés
- Scripts OpenSSL fournis dans `certs/` pour la génération de certificats
- Mode développement et production
- Activation conditionnelle : `NODE_ENV=PRODUCTION` et `USE_HTTPS=true`
- Redirection automatique HTTP → HTTPS via middleware `forceHTTPS`
- Certificats auto-signés pour le développement

#### Validation des Données

- **express-validator** sur tous les endpoints critiques
- Schémas de validation personnalisés dans `middlewares/validator/` :
  - `auth.validation.js` : Register, login, refresh token
  - `user.validation.js` : Utilisateurs, mot de passe, workouts
  - `routine.validation.js` : Routines, validation CRON
- Validation des types, formats, longueurs
- Messages d'erreur détaillés et localisés en français

### 📋 Conformité RGPD

L'API implémente les droits fondamentaux du RGPD :

#### Article 15 - Droit d'accès

- `GET /api/rgpd/my-data` : Consultation complète des données personnelles
- Retourne : profil utilisateur + workouts + routines
- Authentification requise

#### Article 17 - Droit à l'oubli

- `DELETE /api/rgpd/delete-account` : Suppression définitive et complète
- Confirmation obligatoire dans le body (`confirmation: 'DELETE'`)
- Suppression en cascade de toutes les données associées :
  - Données utilisateur (PostgreSQL)
  - Workouts personnels (MongoDB)
  - Routines (MongoDB)
- Authentification requise

#### Article 20 - Droit à la portabilité

- `GET /api/rgpd/export` : Export JSON structuré de toutes les données
- Format standardisé avec versioning et horodatage
- Téléchargement direct du fichier JSON
- Authentification requise

### 📊 Documentation & Qualité

- **Documentation Swagger/OpenAPI** interactive accessible à `/api-docs`
- **Collection Postman** complète avec exemples et tests automatisés
- **Tests unitaires** avec Jest pour tous les contrôleurs
- **Couverture de code** incluse dans les tests

---

## 🛠️ Stack Technique

### Backend & Framework

- **Node.js** (v14+) avec **Express.js 5.1.0**
- Architecture MVC (Model-View-Controller)
- Middleware pipeline avancé avec chaînage

### Bases de Données

#### MongoDB 8.19.3 (Mongoose ODM)

Collections :

- **Exercises** : Base de données d'exercices
- **Workouts** : Programmes d'entraînement
- **Routines** : Planifications CRON
- **RGPD** : Données d'export temporaires

Fonctionnalités :

- Schémas avec validation intégrée
- Timestamps automatiques (`createdAt`, `updatedAt`)
- Population de références (`.populate()`)
- Indexes pour performances

#### PostgreSQL 8.16.3 (pg driver)

Tables :

- **users** : Utilisateurs et authentification

Fonctionnalités :

- Transactions ACID
- Contraintes UNIQUE sur email et pseudonym
- Indexes sur colonnes fréquemment requêtées
- Support des rôles (USER/ADMIN)

### Sécurité & Authentification

| Bibliothèque         | Version  | Usage                                                |
| -------------------- | -------- | ---------------------------------------------------- |
| `jsonwebtoken`       | ^9.0.2   | Génération et vérification JWT (Access & Refresh)    |
| `bcrypt`             | ^6.0.0   | Hachage sécurisé des mots de passe (salt + pepper)   |
| `helmet`             | ^8.1.0   | En-têtes HTTP sécurisés (HSTS, CSP, X-Frame-Options) |
| `express-rate-limit` | ^8.2.1   | Limitation du taux de requêtes par IP                |
| `xss`                | ^1.0.15  | Sanitisation XSS des inputs utilisateur              |
| `cors`               | ^2.8.5   | Gestion CORS sécurisée                               |
| `crypto` (Node.js)   | Built-in | Génération de tokens CSRF sécurisés (32 bytes)       |
| `express-validator`  | ^7.3.1   | Validation robuste des données entrantes             |

### Utilitaires & Qualité

- **cron-parser** ^5.4.0 : Validation et parsing des expressions CRON
- **Jest** ^30.2.0 : Framework de tests unitaires
- **Nodemon** ^3.1.11 : Hot-reload en développement
- **dotenv** ^17.2.3 : Gestion des variables d'environnement

### Documentation & API

- **Swagger UI Express** ^5.0.1 : Interface documentation interactive
- **Swagger JSDoc** ^6.2.8 : Génération documentation OpenAPI à partir des commentaires JSDoc
- **Postman** : Collection complète avec tests automatisés dans `postman/`

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** ≥ 14.0.0 ([télécharger](https://nodejs.org/))
- **MongoDB** ≥ 4.4 ([installation](https://www.mongodb.com/docs/manual/installation/))
- **PostgreSQL** ≥ 12.0 ([installation](https://www.postgresql.org/download/))
- **npm** ≥ 6.0 ou **yarn** ≥ 1.22
- **(Optionnel)** **OpenSSL** pour générer des certificats SSL personnalisés

### Vérification des installations

```bash
node --version   # v14.0.0 ou supérieur
npm --version    # 6.0.0 ou supérieur
mongo --version  # 4.4.0 ou supérieur
psql --version   # 12.0 ou supérieur
```

---

## ⚙️ Installation

### 1. Cloner le repository

```bash
git clone https://github.com/Pmaioranool/b3_efrei_securite_project.git
cd b3_efrei_securite_project/api
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration du fichier .env

Créer un fichier `.env` à la racine du dossier `api/` :

```env
# ========================================
# SERVER CONFIGURATION
# ========================================
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3001

# ========================================
# DATABASES
# ========================================
# MongoDB
MONGO_URL=mongodb://localhost:27017/gymfit

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_HOST=localhost
POSTGRES_DATABASE=gymfit
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_PORT=5432

# ========================================
# SECURITY - JWT
# ========================================
JWT_ACCESS_SECRET=your_super_secret_jwt_access_key_here_min_32_chars
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_here_min_32_chars
BCRYPT_SALT_ROUNDS=12
BCRYPT_PEPPER=your_optional_pepper_string_here

# ========================================
# SECURITY - GENERAL
# ========================================
DB_INIT_KEY=your_db_init_secret_key_for_database_reset

# ========================================
# HTTPS/TLS (Optional)
# ========================================
USE_HTTPS=false
```

> **⚠️ Sécurité** : Ne JAMAIS commiter le fichier `.env` dans Git. Il est déjà inclus dans `.gitignore`.

### 4. Configuration des bases de données

#### MongoDB

Assurez-vous que MongoDB est en cours d'exécution :

```bash
# Windows
net start MongoDB

# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod
```

L'application se connecte automatiquement à `mongodb://localhost:27017/gymfit`.

#### PostgreSQL

1. **Créer la base de données** :

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE gymfit;
\q
```

2. **Initialiser les tables** avec le script SQL fourni :

```bash
psql -U postgres -d gymfit -f sql/init.sql
```

**OU** utiliser l'endpoint d'initialisation (mode développement uniquement) :

```bash
# 1. Obtenir un token CSRF
curl -X GET http://localhost:3000/api/csrf-token

# 2. Initialiser la base de données
curl -X POST http://localhost:3000/api/users/init-db \
  -H "X-CSRF-Token: <token_from_step_1>" \
  -H "X-DB-Init-Key: your_db_init_key_from_env"
```

> **⚠️ Important** : L'endpoint `/api/users/init-db` n'est accessible qu'en mode `NODE_ENV=development`.

### 5. Configuration HTTPS (Optionnel)

Pour activer HTTPS en développement, générer des certificats SSL :

```bash
cd certs

# Générer une clé privée et un certificat auto-signé (valable 365 jours)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout private-key.pem \
  -out certificate.pem \
  -config openssl.cnf
```

Puis mettre à jour le `.env` :

```env
NODE_ENV=PRODUCTION
USE_HTTPS=true
```

---

## 🚀 Démarrage

### Mode développement (avec hot-reload)

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:3000` avec rechargement automatique.

### Mode production

```bash
npm start
```

### Accès à l'API

- **API** : `http://localhost:3000`
- **Documentation Swagger** : `http://localhost:3000/api-docs`
- **Status** : `http://localhost:3000/api/status`

---

## 📡 API Endpoints

### 🔐 Authentification (`/api/auth`)

| Méthode | Endpoint          | Description                             | Authentification |
| ------- | ----------------- | --------------------------------------- | ---------------- |
| `POST`  | `/register`       | Inscription utilisateur (rôle USER)     | -                |
| `POST`  | `/register/admin` | Inscription admin (rôle ADMIN)          | ADMIN            |
| `POST`  | `/login`          | Connexion et obtention des tokens JWT   | -                |
| `POST`  | `/refresh`        | Rafraîchir l'access token               | Refresh Token    |
| `POST`  | `/logout`         | Déconnexion (invalide le refresh token) | JWT              |

### 👥 Utilisateurs (`/api/users`)

| Méthode  | Endpoint                  | Description                      | Authentification         |
| -------- | ------------------------- | -------------------------------- | ------------------------ |
| `GET`    | `/`                       | Liste tous les utilisateurs      | ADMIN                    |
| `GET`    | `/me`                     | Profil de l'utilisateur connecté | JWT                      |
| `GET`    | `/:id`                    | Utilisateur par ID               | JWT + Owner/ADMIN        |
| `PUT`    | `/me/password`            | Changer son mot de passe         | JWT + CSRF               |
| `PUT`    | `/:id`                    | Modifier un utilisateur          | JWT + Owner/ADMIN + CSRF |
| `PUT`    | `/:id/password`           | Modifier mot de passe            | ADMIN + CSRF             |
| `PUT`    | `/:id/last-login`         | MAJ dernière connexion           | JWT + CSRF               |
| `PUT`    | `/:id/workouts-completed` | Incrémenter compteur workouts    | JWT + CSRF               |
| `DELETE` | `/:id`                    | Supprimer un utilisateur         | ADMIN + CSRF             |

### 💪 Exercices (`/api/exercises`)

| Méthode  | Endpoint | Description                             | Authentification |
| -------- | -------- | --------------------------------------- | ---------------- |
| `GET`    | `/`      | Liste tous les exercices (avec filtres) | -                |
| `GET`    | `/:id`   | Exercice par ID                         | -                |
| `POST`   | `/`      | Créer un exercice                       | ADMIN + CSRF     |
| `PUT`    | `/:id`   | Modifier un exercice                    | ADMIN + CSRF     |
| `DELETE` | `/:id`   | Supprimer un exercice                   | ADMIN + CSRF     |

**Paramètres de filtrage** :

- `title` : Recherche par titre (insensible à la casse)
- `BodyPart` : Filtrer par partie du corps
- `Equipment` : Filtrer par équipement
- `limit` : Nombre de résultats (défaut: 10)
- `skip` : Pagination (offset)
- `all` : Retourner tous les résultats (true/false)

### 🎯 Workouts (`/api/workouts`)

| Méthode  | Endpoint        | Description                        | Authentification   |
| -------- | --------------- | ---------------------------------- | ------------------ |
| `GET`    | `/`             | Liste tous les workouts            | ADMIN              |
| `GET`    | `/templates`    | Liste des templates publics        | -                  |
| `GET`    | `/user/me`      | Workouts de l'utilisateur connecté | JWT                |
| `GET`    | `/user/:userId` | Workouts d'un utilisateur          | JWT + Owner/ADMIN  |
| `GET`    | `/:id`          | Workout par ID                     | JWT + Owner/ADMIN  |
| `POST`   | `/`             | Créer un workout                   | JWT + CSRF         |
| `PUT`    | `/:id`          | Modifier un workout                | JWT + Owner + CSRF |
| `DELETE` | `/:id`          | Supprimer un workout               | JWT + Owner + CSRF |

### 📅 Routines (`/api/routines`)

| Méthode  | Endpoint        | Description               | Authentification   |
| -------- | --------------- | ------------------------- | ------------------ |
| `GET`    | `/`             | Liste toutes les routines | ADMIN              |
| `GET`    | `/:id`          | Routine par ID            | JWT + Owner/ADMIN  |
| `GET`    | `/user/:userId` | Routines d'un utilisateur | JWT + Owner/ADMIN  |
| `POST`   | `/`             | Créer une routine         | JWT + CSRF         |
| `PUT`    | `/:id`          | Modifier une routine      | JWT + Owner + CSRF |
| `DELETE` | `/:id`          | Supprimer une routine     | JWT + Owner + CSRF |

**Format CRON attendu** : Format standard Unix CRON

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday=0)
│ │ │ │ │
* * * * *
```

Exemples :

- `0 8 * * 1,3,5` : Tous les lundis, mercredis et vendredis à 8h00
- `0 18 * * *` : Tous les jours à 18h00

### 📋 RGPD (`/api/rgpd`)

| Méthode  | Endpoint          | Description                  | Authentification |
| -------- | ----------------- | ---------------------------- | ---------------- |
| `GET`    | `/my-data`        | Consulter toutes mes données | JWT              |
| `GET`    | `/export`         | Exporter mes données (JSON)  | JWT              |
| `DELETE` | `/delete-account` | Supprimer mon compte         | JWT + CSRF       |

### 🛠️ Utilitaires (`/api`)

| Méthode | Endpoint      | Description           | Authentification |
| ------- | ------------- | --------------------- | ---------------- |
| `GET`   | `/csrf-token` | Obtenir un token CSRF | -                |
| `GET`   | `/status`     | Status de l'API       | -                |
| `GET`   | `/api-docs`   | Documentation Swagger | -                |

---

## 🗃️ Modèles de Données

### Exercise (MongoDB)

```javascript
{
  Title: String,           // Nom de l'exercice (requis)
  Desc: String,           // Description détaillée (optionnel)
  Type: String,           // Type: Cardio, Strength, Flexibility, etc. (requis)
  BodyPart: String,       // Partie du corps: Chest, Back, Legs, etc. (requis)
  Equipment: String,      // Équipement: Barbell, Dumbbell, None, etc. (requis)
  Level: String,          // Niveau: Beginner, Intermediate, Advanced (requis)
  Rating: Number,         // Note de 0 à 5 (défaut: 0)
  RatingDesc: String,     // Description de la note (optionnel)
  createdAt: Date,        // Date de création (auto)
  updatedAt: Date         // Date de MAJ (auto)
}
```

### Workout (MongoDB)

```javascript
{
  name: String,              // Nom du workout (requis)
  userId: Number,            // ID utilisateur (optionnel si template)
  template: Boolean,         // Template partageable (défaut: false)
  exercises: [{
    exercise: ObjectId,      // Référence Exercise (requis)
    sets: [{
      rest: Number,          // Temps de repos en secondes (requis, défaut: 60)
      rep: Number,           // Nombre de répétitions (requis, min: 1)
      weight: Number,        // Charge en kg (optionnel, min: 0)
      duration: Number       // Durée en secondes (optionnel, min: 0)
    }]
  }],
  createdAt: Date,           // Date de création (auto)
  updatedAt: Date            // Date de MAJ (auto)
}
```

**Contraintes** :

- Au moins 1 set requis par exercice
- Au moins 1 répétition par set
- Weight et duration optionnels mais >= 0 si présents

### Routine (MongoDB)

```javascript
{
  userId: Number,            // ID utilisateur (requis)
  workoutId: ObjectId,       // Référence Workout (requis)
  cron: String,              // Expression CRON (requis, validée)
  timezone: String,          // Fuseau horaire (défaut: "Europe/Paris")
  createdAt: Date,           // Date de création (auto)
  updatedAt: Date            // Date de MAJ (auto)
}
```

**Validation** :

- Expression CRON validée avec `cron-parser`
- Timezone doit être valide (format IANA)

### User (PostgreSQL)

```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    pseudonym VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,                    -- Hash bcrypt
    role VARCHAR(100) NOT NULL DEFAULT 'USER',        -- USER ou ADMIN
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refresh_token_version INTEGER NOT NULL DEFAULT 0, -- Versioning pour révocation
    last_login TIMESTAMP NULL
);
```

**Contraintes** :

- `pseudonym` : UNIQUE, NOT NULL
- `email` : UNIQUE, NOT NULL, format email validé
- `password` : Hash bcrypt (12 rounds + pepper)
- `role` : 'USER' (défaut) ou 'ADMIN'

---

## 🔒 Architecture de Sécurité

### Flux d'authentification JWT

```
1. Login
   ├─> Vérification email/password (bcrypt)
   ├─> Génération Access Token (15 min)
   ├─> Génération Refresh Token (7 jours)
   └─> Retour des tokens

2. Requête API protégée
   ├─> Extraction Access Token (Header Authorization)
   ├─> Vérification signature JWT
   ├─> Vérification expiration
   └─> Ajout req.user (userId, email, role)

3. Refresh Token
   ├─> Vérification Refresh Token
   ├─> Vérification version (refresh_token_version)
   ├─> Génération nouveau Access Token
   └─> Retour Access Token

4. Logout
   ├─> Incrémentation refresh_token_version
   └─> Invalidation de tous les Refresh Tokens existants
```

### Flux de protection CSRF

```
1. Obtention Token
   GET /api/csrf-token
   ├─> Génération token sécurisé (32 bytes)
   ├─> Stockage Map (token -> {identifier, createdAt})
   └─> Retour token

2. Requête modifiante (POST/PUT/DELETE)
   ├─> Extraction token (Header X-CSRF-Token)
   ├─> Vérification existence dans Map
   ├─> Vérification expiration (30 min)
   ├─> Vérification identifier (IP)
   ├─> Suppression token (usage unique)
   └─> Suite du traitement

3. Échec validation
   └─> 403 Forbidden - Token CSRF invalide ou expiré
```

### Pipeline de sécurité middleware

```javascript
// server.js - Ordre d'application des middlewares

app.use(forceHTTPS); // 1. Redirection HTTPS
app.use(cors()); // 2. CORS sécurisé
app.use(helmetConfig); // 3. En-têtes HTTP sécurisés
app.use(apiLimiter); // 4. Rate limiting global
app.use(express.json()); // 5. Parsing JSON
app.use(sanitizeXSS); // 6. Sanitisation XSS

// Routes protégées (exemple)
router.post(
  "/endpoint",
  validateCSRFToken, // 7. Validation CSRF
  authenticateToken, // 8. Authentification JWT
  authorizeRoles("ADMIN"), // 9. Autorisation par rôle
  validateData, // 10. Validation express-validator
  controller.action // 11. Logique métier
);
```

---

## 🧪 Tests

### Exécuter les tests

```bash
# Tous les tests
npm test

# Tests avec surveillance (watch mode)
npm test -- --watch

# Tests avec couverture
npm test -- --coverage
```

### Structure des tests

```
test/
└── unit/
    ├── auth.test.js       # Tests authentification (login, register, refresh)
    ├── user.test.js       # Tests contrôleur User (CRUD, password)
    ├── exercise.test.js   # Tests contrôleur Exercise (filtrage, CRUD)
    ├── workout.test.js    # Tests contrôleur Workout (templates, sets)
    └── routine.test.js    # Tests contrôleur Routine (CRON, validation)
```

### Couverture de code

Les tests couvrent :

- ✅ Contrôleurs (logique métier)
- ✅ Middlewares d'authentification
- ✅ Validation des données
- ✅ Gestion des erreurs
- ✅ Cas limites (edge cases)

---

## 📚 Documentation

### Documentation Swagger

Accessible à l'adresse : **`http://localhost:3000/api-docs`**

La documentation Swagger est générée automatiquement à partir des commentaires JSDoc dans les fichiers de routes et fournit :

- Liste complète des endpoints
- Paramètres requis et optionnels
- Schémas de données (Request/Response)
- Codes de statut HTTP
- Exemples de requêtes
- Interface interactive pour tester l'API

### Collection Postman

Fichier : `postman/GymFit API - Complete Collection.postman_collection.json`

Contient :

- Tous les endpoints avec exemples
- Variables d'environnement pré-configurées
- Tests automatisés pour chaque requête
- Gestion automatique des tokens JWT
- Scripts de pré-requête pour CSRF

**Import** :

1. Ouvrir Postman
2. File > Import
3. Sélectionner le fichier `GymFit API - Complete Collection.postman_collection.json`
4. Configurer les variables d'environnement (`baseUrl`, `accessToken`, etc.)

---

## 🗂️ Structure du Projet

```
api/
├── src/
│   ├── controllers/              # Contrôleurs (logique métier)
│   │   ├── auth.controller.js        # Authentification (login, register, refresh, logout)
│   │   ├── User.controller.js        # Gestion utilisateurs (CRUD, password, profile)
│   │   ├── Exercise.controller.js    # Gestion exercices (filtrage, CRUD)
│   │   ├── Workout.controller.js     # Gestion workouts (templates, sets, user workouts)
│   │   ├── routine.controller.js     # Gestion routines (CRON, validation)
│   │   └── RGPD.controller.js        # Conformité RGPD (export, delete, access)
│   │
│   ├── models/                   # Modèles de données
│   │   ├── User.model.js             # PostgreSQL - Schema utilisateurs
│   │   ├── Exercise.model.js         # MongoDB - Schema exercices
│   │   ├── Workout.model.js          # MongoDB - Schema workouts
│   │   ├── Routine.model.js          # MongoDB - Schema routines CRON
│   │   └── RGPD.model.js             # MongoDB - Exports RGPD temporaires
│   │
│   ├── routes/                   # Routes Express
│   │   ├── auth.routes.js            # /api/auth (login, register, refresh, logout)
│   │   ├── user.routes.js            # /api/users (CRUD utilisateurs)
│   │   ├── exercise.routes.js        # /api/exercises (CRUD exercices)
│   │   ├── workout.routes.js         # /api/workouts (CRUD workouts)
│   │   ├── routine.routes.js         # /api/routines (CRUD routines)
│   │   ├── rgpd.routes.js            # /api/rgpd (conformité RGPD)
│   │   └── utils.routes.js           # /api/ (status, csrf-token)
│   │
│   ├── middlewares/              # Middlewares de sécurité et validation
│   │   ├── auth.middleware.js        # JWT (authenticateToken, authorizeRoles, authorizeOwnResource)
│   │   ├── csrf.middleware.js        # CSRF (generateCSRFToken, validateCSRFToken)
│   │   ├── seurity.middleware.js     # Rate limiting, Helmet, force HTTPS
│   │   ├── xss.middleware.js         # Sanitisation XSS globale
│   │   ├── validation.middleware.js  # Gestion erreurs validation
│   │   ├── mongodb-validation.middleware.js  # Validation ObjectId MongoDB
│   │   └── validator/                # Schémas de validation express-validator
│   │       ├── auth.validation.js        # Validation register, login, refresh
│   │       ├── user.validation.js        # Validation CRUD utilisateurs
│   │       └── routine.validation.js     # Validation CRON, timezone
│   │
│   ├── config/                   # Configuration bases de données
│   │   ├── db.postgres.js            # Connexion PostgreSQL (pool)
│   │   └── db.mongo.js               # Connexion MongoDB (mongoose)
│   │
│   ├── utils/                    # Utilitaires
│   │   └── jwt.js                    # Service JWT centralisé (génération, vérification, bcrypt)
│   │
│   ├── server.js                 # Point d'entrée principal (Express app)
│   └── swagger-setup.js          # Configuration Swagger/OpenAPI
│
├── test/                         # Tests unitaires
│   └── unit/
│       ├── auth.test.js              # Tests authentification
│       ├── user.test.js              # Tests utilisateurs
│       ├── exercise.test.js          # Tests exercices
│       ├── workout.test.js           # Tests workouts
│       └── routine.test.js           # Tests routines
│
├── sql/                          # Scripts SQL PostgreSQL
│   ├── init.sql                      # Initialisation schema + seed data
│   └── reset.sql                     # Reset complet de la base
│
├── certs/                        # Certificats SSL/TLS
│   ├── openssl.cnf                   # Configuration OpenSSL
│   ├── README.md                     # Instructions génération certificats
│   ├── private-key.pem               # Clé privée (gitignored)
│   └── certificate.pem               # Certificat SSL (gitignored)
│
├── postman/                      # Collection Postman
│   └── GymFit API - Complete Collection.postman_collection.json
│
├── megaGymDataset.csv            # Dataset 1000+ exercices
├── package.json                  # Dépendances NPM
├── .env                          # Variables d'environnement (gitignored)
├── .gitignore                    # Fichiers exclus de Git
└── README.md                     # Documentation (ce fichier)
```

---

## 🔧 Scripts NPM

```json
{
  "scripts": {
    "start": "node src/server.js", // Production
    "dev": "nodemon src/server.js", // Développement (hot-reload)
    "test": "jest" // Tests unitaires
  }
}
```

---

## 🤝 Contribution

1. **Fork** le projet
2. Créer une branche feature :
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit les changements :
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. Push sur la branche :
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Ouvrir une **Pull Request** avec une description détaillée

### Guidelines

- Suivre les conventions de code existantes
- Ajouter des tests pour les nouvelles fonctionnalités
- Mettre à jour la documentation (README, Swagger)
- Respecter les principes SOLID

---

## 📝 Licence

Ce projet est sous licence **MIT**. Voir le fichier `LICENSE` pour plus de détails.

---

## 👥 Auteurs

- **EFREI Paris** - Projet académique Sécurité des Applications
- **Repository** : [Pmaioranool/b3_efrei_securite_project](https://github.com/Pmaioranool/b3_efrei_securite_project)

---

## 🆘 Support & Contact

Pour toute question ou problème :

1. **Issues GitHub** : [Ouvrir une issue](https://github.com/Pmaioranool/b3_efrei_securite_project/issues)
2. **Documentation** : Consulter `/api-docs` pour plus de détails sur l'API
3. **Collection Postman** : Tester l'API avec la collection fournie

---

## 🎓 Ressources & Références

### Sécurité

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [RGPD](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)
- [Helmet.js](https://helmetjs.github.io/)

### Documentation

- [Express.js](https://expressjs.com/)
- [Mongoose](https://mongoosejs.com/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Jest](https://jestjs.io/)
- [Swagger/OpenAPI](https://swagger.io/specification/)

---

<div align="center">

**⭐ Si ce projet vous a aidé, n'hésitez pas à lui donner une étoile sur GitHub ! ⭐**

Made with ❤️ by EFREI Students

</div>
