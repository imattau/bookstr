# Sending a Zap

This short guide explains how to send a lightning "zap" to tip another user.

## Requirements

- The target profile must include a lightning address.
- A WebLN compatible wallet can be used to pay automatically (optional).

## Zapping a Book

1. Click **Zap** on a `BookCard`.
2. Bookstr queries the profile's lightning address and creates a zap request event.
3. The lnurl callback returns an invoice which can be paid via WebLN or any lightning wallet.

## Confirmation

After payment Bookstr waits for the `9735` zap receipt event that matches the invoice. Once received the zap is confirmed and the button updates to *Zapped!*.

