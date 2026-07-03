# RAPPORT — Problème de géolocalisation (« Recherche automatique »)

**Projet :** Livraison Rapide (Ouaga & Bobo)
**Date :** 28 juin 2026
**Destinataire :** Chef de projet
**Production :** https://www.livraisonrapide.app

---

## 1. Le problème signalé

Objectif fonctionnel voulu : quand un utilisateur clique sur **« Lancer la recherche »** puis **« Recherche automatique »**, il doit être **géolocalisé automatiquement** afin de lui présenter les livreurs **les plus proches**.

Symptôme constaté : au clic sur « Recherche automatique », l'app affiche **« Permission refusée, activez le GPS et autorisez le navigateur »** — et **aucune fenêtre de demande** d'autorisation n'apparaît. Cela se produit aussi bien sur le téléphone principal que sur **iPhone**. D'après le propriétaire, **l'ancienne version (avant la migration Next.js)** ne posait pas ce problème.

---

## 2. Diagnostic (vérifié sur le code et en production)

| Hypothèse | Verdict |
|---|---|
| Le header de sécurité `Permissions-Policy` bloque la géoloc | ❌ **Non.** La valeur en production est `geolocation=(self)`, qui **autorise** la géoloc sur le site. Confirmé par mesure directe des en-têtes. |
| Le site n'est pas en HTTPS | ❌ Non. La production est bien en HTTPS (HSTS actif). |
| Le code appelle la géoloc trop tard (hors « geste utilisateur ») | ❌ Non. Le code appelait déjà `getCurrentPosition` de façon synchrone au clic. |
| **L'appareil/navigateur a refusé la permission** | ✅ **Oui — c'est la cause.** Le code d'erreur renvoyé (`1`) signifie « permission refusée ». |

**Conclusion :** ce n'est **pas** un bug bloquant du code, ni le header de sécurité. Le `code 1` signifie que **le navigateur ou l'appareil a refusé** l'accès à la position. Le cas le plus fréquent quand « ça marchait avant » : un **« Refuser » mémorisé** par Safari/Chrome, qui **ne redemande plus** ensuite ; ou le **Service de localisation désactivé** ; ou un test effectué sur une **adresse non sécurisée** (`http://…`).

> ⚠️ Point important à transmettre : **aucun code ne peut forcer l'autorisation** de géolocalisation. C'est une protection volontaire des navigateurs. Si l'utilisateur (ou l'appareil) a bloqué l'accès, il doit le réautoriser lui-même.

---

## 3. Ce qui a été corrigé / amélioré

Centralisation de la géolocalisation dans un module unique, branché sur les deux boutons (« Recherche automatique » et « Ma position » sur la carte) :

1. **Fiabilisation anti-régression (iOS)** : la demande de position part **immédiatement** au clic — plus aucun risque qu'une évolution future casse l'autorisation sur Safari.
2. **Détection d'une connexion non sécurisée** : si l'app est ouverte en `http://` (cas typique d'un test sur le réseau local), un message clair invite à passer en `https://` — au lieu d'un faux « permission refusée ».
3. **Messages d'erreur précis et utiles** : selon la cause, l'utilisateur reçoit désormais **les étapes exactes pour réautoriser** la localisation (procédure iPhone / procédure Android), au lieu d'un message vague.
4. Repli automatique haute précision → basse précision en cas de signal faible.

**Effet attendu :** si la permission n'est pas bloquée, la fenêtre de demande s'affiche normalement et la recherche automatique fonctionne. Si elle est bloquée, l'utilisateur sait **exactement quoi faire** pour la rétablir.

---

## 4. Comment tester (à faire par l'équipe)

1. Ouvrir **https://www.livraisonrapide.app** (jamais via une adresse `http://`).
2. Si « Refuser » avait déjà été touché auparavant sur iPhone : *Réglages → Safari → Effacer historique et données de sites* (ou utiliser une fenêtre de navigation privée), puis réessayer → la fenêtre de demande doit réapparaître.
3. Vérifier que le **Service de localisation** de l'appareil est activé pour le navigateur.

---

## 5. Fichiers concernés

- `utils/geolocation.ts` *(nouveau)* — module de géolocalisation robuste.
- `app/page.tsx` — branchement des boutons « Recherche automatique » et « Ma position ».

**Statut :** ✅ Code écrit et **compilé sans erreur**. ⏳ **Pas encore déployé** en production (en attente de validation pour mise en ligne).

---

*Rapport établi le 28 juin 2026 à partir de l'état exact du code et de mesures effectuées en production.*
