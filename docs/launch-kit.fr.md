# Kit de lancement Crewlo

Les [deux GIFs et la vidéo de 18 secondes](crewlo/demo/README.md) sont prêts à joindre à une publication. Ce sont des captures de la vraie interface avec événements et appairage simulés, pas une démonstration d'exécution IA en direct. Gardez la mention **SCRIPTED DEMO** visible. Rien n'a été publié automatiquement.

## Texte prêt à adapter

> Et si tes agents IA partageaient un petit studio voxel ?
>
> Je construis Crewlo : un espace local pour donner une mission à son équipe d'agents, suivre leurs activités et garder le contrôle.
>
> Voici 18 secondes de démo de l'interface, avec des données simulées. Crewlo est un fork visuel indépendant de Munder Difflin, encore en développement et ouvert aux contributions.
>
> Je cherche des retours sur l'interface, l'accessibilité et les tests Windows/macOS/Linux. Un bug reproductible ou une petite PR, ça aide déjà beaucoup.
>
> Code : https://github.com/HafidIdrissi/crewlo
> Si l'idée vous plaît, une étoile est la bienvenue ⭐
>
> #OpenSource #AIAgents #BuildInPublic

## Petite séquence de lancement

1. Testez réellement [Telegram et WhatsApp avec vos comptes](messageries-tests.fr.md) avant d'affirmer qu'ils fonctionnent de bout en bout. N'affichez jamais vos tokens ou numéros privés dans une capture.
2. Vérifiez le README et la page locale : `npx vite docs --host 127.0.0.1 --port 5182`.
3. Partagez le GIF studio pour attirer l'œil, puis la vidéo courte pour montrer le parcours. Adaptez le texte à une communauté qui autorise les démonstrations de projets.
4. Demandez un retour précis : « Est-ce que vous comprenez quel agent travaille ? » ou « Pouvez-vous tester sur macOS ? ».
5. Répondez aux premiers retours. Publiez ensuite une vraie amélioration issue des contributions, avec avant/après et crédit de l'auteur.

Pas d'étoiles achetées, de faux comptes, de faux chiffres ni de spam. Un passage dans les tendances GitHub n'est pas garanti.

## Ce qu'il reste à fournir

- Votre vrai lien Buy Me a Coffee. Il est volontairement désactivé dans `docs/crewlo-links.json` pour ne financer aucun compte non confirmé. Le même lien alimente le site et l'app. Activez aussi le nom de compte dans `.github/FUNDING.yml` et le lien du README lorsque vous l'avez confirmé.
- Votre choix de publication du site. Les fichiers sont prêts dans `docs/`, mais rien n'a été déployé. L'ancien `docs/CNAME` du domaine upstream a été retiré localement, comme l'ancien lien de don, et reste récupérable dans Git.

Le bouton **Star** ouvre le dépôt Crewlo ; le visiteur choisit lui-même de mettre une étoile sur GitHub. Aucun token GitHub n'est demandé.
