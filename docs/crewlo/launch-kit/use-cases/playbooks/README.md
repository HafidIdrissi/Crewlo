# Ateliers MVP avec Crewlo

[Ouvrir les cas d’usage sur le site](https://hafididrissi.github.io/Crewlo/use-cases.html) · [Télécharger le kit ZIP](https://hafididrissi.github.io/Crewlo/crewlo/launch-kit/use-cases/playbooks/crewlo-playbooks-fr.zip)

Chaque parcours décrit les agents à créer, les prompts à envoyer, les fichiers à transmettre et les vérifications jusqu’à une démonstration locale utilisable. Les guides sont en français.

1. [Préparer le dossier et créer les trois agents](DEMARRER.fr.md).
2. [TaskBoard : une application de tâches](01-taskboard.fr.md).
3. [ClientFlow : un mini-CRM freelance](02-clientflow.fr.md).
4. [LaunchPage : une page et un formulaire relié à une API locale](03-launchpage.fr.md).
5. [Filmer le parcours et le résultat](04-tournage.fr.md).

Les [23 prompts texte](prompts/) sont également disponibles séparément. Les trois fiches d’agents sont importables depuis **Create agent → Advanced · import an agent setup** : [Produit](agents/produit.json), [Dev](agents/dev.json), [QA](agents/qa.json). Choisis ensuite ton dossier et ton moteur connecté dans le formulaire.

Ces guides sont des scénarios à exécuter. Ils ne présentent pas les applications comme déjà construites ou validées par Crewlo.

## Modifier ou reconstruire le kit

Les fichiers Markdown sont la source éditoriale. Les pages HTML, prompts texte, fiches JSON et ZIP sont générés par [tools/build-crewlo-playbooks.py](https://github.com/HafidIdrissi/Crewlo/blob/main/tools/build-crewlo-playbooks.py).

Depuis la racine du dépôt, avec Python et le module `Markdown` installés :

```sh
python tools/build-crewlo-playbooks.py
```

Le générateur n’ouvre aucune session d’agent et n’appelle aucun fournisseur. Pour prévisualiser tout le site, utilise `npm run site` puis ouvre `/use-cases.html` sur l’adresse locale indiquée.
