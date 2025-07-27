# Managing Nostr Features

This document gives a short overview of the extra Nostr capabilities exposed by Bookstr.

## Relay Management

The **RelayListManager** component in the profile settings screen allows you to modify the list of relays the app communicates with.

1. Add a relay by entering a `wss://` URL and clicking **Add**.
2. Remove a relay by pressing **Remove** next to its address.

All changes are stored as kind `10002` events so the new relay list is shared across devices.

## Delegations

Use **DelegationManager** from the profile settings to generate delegation tags for another pubkey:

1. Fill in the delegatee pubkey, the event kind to allow and the number of days the tag should remain valid.
2. Click **Create** to produce the delegation tag. Copy the JSON output and share it with the delegatee.

They can then attach this tag when publishing to act on your behalf.

## Direct Messaging

Bookstr includes a lightweight chat modal for private conversations.

- **DMModal** opens a single user chat. Messages are encrypted with NIP‑04 and displayed in a scrolling list. Use the input box and **Send** button to chat.

The component subscribes to recent messages when opened and appends new ones in real time.
