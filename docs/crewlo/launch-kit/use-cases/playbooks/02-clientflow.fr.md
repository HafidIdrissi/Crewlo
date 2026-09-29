# ClientFlow — un mini-CRM pour un freelance

**L’histoire à montrer :** « Je perds mes prospects entre des notes et des messages. Je crée un petit outil adapté à mon activité avec trois agents Crewlo. »

**Résultat cible :** une application personnelle de suivi commercial. On crée un prospect, on lui donne une prochaine action, on déplace son dossier et on retrouve les informations après rechargement.

**Équipe :** `ClientFlow Produit`, `ClientFlow Dev`, `ClientFlow QA`, avec les [trois rôles du guide](DEMARRER.fr.md). Dossier commun : `C:\Projects\crewlo-demos\clientflow`. Les agents travaillent successivement.

## Étape 1 — Cadrer une vraie petite utilisation

**Agent : ClientFlow Produit.**

```text
MISSION : cadrer ClientFlow, un mini-CRM local pour un freelance.

Le besoin : retrouver les prospects à relancer sans chercher dans un tableur et plusieurs carnets.

Périmètre :
- Créer et modifier un prospect : entreprise obligatoire, contact facultatif, email facultatif validé, montant estimé facultatif, prochaine action et date de relance facultatives.
- Étapes : Nouveau, Contacté, Proposition, Gagné, Perdu.
- Vue par étape avec un contrôle explicite pour déplacer un prospect. Aucun drag-and-drop obligatoire.
- Recherche par entreprise ou contact ; filtre « À relancer » pour les dossiers actifs dont la date est aujourd’hui ou passée dans le fuseau local.
- Montants positifs ou nuls en EUR, stockés en centimes entiers. Champ vide = inconnu, distinct de zéro. Afficher séparément potentiel actif et gagné ; exclure les perdus du potentiel.
- Données locales conservées après rechargement. Sauvegarde et restauration JSON validées pour déplacer manuellement son portefeuille.
- État vide utile et jeu d’exemples chargé uniquement sur action explicite.

Exemples fictifs : Atelier Nacre, Proposition, 1 500 EUR ; Studio Boréal, Nouveau, montant inconnu ; Maison Sillage, Gagné, 800 EUR. Aucune donnée personnelle réelle.

Crée docs/brief.md avec modèle de données, règles de dates/montants, écrans, critères d’acceptation et limites. Prévois React + TypeScript + Vite si le dossier est vide, des tests compatibles avec l’environnement et une clé localStorage propre à ClientFlow. Pas de compte partagé, d’envoi d’email ou de synchronisation externe. Crée docs/recette.md. Ne code pas.
```

**Passage à la suite :** le brief définit précisément le potentiel actif, les dates de relance et le comportement d’import. Ce sont les points faciles à rendre trompeurs si les règles restent implicites.

## Étape 2 — Construire le mini-CRM

**Agent : ClientFlow Dev.**

```text
MISSION : construire ClientFlow selon docs/brief.md et docs/recette.md.

Inspecte d’abord le dossier. Préserve docs/ lors de l’initialisation. Livre une app française utilisable avec formulaire de prospect, vue par étape, recherche, relances et indicateurs conformes au brief. Les exemples sont fictifs et facultatifs.

Sépare les règles métier des composants pour tester les montants en centimes, la distinction inconnu/zéro, les transitions et les dates civiles locales sans décalage UTC. Formate les montants en EUR à l’affichage. Une fiche doit rester modifiable après déplacement ou rechargement.

Export JSON : inclure une version de schéma et les prospects. Import : limiter la taille acceptée, valider intégralement types, identifiants, montants et statuts ; rejeter un fichier invalide sans changer les données existantes. Pour un import valide, afficher un aperçu du nombre de fiches et remplacer seulement après confirmation. Ne fusionne pas implicitement et ne supprime jamais l’ancien portefeuille avant validation.

Prévois confirmation de suppression, erreur de stockage lisible et état vide. Interface responsive avec contrôles accessibles au clavier. Utilise des dépendances compatibles avec le Node installé et conserve le lockfile.

Fournis npm run dev, npm run typecheck, npm run test:run et npm run build. Exécute les trois vérifications. Écris docs/handoff-dev.md : structure, clé de stockage, commandes et sorties réelles, URL si le serveur a réellement démarré, limites. Termine la mission avant le passage à QA.
```

**À montrer :** création d’Atelier Nacre, passage de Contacté à Proposition, saisie de « Envoyer la proposition », puis filtre des relances.

## Étape 3 — Faire contrôler les cas qui comptent

**Agent : ClientFlow QA.**

```text
MISSION : tester ClientFlow avec des données fictives. Lis docs/brief.md, docs/recette.md et docs/handoff-dev.md.

Exécute typecheck, test:run et build. Ajoute les tests manquants avec l’outillage existant, sans changer l’application ni les dépendances.

Vérifie : entreprise vide refusée ; email vide accepté et email mal formé refusé ; montant inconnu distinct de zéro ; décimales converties sans erreur de centime ; déplacement, édition, recherche et rechargement. Vérifie qu’un dossier Gagné ou Perdu ne figure plus dans « À relancer » ni dans le potentiel actif, et que les montants gagnés sont séparés.

Dans le navigateur si disponible : crée deux dossiers actifs de 1 500,50 EUR et 499,50 EUR, un gagné de 800 EUR et un perdu de 200 EUR. Le potentiel actif attendu est 2 000 EUR et le total gagné 800 EUR. Passe le premier actif à Gagné : le potentiel devient 499,50 EUR et le gagné 2 300,50 EUR. Ce sont des attentes à tester, pas des résultats déjà acquis.

Teste hier/aujourd’hui/demain pour la relance dans le fuseau local, puis export et restauration JSON dans un profil de test. Un import malformé doit laisser les données intactes ; l’annulation de remplacement aussi. Vérifie une largeur de 390 px et le clavier.

Écris docs/qa-1.md : PASS / FAIL / NON TESTÉ, preuves, défauts numérotés avec reproduction et gravité. Si tu ne peux pas ouvrir de navigateur, conserve les cas d’interface NON TESTÉ et fournis la recette à l’utilisateur.
```

## Étape 4 — Corriger et revérifier

**Agent : ClientFlow Dev, seulement si QA trouve des défauts.**

```text
Corrige les défauts reproductibles de docs/qa-1.md sans ajouter de fonctions. Reproduis d’abord, puis corrige et ajoute le test de non-régression utile. Préserve les portefeuilles existants et les tests de comportement. Exécute typecheck, test:run et build. Écris docs/corrections.md et actualise docs/handoff-dev.md avec causes, fichiers modifiés, résultats et limites. Passe ensuite la main à QA.
```

**Agent : ClientFlow QA, après les corrections ou directement si la première recette réussit.**

```text
Relis docs/qa-1.md, docs/corrections.md si présent et docs/handoff-dev.md. Rejoue les contrôles affectés, puis création → déplacement → relance → rechargement → export → restauration. Attribue explicitement à l’utilisateur les essais qu’il t’a rapportés. Écris docs/recette-finale.md avec la version contrôlée, chaque critère, ses preuves et les limites. Décide PRÊT POUR DÉMO LOCALE seulement si tous les critères critiques ont été vérifiés ; sinon liste les réserves ou blocages.
```

## Étape 5 — Préparer la livraison

**Agent : ClientFlow Produit.**

```text
Lis l’application réelle, package.json, docs/handoff-dev.md et docs/recette-finale.md. Rédige README.md avec installation, démarrage, vérifications, mode de stockage, export/restauration et limites. Explique que les données restent dans le navigateur utilisé et qu’un export est nécessaire pour une sauvegarde transportable ; l’app n’envoie aucun email et ne synchronise pas plusieurs utilisateurs.

Crée docs/demo-60s.md : créer Atelier Nacre, ajouter une action, déplacer vers Proposition, montrer la relance, recharger et exporter. Ne présente que des comportements effectivement disponibles. Termine avec les instructions exactes pour essayer le produit.
```

## Étape 6 — Montrer le résultat de bout en bout

1. Pars d’un espace de démonstration vierge.
2. Crée Atelier Nacre, contact fictif « Camille », montant 1 500 EUR.
3. Ajoute « Envoyer la proposition » et une date de relance à aujourd’hui.
4. Passe le dossier en Proposition, puis ouvre À relancer.
5. Recharge : le dossier doit toujours être présent avec son action.
6. Exporte le JSON et montre que le fichier est réellement créé.
7. Montre la restauration dans un autre profil de test et le rapport de recette.

**Phrase de fin :** « J’ai maintenant mon petit outil de suivi : je sais qui relancer, où en est chaque dossier et comment sauvegarder mon portefeuille. »

**Évolution suivante :** si tu veux un vrai CRM multi-utilisateur, définis une deuxième version avec accès, base serveur et contrôle des permissions. Elle ne fait pas partie de la démonstration locale.
