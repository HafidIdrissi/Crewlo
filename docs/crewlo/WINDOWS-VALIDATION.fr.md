# Validation Windows — 27 septembre 2026

Les 22 échecs de la campagne initiale sont corrigés. Le dernier contrôle, après
actualisation du dépôt, compte **967 tests : 959 réussis, 0 échec et 8 ignorés**.
Il comprend les protections des jonctions, le refus des dossiers non enregistrés,
la commande de signature obligatoire et le téléchargement du DMG universel.

## Corrections

- **Worktrees Windows** : vérification du chemin dans la liste Git, exclusion du
  dépôt principal, retrait de la jonction de dépendances connue et refus des autres
  liens avant suppression. Les fichiers témoins du projet principal et des dossiers
  externes restent intacts dans les tests sur dépôts temporaires.
- **Navigation** : les liens Studio des trois pages secondaires conduisent à
  `index.html#crew` au lieu de l'ancienne ancre supprimée.
- **Accueil** : les trois traductions annoncent douze moteurs et incluent Gemini.
- **Tests portables** : chemins Windows, dossier personnel temporaire, scripts
  propres à chaque plateforme et fins de ligne CRLF pris en compte. Les tests du
  site correspondent à la mission interactive et à la nouvelle disposition tout
  en conservant les contrôles des liens, médias locaux et limites des démonstrations.
- **Codex remote** : les helpers de sockets Unix utilisent des séparateurs POSIX.
  Ce mode reste désactivé sous Windows, qui utilise le TUI local.

## Contrôles terminés

| Contrôle | Résultat |
| --- | --- |
| `npm run test:focused` | Dernier contrôle : 959 réussis, 0 échec, 8 ignorés ; code de sortie 0. |
| `npm run typecheck` | Processus principal et renderer : réussite. |
| `node tools/crewlo-site-check.cjs` | Réussite aux largeurs 1440, 1024, 768, 390 et 320 px. |
| Parcours du site | Animations, pause, arrêt hors écran, mode sans mouvement, sélection d'agents, clavier, onglets et liens vérifiés. |
| Diff | Aucun problème d'espacement détecté. |

Le contrôle du site ne remplace pas un audit complet WCAG ni un essai avec lecteur d'écran.

## Paquet Windows

Nouvelle construction : `dist/windows-preview/Crewlo-0.4.6-win-x64-preview-setup.exe`,
129 214 036 octets, non signée. SHA-256 :
`4ea44a06eb5ea82e3276233140e6a006fee0a8b8ad116227ad78d83d84f9e61d`.

La compilation et la création NSIS ont terminé avec le code 0. Le nouveau paquet
a passé les contrôles SQLite et terminal Windows sous Electron 32.3.3. Son
exécutable `win-unpacked/Crewlo.exe` a passé le parcours d'accueil, l'ouverture du
studio, les commandes de caméra et les paramètres, avec conservation d'une valeur
de test après redémarrage. Aucune exception JavaScript observée, aucun agent lancé.
L'assistant d'installation de ce nouveau fichier n'a pas été rejoué.

La prévisualisation réutilise les modules natifs validés sur le poste ; les
bibliothèques MSVC Spectre nécessaires à une reconstruction propre manquent encore.

L'assistant NSIS de la construction précédente a été installé avec succès en
français dans `out/windows-validation/installed/Crewlo`, avec raccourci Bureau.
Cette copie reste présente et n'est pas remplacée automatiquement.

## Limites restantes

### Complément : essai réel d'agent

`tools/check-live-agent.cjs` a exécuté une mission réelle avec Codex depuis
`win-unpacked/Crewlo.exe`, via les vrais IPC et PTY Windows. Le projet temporaire
contient un fichier avec un identifiant aléatoire, absent du prompt. La réponse
finale de l'agent correspond exactement à cet identifiant ; code de sortie 0,
fichier inchangé et aucun fichier supplémentaire dans le projet. Le profil Crewlo
est isolé, Codex est en lecture seule et utilise la connexion ChatGPT existante.

Preuve : `out/windows-validation/live-agent-VddLGD/terminal.txt` et `result.json`.
Cet essai valide le lancement et le retour du fournisseur ; il ne valide pas le
routage du hive, les panneaux actifs ou la livraison par messagerie.

L'essai Claude a échoué avec « OAuth session expired and could not be refreshed »
malgré un statut local « loggedIn ». Une reconnexion de l'utilisateur est nécessaire.
Preuve : `out/windows-validation/live-agent-fAdrUi/terminal.txt`.

Aucun certificat de signature avec clé privée n'a été trouvé dans le magasin
personnel Windows, ni configuration PFX/Azure dans l'environnement courant.
`npm run dist:win:signed` est préparé avec `forceCodeSigning=true` : il exige une
signature et conserve la reconstruction native. Sa configuration passe les tests,
mais aucune version signée n'a été produite. Windows Sandbox n'est pas disponible
sur le PATH ; aucun essai sur Windows propre n'est revendiqué.

- Prévisualisation locale non signée ; installation sur Windows propre et
  réputation SmartScreen non validées.
- La désinstallation a été bloquée par l'outil de contrôle Windows lors de l'essai
  précédent. Aucun contournement n'a été tenté. La conservation effective des
  données après désinstallation reste non vérifiée.
- Les essais d'interface précédents utilisent un profil temporaire et bloquent
  le lancement des fournisseurs. Le contrôle réel Codex complémentaire est décrit ci-dessus.
  Tasks, Approvals et Memory sont indisponibles sans agent ; leurs parcours actifs
  restent à vérifier.
- Aucun nouvel échange réel Telegram ou WhatsApp effectué. WhatsApp reste
  expérimental ; la preuve Telegram publiée concerne un échange simple déjà documenté.
- L'assistant Windows est en français ; l'application propose anglais, chinois et
  arabe. Le nouveau logo reste une proposition distincte, non intégrée à l'application.

## Preuves locales

Journaux UTF-16 : `out/windows-validation/fixed-full-tests.log`,
`out/windows-validation/fixed-build.log` et `out/windows-validation/fixed-desktop.log`.
Le contrôle le plus récent du dépôt est dans `out/windows-validation/repo-refresh-tests.log`.
Captures du nouveau paquet : `out/windows-validation/desktop-check-5dhhrJ/`
(`studio.png`, `settings.png`, `onboarding-provider.png`). Ces preuves ne sont pas
embarquées dans le paquet.

```powershell
npm run typecheck
npm run test:focused
npm run dist:win:preview
node tools/check-windows-package.cjs
# Définir CREWLO_PLAYWRIGHT si Playwright est externe au dépôt.
node tools/check-installed-desktop.cjs dist/windows-preview/win-unpacked/Crewlo.exe
# Essai réel facultatif : connexion fournisseur et consommation associée.
node tools/check-live-agent.cjs dist/windows-preview/win-unpacked/Crewlo.exe codex
node tools/crewlo-site-check.cjs
```

## Bouton de soutien — 27 septembre 2026

Le kit Buy Me a Coffee fourni par le mainteneur est intégré au menu de soutien
et à la dernière page de l'installateur Windows. L'action est facultative et
n'ouvre le navigateur qu'après un clic. La destination provient du même
`docs/crewlo-links.json` que le site et l'application. Lors de cette première
construction, le profil n'était pas configuré et le bouton restait désactivé.

Vérifications de cette version :

- TypeScript et compilation de l'application : réussis.
- 93 tests Crewlo : réussis, dont le contrôle de la destination et des injections NSIS.
- Compilation NSIS de la page finale avec profil absent et avec une destination
  de test locale : réussie sans avertissement ; aucun lien de paiement ouvert.
- Reconstruction réelle de l'installateur : réussie, toujours non signé.
- SVG de marque extrait de l'application empaquetée : identique au fichier fourni.
- SQLite et terminal Windows contrôlés en lecture seule dans le nouveau paquet : réussis.

Artefact local de cette première construction : `dist/windows-preview/Crewlo-0.4.6-win-x64-preview-setup.exe`
(129 248 669 octets).
SHA-256 : `4083abc6e700035150f93ddd9725bc85cc2afa295bf47fe887ab8c3e024294f5`.

Le rendu natif de la nouvelle page finale n'a pas été parcouru manuellement.
Cette reconstruction ne remplace pas les essais encore nécessaires sur un PC
vierge, de désinstallation et de signature. Le binaire n'est pas publié dans
une release publique.

### Activation du profil confirmé

Hafid Idrissi a ensuite fourni `https://buymeacoffee.com/hafididrissi`.
Cette destination est configurée dans le site, le README, le soutien GitHub,
l'application et la page finale de l'installateur. Le profil est ouvert
uniquement sur action du visiteur ; aucun paiement n'a été effectué.

La reconstruction avec le lien actif a réussi. La destination a été retrouvée
dans le JavaScript de l'application empaquetée et dans l'include NSIS généré.
Les 93 tests Crewlo, les contrôles du site sur cinq tailles d'écran et les
boutons des pages internes du blog passent. SQLite et le terminal du nouveau
paquet ont aussi été contrôlés en lecture seule.

Artefact actuel : `dist/windows-preview/Crewlo-0.4.6-win-x64-preview-setup.exe`
(129 248 937 octets), toujours non signé.
SHA-256 : `10436185498dd34c8e68e2c2dca49bf0171206b61ba435d8b0956e237d358bfe`.
Les limites de validation manuelle décrites ci-dessus restent applicables.
