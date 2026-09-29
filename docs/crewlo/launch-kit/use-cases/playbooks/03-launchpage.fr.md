# LaunchPage — une offre et un formulaire qui enregistre vraiment

**L’histoire à montrer :** « Je veux présenter une idée et vérifier que le parcours d’inscription fonctionne. Mes agents construisent la page, le formulaire et un petit serveur local. »

**Produit de démonstration :** FocusKit, un outil fictif de préparation de la journée. Le projet est un prototype de page de lancement, pas une preuve de demande commerciale.

**Résultat cible :** une page responsive et un formulaire relié à un serveur local. Une inscription fictive est enregistrée, un doublon est détecté et les données survivent au redémarrage du serveur.

**Équipe :** `LaunchPage Produit`, `LaunchPage Dev`, `LaunchPage QA`, avec les [rôles du guide](DEMARRER.fr.md). Dossier commun : `C:\Projects\crewlo-demos\launchpage`. Ce scénario utilise deux processus locaux, un serveur de développement et une API.

## Étape 1 — Définir l’offre et le parcours

**Agent : LaunchPage Produit.**

```text
MISSION : cadrer une page de lancement pour FocusKit, produit fictif destiné aux indépendants qui veulent préparer leur journée en trois priorités.

L’offre : « Trois priorités. Une journée plus claire. » L’appel à l’action : « Rejoindre la liste d’attente ». Le produit est en préparation : aucune promesse de disponibilité, gain de temps mesuré, prix, avis client ou nombre d’inscrits inventé.

Page : titre, sous-titre, problème concret, trois bénéfices, aperçu illustré explicitement présenté comme tel, trois étapes d’utilisation prévues, FAQ, formulaire email et état après soumission. Texte français simple. Formulaire accessible, responsive et utilisable au clavier.

Pour une démo technique réelle, l’email doit être envoyé à une API Node locale et enregistré sur disque. Ne pas afficher de succès si l’API refuse ou ne répond pas. Valider côté serveur, gérer le doublon et survivre à un redémarrage. Aucun email externe n’est envoyé.

Crée docs/brief.md et docs/copy.md. Définis le contrat API proposé : POST /api/waitlist, body {email}, HTTP 201 créé, 200 déjà inscrit, 400 invalide, 503 indisponible ; réponses JSON avec code métier et message. GET /api/health indique seulement l’état du service. Aucune route de liste publique des emails.

Crée docs/recette.md avec succès, doublon, erreur réseau et persistance après redémarrage. Le serveur et les données restent locaux, avec adresses fictives en example.com. Ne code pas. Explique dans le brief ce qui devra être conçu avant une ouverture au public.
```

**Passage à la suite :** le brief distingue l’aperçu du futur produit et le formulaire effectivement fonctionnel.

## Étape 2 — Construire la page et son API

**Agent : LaunchPage Dev.**

```text
MISSION : implémenter LaunchPage selon docs/brief.md, docs/copy.md et docs/recette.md.

Si le dossier est vide hors docs/, utilise React + TypeScript + Vite pour l’interface, un serveur Node local et Vitest pour les tests. Garde les dépendances minimales, compatibles avec le Node installé, et le lockfile. Écoute seulement sur 127.0.0.1. Fais passer /api depuis Vite vers l’API locale pour un parcours simple sans CORS permissif.

Implémente POST /api/waitlist et GET /api/health selon le contrat du brief. Limite le corps JSON, valide son type et l’email côté serveur avec une règle pragmatique documentée, limite sa longueur, retire les espaces périphériques et définis une règle de comparaison cohérente pour les doublons. Traite explicitement les contenus non JSON et les entrées malformées.

Pour la démonstration à processus unique, stocke les entrées dans un fichier data/waitlist.json hors des fichiers servis au navigateur et ignoré par Git. Sérialise les écritures et remplace le fichier via un fichier temporaire pour éviter les mises à jour perdues. Charge les données au démarrage, signale une corruption sans les écraser. Si la sauvegarde échoue, renvoie une erreur et n’annonce pas la réussite. Les tests utilisent un répertoire temporaire, jamais le fichier de la démo.

Côté formulaire : label email, validation, état en cours, bouton temporairement désactivé, succès uniquement après réponse positive, doublon compréhensible, erreur réseau conservant la saisie. Aucun envoi d’email ni service externe. Ne place ni données ni secret dans le bundle frontend. Exemples sous example.com seulement.

Crée npm run dev pour Vite, npm run dev:server pour l’API, npm run typecheck, npm run test:run et npm run build. Exécute les trois vérifications. Documente dans docs/handoff-dev.md les deux commandes à lancer dans deux terminaux, les ports choisis, le chemin des données et les sorties réellement obtenues. Un build frontend réussi ne prouve pas le fonctionnement de l’API.

Le résultat est une démo locale : documente honnêtement les limites du fichier à processus unique. Termine avant l’intervention de QA.
```

**À montrer :** la page, la saisie de `demo@example.com`, la réponse réelle du serveur et le fichier de données avec cette seule adresse fictive.

## Étape 3 — Vérifier le parcours navigateur–serveur–disque

**Agent : LaunchPage QA.**

```text
MISSION : vérifier LaunchPage de bout en bout. Lis le brief, le contrat API et docs/handoff-dev.md. Ne modifie pas l’application ni les dépendances.

Exécute typecheck, test:run et build. Avec l’outillage installé, teste l’API et sa persistance dans un répertoire temporaire isolé. Vérifie : adresse valide, champs vides et types erronés, entrée JSON malformée, corps excessif, doublon, deux inscriptions rapprochées, redémarrage, corruption du fichier et erreur de sauvegarde. Documente les codes réellement renvoyés et les limites non testées.

Si un navigateur est disponible : démarre les deux processus et ouvre la vraie page. Soumets demo@example.com, vérifie l’état de confirmation et la présence sur disque. Soumets de nouveau et vérifie le doublon. Arrête le serveur de test, soumets autre@example.com et constate l’erreur visible sans faux succès. Redémarre le serveur et vérifie que la première adresse est conservée. Ne touche à aucun autre service local.

Vérifie aussi clavier, labels, focus, largeur 390 px, CTA et liens. Aucun témoignage ou compteur inventé ne doit apparaître. Ne reproduis aucune donnée réelle dans le rapport.

Écris docs/qa-1.md avec PASS / FAIL / NON TESTÉ pour chaque critère. Sépare tests unitaires, tests d’API, essai navigateur et inspection du fichier. Pour chaque défaut, donne reproduction, attendu, observé et gravité. Si tu n’as pas de navigateur, remets cette partie en recette manuelle.
```

## Étape 4 — Corriger et obtenir la recette finale

**Agent : LaunchPage Dev, s’il y a des défauts.**

```text
Corrige uniquement les défauts reproductibles de docs/qa-1.md. Reproduis-les avec des données de test, puis corrige. Garde la validation serveur, la gestion des erreurs et la séparation entre données privées et fichiers publics. Exécute typecheck, test:run et build, puis le test d’API concerné. Écris docs/corrections.md et actualise docs/handoff-dev.md avec preuves et limites. Ne déploie pas ce serveur local.
```

**Agent : LaunchPage QA.**

```text
Fais la recette finale sur la version corrigée : inscription fictive → confirmation liée à la réponse API → fichier persistant → doublon → redémarrage → données conservées → erreur réseau sans faux succès. Relance les contrôles affectés. Attribue à l’utilisateur les observations manuelles qu’il t’a transmises.

Écris docs/recette-finale.md avec version, critères, états, preuves et limites. PRÊT POUR DÉMO LOCALE exige une chaîne navigateur–API–disque effectivement vérifiée. Si un maillon manque, indique les réserves exactes. La réussite ne vaut pas validation d’un service public.
```

## Étape 5 — Livrer une démo reproductible

**Agent : LaunchPage Produit.**

```text
Lis le code, package.json, docs/handoff-dev.md et docs/recette-finale.md. Rédige README.md avec prérequis, installation, deux terminaux, commandes, URL locale réellement configurée et arrêt des processus. Explique le fichier de données, l’absence d’envoi d’email et le périmètre à processus unique.

Crée docs/demo-60s.md : montrer l’offre, remplir demo@example.com, soumettre, constater la confirmation, montrer le fichier de données et le test de doublon. Identifie la maquette du futur produit comme un aperçu.

Ajoute docs/prochaine-version.md pour une ouverture publique future : stockage adapté à l’hébergement, HTTPS, protection anti-abus, règles de conservation et consentement, accès administratif protégé, supervision et tests de l’environnement déployé. Ce sont des travaux à spécifier, pas des fonctionnalités déjà livrées.

Termine avec les commandes exactes pour essayer le projet et la décision de recette locale.
```

## Étape 6 — Faire la démonstration finale

1. Ouvre les deux terminaux du README et vérifie les ports annoncés.
2. Montre le titre et le CTA de FocusKit.
3. Saisis `demo@example.com` et soumets le formulaire.
4. Montre la confirmation puis l’entrée dans le fichier local.
5. Renvoie la même adresse et montre le traitement du doublon.
6. Redémarre le serveur de démo : l’entrée doit rester présente.
7. Termine sur le README et les vérifications effectivement réussies.

**Phrase de fin :** « Le formulaire ne fait pas seulement apparaître une notification : la demande arrive au serveur, elle est validée et elle reste enregistrée après redémarrage. »

Cette démonstration se termine localement. Un déploiement public constitue une étape supplémentaire à préparer avec un hébergeur et un stockage adaptés.
