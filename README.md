# b3_efrei_securite_project

Monorepo comprenant l'API sécurisée GymFit et le frontend React GymTracker.

## 📦 Contenu

- [api/README.md](api/README.md) : API Node.js/Express (MongoDB + PostgreSQL), JWT, CSRF, XSS, rate limiting, Swagger.
- [gymtracker-frontend/README.md](gymtracker-frontend/README.md) : Frontend React + TypeScript, CSRF automatique, routes protégées.

## 🚀 Démarrage rapide

### Backend (API)

```bash
cd api
npm install
# créer .env (voir api/README.md pour le détail)
npm run dev
```

- Swagger : http://localhost:3000/api-docs
- Status : http://localhost:3000/api/status

Variables .env minimales :

- PORT=3000, NODE_ENV=development
- MONGO_URL=mongodb://localhost:27017/gymfit
- POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_HOST/POSTGRES_DATABASE/POSTGRES_PORT
- JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, BCRYPT_SALT_ROUNDS=12
- DB_INIT_KEY (pour l'init DB côté API)

#### Option Docker (stack complète + jeux de données)

```bash
cd api
docker compose down -v        # réinitialise volumes + réimporte les données
docker compose up --build
```

- API : http://localhost:3000
- Mongo : localhost:27017 (2918 exercices importés du CSV)
- Postgres : localhost:5432 (table users + admin seed)
- La santé Postgres est vérifiée avant le démarrage de l'API (healthcheck).

### Frontend (GymTracker)

```bash
cd gymtracker-frontend
npm install
cp .env.example .env   # ou créer .env avec les clés ci-dessous
npm run dev
```

- App : http://localhost:3001

Variables .env (frontend) :

- PORT=3001
- VITE_API_URL=http://localhost:3000
- VITE_GEMINI_API_KEY=<optionnel>

## 📚 Documentation

- API détaillée : [api/README.md](api/README.md)
- Frontend : [gymtracker-frontend/README.md](gymtracker-frontend/README.md)

## 🧪 Tests

- API : `cd api && npm test`
- Frontend : `cd gymtracker-frontend && npm test`

## 🛠️ Scripts utiles

- API : `npm run dev`, `npm start`, `npm test`
- Frontend : `npm run dev`, `npm run build`, `npm run preview`

## 📄 Licence

Projet académique EFREI - voir licences dans chaque sous-projet.
