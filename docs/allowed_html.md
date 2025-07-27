# Allowed HTML Tags

Bookstr sanitizes all user supplied Markdown with DOMPurify. Only a minimal set of HTML elements is permitted to keep books lightweight.

## Tags

- a
- b
- i
- em
- strong
- p
- ul
- ol
- li
- pre
- code
- blockquote
- h1
- h2
- h3
- h4
- h5
- h6
- img
- hr
- br

## Attributes

- href
- src
- alt
- title
- rel
- target

Any other tags or attributes will be stripped during sanitisation.
