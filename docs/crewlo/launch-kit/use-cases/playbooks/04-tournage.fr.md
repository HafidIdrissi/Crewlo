# Filmer le parcours Crewlo jusqu’au résultat

## Le format à viser

Une vidéo principale de **3 minutes environ**, accompagnée du guide complet et de ses prompts copiables. Un montage court de 60 secondes peut renvoyer vers cette vidéo. On voit le travail réel dans Crewlo, puis les actions qui fonctionnent dans l’application obtenue.

L’enregistrement commence avec un dossier de projet neuf et se poursuit jusqu’à la recette. Tu peux filmer en plusieurs prises et raccourcir les attentes. Le temps affiché dans le montage n’est pas le temps réel nécessaire pour construire le projet.

## Préparer l’enregistrement

Choisis TaskBoard pour commencer. Prépare un dossier de démonstration, ton CLI authentifié, le guide à côté et un outil de capture que tu utilises déjà. Fais la connexion au fournisseur avant l’enregistrement. Utilise uniquement les tâches fictives du scénario et un cadrage centré sur Crewlo, l’éditeur et le navigateur.

Crée les agents avec les rôles du kit. Tu peux filmer la création de Produit en détail et raccourcir Dev et QA, tout en montrant leur nom et leur Goal. Garde les prompts complets dans la ressource associée : on ne doit pas devoir les retranscrire depuis des images rapides.

## Découpage principal — TaskBoard en 3 minutes

| Temps du montage | Action réellement filmée | Texte ou voix proposés | Preuve visible |
| --- | --- | --- | --- |
| 0:00–0:12 | Montrer rapidement l’application finale : créer une tâche et changer son statut | « Voici TaskBoard. Je vais montrer comment partir du brief dans Crewlo jusqu’à cette application. » | Le résultat réel ; mention « aperçu du résultat final » |
| 0:12–0:35 | Revenir au début. Ouvrir Create agent, saisir le nom, choisir le dossier et le CLI | « Je prépare trois rôles : Produit cadre, Dev construit, QA vérifie. Ils travaillent dans le même dossier. » | Les champs réellement remplis ; début de session |
| 0:35–0:50 | Montrer Goal et la première mission adressée à Produit | « Je précise l’utilisateur, les fonctions et ce qui permettra de dire que c’est terminé. » | Prompt TaskBoard étape 1 ; nom du destinataire |
| 0:50–1:05 | Ouvrir le brief obtenu et deux critères | « Le brief fixe notamment les statuts et la sauvegarde après rechargement. » | docs/brief.md réellement écrit |
| 1:05–1:30 | Passer à Dev, envoyer le prompt de construction, montrer quelques commandes | « Le développeur lit ce brief, construit l’app et consigne ce qu’il a exécuté. » | Prompt étape 2, code et terminal ; « attente accélérée » sur les coupes |
| 1:30–1:48 | Ouvrir le navigateur et ajouter deux tâches | « On peut maintenant essayer le produit. » | La vraie URL locale et les interactions |
| 1:48–2:08 | Passer à QA, montrer le prompt et le rapport reçu | « Un autre agent vérifie les critères. Il distingue ce qui passe, échoue ou reste à tester. » | Rapport réel ; résultats sans chiffres ajoutés |
| 2:08–2:25 | Si un défaut existe, montrer sa reproduction, le correctif et sa vérification ; sinon montrer un cas limite testé | « Voici le point détecté et sa correction. » ou « La première recette passe ; je vérifie aussi les entrées invalides. » | Aucun bug inventé pour le montage |
| 2:25–2:48 | Créer une tâche, changer son statut, filtrer puis recharger | « La preuve la plus simple : la tâche et son statut sont toujours là après rechargement. » | Parcours continu lisible, sans masquer le rechargement |
| 2:48–3:00 | Montrer README et recette finale, puis revenir au studio | « Le résultat, son code et ses vérifications sont prêts. Les agents et les prompts de ce parcours sont dans le guide. » | Fichiers du même projet et décision de recette |

Si le résultat garde une réserve, remplace la dernière phrase par « Voici ce qui fonctionne et le point qu’il reste à régler ». Garde les limitations utiles à la compréhension de la démo.

## Version courte — 60 secondes

| Temps | Prise |
| --- | --- |
| 0–6 s | Résultat réel : créer et terminer une tâche. |
| 6–15 s | Trois agents, trois responsabilités ; montrer le dossier commun. |
| 15–25 s | Brief envoyé à Produit et document obtenu. |
| 25–36 s | Mission Dev, extrait de travail avec attente accélérée. |
| 36–46 s | Mission QA et contrôle effectivement exécuté. |
| 46–56 s | Rechargement de la page et persistance visible. |
| 56–60 s | « Agents, prompts et étapes : guide complet disponible. » |

## Adapter la fin aux deux autres scénarios

**ClientFlow :** remplacer la séquence tâches par création d’un prospect, prochaine action, déplacement dans le pipeline, filtre des relances et rechargement. Montrer l’export réel comme preuve complémentaire.

**LaunchPage :** remplacer la séquence tâches par saisie de demo@example.com, requête réelle, confirmation, fichier local et doublon. Montrer le redémarrage dans la version longue. Une simple animation de notification ne suffit pas à raconter l’enregistrement serveur.

## Ce qu’il faut garder après la séance

Dans le projet construit, conserve les prompts, docs/brief.md, docs/handoff-dev.md, docs/qa-1.md, docs/corrections.md si présent, docs/recette-finale.md, README.md, le code et son lockfile. Garde aussi les prises originales et les heures de début/fin si tu veux publier une durée de travail réelle.

Écris un petit bilan factuel : environnement utilisé, fournisseur et modèle effectivement sélectionnés, temps observé, interventions manuelles, comportement final et limites. On peut alors raconter une création avec Crewlo sans confondre scénario proposé et exécution constatée.

## Si tu veux publier une simulation avant le tournage

Utilise une mention visible « Démonstration scénarisée — exécution à réaliser ». Les anciennes animations du studio peuvent illustrer le flux, mais elles ne prouvent pas que les nouvelles missions ont tourné. Le kit actuel est le conducteur de la séance ; la vidéo en conditions réelles se fera avec les réponses et le produit issus de cette séance.
