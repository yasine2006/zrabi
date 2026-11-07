# Zarbia Atlas — Tapis marocains faits main

Plateforme e-commerce Next.js 14 (App Router) + PostgreSQL pour la vente de tapis
marocains artisanaux. Deux espaces : **vitrine** (client) et **back-office**
(admin).

---

## 1. Comment fonctionne le site (vue d'ensemble)

```
┌─────────────────────────────────────────────────────────────┐
│  NAVIGATEUR (client)                                        │
│  ├── Navbar (logo, liens, devise, langue, panier, favoris)  │
│  ├── Pages (Home, Shop, Product, Checkout, Order, Custom)    │
│  ├── CartDrawer (panier coulissant, countdown 15 min)        │
│  └── StoreProvider (état global : panier, devise, langue…)   │
└──────────────────────┬──────────────────────────────────────┘
                       │ fetch /api/...
┌──────────────────────┴──────────────────────────────────────┐
│  SERVEUR Next.js (API routes)                               │
│  ├── /api/rugs          catalogue public                    │
│  ├── /api/orders        réservation + création commande      │
│  ├── /api/shipping/quote devis livraison                    │
│  ├── /api/custom-orders commandes sur mesure                │
│  ├── /api/payments/...  webhooks Stripe/CMI                 │
│  └── /api/admin/*       back-office (cookie session)        │
└──────────────────────┬──────────────────────────────────────┘
                       │ Prisma
┌──────────────────────┴──────────────────────────────────────┐
│  PostgreSQL (Docker, port 55432)                             │
│  ├── rugs, artisans, orders, order_items, custom_orders      │
│  ├── users (admin), currency_rates, shipping_rates          │
│  ├── newsletter_subscribers                                 │
│  └── reviews (modèle présent, UI non câblée)                │
└─────────────────────────────────────────────────────────────┘
```

### Flux d'achat (client)

1. **Parcourir** `/shop` → filtres (type, région, dispo, prix, tri).
2. **Voir** `/rugs/[slug]` → galerie, zoom, vidéo, specs, certificat.
3. **Ajouter au panier** → le tapis est verrouillé 15 min (`RESERVED`).
4. **Panier** (`CartDrawer`) → countdown `MM:SS`, devis livraison par pays/poids, promo `ATLAS10`.
5. **Checkout** `/checkout` → formulaire client, frais livraison dynamiques, choix paiement (COD / Stripe / CMI).
6. **Confirmer** → `POST /api/orders` → commande créée, tapis réservé, redirection `/order/[id]`.
7. **Suivi** `/order/[id]` → timeline, statut, reçu imprimable.

### Règles métier clés

- Chaque tapis est **unique** : quantité verrouillée à 1, ne peut être ajouté qu'une fois.
- Réservation de **15 minutes** (côté client ET serveur via `Rug.reservedUntil`).
- Les réservations expirées sont libérées à chaque lecture DB.
- Livraison calculée par **zone + poids** (Maroc gratuit, Europe 450 MAD, USA/Canada 650, Moyen-Orient 850 en fallback).
- Prix en **MAD** (base) + affichage EUR/USD avec taux live (0.096 / 0.105).
- Paiement : COD (Maroc), Stripe (international), CMI (cartes marocaines).

---

## 2. Comment démarrer le projet

### Prérequis
- Node.js 18+
- Docker (pour PostgreSQL)
- npm

### Installation (dev)

```bash
# 1. Cloner le projet
git clone <repo-url>
cd zarbia

# 2. Installer les dépendances
npm install

# 3. Démarrer PostgreSQL (Docker)
docker compose up -d db
# Attendre que le conteneur soit "healthy" :
docker ps --filter name=zarbia-atlas-db

# 4. Configurer l'environnement
cp .env.example .env
# Vérifier DATABASE_URL = postgres://zarbia:zarbia_pass@localhost:55432/zarbia_atlas

# 5. Synchroniser le schéma (pas de migrations versionnées)
npx prisma db push

# 6. Générer le client Prisma
npx prisma generate

# 7. Seeder les données (8 tapis, 3 artisans, admin, taux, shipping)
npm run db:seed

# 8. Lancer le serveur de dev
npm run dev
```

Ouvrir http://localhost:3000

### Production (local)

```bash
npm run build
npm run start   # http://localhost:3000
```

> ⚠️ `npm run start` requiert une build fraîche. Ne pas builder pendant qu'un
> serveur tourne (corrompt `.next`).

### Docker (tout-en-un, pour partager sans Node/npm)

```bash
# Build + run (app + postgres)
docker compose up -d --build

# Ouvrir http://localhost:3000
# Arrêter : docker compose down
# Données persistantes dans le volume pgdata
```

> Note : Docker Desktop peut s'arrêter sur certaines machines Windows. Pour un
> partage fiable, garder Docker Desktop lancé ou utiliser le mode production
> local (`npm run build && npm run start`).

### Variables d'environnement importantes

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | PostgreSQL (port 55432 par défaut) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Numéro WhatsApp (ex: 2126XXXXXXXXX) — **placeholder à remplacer** |
| `SMTP_HOST` | Vide = pas d'e-mails transactionnels |
| `ORDER_ACCESS_SECRET` | Secret HMAC pour les liens `/order/[id]` |
| `ADMIN_SESSION_SECRET` | Secret session admin |
| `SECURE_COOKIES` | `true` uniquement en HTTPS production |

---

## 3. Accès Admin (Back-office)

**URL:** http://localhost:3000/admin

**Identifiants:**
- Email : `admin@zarbia-atlas.ma`
- Mot de passe : `zarbyaatlassadmin`
- **2FA activé** (TOTP). Générer le code avec :
  ```bash
  npm run admin:code
  ```
  (code valide 30 secondes).

**Fonctionnalités admin:**
- **Vue d'ensemble** — KPIs ventes, tapis les plus consultés, dernières commandes.
- **Tapis & stock** — tableau des tapis, basculer AVAILABLE/SOLD, dupliquer, ajouter un nouveau tapis.
- **Commandes** — filtres, mise à jour statut (PENDING_COD → CONFIRMED → SHIPPED), numéro de suivi transporteur, facture PDF.
- **Sur-mesure** — devis, acompte 30 %, statut.
- **Réglages** — taux de change EUR/USD + grille de shipping.

---

## 4. Structure du projet

```
src/
  app/                    # Routes Next.js (pages + API)
    layout.tsx            # Fonts, metadata, StoreProvider, chrome
    page.tsx              # Home
    shop/page.tsx         # Catalogue
    rugs/[slug]/page.tsx  # Fiche produit
    checkout/page.tsx     # Checkout
    order/[id]/page.tsx   # Confirmation commande
    custom-order/page.tsx # Configurateur sur mesure
    admin/page.tsx        # Back-office
    api/                  # API routes
      rugs/               # Catalogue public
      orders/             # Réservation + commande
      shipping/quote/     # Devis livraison
      custom-orders/      # Commandes sur mesure
      payments/           # Webhooks
      admin/              # Back-office protégé
  components/
    Navbar.tsx            # Header sticky glassmorphism
    CartDrawer.tsx        # Panier coulissant
    RugCard.tsx           # Carte produit (hover, favoris, add)
    WhatsAppButton.tsx    # Bouton flottant concierge
    pages/                # Une vue par route (client components)
    admin/                # Composants admin
  context/
    StoreContext.tsx      # État global (panier, devise, langue, favoris, commandes)
  lib/
    initial-data.ts       # 8 tapis fallback + taux mock
    services/
      order-service.ts    # Transaction commande
    api/                  # Schémas, erreurs, sérialiseurs
    admin/                # Auth, crypto, session, data, invoice
    payments/             # COD, Stripe, CMI
    money.ts, currency.ts # Conversion et formatage
    shipping.ts           # Zones + brackets poids
    stock.ts              # Réservations 15 min
    storefront.ts         # Lectures catalogue côté serveur
    promo.ts              # Codes promo
    i18n.ts               # Traductions, types de tapis
    whatsapp.ts           # Liens wa.me pré-remplis
prisma/
  schema.prisma           # Modèle de données
  seed.ts                 # Seed idempotent
scripts/
  admin-totp.ts           # Génère le code TOTP
```

---

## 5. État global (StoreContext)

Accessible via `useStore()` dans tout composant client.

| Clé | Description |
|-----|-------------|
| `currency` / `setCurrency` | MAD (défaut), EUR, USD |
| `formatPrice(priceMad)` | Convertit MAD → devise sélectionnée |
| `locale` / `setLocale` | fr / en |
| `t(fr, en)` | Traduction inline |
| `rugs` | Catalogue (fallback → sync `/api/rugs`) |
| `addRug`, `updateRugStatus`, `duplicateRug`, `toggleMadeToOrder` | Actions admin |
| `cart` / `addToCart` / `removeFromCart` / `clearCart` | Panier (unique, qte=1) |
| `isCartOpen` / `setIsCartOpen` | Ouverture panier |
| `reservationExpiry` | Timestamp countdown 15 min |
| `favorites` / `toggleFavorite` | Favoris (IDs) |
| `orders` / `createOrder` | Historique + création commande |
| `promo` / `applyPromo` / `removePromo` | Codes promo |

---

## 6. API principales

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/rugs` | GET | Catalogue public (filtres, pagination) |
| `/api/rugs/[slug]/view` | POST | Compteur de vues (1/session) |
| `/api/shipping/quote` | POST | Devis livraison (pays + poids) |
| `/api/orders` | POST | Création commande + réservation |
| `/api/custom-orders` | POST | Commande sur mesure |
| `/api/admin/auth/login` | POST | Login admin (email + password) |
| `/api/admin/auth/session` | GET | Session courante |
| `/api/admin/rugs` | POST | Créer un tapis |
| `/api/admin/rugs/[id]` | PATCH | Modifier un tapis |
| `/api/admin/rugs/[id]/duplicate` | POST | Dupliquer un tapis |
| `/api/admin/orders/[id]` | PATCH | Mettre à jour une commande |
| `/api/admin/settings/currency` | PATCH | Taux de change |
| `/api/admin/settings/shipping` | PATCH | Grille shipping |

---

## 7. Base de données

**Connexion:** `postgres://zarbia:zarbia_pass@localhost:55432/zarbia_atlas`

**Tables principales:**
- `rugs` — tapis (sku, nom, type, dimensions, prix, statut, photos…)
- `artisans` — artisanes (nom, village, région, bio)
- `orders` / `order_items` — commandes
- `custom_orders` — commandes sur mesure
- `users` — comptes (admin)
- `currency_rates` — taux de change
- `shipping_rates` — grille livraison

**Commandes utiles:**
```bash
npm run db:seed        # Re-seed (idempotent)
npm run db:reset       # Reset + re-seed
npm run admin:code     # Code TOTP (si 2FA réactivé)
```

---

## 8. Variables d'environnement (.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Connexion PostgreSQL |
| `NEXT_PUBLIC_APP_URL` | URL de l'app |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Numéro WhatsApp concierge |
| `ADMIN_API_KEY` | Clé API admin (optionnel) |
| `ADMIN_SESSION_SECRET` | Secret session HMAC |
| `SEED_ADMIN_EMAIL` | Email admin |
| `SEED_ADMIN_PASSWORD` | Mot de passe admin |
| `SMTP_*` | Notifications email (optionnel) |

---

## 9. Scripts npm

| Script | Description |
|--------|-------------|
| `npm run dev` | Serveur de dev (port 3000) |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seeder la base |
| `npm run db:reset` | Reset + seed |
| `npm run admin:code` | Code TOTP admin |

---

## 10. Dépannage

**La base ne démarre pas:**
```bash
docker compose up -d
docker ps   # vérifier zarbia-atlas-db
```

**Port 3000 occupé:**
```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen | Select -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

**Réinitialiser complètement:**
```bash
npm run db:reset
npm run db:seed
```

**Hydration errors:** Vérifier que les composants client ont `"use client"` en ligne 1.

---

## 11. Palette & Design

| Token | Valeur | Usage |
|-------|--------|-------|
| Desert Sand | `#FAF6F0` | Fond principal |
| Wool Cream | `#F3ECE1` | Surfaces |
| Deep Espresso | `#2A211B` | Texte |
| Terracotta | `#8C583A` | Accent primaire |
| Gold | `#C59B27` | Accents |

**Fonts:** Cormorant Garamond (titres) + Plus Jakarta Sans (corps).

---

*Zarbia Atlas — Des tapis qui portent une histoire.* 🧶
