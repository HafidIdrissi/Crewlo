# Security policy

Crewlo is a source-first desktop application. Security fixes target the current `main` branch; there is no verified Crewlo installer or supported release series yet.

## Report privately

Please do **not** publish a vulnerability, credential, private chat or raw terminal log in an issue or discussion. Use [Crewlo's private vulnerability reporting form](https://github.com/HafidIdrissi/Crewlo/security/advisories/new). Include a concise impact description, reproduction steps, affected commit or version, and a minimal proof of concept without real secrets. The maintainers can coordinate a fix through the private advisory.

The original Munder Difflin project is not Crewlo's security contact. If the problem is also present upstream, coordinate disclosure separately rather than assuming a report here reaches its maintainers.

## Security boundaries

- Agents run as local CLI processes with the permissions of the chosen tool and its configuration. Crewlo cannot replace that provider's approval or sandbox controls.
- Telegram uses outbound Bot API long polling. WhatsApp uses the official Meta Cloud API and a signed webhook receiver bound to `127.0.0.1`; the user must supply their own public HTTPS ingress for Meta callbacks. Do not expose the local receiver directly to the Internet.
- Pairing is intended for one confirmed owner in private chats. Messages from a paired phone are still untrusted input to an agent; do not grant an agent broad filesystem or shell permissions solely because the transport is paired.
- Messaging credentials use an OS-encrypted store where supported. Conversation history is not encrypted by the messaging integration. Keep your PC, account and agent CLI protected.
- The Telegram and WhatsApp integrations have automated tests, but WhatsApp live delivery and packaged cross-platform behavior have not yet been independently verified. See the [live-test checklist](docs/messageries-tests.fr.md).

For ordinary non-security bugs, use [Crewlo Issues](https://github.com/HafidIdrissi/Crewlo/issues/new/choose).
