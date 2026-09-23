# Lancer Crewlo sur Windows

Crewlo se lance aujourd’hui **depuis les sources**. Il n’y a pas encore d’installateur Crewlo vérifié en un clic. Le diagnostic ci-dessous aide à repérer les prérequis avant de lancer l’installation ; il ne modifie rien.

## 1. Ouvrir le projet

Si tu as déjà ce dépôt sur ton PC, ouvre PowerShell dans son dossier. Sinon, après avoir installé Git :

```powershell
git clone https://github.com/HafidIdrissi/crewlo.git
cd crewlo
```

Ces commandes récupèrent l’état actuellement publié du dépôt. Un changement encore uniquement local n’est pas disponible dans un nouveau clone tant qu’il n’a pas été publié par le mainteneur.

## 2. Vérifier sans rien installer

Il faut d’abord disposer de Node.js pour exécuter le diagnostic. Le projet attend **Node.js stable 22.22 ou plus récent**, avec npm, ainsi que Git.

La reconstruction native utilise aussi **Python 3 via node-gyp**. Sa présence et sa compatibilité ne sont pas contrôlées par ce doctor : vérifie ton installation Python et les prérequis node-gyp avant `npm ci`. Sous Windows, `py -3 --version` permet de vérifier le lanceur Python lorsqu’il est installé.

```powershell
node tools/crewlo-doctor.cjs
```

Le raccourci `npm run doctor` fait la même chose. Le script fonctionne avant `npm ci`, car il n’utilise que les modules intégrés de Node. Si `node` est introuvable, installe Node.js puis rouvre PowerShell avant de poursuivre.

Lis les lignes `FAIL` avant d’installer :

- **Node.js trop ancien** : installe une version prise en charge et ouvre un nouveau terminal. Vérifie `node --version` dans ce terminal ; un ancien Node peut encore être prioritaire dans le PATH.
- **Compilateur C++ absent** : dans Visual Studio Installer, ajoute « Développement Desktop en C++ » et le toolset MSVC correspondant à l’architecture de ton installation Node/Electron.
- **Spectre absent / MSB8040** : dans les composants individuels, ajoute les bibliothèques MSVC avec atténuation Spectre pour **la même version du toolset et la même architecture**. Avoir un autre toolset ou une autre architecture ne suffit pas.
- **Windows SDK absent ou incomplet** : ajoute un Windows 10/11 SDK avec ses en-têtes, bibliothèques et outils.

Le doctor cherche Visual Studio via `vswhere`, le toolset sélectionné par défaut, les bibliothèques Spectre correspondantes et le SDK dans les emplacements enregistrés/standards. Une installation personnalisée non détectée nécessite une vérification manuelle. Il ne lance pas une compilation pour prouver que toute la chaîne fonctionne.

Un avertissement indiquant que les dépendances ne sont pas encore présentes est normal avant la première installation. Le diagnostic n’installe rien, ne lance aucune élévation administrateur et ne lit pas tes identifiants.

## 3. Installer, puis ouvrir la vraie application

Après avoir réglé les prérequis :

```powershell
npm ci
npm run doctor
npm run dev
```

`npm ci` est l’étape qui télécharge les dépendances et reconstruit les modules natifs via `postinstall`. Elle modifie `node_modules`. **Le doctor ne fait pas cette installation à ta place.**

Après l’installation, le doctor charge `node-pty` et `better-sqlite3` dans l’Electron installé, avec une requête SQLite en mémoire. Il n’ouvre pas Crewlo, ne crée pas de terminal agent et ne crée pas de base de données sur disque. Un chargement réussi ne remplace pas un test de l’application ni une compilation des modules depuis zéro.

Si seuls les modules natifs échouent et que les prérequis sont corrigés, reconstruis explicitement les dépendances déjà installées, puis revérifie :

```powershell
npm run postinstall
npm run doctor
```

`npm run dev` ouvre l’application Electron. Configure ton fournisseur, ouvre un studio puis connecte une session agent compatible avec la messagerie, par exemple Claude Code ou Codex. Commence par une petite demande sans accès sensible et vérifie les paramètres de permission du CLI.

## 4. Tester Telegram ou WhatsApp

Suis le [guide de connexion local](../messaging-setup.html) : [Telegram](../messaging-setup.html#telegram) est le parcours le plus court ; [WhatsApp](../messaging-setup.html#whatsapp) utilise l’API officielle Meta, avec un relais HTTPS que tu configures toi-même.

Garde le PC, Crewlo et l’agent allumés. Les tokens se saisissent **uniquement dans les champs secrets de l’application**. Le site et son aperçu navigateur ne peuvent pas connecter les agents : ils servent à présenter le projet et lire la documentation.

Pour afficher le site local :

```powershell
npm run site
```

Ouvre l’adresse localhost affichée. Cela ne remplace pas `npm run dev` et ne publie pas le site.

## Ce que le diagnostic prouve — et ne prouve pas

Pour un résultat lisible par un outil : `node tools/crewlo-doctor.cjs --json`. Code de sortie `1` : au moins un échec détecté ; `0` : aucun échec détecté, mais lis les avertissements. `--help` affiche le résumé des options.

- Vérifié : version de Node, présence/version de npm et Git ; sous Windows, présence des fichiers du compilateur, du SDK et de Spectre ; présence des manifestes des dépendances ; chargement des modules natifs dans l’Electron local.
- Non vérifié : Python 3 et sa compatibilité node-gyp, intégrité complète des dépendances, réussite d’une compilation source, authentification du fournisseur IA, sécurité de ses permissions, connexion Telegram/Meta, relais public, réponse réelle d’un agent, fonctionnement de macOS/Linux.
- Jamais exécuté automatiquement : installation, réparation, compilation, création d’un agent, requête réseau externe ou publication. Les sorties brutes de commandes et les secrets ne sont pas affichés.

### Constat sur le PC de développement, 22 septembre 2026

Le doctor a été exécuté réellement sur Windows x64. npm, Git, MSVC, Windows SDK, les manifestes des dépendances et les deux tests de chargement natif Electron passent. Il relève **Node 20.19.4**, inférieur au minimum du projet, et ne trouve pas les bibliothèques Spectre du toolset MSVC sélectionné **14.39.33519**. Les binaires natifs existants se chargent, mais cela ne prouve pas qu’une réinstallation complète pourrait les reconstruire. Rien n’a été installé ni corrigé automatiquement.

## Préparer une vraie démo publique

**Bloqué pour l’instant : aucune vidéo d’exécution réelle n’est validée sans un test téléphone + agent réel avec tes propres comptes.** Les médias actuels restent des démonstrations d’interface étiquetées « SCRIPTED DEMO ».

1. Dans un petit dossier de travail dédié, prépare un agent authentifié et un fichier sans données personnelles. Relis ses autorisations.
2. Configure ton canal dans Crewlo, hors enregistrement. Ne filme jamais token, App secret, QR d’appairage encore actif, numéro personnel ou historique privé.
3. Sur le téléphone, envoie une demande limitée, par exemple « Réponds simplement : Bonjour depuis Crewlo ». Conserve une preuve de la réponse réelle préfixée et de l’échange correspondant dans Conversation.
4. Vérifie une demande pendant la pause, puis la reprise sur le PC. Pour WhatsApp, distingue l’acceptation Meta de la livraison au téléphone. Note tout échec ou résultat incertain.
5. Seulement après cette validation, enregistre une courte prise montrant la demande, l’activité réellement reçue et la réponse. Ne transforme pas un montage avec données simulées en prétendue exécution directe. Si tu coupes de l’attente, indique « attente raccourcie » ; n’invente aucun temps de réponse.
6. Revois la vidéo image par image pour retirer toute information privée avant de la partager. Demande l’accord des personnes visibles. Publie uniquement après validation explicite du contenu et de sa destination.

Le [kit démo](demo/README.md) documente les médias simulés existants. Aucun enregistrement live, aucun envoi Telegram/WhatsApp réel et aucune publication ne sont faits par le doctor.
