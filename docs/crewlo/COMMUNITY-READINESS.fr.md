# Préparation communautaire — 27 septembre 2026

Crewlo est prêt pour une présentation **en preview ouverte aux testeurs**.
Ce document distingue les contrôles automatisés des essais personnels encore ouverts.

## Dépendances et correctifs

- Suppression de `localtunnel` et de ses types, inutilisés par le code ; cela retire l'ancien Axios.
- TOML utilisé par `tunnelmole` fixé à `4.2.0`, avec un test de compatibilité, de profondeur excessive et de pollution de prototype.
- Hono mis à jour vers `4.13.9` ; Axios restant à `1.20.0`.
- `npm audit --omit=dev` : **0 vulnérabilité signalée** après correction. Ce résultat porte sur les dépendances npm de production, pas sur un audit exhaustif de l'application ou d'Electron.
- TypeScript : vérifications réussies. Suite complète : **969 tests, 961 réussis, 0 échec, 8 ignorés**.

Les installateurs preview 2 sont reconstruits depuis `f8585344`. Les anciennes
preview 1 sont conservées comme historique et remplacées dans les liens du site.

## Installation et utilisation

| Cible | Contrôles terminés | Limites |
| --- | --- | --- |
| Windows local | SQLite, PTY, accueil, studio, caméra, paramètres persistants ; réponse réelle Codex lisant un fichier temporaire via IPC/PTY, sans modification du fichier | Ce test ne valide pas tous les agents, le routage hive ni la messagerie |
| Windows Server 2022 temporaire | Téléchargement du nouvel EXE, SHA-256, installation NSIS silencieuse, runtime SQLite/PTY, premier lancement et paramètres après redémarrage | Un runner serveur ne remplace pas un PC Windows 10/11 personnel ; parcours visuel de l'installateur et désinstallation non validés |
| Mac Apple Silicon et Intel, macOS 15 | DMG vérifié et monté, application copiée, SQLite/PTY, accueil, studio, caméra et paramètres après redémarrage | Profil isolé, agents bloqués pendant le test UI ; permissions personnelles, quarantaine d'un téléchargement navigateur et mission réelle sur Mac non validées |

- [Exécution Windows](https://github.com/HafidIdrissi/Crewlo/actions/runs/36352877292)
- [Exécutions Mac](https://github.com/HafidIdrissi/Crewlo/actions/runs/36352545549)

Windows reste non signé ; macOS utilise une signature ad hoc, sans Developer ID
ni notarisation. Pas de mise à jour automatique. Les essais live Telegram,
WhatsApp et Claude restent reportés conformément au choix du mainteneur.

## Site, dépôt et bouton Star

La documentation de contribution, la politique de sécurité et les mentions
obsolètes de publication ont été actualisées. Le site contient un bouton Star
avec le compteur public GitHub, sans token ni action automatique sur le compte.
Le README utilise un badge de compteur GitHub.

Contrôles du site réussis à 320, 390, 768, 1024 et 1440 px. Le compteur couvre
une valeur normale, zéro, une réponse invalide et une panne de l'API. Dans ces
deux derniers cas, le lien reste disponible sans nombre inventé. Le compteur
réel a été vérifié sur le site public. L'audit complet d'accessibilité reste ouvert.

## Dernier essai à faire sur une machine personnelle

1. Télécharger la preview 2 correspondant à la machine depuis le site.
2. Installer normalement et noter les éventuels avertissements du système.
3. Connecter son propre agent dans un projet de test non sensible.
4. Envoyer une demande de résumé, lire sa réponse et vérifier les permissions.
5. Fermer et rouvrir Crewlo, puis vérifier les paramètres et l'historique.

Ces étapes personnelles ne sont pas déclarées réussies par les tests CI.
