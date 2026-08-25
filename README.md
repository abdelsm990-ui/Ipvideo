# Ipvideo — Plateforme de Génération Vidéo par IA

Application fullstack avec **génération vidéo IA réelle** via l'API Replicate, authentification JWT, paiement **PayPal**, et base de données **Supabase (PostgreSQL)**.

---

## 🏗 Architecture

```
Ipvideo/
├── client/              # Frontend HTML/CSS/JS (statique)
├── server/              # Backend Node.js 20 + Express + TypeScript
│   ├── src/
│   │   ├── config/       # Supabase client
│   │   ├── controllers/  # Auth, Video, Payment (PayPal)
│   │   ├── middleware/   # JWT auth
│   │   ├── routes/       # API routes
│   │   ├── services/     # Replicate AI + PayPal + DB (Supabase)
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # JWT helpers
│   ├── Dockerfile
│   ├── package.json
│   └── supabase-schema.sql  # Schema SQL à exécuter dans Supabase
├── docker-compose.yml
├── nginx.conf
└── README.md
```

---

## 🚀 Stack Technique

| Couche | Technologie |
|--------|-------------|
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Backend | Node.js 20, Express, TypeScript |
| Base de données | **Supabase** (PostgreSQL) |
| Auth | JWT + bcryptjs |
| Paiement | **PayPal** (Checkout + Subscriptions) |
| IA Vidéo | Replicate API (Luma Dream Machine, Stable Video Diffusion) |
| Déploiement | Docker + Docker Compose + Nginx |

---

## 📋 Prérequis

- [Node.js](https://nodejs.org/) ≥ 18
- [Docker & Docker Compose](https://docs.docker.com/get-docker/)
- Compte [Supabase](https://supabase.com/) (créer un projet gratuit)
- Compte [PayPal Developer](https://developer.paypal.com/) (mode sandbox pour test)
- Compte [Replicate](https://replicate.com/) (obtenir un token API)

---

## ⚡ Démarrage Rapide (Docker)

```bash
# 1. Naviguer dans le projet
cd Ipvideo

# 2. Configurer les variables d'environnement
copy server\.env.example server\.env
# Éditer server\.env avec vos vraies clés

# 3. Créer les tables dans Supabase
# Allez dans l'éditeur SQL de votre projet Supabase
# Copiez et exécutez le contenu de server/supabase-schema.sql

# 4. Lancer (API + Nginx)
docker-compose up --build

# 5. Ouvrir http://localhost
```

---

## 🛠 Démarrage Développement (sans Docker)

### 1. Backend
```bash
cd server
cp .env.example .env
# Éditer .env avec vos clés

npm install
npm run dev        # API sur http://localhost:5000
```

### 2. Frontend
Le frontend est statique. Ouvrez `client/index.html` avec **Live Server** (VS Code) ou servez via Nginx.

### 3. Base de données (Supabase)
1. Créez un projet sur [supabase.com](https://supabase.com/)
2. Dans l'éditeur SQL, exécutez `server/supabase-schema.sql`
3. Copiez l'URL et la **Service Role Key** (Project Settings → API) dans `.env`

---

## 🔑 Configuration des Clés API

### Supabase (Base de données)
1. Créer un projet sur [supabase.com](https://supabase.com/)
2. Project Settings → API → copier `URL` dans `SUPABASE_URL`
3. Copier `service_role key` (NE PAS utiliser la anon/public key côté serveur) dans `SUPABASE_SERVICE_ROLE_KEY`
4. Exécuter `server/supabase-schema.sql` dans l'éditeur SQL

### PayPal (Paiement)
1. Créer un compte developer sur [developer.paypal.com](https://developer.paypal.com/)
2. Créer une app dans le Dashboard → copier **Client ID** et **Secret**
3. Pour les **abonnements mensuels** :
   - Aller dans "Subscriptions" → "Create Plan"
   - Créer un produit "Ipvideo Pro" (25$/mois) → copier le **Plan ID** (`P-...`) dans `PAYPAL_PLAN_PRO_ID`
   - Créer un produit "Ipvideo Enterprise" (79$/mois) → copier le **Plan ID** dans `PAYPAL_PLAN_ENTERPRISE_ID`
4. Créer un **Webhook** (pour recevoir les événements) :
   - URL : `https://votre-domaine.com/api/payments/webhook`
   - Événements : `Billing subscription created`, `Billing subscription cancelled`, `Payment sale completed`
   - Copier le **Webhook ID** dans `PAYPAL_WEBHOOK_ID`

### Replicate (Génération Vidéo IA)
1. Créer un compte sur [replicate.com](https://replicate.com/)
2. Account → API Tokens → copier dans `REPLICATE_API_TOKEN`

---

## 📁 Variables d'Environnement

Créez un fichier `server/.env` :

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT
JWT_SECRET=votre_secret_ultra_long_et_aleatoire_123456789
JWT_EXPIRE=7d

# PayPal (Sandbox pour test)
PAYPAL_CLIENT_ID=AbC...
PAYPAL_CLIENT_SECRET=EfG...
PAYPAL_PLAN_PRO_ID=P-...
PAYPAL_PLAN_ENTERPRISE_ID=P-...
PAYPAL_WEBHOOK_ID=6A6...

# Replicate AI
REPLICATE_API_TOKEN=r8_...

# Cloudinary (optionnel)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 📡 API Endpoints

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Créer un compte |
| POST | `/api/auth/login` | ❌ | Connexion |
| GET | `/api/auth/me` | ✅ | Profil utilisateur |
| POST | `/api/videos/generate` | ✅ | Lancer génération vidéo |
| GET | `/api/videos/my` | ✅ | Liste des vidéos |
| GET | `/api/videos/:id/status` | ✅ | Statut d'une vidéo |
| POST | `/api/payments/paypal-order` | ✅ | Créer order PayPal (1 mois) |
| POST | `/api/payments/paypal-capture` | ✅ | Confirmer paiement PayPal |
| POST | `/api/payments/paypal-subscription` | ✅ | Créer abonnement PayPal |
| POST | `/api/payments/cancel` | ✅ | Annuler abonnement |
| POST | `/api/payments/webhook` | ❌ | Webhook PayPal |

---

## 🎬 Génération Vidéo IA — Comment ça marche

1. L'utilisateur remplit le formulaire (prompt, style, durée, etc.)
2. Le backend appelle **Replicate API** avec le modèle choisi :
   - `luma-ai/dream-machine` — qualité premium
   - `stability-ai/stable-video-diffusion` — open source, économique
   - `anotherjesse/zeroscope-v2-xl` — rapide
3. Replicate traite la demande (30s à 2min)
4. Le backend poll le statut toutes les 5 secondes
5. La vidéo URL réelle est stockée dans Supabase et affichée au client

**Coût Replicate** : ~$0.02 à $0.50 par vidéo selon le modèle et la durée.

---

## 💰 Modèle Économique (PayPal)

| Plan | Prix | Limites |
|------|------|---------|
| **Découverte** | Gratuit (3 jours) | 120 points (~3 vidéos de 30s), 720p, 15s max |
| **Pro** | 25$/mois | 1 000 points (~25 vidéos de 30s), 1080p, 60s max, 50 voix IA/mois |
| **Entreprise** | 79$/mois | 5 utilisateurs, API, 120s max, account manager |

Le webhook PayPal met automatiquement à jour le `plan` de l'utilisateur dans Supabase.

---

## 🐳 Déploiement Production

### Via Docker Compose
```bash
# Définir NODE_ENV=production dans server/.env
# Configurer les vraies clés live PayPal
# Puis:
docker-compose up -d
```

### Via VPS
1. Installer Docker sur le serveur
2. Cloner le repo
3. `docker-compose up -d`
4. Configurer Nginx + SSL (Let's Encrypt / Certbot)

---

## 🧪 Tests

### Compte de test
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@ipvideo.com","password":"password123"}'
```

### Test PayPal (Sandbox)
Utilisez les comptes sandbox de votre Dashboard PayPal Developer pour tester les paiements sans vraie carte.

---

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt (salt 12)
- Tokens JWT avec expiration 7 jours
- PayPal webhooks vérifiés par signature
- CORS configuré pour le domaine client uniquement
- Supabase RLS activé (Row Level Security)

---

## 📄 Licence

Projet privé — Ipvideo © 2026
