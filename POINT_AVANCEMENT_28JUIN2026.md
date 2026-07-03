# POINT D'AVANCEMENT — Livraison Rapide

**Date :** 28 juin 2026
**Destinataire :** Chef de projet
**Production :** https://www.livraisonrapide.app
**Version en ligne :** commit `92c41b9` (branche `main`)

---

## Résumé exécutif

Quatre chantiers traités aujourd'hui, **tous livrés et vérifiés en production** :
1. **Déploiement débloqué** — le site servait encore l'ancienne version « sous-région » ; cause identifiée et corrigée. La version Burkina est en ligne.
2. **Documentation technique auditée** — corrigée sur les points de sécurité.
3. **Phase A « publication stores »** — fondations PWA prêtes pour Google Play / App Store.
4. **Installation iOS** — guide d'installation amélioré.

Aucune perte de données. Aucune interruption de service.

---

## 1. Incident de déploiement (résolu)

**Symptôme :** GitHub à jour depuis 2 h, mais le site affichait toujours l'ancienne version.

**Cause :** un retour en arrière par `git push --force` vers un ancien commit **ne déclenche pas** de nouveau déploiement sur Vercel → la production restait figée sur l'ancien build (≈ 2,6 jours).

**Correctif :** un nouveau commit a forcé le redéploiement **et** purgé automatiquement le cache de l'application chez les utilisateurs. Vérifié en ligne (manifeste, titre, en-têtes Vercel).

**À retenir pour l'avenir :** tout futur rollback doit se faire par un **nouveau commit**, jamais par un simple force-push.

📄 Détail complet : `RAPPORT_INCIDENT_DEPLOIEMENT_28JUIN2026.md`

---

## 2. Revue de la documentation technique

La documentation fournie a été confrontée au code réel. Corrections principales :
- La route d'envoi de notifications est **bien sécurisée** (le doc la disait « à auditer »).
- L'exposition des pièces d'identité (CNI) était une **vraie faille déjà corrigée** le 18 juin (le doc la classait en « incertitude »).
- Version réelle : **Next.js 16**, pas 14/15.

---

## 3. Phase A — Publication sur les stores (livrée)

Fondations techniques prêtes pour soumettre l'app sur Google Play et l'App Store :

| Livrable | Statut |
|---|---|
| Jeu d'icônes PNG (192/512 + maskable + 1024 Apple) | ✅ en ligne |
| Manifeste PWA conforme aux stores | ✅ en ligne |
| Page **Politique de confidentialité** (`/confidentialite`) | ✅ en ligne |
| Page + fonction **Suppression de compte** (`/suppression-compte`) — exigence obligatoire d'Apple | ✅ en ligne |

📄 Plan complet de publication (coûts, étapes, pièges) : `ROADMAP_PUBLICATION_STORES.md`

---

## 4. Installation sur iPhone (améliorée)

**Constat franc :** l'installation « 1 clic » automatique, possible sur Android, **n'existe pas sur iPhone** — Apple ne fournit aucune API pour cela. La seule vraie installation type App Store passera par la **Phase C** (app native).

**Ce qui a été fait (meilleure solution web possible) :** le guide d'installation iOS a été rendu beaucoup plus fluide — détection du navigateur (Safari / autres / navigateur intégré type Facebook-Instagram), flèche animée vers le bon bouton, instructions en 3 étapes, et non-réaffichage pendant 7 jours. ✅ en ligne.

---

## 5. État Git & production

| Commit | Contenu | En ligne |
|---|---|---|
| `92c41b9` | Guide d'installation iOS amélioré | ✅ |
| `6cb4df5` | Documentation (incident + roadmap) | ✅ |
| `f257872` | Phase A — fondations PWA stores | ✅ |
| `d4c351b` | Correctif déploiement + purge cache | ✅ |

Dépôt local et GitHub synchronisés. Production vérifiée (toutes les nouvelles URLs répondent, le nouveau code est bien servi).

---

## 6. Décisions / actions attendues

**Validations rapides :**
- [ ] Confirmer les **coordonnées de contact** affichées dans la politique de confidentialité (e-mail + téléphone).
- [ ] Tester la **suppression de compte** avec un compte jetable (action définitive — jamais sur un vrai compte).
- [ ] Supprimer la route de debug `app/api/test-cookies/` (présente en local, non déployée).

**Décisions de fond (publication mobile) :**
- [ ] **Bloqueur n°1 — paiement :** le système actuel (capture d'écran + lecture IA) est fragile et risque le **rejet** par les stores. Recommandation : intégrer un vrai paiement Mobile Money (Orange/Moov) avant soumission.
- [ ] **Phase B (Android)** : ouvrir le compte Google Play (**25 $, paiement unique**) pour lancer la mise en boutique. Voie rapide recommandée.
- [ ] **Phase C (iOS)** : compte Apple (**99 $/an**) + build cloud, pour une vraie app App Store. Phase 2.

> Rappel marché : l'Afrique de l'Ouest est à **~85 % Android** → prioriser Google Play donne le meilleur retour pour un coût minimal.

---

*Point établi le 28 juin 2026 à partir de l'état exact du code et de mesures effectuées en production.*
