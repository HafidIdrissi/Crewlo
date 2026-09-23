# Tester Telegram et WhatsApp dans Crewlo

Ces intégrations utilisent les agents déjà connectés à Crewlo. Elles ne démarrent pas un nouvel agent et ne valident jamais une permission à votre place. Gardez le PC allumé et Crewlo ouvert. Les échanges apparaissent dans **Conversation**, avec le badge du canal.

## Telegram — le plus simple à tester

1. Dans Telegram, créez un bot auprès du compte officiel [@BotFather](https://t.me/BotFather) avec `/newbot`.
2. Dans Crewlo, cliquez sur **Telegram** en haut à droite. Collez le token dans le champ prévu, puis **Connect**. Ne mettez pas votre token dans un ticket, un message de chat ou une commande de terminal.
3. Scannez le QR/lien, appuyez sur **Start** dans Telegram, puis **Confirm pairing** sur le PC après avoir vérifié votre identité.
4. Sélectionnez un agent connecté dans Crewlo, ou envoyez `/agents`, puis `/agent <id>` depuis Telegram.
5. Envoyez : « Réponds simplement : Bonjour depuis Crewlo ». Vérifiez la réponse préfixée par le nom de l’agent sur le téléphone et dans Conversation.

Telegram fonctionne par [long polling de l’API officielle](https://core.telegram.org/bots/api#getupdates) : aucun tunnel ou serveur public à configurer. Un autre outil ne doit pas utiliser le même bot simultanément. Le [guide Telegram détaillé](telegram-setup.md) couvre les erreurs et les limites.

## WhatsApp — API officielle Meta, pas WhatsApp Web

Le QR Crewlo sert à associer **votre conversation** au numéro de l’API. Ce n’est pas un QR « Appareils connectés », et il ne connecte pas votre compte personnel par une bibliothèque non officielle.

1. Créez/configurez une application Meta avec **WhatsApp Cloud API**. Pour commencer, utilisez le numéro de test fourni par Meta et ajoutez votre téléphone aux destinataires de test autorisés. Récupérez le **Phone number ID**, un **access token** avec les permissions WhatsApp nécessaires et l’**App secret** de l’application. Les tokens de test peuvent expirer ; Crewlo ne les renouvelle pas automatiquement. Voir la [collection officielle Meta](https://www.postman.com/meta/whatsapp-business-platform/collection/wlk6lh4/whatsapp-cloud-api).
2. Cliquez sur **WhatsApp** dans Crewlo. Renseignez ces informations, la version de Graph API affichée par votre application Meta (v26.0 par défaut), le port local et un **verification token** de votre choix : 24 à 128 lettres/chiffres/caractères `_` ou `-`. Notez ce dernier dans votre gestionnaire de mots de passe pour pouvoir le copier dans Meta.
3. Cliquez sur **Connect**. Crewlo valide le numéro et ouvre uniquement un récepteur local, par défaut `http://127.0.0.1:8788/whatsapp/webhook`. **Local listener ready** ne signifie pas encore que Meta atteint le PC.
4. Avec votre propre tunnel/relais HTTPS, faites pointer une URL publique vers ce récepteur local. Dans Meta, configurez le callback `https://VOTRE-ADRESSE/whatsapp/webhook`, indiquez exactement le même verification token et abonnez l’application au champ **messages** du compte WhatsApp concerné. Crewlo ne crée aucun tunnel et ne publie aucune adresse tout seul. Les requêtes POST sont vérifiées avec la [signature HMAC officielle Meta](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/), calculée sur le corps brut avec l’App secret.
5. Ouvrez le lien/QR d’appairage Crewlo depuis votre téléphone et **envoyez** le message prérempli `CREWLO …` au numéro Cloud API. Validez votre numéro sur le PC avec **Confirm pairing**. Le lien est à usage unique et expire après cinq minutes.
6. Choisissez l’agent, puis envoyez `/agents`, `/agent <id>` et « Réponds simplement : Bonjour depuis Crewlo ». Consultez également Conversation.

WhatsApp autorise les réponses libres dans la fenêtre ouverte par le dernier message de l’utilisateur (24 heures). Crewlo n’envoie pas de modèles payants pour contourner cette limite : une réponse hors fenêtre est conservée avec **Waiting for your WhatsApp message**. Envoyez un nouveau message depuis votre téléphone pour la débloquer. [Règles de conversation dans la documentation officielle WhatsApp](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/).

**Accepted by WhatsApp** = Meta a accepté la requête, pas nécessairement livré le message. **Delivered** et **Read** proviennent des notifications de Meta. La lecture peut ne jamais être signalée si les accusés de lecture sont désactivés. Un échec explicite ou un résultat incertain reste visible ; Crewlo ne renvoie pas automatiquement un message dont l’envoi est ambigu.

Si Meta signale un échec plus tard par webhook, la réponse reste en échec, même si la cause est une fenêtre expirée : elle n’est pas rejouée automatiquement, pour éviter de dupliquer des morceaux déjà livrés. Consultez Conversation avant de demander un nouvel envoi.

## Vérification rapide commune

- **Identité :** une autre personne ou un groupe ne doit déclencher aucun travail. Ne confirmez aucun numéro inconnu dans Crewlo.
- **Pause :** mettez la livraison en pause sur le PC, envoyez une demande sur le téléphone, vérifiez qu’elle attend, puis utilisez **Resume**. Une seule demande doit parvenir à l’agent.
- **Indisponibilité :** déconnectez la session agent et envoyez une nouvelle demande : Crewlo doit expliquer qu’elle n’a pas été soumise.
- **Réponse longue :** demandez une réponse de plusieurs milliers de caractères ; les morceaux conservent le nom de l’agent.
- **Redémarrage :** relancez Crewlo avec le même studio. Telegram reprend les mises à jour ; pour WhatsApp, gardez également le tunnel et l’abonnement Meta actifs. Le propriétaire confirmé et la file locale sont conservés.
- **Disconnect :** arrête le transport et retire ses secrets. Le travail déjà soumis peut continuer ; les messages encore retenus dans la file sont annulés.

Un agent doit répondre via son outbox normal avec le champ `public_reply` demandé dans le message reçu. Les sorties de terminal ne sont jamais utilisées comme réponse de substitution. Si Conversation reste sur **Awaiting agent reply**, regardez l’état et les éventuelles permissions de l’agent sur le PC, plutôt que de renvoyer la même demande.

## Ce qui est vérifiable sans vos identifiants

Les tests automatiques utilisent des identifiants factices et des réponses de fournisseur simulées. Ils vérifient la signature HTTP, le stockage chiffré Windows, les frontières d’identité, la déduplication, les pauses, le retour des réponses publiques et les écrans. Ils ne prouvent pas l’accès à votre application Meta, votre token Telegram, votre tunnel public ni la réponse de votre modèle réel. Les étapes ci-dessus restent nécessaires pour valider ces éléments.

Les secrets sont chiffrés dans le coffre-fort existant de Crewlo. Les messages, états et identifiants de propriétaire restent dans le stockage local ; ce journal de conversation n’est pas chiffré par cette fonctionnalité. Les deux canaux sont indépendants : vous pouvez activer ou déconnecter l’un sans modifier l’autre.

### Vérifications locales du 22 septembre 2026

- 104 tests ciblés passés : Telegram, WhatsApp, boutons de soutien, médias promotionnels et régressions de permissions/files/studio.
- TypeScript côté main et interface : passés. Compilation de production : passée.
- Telegram : essai Electron avec vrai coffre-fort Windows, SQLite et IPC ; API Telegram et réponse agent simulées.
- WhatsApp : essai Electron avec vrai coffre-fort Windows, SQLite, IPC et serveur HTTP local ; challenge Meta, signature HMAC, doublons, propriétaire, accusés de livraison/lecture et déconnexion vérifiés. API Meta et exécution agent simulées.
- Studio : essais à 1440, 1024 et 720 pixels ; labels d’activité, saisie large et pause/reprise vérifiés.

Reproduction des vérifications principales :

```powershell
npm run typecheck
node --test test/telegram-hive.test.cjs test/telegram-http.test.cjs test/telegram-messaging.test.cjs test/whatsapp-transport.test.cjs test/whatsapp-service.test.cjs
node --test test/community-links.test.cjs test/crewlo-promo.test.cjs
npm run build
node tools/crewlo-telegram-smoke.cjs
node tools/crewlo-whatsapp-ui-smoke.cjs
node tools/crewlo-activity-capture.cjs
node tools/crewlo-site-check.cjs
```

Pour les scripts d’interface, Playwright doit être disponible dans les modules Node, ou indiqué par `CREWLO_PLAYWRIGHT`. Ils utilisent des profils de test isolés. Les tests ne démarrent pas vos agents et ne contactent pas Telegram ou Meta avec de vrais identifiants.

### Reprise après panne — renforcement du 22 septembre 2026

Deux défauts ont été reproduits puis corrigés avec des tests de régression :

- Le délai global imposé par l’API est désormais enregistré. Un redémarrage ne permet plus aux réponses suivantes de le contourner. Les anciens délais enregistrés sur les messages sont repris ; les messages et délais de l’ancien appairage ne sont pas transmis à un nouveau propriétaire après Disconnect.
- Une réponse publique possède un journal de transfert durable avant son archivage. Si le stockage du transport échoue, ce transfert peut reprendre après redémarrage, sans relancer l’agent ni reproduire les livraisons inbox/notifications déjà tentées. Le corps générique et le sujet interne ne sont pas copiés dans ce journal.

En cas d’erreur de stockage, rétablis l’accès au stockage puis redémarre Crewlo. Une réponse dont l’envoi réseau est déjà **incertain** n’est pas renvoyée automatiquement. Consulte le téléphone et Conversation avant toute nouvelle demande.

Limites : la notification Hive locale est « au plus une fois » ; un crash entre le checkpoint et le routage local peut l’omettre, tout en conservant la réponse distante récupérable. Les tests ne simulent pas une coupure électrique ni une perte matérielle de disque, et ce mécanisme ne revendique pas une garantie `fsync` ou « exactement une fois » sur le réseau.

Résultats de cette passe : **81/81 tests** messageries/routage/reprise, **21/21 tests** diagnostic/site/liens et **45/45 régressions** studio/permissions/files passés, soit **147 tests ciblés**. TypeScript main/interface, compilation de production et les deux essais Electron Telegram/WhatsApp passent également. Ces essais utilisent le vrai chiffrement Windows, SQLite, IPC et, pour WhatsApp, le récepteur HTTP local ; les API externes et réponses agent restent simulées. Ce n’est pas un résultat de la suite complète du dépôt, dont les échecs historiques restent documentés dans les [notes de vérification](crewlo/VERIFICATION.md).

```powershell
node --test test/telegram-hive.test.cjs test/telegram-http.test.cjs test/telegram-messaging.test.cjs test/whatsapp-transport.test.cjs test/whatsapp-service.test.cjs test/messaging-reply-recovery.test.cjs test/hive-malformed-outbox.test.cjs test/hive-unknown-recipient.test.cjs
node --test test/crewlo-doctor.test.cjs test/community-links.test.cjs test/crewlo-promo.test.cjs
node --test test/tool-activity.test.cjs test/crewlo-voxel.test.cjs test/hook-event-contract.test.cjs test/codex-sandbox.test.cjs test/control.test.cjs test/queue-delivery.test.cjs test/prompt-delivery.test.cjs test/hive-nudge.test.cjs
```

Pour l’installation, utilise `npm run doctor` et le [démarrage Windows détaillé](crewlo/QUICKSTART.fr.md). Le diagnostic réel de ce PC signale encore Node 20.19.4 et l’absence détectée des bibliothèques MSVC Spectre correspondantes ; il ne répare ni n’installe rien. Le test avec tes comptes, ton téléphone et ton agent réel reste à effectuer. Aucune vidéo d’exécution réelle n’est annoncée comme validée.
