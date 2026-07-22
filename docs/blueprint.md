# QuickReply Manager — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot that lets users create personal quick-reply buttons and access owner-maintained shared sets. Users can export/share personal sets with optional moderation, while the owner manages shared buttons and reviews exports. Focuses on static text replies for efficient communication in chats and groups.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Individual Telegram users needing saved replies
- Group chat participants using shared sets

## Success criteria

- Users can create and use personal quick-replies
- Owner can manage shared sets and review exports
- Exported sets trigger owner notifications with share codes

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open main menu with welcome and help
- **/help** (command, actor: user, command: /help) — List main commands and features
- **/my** (command, actor: user, command: /my) — Access personal quick-replies menu (list, add, edit, delete, export)
- **/shared** (command, actor: user, command: /shared) — View owner-maintained shared set buttons
- **Add New Reply** (button, actor: user, callback: reply:add) — Initiates quick-reply creation flow
  - inputs: Reply name, Button text, Optional payload
  - outputs: Created personal reply entry
- **Export Set** (button, actor: user, callback: export:start) — Initiates export/share process for personal sets
  - inputs: Set name, Visibility choice
  - outputs: Export record with share code

## Flows

### Create Personal Reply
_Trigger:_ /my followed by 'Add New Reply'

1. Request reply name
2. Request button text
3. Request optional payload
4. Confirm creation

_Data touched:_ Personal quick-reply set

### Use Reply
_Trigger:_ Tap button in /my or /shared menus

1. Send button text to current chat

_Data touched:_ User's active chat context

### Export Personal Set
_Trigger:_ Tap 'Export Set' button

1. Request set name
2. Generate share code
3. Confirm public visibility
4. Notify owner

_Data touched:_ Export record

### Owner Admin
_Trigger:_ Owner-specific commands

1. List exports for moderation
2. Edit shared set buttons
3. Approve/reject exports

_Data touched:_ Shared set, Export records

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User profile** _(retention: persistent)_ — Telegram user ID and display name
  - fields: telegram_id, display_name
- **Personal quick-reply set** _(retention: persistent)_ — User-specific collection of up to 50 buttons
  - fields: user_id, reply_name, button_text, payload
- **Shared quick-reply set** _(retention: persistent)_ — Owner-managed collection of up to 100 buttons
  - fields: button_text, payload, owner_approved
- **Export record** _(retention: persistent)_ — Published personal set with share code
  - fields: export_id, user_id, set_name, share_code, is_public

## Integrations

- **Telegram** (required) — Bot API messaging and inline keyboards
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Add/remove/edit shared set buttons
- Review and moderate exported sets
- Receive notifications on new exports

## Notifications

- Owner notified when users export/share sets

## Permissions & privacy

- Personal sets are private by default
- Exports require explicit public sharing
- User data stored with Telegram ID only

## Edge cases

- Exceeding 50 personal buttons
- Invalid share codes during import
- Duplicate button names in sets
- Owner offline during export moderation

## Required tests

- End-to-end export flow with owner notification
- Shared set button sending in group chats
- Personal set limit enforcement

## Assumptions

- Owner is sole admin for shared set
- Exports require moderation before public sharing
- Payloads are plain text only
