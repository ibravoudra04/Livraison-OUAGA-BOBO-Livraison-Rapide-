# ROADMAP — Publication sur Google Play Store & Apple App Store

**Projet :** Livraison Rapide (Ouaga & Bobo)
**Production actuelle :** https://www.livraisonrapide.app (PWA Next.js sur Vercel)
**Date :** 28 juin 2026
**Objectif :** Publier l'application sur le **Google Play Store (Android)** et l'**Apple App Store (iOS)**, en partant de zéro (aucun compte développeur, aucune infra mobile existante).

---

## 0. État réel du dépôt (corrections préalables)

Trois hypothèses de départ ont été corrigées après inspection du code :

| Hypothèse initiale | Réalité dans le repo |
|---|---|
| Next.js 14/15 | **Next.js 16.2.7** (`package.json`) |
| Présence d'un `assetlinks.json` | **Absent** — aucun fichier ni dossier `.well-known/`. À créer (indispensable Android TWA). |
| Terrain mobile préparé | **Aucune** config Capacitor / Expo / Bubblewrap. On part d'une feuille blanche. |
| Icônes prêtes | Manifest pointe sur `delivery_logo_premium.jpg` (**JPEG**) en 192/512. Les stores exigent des **PNG**, dont une **maskable**, + un **1024×1024** (Apple). |

PWA déjà en place et fonctionnelle : `manifest.json`, service worker (`@ducanh2912/next-pwa`), HTTPS. ✅

---

## 1. Recommandation stratégique

**Prioriser Android, traiter iOS comme une phase 2 optionnelle.**

- Marché Burkina Faso / Afrique de l'Ouest : **~85 % Android**. L'effort iOS (Mac, 99 $/an, D-U-N-S, review stricte) sert une part minime d'utilisateurs.
- L'app **fonctionne déjà sur iPhone** via Safari « Ajouter à l'écran d'accueil » (objet du dernier commit). Les utilisateurs iOS ne sont pas bloqués.
- Android via **TWA** : rapide, gratuit à compiler (pas de Mac), **synchronisé automatiquement** avec le site web (pas de re-soumission à chaque changement de contenu).

---

## 2. Approche technique

### Android → TWA (Trusted Web Activity) ✅ *recommandé*
- La TWA affiche la PWA hébergée en plein écran, sans barre d'URL. **L'app *est* le site.**
- Avantages : effort minimal, AAB léger, contenu toujours à jour (déploiement Vercel → app à jour sans nouvelle soumission), **build possible sous Windows**.
- Prérequis : PWA valide (✅) + **Digital Asset Links** (`assetlinks.json` à héberger) pour prouver la propriété du domaine.
- Outils : **Bubblewrap** (CLI) ou **PWABuilder** (web).

### iOS → Capacitor *(pas de TWA sur iOS)*
- ⚠️ Apple rejette les wrappers WebView nus (**Guideline 4.2 — Minimum Functionality**).
- Pour passer : apporter de la **vraie valeur native** via Capacitor + plugins (push natif APNs, géolocalisation native, splash, partage, caméra…).
- ⚠️ **Le push web actuel (web-push/VAPID) ne fonctionne pas dans une WebView iOS** → bascule obligatoire sur **push natif APNs**.
- PWABuilder iOS existe mais est souvent rejeté → **Capacitor + features natives** est le pari le plus sûr.

**Résumé :** Android = TWA (simple) · iOS = Capacitor + enrichissements natifs (plus lourd, review incertaine).

---

## 3. Préparation financière & administrative

| Poste | Google Play | Apple App Store |
|---|---|---|
| Compte développeur | **25 $ une seule fois** | **99 $ / an** (récurrent) |
| Carte bancaire | requise | requise |
| Vérification identité | Oui (D-U-N-S si *organisation*) | Individuel : pièce d'identité · Organisation : **D-U-N-S obligatoire** |
| Délai d'ouverture | heures → jours | jours (plus si D-U-N-S à obtenir) |

**Points clés :**
- **D-U-N-S** : gratuit (Dun & Bradstreet) mais **1 à 3 semaines** ; requis seulement pour publier sous un **nom d'entreprise**. Pour démarrer vite et seul → **compte individuel** (publication sous nom propre).
- **Politique de confidentialité publique obligatoire** (collecte de téléphone, GPS, CNI/selfies) → à héberger sur le domaine.
- Apple : remplir le **questionnaire App Privacy**.
- **Budget de départ (compte individuel) : 25 $ (Android) + 99 $/an (iOS). Android seul = 25 $.**

---

## 4. Compiler iOS sans Mac

Android : pas de Mac nécessaire. iOS : Xcode (macOS) obligatoire, sauf via le cloud.

| Solution | Principe | Coût |
|---|---|---|
| **Codemagic** | CI/CD cloud, runners macOS, support Capacitor | Offre gratuite (~500 min/mois) puis payant |
| **GitHub Actions** (runner `macos`) | Build iOS scripté | Gratuit dans quotas puis à la minute |
| **Ionic Appflow** | Build cloud Capacitor/Ionic | Payant |
| **Location de Mac** (MacinCloud, MacStadium) | Mac distant | À l'usage |
| **Expo EAS** | ⚠️ Pour React Native, **non adapté** à un wrapper Next.js | — |

➡️ **Recommandation : Capacitor + Codemagic** (ou GitHub Actions macOS). Compte Apple 99 $/an toujours requis + gestion des certificats/provisioning (gérables via Fastlane par le service cloud).

---

## 5. Roadmap étape par étape

Légende : 🤖 = réalisable directement dans le repo (code/config) · 🧑 = action manuelle (consoles, paiements, identité).

### Phase A — Fondations PWA (commun aux deux stores)
1. 🤖 Générer un jeu d'**icônes PNG** complet (192, 512, **512 maskable**, **1024** Apple) + script.
2. 🤖 Corriger `manifest.json` (icônes PNG, `id`, `categories`, `screenshots`, `orientation`) pour l'audit PWABuilder.
3. 🤖 Ajouter une page **Politique de confidentialité** + page **Suppression de compte** (exigence Apple 5.1.1).
4. 🤖 Vérifier le **score Lighthouse PWA** (installabilité) et corriger les manques.

### Phase B — Android (TWA)
5. 🧑 Créer le compte **Google Play Console** (25 $) + vérification d'identité.
6. 🤖 Initialiser la **TWA** (Bubblewrap : `twa-manifest.json`, package `app.livraisonrapide`, couleurs…).
7. 🤖 Générer la **clé de signature** (keystore) + empreinte **SHA-256**.
8. 🤖 Créer `public/.well-known/assetlinks.json` (avec l'empreinte) + route Next.js → déployer sur Vercel.
9. 🤖 Construire l'**AAB** (Android App Bundle) — sous Windows.
10. 🧑 Créer la fiche Play (description, captures, classification), **uploader l'AAB**, remplir « Sécurité des données », **soumettre**.

### Phase C — iOS (Capacitor) *(phase 2)*
11. 🧑 Créer le compte **Apple Developer** (99 $/an) + D-U-N-S si entreprise.
12. 🤖 Ajouter **Capacitor** (`capacitor.config.ts`, plateforme iOS) + plugins natifs (push APNs, géoloc, splash…).
13. 🤖 Écrire la **config de build cloud** (Codemagic / GitHub Actions macOS).
14. 🧑 Créer **certificats & provisioning** Apple (ou déléguer au cloud), créer l'app dans **App Store Connect**.
15. 🤖/🧑 Lancer le **build iOS cloud**, récupérer l'IPA.
16. 🧑 Remplir la fiche App Store + **App Privacy**, soumettre, répondre aux retours d'Apple.

---

## 6. Pièges de validation à éviter

### 🔴 Paiement par capture d'écran + OCR Gemini = risque n°1
- **Fiabilité/fraude** : un faux reçu Photoshopé trompe l'IA (déjà identifié à l'audit). Un reviewer testant un faux reçu → rejet pour fonctionnement trompeur.
- **Catégorie de paiement** :
  - Apple **3.1.1** : le numérique consommé dans l'app doit passer par l'**In-App Purchase** (15–30 %).
  - Apple **3.1.3/3.1.5** : les **services du monde réel** (livraison, mise en relation) sont **exemptés** → paiement externe autorisé.
  - Le cas « payer pour débloquer le numéro d'un livreur réel » est **gris** → un reviewer peut exiger l'IAP. Imprévisible. Même logique côté Google Play (Play Billing).
- ✅ **Recommandation : remplacer l'OCR par une vraie intégration Mobile Money (Orange/Moov via PSP) ou carte** avant la soumission. On peut alors revendiquer le statut « service du monde réel / marketplace » et utiliser le paiement externe légitimement. **Ne jamais masquer** la fonctionnalité au reviewer (Apple 2.3.1 → bannissement).

### 🔴 Autres rejets classiques
- **Apple 5.1.1 — suppression de compte in-app** : obligatoire dès qu'il y a création de compte. **À ajouter** (🤖).
- **Apple 4.2 — Minimum Functionality** : wrapper WebView nu rejeté → features natives requises (iOS).
- **Sign in with Apple (4.8)** : requis seulement si login social tiers. Ici téléphone+PIN (Supabase) → **non requis** ✅.
- **Confidentialité données sensibles** : GPS précis, téléphone, **CNI, selfies** → déclaration exacte + justification sur les deux stores. Sécuriser le bucket Storage des CNI.
- **Permissions** : textes de justification clairs (géolocalisation, notifications ; `NSLocationWhenInUseUsageDescription` etc. côté iOS — 🤖).
- **Classification d'âge** : remplir honnêtement.

---

## 7. Synthèse

| Volet | Verdict |
|---|---|
| Android (TWA) | Voie rapide, gratuite à compiler, à faire en premier. ~25 $. |
| iOS (Capacitor) | Faisable sans Mac (build cloud) mais 99 $/an, plus de code natif, review stricte. Phase 2. |
| Bloqueur n°1 | Paiement OCR : à remplacer par un vrai PSP Mobile Money avant soumission. |
| À ajouter au code | Icônes PNG, manifest store-ready, assetlinks, politique de confidentialité, **suppression de compte**, push natif (iOS). |

**Prochaine action recommandée :** démarrer la **Phase A** (icônes PNG + manifest store-ready + page suppression de compte + politique de confidentialité) — sert les deux stores et ne dépend d'aucun compte payant.

---

*Document établi le 28 juin 2026 à partir de l'état exact du code source du dépôt.*
