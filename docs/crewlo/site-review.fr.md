# Refonte du site Crewlo — 22 septembre 2026

## Point de départ

L’examen de [Munder Difflin](https://munderdiffl.in/) montre une proposition de valeur explicite, une démonstration interactive, des accès au téléchargement, une présentation des offres et une FAQ. Le site affiche également ses chiffres d’adoption ; ils ne constituent pas une preuve indépendante et ne sont pas repris pour Crewlo.

L’ancienne page Crewlo montrait surtout une vidéo et deux cartes. Elle ne donnait pas assez vite une vue du produit, les prérequis d’installation ou un parcours aux nouveaux contributeurs. La refonte vise ces écarts ; elle ne démontre pas une supériorité générale du produit ni un futur succès dans les tendances GitHub.

## Changements livrés localement

- Studio visible dès le premier écran, avec identité papier/vert forêt/terre cuite et promesse « Your agents. One living workspace. ».
- Parcours interactif Observer / Diriger / Connecter, utilisable au clavier, sans session IA déclenchée depuis le site.
- GIFs à lecture volontaire, vidéo de 18 secondes et indications visibles sur les données simulées.
- Deux parcours distincts Telegram et WhatsApp, avec prérequis et limites de validation explicites.
- Installation depuis le code, commande copiable, prérequis Windows et retour en cas de refus du presse-papiers.
- Contributions proposées aux testeurs, développeurs, designers et personnes partageant le projet.
- FAQ sur les modèles, coûts externes, données, disponibilité du PC et origine du fork.
- README cohérent avec le site, section `Build from source`, liens de démonstration, crédits et licences conservés.

Le guide de critique design a orienté la hiérarchie visuelle. Le guide de rédaction d’interface a orienté les appels à l’action et les limites compréhensibles. Le guide de documentation a structuré le README autour des premières étapes utiles.

## Vérification

Tests statiques du site et des liens de soutien : 6 tests ciblés. Le contrôle Chromium couvre les tailles 1440, 1024, 768, 390 et 320 pixels, les onglets au clavier, l’ouverture de la FAQ, la copie réussie/refusée/indisponible, la lecture réelle du MP4, les GIFs opt-in, la réduction du mouvement, les ancres et les URL de soutien autorisées. Aucune requête externe du site n’est nécessaire à ce parcours. Ces contrôles ne remplacent pas un audit complet WCAG ni un essai avec lecteur d’écran.

```powershell
node --test test/crewlo-promo.test.cjs test/community-links.test.cjs
node tools/crewlo-site-check.cjs
```

Le script navigateur utilise un serveur de test isolé sur `127.0.0.1:5184` par défaut (`CREWLO_SITE_TEST_PORT` permet de le changer), afin de ne pas interrompre l’aperçu utilisateur sur le port 5182. Playwright/Chromium doivent être installés ou indiqués par `CREWLO_PLAYWRIGHT` et `CREWLO_CHROMIUM`.

## Pour aller plus loin que la vitrine

### Direction voxel demandée après la première revue

La direction visuelle a ensuite été réorientée vers un univers en blocs inspiré du studio : ciel, nuages pixel, terrain, boutons en relief et typographie Press Start 2P pour les titres courts. Les textes courants restent en Inter pour conserver une lecture confortable. Ces polices sont hébergées localement avec leurs licences ; aucun asset Minecraft/Mojang n'est utilisé.

Telegram et WhatsApp sont désormais des entrées nommées dans la navigation persistante et des cartes d'accès dans le premier écran. La section détaillée des deux canaux précède les autres fonctions, avec captures de configuration, étapes et exigences distinctes. Les boutons ouvrent les instructions ; ils ne prétendent pas connecter un compte depuis le site.

Le README est centré sur Crewlo, avec un seul rappel de l'origine du moteur dans ses crédits. Les choix d'héritage et de compatibilité sont regroupés dans [ENGINEERING_NOTES.md](ENGINEERING_NOTES.md). Le site conserve lui aussi une attribution compacte dans le pied de page.

### Point de vue d'un premier visiteur

Le style peut donner envie de regarder la démonstration, mais le passage à l'installation reste freiné par les prérequis natifs et l'absence de démonstration de mission IA réelle. Ce constat est un jugement UX, pas une mesure de conversion ni une enquête utilisateur. Les prochaines validations utiles sont :

1. Valider Telegram et WhatsApp avec les vrais comptes et un agent réel ; conserver les preuves et masquer les identifiants dans toute capture.
2. Réussir une installation Windows depuis un environnement propre et préparer un premier installateur vérifié. Les dépendances natives restent une friction connue.
3. Recueillir des retours sur une première mission : démarrage compris, état de chaque agent compris, réponse trouvée. Mesurer ces résultats avant de promettre une meilleure expérience.
4. Renseigner le lien Buy Me a Coffee confirmé, choisir l’URL publique et finaliser les métadonnées de partage avec cette URL absolue. Rien n’est publié automatiquement.
5. Publier une démonstration réelle et un appel à contribution précis. Ne pas promettre un classement Trending ou inventer des chiffres de popularité.

## Mention « forked from »

Elle est normale : GitHub conserve le lien d’origine d’un fork indépendamment du nom ou du README. Aucun changement de relation GitHub n’a été effectué. La [documentation GitHub sur le détachement](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/detaching-a-fork) précise que quitter le réseau est permanent et peut faire perdre les métadonnées associées au fork, notamment étoiles, issues et pull requests. Ce n’est pas une modification cosmétique à effectuer automatiquement.

Les crédits et licences restent nécessaires même si le dépôt devient techniquement indépendant. Toute décision de détachement doit être distincte de cette refonte.
