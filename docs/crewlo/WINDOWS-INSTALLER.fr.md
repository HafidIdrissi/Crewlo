# Installateur Windows Crewlo

L'assistant NSIS cible Windows x64. Il propose le français et l'anglais, un dossier
de destination modifiable, ainsi que des raccourcis Crewlo. Il n'installe pas les
CLI des fournisseurs : ils se configurent ensuite dans l'application.

L'identifiant `app.crewlo.desktop` distingue cette installation de Munder Difflin.
La désinstallation conserve les données utilisateur. Les anciennes installations
portant l'identifiant de Munder ne sont pas migrées ni désinstallées automatiquement.
Le protocole historique des liens de recrutement reste conservé pour compatibilité.

## Construction normale

Sur Windows x64, avec Node.js >=22.22, les dépendances du projet et la chaîne C++
complète (Python, MSVC, bibliothèques Spectre correspondantes et Windows SDK) :

```powershell
npm run doctor
npm run dist:win
```

Produit `dist/Crewlo-0.4.6-win-x64-setup.exe` pour la version actuelle. Cette commande
reconstruit les modules natifs et ne publie rien. La signature nécessite un
certificat de signature de code configuré séparément.

Pour une construction qui **exige** la signature :

```powershell
npm run dist:win:signed
```

Le résultat est placé dans `dist/windows-signed`. Cette commande conserve la
reconstruction native et refuse une sortie non signée (`forceCodeSigning=true`).
Elle ne publie rien. Il faut fournir un certificat de signature valide avec sa clé
privée via la configuration sécurisée d'electron-builder. Aucun certificat n'a
été trouvé sur ce poste lors du contrôle ; cette construction reste à réaliser.

## Prévisualisation locale

```powershell
npm run dist:win:preview
```

Cette variante vérifie le chargement des modules natifs déjà installés dans Electron
avant de les réutiliser, sans reconstruction. Elle produit un installateur non signé
dans `dist/windows-preview/`, avec `preview` dans le nom. Elle sert aux essais locaux,
pas à prouver qu'une construction propre ou une installation sur un autre PC fonctionne.

La prévisualisation ne publie rien et ne lance pas l'assistant automatiquement.
Le dossier `win-unpacked` permet aussi de vérifier le paquet avant installation.
Pour contrôler ses fichiers, SQLite en mémoire et le terminal Windows sans lancer
le studio ni accéder aux comptes utilisateur :

```powershell
node tools/check-windows-package.cjs
```

Contrôles locaux du 27 septembre 2026 : compilation Electron, typage du processus
principal, tests de configuration NSIS, chargement de SQLite et terminal Windows
dans le paquet Electron 32.3.3 réussis. La prévisualisation réutilise les modules
natifs présents ; les bibliothèques MSVC Spectre nécessaires à une reconstruction
propre manquent encore sur cette machine.

Un test sur une machine Windows propre, la désinstallation interactive
et la signature restent nécessaires avant d'annoncer une version distribuable.

## Essai de l'installateur sur le poste de développement

Le 27 septembre 2026, le fichier `Crewlo-0.4.6-win-x64-preview-setup.exe`
a été exécuté avec l'interface française. Accueil, sélection d'un dossier personnalisé,
copie des fichiers et écran de fin ont fonctionné. Un raccourci Bureau a été créé.
Destination de test : `out/windows-validation/installed/Crewlo`.

La copie installée a passé le contrôle SQLite en mémoire et terminal Windows sous
Electron 32.3.3. Deux démarrages ont été réalisés avec un profil isolé dans
`out/windows-validation/profile/user-data`, sans connecter de fournisseur. L'accueil
s'affiche et le choix technique suivi de « next » avance à la seconde étape ; aucune
erreur JavaScript n'a été observée pendant le contrôle du premier écran.
Les captures sont dans `out/windows-validation/first-launch.png` et
`out/windows-validation/onboarding-next.png`.

Limites constatées :

- Le texte « ELEVEN ENGINES » a été corrigé dans la nouvelle construction : douze moteurs, dont Gemini. La copie installée lors du premier essai reste celle d'avant correction.
- Un essai réel Codex a ensuite réussi via le terminal du paquet reconstruit sur un projet temporaire. Claude nécessite une reconnexion. Les échanges réels de messagerie restent à tester ; voir le bilan actualisé.
- L'outil de contrôle Windows a bloqué le lancement du désinstalleur. La désinstallation
  et la conservation effective des données restent donc non vérifiées ; la copie de
  test n'a pas été supprimée. Le paramètre de conservation passe le test de configuration.
- Ce poste possède déjà les outils de développement. Ce n'est pas un test sur un
  Windows propre, et le fichier reste non signé.

Le bilan actualisé des corrections et des tests est dans [WINDOWS-VALIDATION.fr.md](WINDOWS-VALIDATION.fr.md).
