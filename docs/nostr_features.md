# Managing Nostr Features

This document gives a short overview of the extra Nostr capabilities exposed by Bookstr.

## Relay Management

The dedicated **Relay settings** page exposes the **RelayListManager** so you can edit the list of relays the app communicates with.

1. Add a relay by entering a `wss://` URL and clicking **Add**.
2. Remove a relay by pressing **Remove** next to its address.
3. Click **Add relays from followed authors** to merge relay URLs advertised by people you follow. It uses `fetchUserRelays` to gather each contact's list and appends any unique addresses.

All changes are stored as kind `10002` events so the new relay list is shared across devices.

## Search Relays

Preferred search relays are stored in `kind:10007` events. When the SearchRelayManager UI is added to the profile settings you will be able to:

1. Enter a `wss://` URL and press **Add** to include it.
2. Click **Remove** beside an address to delete it.

The updated list is saved as a `kind:10007` event so other clients can reuse your search preferences.


## Delegations

Use **DelegationManager** from the profile settings to generate delegation tags for another pubkey:

1. Fill in the delegatee pubkey, the event kind to allow and the number of days the tag should remain valid.
2. Click **Create** to produce the delegation tag. Copy the JSON output and share it with the delegatee.

They can then attach this tag when publishing to act on your behalf.

## Direct Messaging

Bookstr includes a lightweight chat modal for private conversations.

- **DMModal** opens a single user chat. Messages are encrypted with NIP‑04 and displayed in a scrolling list. Use the input box and **Send** button to chat.

The component subscribes to recent messages when opened and appends new ones in real time.
