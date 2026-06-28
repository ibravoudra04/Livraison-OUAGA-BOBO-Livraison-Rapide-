# RAPPORT D'INCIDENT — Déploiement bloqué après rollback « Burkina »

**Projet :** Livraison Rapide (Ouaga & Bobo)
**Date de l'incident :** 28 juin 2026
**Production :** https://www.livraisonrapide.app (hébergement Vercel)
**Commit cible du rollback :** `444a10a` — *fix: compatibilité installation PWA sur iOS*
**Commit correctif déployé :** `d4c351b` — *fix: forcer redéploiement Vercel + purge cache PWA*
**Statut final : ✅ RÉSOLU — version Burkina en ligne et vérifiée**

---

## 1. Résumé pour la direction (TL;DR)

Après le retour en arrière (rollback) vers la version exclusivement Burkina Faso, le site en ligne continuait d'afficher l'ancienne version « sous-région ». 

**Le rollback Git était correct** : le dépôt local **et** la branche `main` sur GitHub pointaient bien sur le bon commit `444a10a`.

**Le vrai blocage était sur Vercel, pas sur le cache PWA comme on le soupçonnait** : le déploiement de la version Burkina n'avait jamais été publié en production. Vercel servait encore l'ancien déploiement « sous-région », vieux d'environ **2,6 jours**.

**Cause technique :** un `git push --force` vers un ancien commit déjà construit **ne déclenche pas** de nouveau déploiement de production sur Vercel.

**Correctif :** un nouveau commit a été poussé sur `main`. Vercel a alors construit et publié la version Burkina, et ce même commit a déclenché la purge automatique du cache PWA chez tous les utilisateurs.

**Aucune perte de données. Aucune action requise de la part des utilisateurs.**

---

## 2. Symptôme constaté

- GitHub (`main`) à jour sur le bon commit `444a10a` depuis plus de 2 heures.
- Le site en ligne affichait toujours la mauvaise version (avec la sous-région).
- Hypothèse initiale : problème de cache PWA (service worker) sur les appareils.

---

## 3. Méthode de diagnostic (fondée sur des preuves)

Plutôt que de supposer, nous avons interrogé directement le serveur de production en contournant tout cache d'appareil (requêtes `curl` avec paramètre anti-cache). Trois vérifications croisées :

1. **État Git réel** (local + GitHub).
2. **Build du commit `444a10a`** reconstruit localement, pour exclure une erreur de compilation.
3. **Contenu réellement servi par le serveur** (HTML, `manifest.json`, en-têtes Vercel).

---

## 4. Constats

### 4.1 — Git : conforme ✅
- HEAD local = `444a10a`
- `origin/main` (GitHub) = `444a10a`
- Les deux parfaitement synchronisés.
> Le rollback a bien réussi côté code source. Le problème est **en aval**.

### 4.2 — Build : conforme ✅
- Le commit `444a10a` a été reconstruit localement : **compilation réussie (code de sortie 0)**, TypeScript OK, service worker généré correctement.
> **Aucune erreur de build ne bloquait le déploiement.**

### 4.3 — Production : NON conforme ❌ (la racine du problème)
Le serveur servait toujours l'ancienne version « sous-région ». Preuves décisives relevées sur le `manifest.json` et le HTML en ligne :

| Élément | Version Burkina attendue (`444a10a`) | Ce que le serveur servait |
|---|---|---|
| `manifest.json` → `name` | `Livraison Rapide — Ouaga & Bobo` | `Livraison Rapide` |
| `manifest.json` → `description` | `…à Ouagadougou et Bobo-Dioulasso` | `…près de chez vous **en Afrique**` |
| `manifest.json` → icônes | fichiers locaux | proxy externe `wsrv.nl` + `screenshots` |
| `<title>` de la page | `Livraison Rapide - Ouaga & Bobo` | `Livraison Rapide` |
| En-tête Vercel | — | `X-Vercel-Cache: HIT`, `Age ≈ 63 h` |

> L'âge du cache (≈ 2,6 jours) est largement **antérieur** au push effectué 2 h plus tôt → le déploiement de la version Burkina n'a jamais atteint la production.

---

## 5. Cause racine

**Un `git push --force` qui ramène la branche `main` vers un ancien commit déjà construit ne provoque pas systématiquement un nouveau déploiement de production sur Vercel.**

Vercel reconnaît que le SHA `444a10a` avait déjà été bâti (avant les travaux « sous-région ») et **ne re-promeut pas** l'alias de production. Conséquence : l'alias de production restait pointé sur le **dernier déploiement « sous-région »**.

➡️ Tant que Vercel ne publiait pas la bonne version, agir sur le cache PWA aurait été inutile : les appareils n'auraient fait que re-télécharger la version sous-région. **L'ordre de résolution est : d'abord Vercel, ensuite le cache PWA.**

---

## 6. Correctif appliqué

Un **seul geste** a réglé les deux dimensions du problème : un nouveau commit poussé sur `main`.

- **Commit `d4c351b`** : modification de la chaîne de version du « kill-switch » PWA dans `app/layout.tsx`.
  ```diff
  - var version = '2026-06-12_v4';
  + var version = '2026-06-28_v5';
  ```

Effets :
1. **Nouveau SHA → Vercel construit et publie enfin un déploiement de production à jour** (la version Burkina). C'est ce que le force-push n'avait pas su faire.
2. **Nouvelle chaîne de version → purge automatique du cache PWA** : à sa prochaine ouverture de l'application, chaque utilisateur déclenche **une fois** la désinscription de tous les service workers, la suppression de tous les caches, puis un rechargement — et récupère ainsi la version Burkina.

> Le mécanisme anti-cache existait déjà dans le code (`app/layout.tsx`, `components/SwUpdateHandler/`, `public/migration-sw.js`, avec `skipWaiting` + `clientsClaim`). Il suffisait d'incrémenter la chaîne de version pour le déclencher.

---

## 7. Vérification après correctif (en production, hors cache)

| Contrôle | Avant | Après |
|---|---|---|
| `manifest.json` → `name` | `Livraison Rapide` | **`Livraison Rapide — Ouaga & Bobo`** ✅ |
| `<title>` | `Livraison Rapide` | **`Livraison Rapide - Ouaga & Bobo`** ✅ |
| Icônes manifest | proxy `wsrv.nl` | **fichiers locaux (Burkina)** ✅ |
| `X-Vercel-Cache` | `HIT`, Age ≈ 63 h | **Age 0 (nouveau déploiement)** ✅ |
| Version kill-switch (HTML) | `2026-06-12_v4` | **`2026-06-28_v5`** ✅ |
| `service-worker.js` | — | **HTTP 200, importe `migration-sw.js`** ✅ |

**Conclusion : la version Burkina est bien en ligne et servie par la production.**

---

## 8. Impact utilisateurs

- **Aucune action requise** de la part des utilisateurs.
- À leur prochaine ouverture de l'application (navigateur ou PWA installée), le cache se purge automatiquement et l'application se recharge sur la version Burkina.
- Aucune donnée perdue (clients, livreurs, messages, paiements intacts).

---

## 9. Recommandations (prévention)

1. **Pour tout futur rollback** : ne pas se limiter à un `git push --force` vers un ancien commit. **Toujours créer un nouveau commit** (par ex. `git revert`, ou au minimum un commit vide) afin que Vercel détecte un SHA inédit et déclenche un déploiement de production.
2. **Pour forcer la mise à jour des clients PWA** : incrémenter la chaîne `version` du kill-switch dans `app/layout.tsx` à chaque changement visuel majeur.
3. **Vérifier après chaque déploiement sensible** : contrôler `manifest.json` / `<title>` en production (hors cache) et l'en-tête `X-Vercel-Cache` (`Age` doit retomber à 0).
4. **Contrôles dashboard Vercel utiles** : `Settings → Git → Production Branch = main` ; `Settings → Domains` : confirmer que `www.livraisonrapide.app` est bien rattaché à **Production** (l'apex redirige en 308 vers `www`).
5. **Nettoyage** : la route de debug `app/api/test-cookies/` traîne encore dans l'arbre de travail (non commitée). À supprimer.

---

## 10. Annexe — Détails techniques

- **URL de production :** l'apex `livraisonrapide.app` redirige (HTTP 308) vers `www.livraisonrapide.app`, qui sert la production.
- **Service worker généré :** `/service-worker.js` (config `@ducanh2912/next-pwa` dans `next.config.mjs`), avec `skipWaiting: true`, `clientsClaim: true`, et `importScripts: ['/migration-sw.js']`.
- **Stack :** Next.js 16.2.7 (webpack), React 19, Supabase, déploiement Vercel sur push de la branche `main`.
- **Commits concernés :**
  - `444a10a` — cible du rollback (version Burkina).
  - `d4c351b` — correctif de redéploiement + purge PWA (28 juin 2026).

---

*Rapport établi le 28 juin 2026 à partir de l'état exact du code source et de mesures effectuées directement sur la production.*
