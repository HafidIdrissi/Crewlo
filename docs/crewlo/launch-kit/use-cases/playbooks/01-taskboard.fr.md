# TaskBoard — de l’idée à une application utilisable

**L’histoire à montrer :** « J’ai une idée simple. Je crée trois agents dans Crewlo, je leur donne des responsabilités précises, et je teste le produit qu’ils construisent. »

**Résultat cible :** une application locale dans le navigateur, avec ajout de tâches, trois statuts, filtres et sauvegarde après rechargement. Le résultat attendu est interactif : on crée réellement une tâche et on retrouve sa modification.

**Équipe :** `TaskBoard Produit`, `TaskBoard Dev`, `TaskBoard QA`. Suis d’abord le [guide de création des agents](DEMARRER.fr.md). Dossier commun proposé : `C:\Projects\crewlo-demos\taskboard`.

## Étape 1 — Transformer l’idée en mission réalisable

**Agent : TaskBoard Produit.** Colle ce prompt dans sa conversation.

```text
MISSION : cadrer TaskBoard, un gestionnaire personnel de tâches local.

UTILISATEUR : un indépendant veut savoir ce qu’il doit faire aujourd’hui.
PARCOURS : ouvrir l’app, saisir une tâche, la retrouver dans « À faire », la passer à « En cours » puis « Terminée », filtrer et recharger la page.

PÉRIMÈTRE V1 :
- Ajouter une tâche avec titre obligatoire, espaces seuls refusés et longueur maximale de 120 caractères.
- Trois statuts : À faire, En cours, Terminée. Une tâche peut revenir au statut précédent.
- Filtrer Toutes / À faire / En cours / Terminée, avec compteurs cohérents.
- Supprimer une tâche avec confirmation simple.
- Sauvegarder dans localStorage et restaurer après rechargement.
- Traiter une donnée sauvegardée invalide et un stockage indisponible sans écran blanc ni message trompeur de sauvegarde réussie.
- Interface française, responsive, formulaires nommés, navigation clavier et focus visibles.
- Bouton explicite « Charger un exemple », seulement quand la liste est vide. Ne jamais injecter silencieusement des tâches au démarrage.

TECHNIQUE : inspecte le dossier. S’il est vide, prévois React + TypeScript + Vite, CSS simple et Vitest pour les règles métier. Choisis des versions compatibles avec le Node installé. Aucun serveur de données, compte ou synchronisation distante dans cette V1.

LIVRABLES : crée docs/brief.md avec 1) besoin, 2) périmètre, 3) modèle Task {id, title, status, createdAt}, 4) états d’erreur, 5) fichiers envisagés, 6) critères d’acceptation numérotés, 7) commandes de lancement et de vérification prévues. Crée docs/recette.md avec les manipulations à faire dans le navigateur.

Ne code pas l’application. Fais les choix simples toi-même. Termine par un résumé en 8 lignes maximum et les deux chemins produits.
```

**À montrer :** l’envoi de la mission, l’agent sélectionné, puis `docs/brief.md` réellement créé.

**Passage à la suite :** le brief couvre notamment les trois statuts, la persistance et les critères vérifiables. Si le plan ajoute des comptes ou une base distante, fais retirer cet ajout avant la construction.

## Étape 2 — Construire une première version complète

**Agent : TaskBoard Dev.** Produit a terminé ; tu passes maintenant la main.

```text
MISSION : implémenter le MVP décrit dans docs/brief.md. Lis aussi docs/recette.md et inspecte les fichiers existants avant de créer quoi que ce soit.

Construis une version fonctionnelle complète de TaskBoard. Si le dossier ne contient que docs/, initialise l’application dans ce même dossier en préservant ces documents. Réutilise React + TypeScript + Vite et une feuille CSS simple si le brief confirme ce choix.

Organisation proposée, adaptable si tu expliques pourquoi :
- src/domain/tasks.ts : types, transitions et filtres.
- src/storage/tasks.ts : lecture, validation et écriture du stockage.
- src/App.tsx et petits composants : formulaire, compteurs, filtres, cartes.
- src/styles.css : mise en page responsive, focus et états vides.
- src/domain/*.test.ts et src/storage/*.test.ts : contrôles utiles.

Attention au premier rendu : ne sauvegarde pas une liste vide avant d’avoir chargé les tâches existantes. Une donnée corrompue doit être signalée ; ne l’écrase pas automatiquement. Prévois une réinitialisation explicitement confirmée. Si l’écriture est refusée, garde l’état utilisable en mémoire et signale que le rechargement peut perdre les modifications.

Rends utilisables npm run dev, npm run build, npm run typecheck et npm run test:run. Installe les dépendances nécessaires, conserve le lockfile et exécute ces trois dernières vérifications. Les scripts doivent terminer avec un code d’erreur en cas d’échec ; test:run ne reste pas en mode watch.

Style : fond clair, cartes lisibles, accents verts, trois colonnes sur écran large et présentation adaptée sur mobile. Les statuts doivent être compréhensibles sans leur couleur. Utilise uniquement des exemples fictifs.

Crée docs/handoff-dev.md avec les fichiers modifiés, commandes exactes, résultats réellement obtenus, clé localStorage, limites et procédure de lancement. Donne l’URL uniquement après démarrage effectif ; sinon donne la commande à lancer. Termine ton intervention pour que QA puisse travailler sans écritures concurrentes.
```

**À montrer :** une courte séquence du terminal pendant le travail, puis l’application ouverte à l’adresse réellement annoncée.

**Passage à la suite :** la page s’ouvre, on peut saisir une tâche, `docs/handoff-dev.md` existe. Un échec de build reste un travail à terminer par Dev.

## Étape 3 — Vérifier le produit avec un autre regard

**Agent : TaskBoard QA.** Envoie seulement quand Dev a terminé.

```text
MISSION : effectuer la recette de TaskBoard à partir de docs/brief.md, docs/recette.md et docs/handoff-dev.md.

Lis le code puis exécute npm run typecheck, npm run test:run et npm run build. Complète les tests utiles avec l’outillage déjà installé. Vérifie les transitions, filtres, titres invalides, lecture/écriture de sauvegarde et données corrompues. Une simple simulation de localStorage en test unitaire ne suffit pas à prouver le rechargement de l’application dans un vrai navigateur.

Si tu disposes d’un navigateur pilotable, effectue ce parcours avec un espace de test vierge :
1. Vérifier l’état vide. Refuser un titre uniquement composé d’espaces.
2. Créer « Préparer la démo », « Tester sur mobile » et « Rédiger le README ».
3. Passer la première tâche à En cours, la deuxième à Terminée.
4. Vérifier chaque filtre et les compteurs, puis recharger la même URL.
5. Vérifier que les trois tâches et leurs statuts sont conservés.
6. Annuler une suppression, vérifier que la tâche reste, puis confirmer la suppression et recharger.
7. Vérifier un titre long, la navigation clavier et une largeur de 390 px.
8. Dans ce profil de test seulement, vérifier le comportement sur stockage corrompu et sauvegarde refusée ; expliquer comment ces cas ont été déclenchés.

Si le navigateur n’est pas disponible, fournis la recette manuelle et marque ces lignes NON TESTÉ. Ne modifie pas le code applicatif ni les dépendances.

Écris docs/qa-1.md : pour chaque critère, PASS / FAIL / NON TESTÉ, preuve, commande ou manipulation. Pour un défaut, donne un identifiant BUG-01, les étapes exactes, attendu, observé et gravité. Termine par les défauts bloquants et la mission précise à transmettre à Dev.
```

**Passage à la suite :** lis le rapport. Les captures et sorties de terminal doivent correspondre à cette version du produit. S’il n’y a aucun défaut, passe à l’étape 5 ; si des contrôles sont NON TESTÉ, effectue-les avant la recette finale.

## Étape 4 — Corriger ce qui a effectivement échoué

**Agent : TaskBoard Dev.** Cette étape est conditionnelle : ne crée pas un bug pour rendre la vidéo plus spectaculaire.

```text
MISSION : corriger les défauts réels recensés dans docs/qa-1.md.

Lis le rapport et reproduis chaque défaut avant de modifier son code. Pour chaque BUG confirmé, effectue la correction la plus ciblée et ajoute ou ajuste le test de non-régression approprié. Ne change pas les assertions pour masquer une erreur du produit. Si une observation n’est pas reproductible, indique tes tentatives et les informations manquantes.

Exécute npm run typecheck, npm run test:run et npm run build. Mets à jour docs/handoff-dev.md et crée docs/corrections.md avec, pour chaque BUG, sa cause, les fichiers touchés et les contrôles relancés. N’ajoute aucune fonctionnalité. Termine le travail avant de repasser à QA.
```

**Si le seul blocage est une vérification manuelle :** fais les manipulations, puis transmets à QA les résultats observés avec le navigateur, l’URL et la date. N’envoie pas un simple « tout marche ».

## Étape 5 — Prononcer une recette finale

**Agent : TaskBoard QA.**

```text
MISSION : décider si TaskBoard est prêt pour une démonstration locale.

Relis docs/qa-1.md, docs/handoff-dev.md et docs/corrections.md si ce fichier existe. Rejoue les cas corrigés, puis le parcours ajouter → changer le statut → filtrer → recharger → supprimer. Utilise les tests et ton navigateur si disponibles. Les contrôles manuels transmis par l’utilisateur doivent être attribués à l’utilisateur, sans prétendre les avoir exécutés toi-même.

Écris docs/recette-finale.md avec la version contrôlée (commit s’il existe, sinon date et fichiers contrôlés), chaque critère et son état, les commandes exécutées et les limites. Si l’état du code a changé depuis un test, refais le contrôle concerné.

Décision : PRÊT POUR DÉMO LOCALE seulement si tous les critères critiques ont été vérifiés, sans défaut bloquant. Sinon indique PRÊT SOUS RÉSERVES ou BLOQUÉ et la liste exacte des actions restantes. N’annonce pas « production-ready ».
```

**Passage à la suite :** ajout, transitions, filtres, suppression et persistance doivent fonctionner réellement. Une démo ne se termine pas uniquement sur des tests unitaires verts.

## Étape 6 — Livrer le projet et préparer sa présentation

**Agent : TaskBoard Produit.**

```text
MISSION : préparer la livraison locale de TaskBoard à partir du code réel, docs/brief.md, docs/handoff-dev.md et docs/recette-finale.md.

Rédige README.md : à quoi sert l’app, prérequis réellement utilisés, installation depuis le lockfile, lancement, commandes de vérification, données stockées dans ce navigateur et limites connues. Reprends les scripts effectivement présents dans package.json.

Rédige docs/demo-60s.md avec les actions à montrer : état vide, saisie d’une tâche, passage à En cours, filtre, rechargement et persistance. Mentionne les preuves de recette disponibles et les réserves. N’invente ni temps de construction, nombre de tests réussis, utilisateurs ou témoignages.

Termine par un récapitulatif : ce qui fonctionne, comment essayer, ce qui reste limité. Conserve la distinction entre prototype personnel local et application synchronisée entre utilisateurs.
```

## Étape 7 — Faire toi-même la démonstration finale

1. Démarre l’app avec la commande du README et ouvre l’URL affichée.
2. Crée « Publier ma première démo Crewlo ».
3. Passe la tâche à En cours, sélectionne le filtre correspondant.
4. Recharge la page : retrouve la tâche et son statut.
5. Passe-la à Terminée, puis montre le filtre Terminée.
6. Montre brièvement le rapport de recette et le README.

**Phrase de fin :** « Voilà le résultat : une application que je peux utiliser, avec le code, les instructions et les vérifications. Dans Crewlo, j’ai gardé chaque mission et chaque réponse avec l’agent responsable. »

Le produit est prêt pour cette démonstration quand ce parcours réussit. Son ouverture dans le navigateur local termine le premier scénario ; un hébergement public peut devenir un épisode séparé.

## Bonus — Demander un bilan depuis Telegram

Effectue ce bonus après la livraison, avec un agent déjà connecté. Configure Telegram depuis Crewlo, termine l’appairage sur le bureau et garde le PC éveillé. Utilise `/agents`, puis `/agent <id>` avec l’identifiant effectivement listé de TaskBoard Dev.

```text
Lis docs/handoff-dev.md et docs/recette-finale.md s’ils existent. Résume en cinq lignes ce qui fonctionne, les contrôles effectués et les limites de TaskBoard. Ne modifie rien. Si un fichier est absent ou inaccessible, dis-le plutôt que d’inventer un avancement.
```

Compare la réponse dans Telegram et dans Conversation avant d’inclure cette séquence dans une vidéo. Le précédent échange Telegram vérifié dans Crewlo ne valide pas à lui seul ce nouveau scénario sur le MVP.

## Si tu veux ensuite enrichir le produit

Un deuxième épisode peut ajouter des dates d’échéance, la recherche ou un export JSON. Choisis une seule évolution, fais écrire ses critères par Produit, implémenter par Dev et vérifier par QA. La synchronisation entre appareils nécessite un autre périmètre avec serveur et gestion d’accès.
