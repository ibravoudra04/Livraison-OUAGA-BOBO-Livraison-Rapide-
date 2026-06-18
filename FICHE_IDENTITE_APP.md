# 🪪 FICHE D'IDENTITÉ — Livraison Rapide (Ouaga & Bobo)
*Audit Phase 1 — 11 juin 2026. Base de données consultée en LECTURE SEULE uniquement.*

## 1. Le concept en 5 lignes
Livraison Rapide est une application web (qui s'installe comme une appli mobile) qui met en relation,
en temps réel et sur une carte, des **clients** qui cherchent un livreur et des **livreurs indépendants**
à Ouagadougou et Bobo-Dioulasso. Le client voit les livreurs disponibles autour de lui, puis paie une
petite somme (500 FCFA via Orange Money) pour débloquer le numéro et appeler/discuter avec le livreur.
Ce n'est PAS une app de commande de repas : c'est un **annuaire géolocalisé de livreurs** que l'on contacte directement.

## 2. Les profils / rôles et ce que chacun peut faire

| Rôle | Ce qu'il peut faire |
|------|---------------------|
| **Visiteur (non connecté)** | Voir la carte (floutée tant qu'il n'a pas payé l'accès 500 F), choisir sa ville, se géolocaliser, lancer "Détecter un livreur". |
| **Client** | S'inscrire (téléphone + code secret), voir les profils de livreurs, payer 500 F pour débloquer un numéro, **discuter par chat**, appeler, laisser un avis (étoiles), signaler un problème, passer **Premium** (5000 F/mois = accès illimité). |
| **Livreur** | S'inscrire avec photos (CNI recto/verso + selfie), attendre la validation de l'admin, gérer son tableau de bord (statut en ligne, position GPS, compteur de contacts, avis reçus), **répondre aux clients par chat**, payer son abonnement (500 F/semaine après 4 contacts gratuits). |
| **Administrateur** | Tout superviser : valider/suspendre/supprimer les livreurs, décerner le badge "Vérifié", gérer les clients et leur Premium, lire toutes les discussions, voir les statistiques et revenus, gérer les litiges, publier des annonces, envoyer des notifications push à tous, voir les reçus de paiement. |

> Compte admin réel détecté : **67370909@livraison.com** (numéro 67 37 09 09, code 1234). C'est le seul vrai admin.

## 3. Le parcours complet de A à Z

1. **Arrivée** : le visiteur ouvre l'app → écran d'accueil avec une loupe géante → choisit sa ville (ou géoloc auto).
2. **Carte floutée** : la carte des livreurs est floutée. Pour la voir, le visiteur doit "Utiliser les services — 500 FCFA" :
   il compose le code Orange Money, fait une **capture d'écran du SMS de confirmation**, et l'envoie. Une **IA (Google Gemini)**
   lit la capture et vérifie que le paiement de 500 F a bien été fait au bon numéro. Si oui, la carte se débloque (3 livreurs consultables).
3. **Choisir un livreur** : le visiteur/client clique sur un repère → fiche du livreur (photo, véhicule, note, distance, téléphone).
4. **Contact** : bouton "Appeler" ou "Discuter (Chat)". Le chat exige d'être connecté.
5. **Inscription client** : téléphone + nom + code secret (PIN). Pas d'email, pas de SMS de vérification.
6. **Chat temps réel** : messages instantanés entre client et livreur, avec photos, fichiers et partage de position GPS.
   Une **notification push** est envoyée au destinataire.
7. **Avis** : après contact, le client peut noter le livreur (1 à 5 étoiles + commentaire).
8. **Côté livreur** : il s'inscrit avec ses pièces → statut "en attente" → l'admin vérifie ses documents → l'admin valide → il passe "actif"
   et apparaît sur la carte. Il reçoit les messages des clients dans son tableau de bord.
9. **Modèle économique** : client paie 500 F par accès (ou 5000 F/mois Premium) ; livreur a 4 contacts gratuits puis 500 F/semaine.
   ⚠️ **Période de lancement gratuite jusqu'au 1er juillet 2026** : actuellement tout est débloqué pour tout le monde.

## 4. Liste exhaustive des fonctionnalités (navigation + code + base de données)

**Carte & recherche** : carte Leaflet temps réel, switch Ouaga/Bobo, géolocalisation, filtrage par distance (5 km),
détection du livreur le plus proche, compteur de livreurs en ligne, marqueurs animés.

**Paiement** : simulateur Orange Money, vérification automatique de reçu par IA Gemini, anti-fraude (un reçu = un seul usage),
limite de 5 tentatives puis renvoi vers le support WhatsApp, abonnement Premium client, abonnement hebdo livreur (affiché mais bouton non finalisé).

**Comptes** : inscription/connexion client, inscription/connexion livreur (avec upload de photos compressées),
connexion admin par numéro spécial, sessions persistantes.

**Communication** : chat temps réel client↔livreur, envoi photo/fichier, partage de position, notifications push (web-push/VAPID),
annonces globales in-app, signalement de problème.

**Avis & réputation** : notation par étoiles, badge "Vérifié" décerné par l'admin, moyenne affichée.

**Espace admin** : 11 onglets — vue globale, discussions, livreurs, clients, candidatures en attente, abonnements,
analytiques 14 jours (graphiques), statistiques plateforme (revenus/clics/visites), litiges, reçus de paiement,
configuration & tarifs ; export CSV des livreurs et clients ; broadcast push.

**Technique** : PWA installable, service worker, masquage du téléphone côté serveur (vue SQL sécurisée).

## 5. Écarts et bizarreries détectés (avant même les tests)

🔴 **1. Le système d'avis est cassé (code ≠ base).** Le code envoie une colonne `rating`, mais la table `avis` n'a
PAS cette colonne — elle s'appelle `stars`. De plus la colonne `text` est obligatoire alors que le commentaire est facultatif
dans le formulaire, et la colonne obligatoire `stars` n'est jamais remplie. **Conséquence : enregistrer un avis échouera à coup sûr.**
La table `avis` est d'ailleurs vide (0 ligne) — cohérent avec un système qui n'a jamais fonctionné.

🟠 **2. Détection de l'admin trop permissive côté affichage.** L'app considère quelqu'un comme admin si son
`user_metadata.role = admin` OU si son téléphone contient 67370909. Or `user_metadata` est modifiable par l'utilisateur
lui-même. Quelqu'un pourrait donc s'auto-déclarer admin et voir s'ouvrir le tableau de bord admin. **Bonne nouvelle :**
la base (RLS) ne fait confiance qu'à `app_metadata`, donc il verrait un tableau **vide** et ne pourrait rien lire d'important.
**Mais** une exception existe : la table `push_subscriptions` autorise encore la lecture via `user_metadata` → un faux admin
pourrait lire les abonnements push de tous les utilisateurs. À corriger.

🟠 **3. Tous les numéros de livreurs sont publics en ce moment.** À cause de la période gratuite jusqu'au 1er juillet 2026,
la vue affiche le numéro de TOUS les livreurs à n'importe quel visiteur (vérifié en lecture seule : `is_unlocked=true` pour tout le monde).
C'est voulu pour le lancement, mais à garder en tête : après le 1er juillet, le masquage reprendra automatiquement.

🟡 **4. 300 abonnements push pour 39 comptes.** Beaucoup d'abonnements périmés s'accumulent. Sans nettoyage, les envois
de notifications deviendront lents et partiellement inutiles.

🟡 **5. Champs "Tarifs" dans l'admin non connectés.** Les champs de configuration des prix (500 F, 5000 F, 500 F) affichent
"Paramètres sauvegardés !" mais ne sauvegardent rien (valeurs codées en dur).

🟡 **6. Bouton "Régler mon abonnement (500 FCFA)" du livreur** : présent mais sans action derrière (non finalisé).

🟡 **7. Onglet "Litiges" de l'admin** : la fonction `resolveTicket` existe mais l'interface de cet onglet n'est pas affichée
dans le code lu (à vérifier en test).

ℹ️ **Bizarrerie d'architecture** : il y a deux systèmes de paiement séparés (l'écran 500 F de la carte ET un "PaymentSimulator"
réutilisable pour le Premium/abonnements). Les deux passent par l'IA Gemini.

## 6. État de la base de données (constaté en lecture seule)

| Table | Lignes | Rôle |
|-------|--------|------|
| `livreurs` | 33 | Profils livreurs (29 actifs, 4 en attente ; 32 Ouaga, 1 Bobo ; 6 vérifiés) |
| `clients_livraison` | 2 | Profils clients |
| `chats_livraison` | 1 | Messages du chat |
| `paiements` | 2 | Reçus validés par l'IA (pas de doublon, anti-fraude OK) |
| `tickets_support` | 1 | Signalements |
| `push_subscriptions` | 300 | Abonnements notifications (trop nombreux, voir écart n°4) |
| `deblocages` | 0 | Vide (normal : période gratuite) |
| `avis` | 0 | Vide (cohérent avec le bug n°1) |
| `annonces` | 0 | Vide |

**Sécurité RLS (testée) :** un visiteur non connecté ne peut lire **aucune** table directement (isolation correcte ✓).
Le numéro brut des livreurs n'est pas exposé par la vue (masquage correct ✓, hors période gratuite). Aucun déblocage ni chat orphelin.
Liens entre tables (client↔livreur↔déblocage↔chat) cohérents.

---

## 7. PLAN DE TEST (Phase 2) — profil par profil

### A. Visiteur / paiement d'accès
- [ ] Chargement de la carte, switch Ouaga/Bobo, géolocalisation, compteur de livreurs
- [ ] Bouton "Détecter un livreur" sans livreur / avec livreurs
- [ ] Écran de paiement 500 F : reçu valide / reçu invalide / reçu déjà utilisé / 5 tentatives → support
- [ ] Vérifier en base qu'un paiement valide crée bien une ligne `paiements`

### B. Client
- [ ] Inscription (champs vides, téléphone invalide, numéro déjà pris)
- [ ] Connexion (bon PIN / mauvais PIN)
- [ ] Consulter une fiche livreur, appeler, ouvrir le chat
- [ ] **Envoyer un vrai message de test** et vérifier qu'il arrive au livreur + stocké en base `chats_livraison`
- [ ] **Laisser un avis** (test du bug n°1 — devrait échouer) + vérifier la base
- [ ] Passer Premium (jusqu'à l'écran de paiement, SANS payer pour de vrai)
- [ ] Historique "livreurs consultés" et "discussions récentes"

### C. Livreur
- [ ] Inscription complète avec photos (cas déjà corrigé : numéro déjà inscrit)
- [ ] Connexion, tableau de bord, statut, compteur de contacts
- [ ] Réception d'un message client en temps réel
- [ ] Affichage des avis reçus

### D. Administrateur
- [ ] Connexion admin (67 37 09 09 / 1234)
- [ ] Valider une candidature en attente, suspendre, décerner/retirer le badge Vérifié
- [ ] Voir les discussions, les stats, les analytiques, les reçus, les litiges
- [ ] Export CSV livreurs/clients
- [ ] Publier une annonce + vérifier qu'elle s'affiche chez un visiteur
- [ ] Envoyer une notification push de test
- [ ] Tester l'onglet Litiges (résolution d'un ticket)

### E. Cas d'erreur transverses
- [ ] Email/téléphone invalide, champs vides, mauvais mot de passe
- [ ] Chat/avis sans être connecté
- [ ] Isolation : un client peut-il lire les données d'un autre client / d'un livreur ? (test avec compte connecté)

> **Pour la Phase 2 il me faut des comptes de test** (ou votre accord pour que j'en crée) :
> 1 client de test, 1 livreur de test. L'admin réel existe déjà (je l'utiliserai en lecture seule, sans rien casser).
> Je ne ferai **aucun vrai paiement** et je supprimerai les données de test (messages, comptes) à la fin.
