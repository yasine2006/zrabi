# Zarbia Atlas — Dossier technique

> Document technique du projet : architecture, stack, fonctionnalités, ce qui manque
> et ce que le propriétaire (agence) doit fournir. Mis à jour le 2026-11-08.

---

## 1. Vue d'ensemble

Plateforme e-commerce **Next.js 14 (App Router)** + **PostgreSQL** pour la vente
de tapis marocains artisanaux. Deux espaces : **vitrine client** et **back-office
admin**. Trilingue FR / EN / AR avec RTL pour l'arabe.

- **URL locale** : http://localhost:3000
- **Repo GitHub** : https://github.com/yasine2006/zrabi (branch `main`)
- **Identifiants admin** : `admin@zarbia-atlas.ma` / `zarbyaatlassadmin` (2FA TOTP)

---

## 2. Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 14.2 (App Router, Server Components) |
| Langage | TypeScript (strict) |
| UI | Tailwind CSS, Framer Motion, lucide-react |
| DB | PostgreSQL 16 (Docker, port 55432) |
| ORM | Prisma 6.19 |
| Auth admin | Cookie session HMAC (scrypt + TOTP) |
| Paiements | Stripe, CMI, COD (env-driven) |
| E-mail | SMTP (nodemailer) — actuellement vide |
| Images | next/image (Unsplash stock) |
| PDF | pdf-lib (factures avec translittération arabe) |
| Déploiement | Docker (Dockerfile + docker-compose), Vercel-ready |

---

## 3. Architecture

```
src/
├── app/                # Routes Next.js (pages + API)
│   ├── page.tsx        # Home
│   ├── shop/           # Catalogue + filtres + recherche
│   ├── rugs/[slug]/    # Fiche produit (JSON-LD Product)
│   ├── checkout/       # Checkout (COD/Stripe/CMI)
│   ├── order/[id]/     # Confirmation (token-gated)
│   ├── custom-order/   # Configurateur sur mesure
│   ├── our-story/      # Notre histoire
│   ├── blog/           # Journal (3 articles)
│   ├── faq/            # FAQ (JSON-LD FAQPage)
│   ├── legal/          # CGV, privacy, returns, notices
│   ├── contact/        # Contact
│   ├── favorites/      # Favoris (localStorage)
│   ├── track/          # Suivi de commande
│   ├── admin/          # Back-office
│   └── api/            # API routes (rugs, orders, shipping, newsletter, admin/*)
├── components/         # UI (Navbar, Footer, CartDrawer, pages/*, admin/*)
├── context/            # StoreContext (panier, devise, langue, favoris, commandes)
├── lib/                # logique métier (stock, shipping, currency, promo removed, legal, orders/access, i18n, i18n-server, seo)
└── prisma/             # schema.prisma + seed.ts
```

### Flux d'achat
1. Parcourir `/shop` → filtres (type, région, dispo, prix, tri, recherche).
2. Voir `/rugs/[slug]` → galerie, zoom, vidéo, specs, certificat.
3. Ajouter au panier → tapis verrouillé 15 min (`RESERVED`).
4. Panier (CartDrawer) → countdown, devis livraison, pays/poids.
5. Checkout → formulaire client, frais dynamiques, choix paiement.
6. Confirmer → `POST /api/orders` → commande créée, tapis réservé, redirection `/order/[id]?token=...`.
7. Suivi → `/order/[id]` (token-gated) ou `/track` (numéro + e-mail).

---

## 4. Fonctionnalités implémentées

### Vitrine
- Home (hero, marquee horizontal continu LTR/RTL, nouveautés, journal, newsletter)
- Shop (filtres, recherche, tri, prix, disponibilité, favoris)
- Fiche produit (galerie, zoom, vidéo, specs, certificat, JSON-LD Product)
- Checkout (COD/Stripe/CMI, devis shipping dynamique, validation Zod)
- Confirmation commande (token-gated, timeline, reçu imprimable)
- Sur-mesure (configurateur, devis, acompte 30 %)
- Notre histoire, Journal (3 articles), FAQ, Contact, Favoris, Suivi
- Pages légales (CGV, confidentialité, retours, mentions)
- i18n FR/EN/AR + RTL + cookie locale
- Newsletter (DB + API + export CSV)
- Rate limiting sur POST publiques
- SEO: sitemap, robots, manifest, OG image, JSON-LD, metadata traduites
- Sécurité: headers HTTP, protection /order/[id]

### Back-office (admin)
- Auth (password scrypt + TOTP + cookie HMAC)
- Dashboard (KPIs, commandes, tapis, sur-mesure, réglages)
- CRUD tapis (upload drag&drop, duplication, statut)
- Commandes (filtre, statut, tracking, facture PDF)
- Sur-mesure (devis, acompte, statut)
- Réglages (taux EUR/USD, shipping)
- Newsletter (compteur + export CSV)

---

## 5. Ce qui manque / à fournir par l'agence (propriétaire)

### 🔴 Contenu & données (bloquant pour la mise en production)
1. **Numéro WhatsApp** (`NEXT_PUBLIC_WHATSAPP_NUMBER`) — actuellement `212600000000` (placeholder). Tous les boutons WhatsApp sont morts.
2. **SMTP** (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`) — les promesses "e-mail de confirmation" sont actuellement fausses.
3. **Photos réelles des 8 tapis** (actuellement Unsplash stock) + vidéo produit (optionnel).
4. **Textes marketing** (storyFr/En/Ar par tapis) — actuellement génériques.
5. **Informations légales** (ICE, registre de commerce, identifiant fiscal) pour les pages légales/notices.
6. **Coordonnées réelles** (e-mail, téléphone, adresse atelier, réseaux sociaux).

### 🟠 Configuration & infra
7. **Base de données managée** (Neon / Supabase / Railway) — Docker local s'arrête tout seul.
8. **Migrations Prisma** (`prisma migrate dev`) au lieu de `db push` (pas d'historique).
9. **Backups automatiques** de la DB.
10. **Noms de domaine** + certificat SSL (HTTPS) pour `SECURE_COOKIES=true`.
11. **Comptes paiement** (Stripe, CMI) — hors scope cette phase.

### 🟡 Contenu admin
12. **Taux de change réels** (actuellement mock 0.096 / 0.105).
13. **Grille de shipping réelle** (actuellement fallback 450/650/850 MAD).
14. **Artisans réels** (noms, bios, villages, photos).
15. **Compte admin réel** (changer mot de passe + TOTP secret).

---

## 6. Ce que vous (développeur) devez encore acquérir / faire

### Services à souscrire
| Service | Usage | Coût indicatif |
|---|---|---|
| DB managée (Neon/Supabase) | PostgreSQL production | Gratuit → ~$25/mois |
| Cloudinary / S3 / R2 | Stockage images (actuellement disque local) | Gratuit → ~$10/mois |
| Resend / Postmark / Brevo | E-mails transactionnels | Gratuit → ~$15/mois |
| Sentry | Monitoring erreurs | Gratuit → ~$26/mois |
| Plausible / GA4 | Analytics | Gratuit |
| Vercel / Railway | Hébergement app | Gratuit → ~$20/mois |
| ngrok / Cloudflare Tunnel | Partage temporaire | Gratuit |

### Développement restant (Week 3-4)
- **Comptes clients** (inscription/connexion, historique commandes)
- **Avis clients** (UI + API + étoiles + modération admin)
- **Page favoris** ✅ (existe, localStorage) — à synchroniser avec DB
- **Recherche dans le catalogue** ✅ (existe)
- **Page contact** ✅ (existe)
- **Suivi de commande** ✅ (existe via /track)
- **Upload d'images pour commandes sur mesure** (champ `inspirationPhotos` présent, UI manquante)
- **Pagination du catalogue** (actuellement `?limit=100`)
- **Paramètres admin** : infos boutique, gestion avis, export CSV commandes
- **Tests E2E** (Playwright) + CI GitHub Actions
- **Middleware** (protection `/admin` — retiré car redirect loop ; à refaire proprement)
- **hreflang / locale dans l'URL** (`/fr`, `/ar`)
- **Images OG par page**
- **Migrations Prisma versionnées** (actuellement `db push`)

---

## 7. Variables d'environnement (`.env`)

Voir `.env.example`. Points clés :
- `DATABASE_URL` → port **55432** (pas 5432)
- `NEXT_PUBLIC_WHATSAPP_NUMBER` → **placeholder à remplacer**
- `SMTP_HOST` → vide = pas d'e-mails
- `ORDER_ACCESS_SECRET` → secret HMAC pour `/order/[id]`
- `ADMIN_SESSION_SECRET` → secret session admin
- `SECURE_COOKIES` → `true` uniquement en HTTPS

---

## 7b. Déploiement Neon + Vercel (production)

### Base de données (Neon)
1. Créer un projet sur https://neon.tech → récupérer la connection string.
2. Mettre à jour `DATABASE_URL` dans Vercel (Settings → Environment Variables) :
   ```
   postgres://USER:PASSWORD@ep-xxx.region.aws.neon.tech/zarbia_atlas?sslmode=require
   ```
3. Pousser le schéma : `npx prisma db push` (avec DATABASE_URL=Neon).
4. Seeder : `npm run db:seed` (avec DATABASE_URL=Neon).

### Application (Vercel)
1. Importer le repo GitHub `yasine2006/zrabi` sur Vercel.
2. Framework preset : Next.js (auto-détecté).
3. Build command : `npm run build` (le `postinstall` génère le client Prisma).
4. Variables d'environnement à définir sur Vercel :
   - `DATABASE_URL` (Neon)
   - `NEXT_PUBLIC_APP_URL` (https://votre-domaine.vercel.app)
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
   - `ORDER_ACCESS_SECRET`, `ADMIN_SESSION_SECRET`, `AUTH_SECRET`
   - `TWO_FACTOR_ENCRYPTION_KEY`
   - `SEED_ADMIN_*`
   - `BLOB_READ_WRITE_TOKEN` (Vercel Blob, uploads photos/vidéos — store **privé**)
   - `SMTP_*` (optionnel)
5. Déployer. Avec le token, l'admin envoie les fichiers **directement du navigateur vers Vercel Blob** (`@vercel/blob/client`, `access: "private"`) : aucune limite de 4.5 MB sur le body de la fonction. Les fichiers sont servis par `/api/media/[...path]` (token serveur + Range/206 pour la vidéo). Sans token (développement local), les fichiers restent dans `public/uploads` et sont servis par `/api/uploads/[...path]`.

### Notes
- Le filesystem Vercel est read-only → `public/uploads` ne persiste pas. Le store Blob étant privé, ne jamais utiliser l'URL Blob brute : passer par `/api/media/...` avec `access: "private"` côté serveur.
- `SECURE_COOKIES` doit être `true` en production HTTPS.
- Rate limiting est en mémoire (par instance) → remplacer par Redis/Upstash si multi-instance.

---

## 8. Comment lancer le projet

### Dev
```bash
npm install
docker compose up -d db
cp .env.example .env
npx prisma db push
npx prisma generate
npm run db:seed
npm run dev          # http://localhost:3000
```

### Production (local)
```bash
npm run build
npm run start        # http://localhost:3000
```

### Docker (tout-en-un)
```bash
docker compose up -d --build
# http://localhost:3000
```

### Admin
- URL : http://localhost:3000/admin
- Email : `admin@zarbia-atlas.ma`
- Mot de passe : `zarbyaatlassadmin`
- 2FA : `npm run admin:code` (code valide 30s)

---

## 9. Commandes utiles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de dev (hot reload) |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:seed` | Seeder la DB |
| `npm run admin:code` | Code TOTP admin |
| `npx prisma db push` | Sync schéma DB |
| `npx prisma studio` | UI DB |
| `docker compose up -d` | Démarrer PostgreSQL |
| `docker compose down` | Arrêter |

---

## 10. Points d'attention

- **Docker Desktop** s'arrête parfois tout seul sur Windows → utiliser DB managée en production.
- **`.env` n'est pas versionné** (dans `.gitignore`). Ne jamais committer de secrets.
- **`output: "standalone"` retiré** pour que `npm run start` fonctionne en local.
- **Rate limiting en mémoire** (par instance) → remplacer par Redis/Upstash en production multi-instance.
- **Images sur disque local** (`public/uploads`) → migrer vers S3/Cloudinary/R2 pour serverless.
- **Marquee home** : animations CSS avec `!important` ; vérifier via computed styles (les tests browser figent les animations).

---

*Document généré automatiquement. Dernière mise à jour : 2026-11-08.*
