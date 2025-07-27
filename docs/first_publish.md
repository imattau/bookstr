# Publishing Your First Book

This guide walks you through using the `BookPublishWizard` to create and publish a book event on Nostr.

## 1. Starting the Wizard

Open the "Write" screen or choose **Publish Book** from the library. The wizard appears and guides you through several steps.

## 2. Enter Details

1. **Title & Summary** – Fill in the title and a short summary then press **Next**.
2. **Cover Image** – Paste a URL for the cover artwork (optional). Continue with **Next**.
3. **Tags** – Enter comma separated tags and press **Next**.
4. **Content** – Write the book using Markdown. Only a small set of HTML tags is allowed. See [allowed_html.md](allowed_html.md) for details. Press **Next** once more to preview.

## 3. Proof‑of‑Work and Publishing

On the final screen you can review the preview. Tick **Enable proof-of-work** if desired to add a small PoW to the event before clicking **Publish**. Successful publishing calls `reportBookPublished()` and unlocks the _First Book Published_ achievement.

## 4. Locating the Event

After publishing, the wizard returns to the first step. Two events are sent:
the long-form `kind:30023` entry and a matching `kind:41` list event that
references it. This list event ensures your book appears in the library and in
`BookListScreen`. Most clients will show the events in your profile or search
results a few seconds after publication.

## 5. Large Chapters

Bookstr limits individual event content to `MAX_EVENT_SIZE` bytes (1000 by
default). When a chapter is longer, `publishLongPost` slices the text into
numbered parts. Each part shares a unique `d` tag and stores its position with a
`part` index. The reader collects all events with the same `d` value and
concatenates them before rendering so the full chapter is shown to the user.
