# Rapport de correction — Build Vercel qui échouait (passage 100% gratuit)

**Date :** 3 juillet 2026
**Commit du correctif :** `d57ddd0` (poussé sur `main`)
**Statut :** ✅ Build local vérifié OK (`tsc --noEmit` + `next build` complet). Redéploiement Vercel déclenché.

---

## 1. Le vrai diagnostic

Le passage « 100% gratuit » avait bien supprimé le contenu premium **dans les composants enfants**
(`ClientDashboard`, `DriverDashboard`), mais **pas dans les composants parents** qui continuaient à
leur transmettre des props premium devenues inexistantes.

Résultat : une **chaîne de 4 erreurs TypeScript**. Or `tsc` (et donc le build Vercel) **s'arrête à la
toute première erreur**. Chaque correction ne révélait donc que l'erreur suivante → impression de
« boucle sans fin » / « l'IA n'y arrive pas ». Ce n'était pas un problème difficile, c'était **un
nettoyage incomplet** qu'il fallait terminer **d'un seul coup**, puis valider avec un build complet
avant de pousser.

L'erreur affichée par Vercel (`Property 'onSimulatePremium' is missing ... app/page.tsx:477`) n'était
donc que **la partie visible** : la 1ère erreur d'une pile de 4.

---

## 2. Les 4 erreurs corrigées

| # | Fichier | Cause exacte | Correction |
|---|---------|--------------|------------|
| 1 | `components/ClientDrawer/ClientDrawer.tsx` | L'interface `ClientDrawerProps` exigeait encore `onSimulatePremium`, déstructurait cette prop, et la repassait à `<ClientDashboard>` (qui ne l'accepte plus). C'est **cette** prop manquante que `app/page.tsx:477` signalait. | Retrait de `onSimulatePremium` : interface + déstructuration + passage à `ClientDashboard`. |
| 2 | `components/DriverDrawer/DriverDrawer.tsx` | `<DriverDashboard>` recevait encore `onSimulatePayment` et `onPaySubscription`, absents de `DriverDashboardProps`. | Retrait des deux props (et du lien Orange Money `tel:*144*...` devenu inutile). |
| 3 | `components/AdminDashboard/AdminDashboard.tsx` | Bloc `{activeTab === 'paiements' && (...)}` toujours présent alors que `'paiements'` avait été retiré du type `TabType` → `error TS2367: comparison ... have no overlap`. ~43 lignes de code mort. | Suppression complète du bloc onglet « Paiements ». |
| 4 | `.next/dev/types/validator.ts` (généré) | Type Next.js **périmé** référençant `app/api/verify-payment/route.js`, un fichier supprimé → `error TS2307: Cannot find module`. | Purge du cache `.next` local. Sur Vercel le build est propre, donc ce type n'existe pas : sans impact déploiement. |

**Note :** `ClientDashboard.tsx` et `DriverDashboard.tsx` étaient déjà corrects. Le problème était
**uniquement dans les composants parents (`*Drawer`)** qui n'avaient pas été mis à jour en même temps.

---

## 3. Bonus — cache PWA

Fichier `app/layout.tsx` : la version du « kill-switch » PWA a été passée de `2026-06-28_v5` à
`2026-07-03_v6`. Sans ça, les appareils ayant l'ancienne version en cache (service worker) auraient pu
continuer d'afficher l'app payante malgré le nouveau déploiement. Le bump force un rechargement propre.

---

## 4. Méthode de validation (à reproduire systématiquement)

Ne jamais pousser en espérant que Vercel valide. Vérifier **en local d'abord** :

```bash
# 1. Purger le cache pour éviter les faux positifs de types périmés
rm -rf .next
# 2. La MÊME vérif que Vercel, mais qui affiche TOUTES les erreurs d'un coup
npx tsc --noEmit
# 3. Build complet identique à Vercel
npm run build
```

`tsc --noEmit` est la clé : contrairement au message Vercel qui ne montre que la 1ère erreur, il liste
**toute la pile**. C'est ce qui a permis de voir les 4 erreurs immédiatement au lieu de les découvrir
une par une à chaque redéploiement.

Résultats obtenus : `TSC_EXIT=0` et `BUILD_EXIT=0`. La route `/api/verify-payment` a bien disparu de la
liste des routes générées.

---

## 5. Ce qui reste à faire (hors code)

Le correctif ci-dessus concerne **le code (build)**. Pour que l'app soit gratuite **au niveau des
données**, il faut aussi que `scratch/migration_free.sql` ait été **exécuté dans Supabase** (SQL Editor) :
il met à jour `livreurs_view` pour que `phone_display` affiche toujours le numéro en clair et que
`is_unlocked` soit toujours `true`. Tant que ce script n'est pas appliqué en prod, la vue peut encore
masquer les numéros — même avec un build réussi.

---

### Fichiers modifiés dans le commit `d57ddd0`
- `components/ClientDrawer/ClientDrawer.tsx`
- `components/DriverDrawer/DriverDrawer.tsx`
- `components/AdminDashboard/AdminDashboard.tsx`
- `app/layout.tsx`

*(4 fichiers, +5 / −58 lignes)*
