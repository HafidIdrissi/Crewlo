# Contrôle macOS — 27 septembre 2026

## Mise à jour : previews Apple Silicon et Intel publiées

Les deux DMG ont été construits sur des runners macOS 15 correspondant à leur
architecture, à partir du commit `8a0f0eb2`.
[Exécution et journaux GitHub](https://github.com/HafidIdrissi/Crewlo/actions/runs/36351216255).

- Apple Silicon : `Crewlo-0.4.6-mac-arm64.dmg`.
- Intel : `Crewlo-0.4.6-mac-x64.dmg`.
- Sur chaque architecture : fichiers du paquet présents, SQLite en mémoire et
  commande réelle dans un PTY validés sous Electron 32.3.3.
- Vérification des deux images par `hdiutil verify` réussie.
- Signature ad hoc locale via `build/sign-mac-preview.cjs`, sans certificat
  Developer ID ni notarisation Apple. Aucune clé Apple utilisée.

[Téléchargements et checksums](https://github.com/HafidIdrissi/Crewlo/releases/tag/v0.4.6-mac-preview.1).

Ces contrôles ne valident pas l'installation complète sur un Mac personnel,
l'interface au premier lancement, les autorisations macOS, la connexion d'un
agent ni une mission réelle. Ces essais restent à réaliser. Le DMG universel
de la configuration générale n'est pas le fichier distribué : la preview
propose deux DMG distincts, chacun testé sur son architecture.

## Contrôle initial depuis Windows (historique)

**Configuration contrôlée depuis Windows ; aucun installateur macOS construit
ou exécuté.** Un essai réel sur Mac reste indispensable.

## Résultats

- 36 tests ciblés réussis, aucun échec : ressources d'installation, choix des
  téléchargements, variables du terminal et branches macOS de l'installation Node.
- `electron-builder.yml` prévoit DMG et ZIP universels (Intel x64 et Apple Silicon
  arm64), identifiant `app.crewlo.desktop`, nom Crewlo et reconstruction native.
- Structure du fichier ICNS vérifiée, avec image 1024 px ; plist des permissions
  analysé avec succès. Hardened runtime et déclarations de dossiers/microphone présents.
  Cela ne valide pas leur comportement effectif sous macOS.
- `node-pty` et `better-sqlite3` sont exclus de l'ASAR pour leurs fichiers natifs.
  Leur chargement sur Intel et Apple Silicon n'a pas été exécuté.
- La tentative de packaging retourne explicitement :
  `Build for macOS is supported only on macOS` (electron-builder 25.1.8).
  Aucun `.dmg` existant n'a été trouvé dans `dist`.

## Corrections apportées

- Le sélecteur de téléchargement accepte désormais le DMG `mac-universal` sur
  Intel et Apple Silicon, en donnant priorité à un DMG propre à l'architecture
  lorsqu'il existe. Un test de régression vérifie aussi le refus du ZIP et des
  plateformes incompatibles. Le flux de mise à jour Crewlo reste non configuré.
- `npm run dist:mac` utilise maintenant `--publish never` explicitement.

## Réserves de distribution

Le hook `build/notarize.cjs` continue en cas d'échec de notarisation : une simulation
du rejet Apple a confirmé qu'il écrit un avertissement sans faire échouer le build.
Un build réussi ne prouve donc pas que Gatekeeper acceptera le paquet.
La bibliothèque installée `@electron/notarize` attache déjà le ticket à l'application ;
le hook appelle ensuite `stapler staple` une seconde fois. Ce doublon n'a pas été
testé sur Mac. La signature et la notarisation restent reportées selon la demande
de l'utilisateur ; aucune requête Apple n'a été effectuée.

## Essai à réaliser sur Mac

Avec Git, Node pris en charge par le projet et les outils de compilation Xcode :

```sh
npm ci
npm run typecheck
npm run build
npm run dist:mac
```

Artefacts attendus pour cette version :
`dist/Crewlo-0.4.6-mac-universal.dmg` et `.zip`.

Monter le DMG, copier Crewlo dans Applications, puis vérifier sur Mac :
premier démarrage, accueil, sauvegarde des paramètres, SQLite, lancement d'un
terminal et d'un agent, fermeture des processus enfants. Répéter sur Intel et
Apple Silicon, puis vérifier les permissions et les avertissements Gatekeeper.
Ne pas confondre ces étapes avec les tests Windows déjà réalisés.

Le workflow manuel `.github/workflows/release.yml` contient un runner macOS,
mais il n'a pas été déclenché : les modifications contrôlées sont locales.
