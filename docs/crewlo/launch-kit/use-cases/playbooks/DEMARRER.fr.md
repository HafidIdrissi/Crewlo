# Construire un MVP avec Crewlo, du premier agent à la démo

Ce kit prolonge les courtes vidéos de cas d’usage par trois parcours exécutables. Tu crées les agents, tu copies leurs missions dans l’ordre, tu ouvres le produit obtenu et tu vérifies le résultat. Les durées ci-dessous sont des budgets de séance proposés, pas des performances mesurées de Crewlo.

Les guides et scripts sont prêts. Les applications décrites doivent encore être construites et vérifiées avec tes agents : aucun résultat de build, de test ou de collaboration en direct n’est inventé dans ce kit.

## Choisir ton premier projet

| Parcours | À la fin, tu peux… | Équipe | Budget de séance indicatif |
| --- | --- | --- | --- |
| [TaskBoard](01-taskboard.fr.md) | Ajouter, terminer, filtrer et retrouver des tâches après rechargement | Produit, Dev, QA | 45–90 min |
| [ClientFlow](02-clientflow.fr.md) | Suivre des prospects, changer leur étape et sauvegarder un portefeuille local | Produit, Dev, QA | 60–120 min |
| [LaunchPage](03-launchpage.fr.md) | Montrer une offre et enregistrer des inscriptions dans un serveur local | Produit, Dev, QA | 60–120 min |

Pour la première vidéo, choisis **TaskBoard** : on comprend le résultat en quelques secondes et on peut prouver chaque fonction à l’écran. ClientFlow rend la démonstration plus proche d’un usage professionnel. LaunchPage ajoute un vrai échange navigateur–serveur.

## 1. Préparer le dossier du projet

Crée un dossier neuf, distinct du code source de Crewlo, par exemple `C:\Projects\crewlo-demos\taskboard`. Utilise `clientflow` ou `launchpage` pour les autres parcours. Chaque application a son propre dossier.

Vérifie que le CLI que tu utilises déjà est connecté à ton compte et peut lire un petit fichier de ce dossier. Crewlo ouvre les sessions de ces CLIs ; leur abonnement ou leur consommation reste celui de ton fournisseur. Pour les projets proposés, prévois Node.js et npm disponibles dans le terminal de l’agent. Les agents choisissent des versions de dépendances compatibles avec l’environnement et conservent le fichier de verrouillage obtenu.

## 2. Créer les trois agents

Ouvre le formulaire **Create agent**. Les sections actuelles sont **Identity**, **Workspace**, **Engine** et **Briefing**. Les libellés peuvent être traduits selon la langue de l’application.

Pour chaque rôle :

1. Dans **Identity**, donne un nom reconnaissable, par exemple `TaskBoard Produit`. Le personnage est au choix.
2. Dans **Workspace**, sélectionne le dossier de ton application. Les trois agents utilisent exactement ce même dossier. Laisse l’isolation Git désactivée pour ce parcours séquentiel et ne renseigne pas de session à reprendre.
3. Dans **Engine**, sélectionne un CLI déjà authentifié et un modèle disponible dans ta configuration. Tu peux utiliser le même fournisseur pour les trois agents.
4. Dans **Briefing**, remplis Description et Goal avec le rôle ci-dessous, ou importe sa fiche JSON.
5. Clique **Create agent**, puis vérifie que sa session est prête. Crée de préférence chaque agent au moment de sa première mission.

| Rôle | Description | Responsabilité |
| --- | --- | --- |
| Produit | Cadre le MVP et prépare sa livraison | Le brief, les critères d’acceptation, le parcours utilisateur et le README final |
| Dev | Construit le produit et corrige les défauts | Le code de l’application, son installation et son démarrage |
| QA | Vérifie les comportements et documente les preuves | Les tests, les anomalies reproductibles et le rapport de recette |

### Rôle permanent de Produit

```text
Tu es le responsable produit de ce projet. Travaille seulement sur la mission explicite reçue. Sans mission, réponds que tu es prêt et attends. Lis les fichiers avant de proposer un changement. Transforme le besoin en petit périmètre réalisable, parcours utilisateur et critères d’acceptation observables. Tu peux écrire les briefs, la documentation et le scénario de démo. Ne modifie pas le code de l’application. Réutilise les décisions présentes dans docs/brief.md. Termine chaque mission par les fichiers produits, les choix faits et le prochain transfert. Ne crée pas d’autres agents et ne lance pas de travail récurrent. N’annonce comme exécuté que ce que tu as réellement vérifié.
```

### Rôle permanent de Dev

```text
Tu es le développeur de ce projet. Travaille seulement sur la mission explicite reçue. Sans mission, réponds que tu es prêt et attends. Lis docs/brief.md puis inspecte le dossier. Construis le plus petit produit utilisable qui respecte les critères. Réutilise les outils déjà présents. Tu es le seul propriétaire du code applicatif et des dépendances. Écris un code lisible, traite les erreurs et vérifie tes modifications. À la fin, indique les fichiers changés, les commandes réellement exécutées, leur résultat et comment ouvrir l’application. Consigne le passage de relais dans docs/handoff-dev.md. Ne crée pas d’autres agents, ne lance pas de travail récurrent et n’élargis pas le périmètre.
```

### Rôle permanent de QA

```text
Tu es le responsable qualité de ce projet. Travaille seulement sur la mission explicite reçue. Sans mission, réponds que tu es prêt et attends. Lis docs/brief.md et docs/handoff-dev.md. Vérifie le comportement observable, les erreurs et la persistance avec des données fictives. Tu peux ajouter ou améliorer les tests et écrire les rapports de recette. Ne change pas le code applicatif ni les dépendances : transmets ces corrections au développeur. N’ajoute aucun outil payant. Sépare clairement PASS, FAIL et NON TESTÉ. Pour chaque anomalie, donne les étapes de reproduction, attendu, observé et gravité. Réexécute les contrôles concernés après correction. Ne crée pas d’autres agents et ne lance pas de travail récurrent.
```

### Importer les rôles plus vite

Dans **Advanced · import an agent setup**, utilise le bouton d’import de fichier avec l’une des fiches : [Produit](agents/produit.json), [Dev](agents/dev.json), [QA](agents/qa.json). L’import préremplit le formulaire ; il reste à choisir le dossier, vérifier Engine, personnaliser le nom et créer l’agent. Les fiches ne fixent ni fournisseur ni modèle : elles reprennent la configuration locale. Elles ne créent pas toute l’équipe automatiquement.

## 3. Envoyer chaque prompt au bon agent

Sélectionne le personnage ou la fiche de l’agent, ouvre sa conversation et vérifie le nom du destinataire dans son compositeur. Colle la mission et envoie-la. Au besoin, son terminal permet d’inspecter les commandes et les demandes d’autorisation.

Le grand compositeur global peut passer par le coordinateur. Pour ce premier tutoriel, privilégie la conversation de l’agent nommé dans l’étape : tu conserves le contrôle du passage de relais, même si le routage automatique de ton fournisseur n’est pas disponible.

**Ordre : Produit → Dev → QA → Dev si nécessaire → QA → Produit.** Attends la fin d’une mission avant de démarrer la suivante. Cette règle évite les modifications concurrentes dans le dossier partagé. Les prompts disent quels fichiers lire : les agents n’ont pas besoin de partager automatiquement leur historique de conversation.

Dans chaque guide, le bloc « Passage à la suite » est ton repère. Si le fichier attendu manque, fais terminer cette étape avant d’envoyer le prompt suivant.

## 4. Débloquer les incidents courants

| Ce que tu observes | Ce que tu fais |
| --- | --- |
| Message en file d’attente | Vérifie le destinataire, une session occupée, une saisie non envoyée ou un sélecteur ouvert dans son terminal. |
| Message delivery paused | Utilise Resume sur le bureau, puis vérifie que le message a été traité avant de le renvoyer. |
| Le fournisseur demande une connexion ou une autorisation | Termine l’étape correspondante dans le terminal ou l’interface d’approbation, puis reprends la mission. |
| « Terminé » mais aucun fichier de livraison | Demande les chemins exacts et l’écriture du document manquant. |
| Un serveur est annoncé mais l’URL ne répond pas | Demande la sortie réelle du lancement et vérifie que le processus reste actif. |
| Port déjà utilisé | Utilise un autre port local libre et fais corriger le README. |
| QA ne peut pas ouvrir un navigateur | Fais toi-même la recette décrite. Le rapport doit garder NON TESTÉ jusqu’à ton retour. |
| L’agent a créé un worktree isolé | Reviens à un dossier partagé pour ce tutoriel, ou termine une intégration Git explicite avant le relais ; les fichiers d’un worktree ne se partagent pas automatiquement. |

Prompt commun de reprise :

```text
Reprends uniquement l’étape en cours. Relis docs/brief.md et ton dernier document de passage de relais. Dis ce qui existe effectivement dans le dossier, ce qui a été exécuté et ce qui bloque encore. Termine le livrable manquant sans recommencer le projet ni étendre le périmètre. Si une commande échoue, conserve son erreur, corrige sa cause et réessaie le contrôle concerné.
```

## 5. Filmer un tutoriel qui montre vraiment le travail

Le [script de tournage](04-tournage.fr.md) donne le déroulé d’une vidéo de 3 minutes environ, un format court de 60 secondes et une liste de prises à capturer. Enregistre les sessions de Crewlo et l’application issue de ces sessions. Affiche « attente accélérée » quand tu compresses les générations. Les sorties attendues des guides servent de points de contrôle ; elles ne sont pas des réponses à faire passer pour celles des agents.

## Repères de compatibilité

Ce kit a été écrit d’après le code local du 29 septembre 2026 : formulaire `src/renderer/src/components/AddAgentModal.tsx`, schéma d’import `src/shared/hire.ts`, compositeur `src/renderer/src/components/MessageQueueComposer.tsx` et README. Les fiches utilisent le format d’import existant `munder-difflin/hire@1`, conservé par Crewlo.

Le parcours décrit une coordination manuelle par missions et fichiers. Le bon fonctionnement de l’import, des fournisseurs et de l’exécution complète doit être confirmé dans la session utilisée pour filmer. Les rôles peuvent aussi être employés successivement dans un seul agent si tu veux réduire le nombre de sessions.
