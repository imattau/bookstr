# UI Components

Reusable primitive components styled with design tokens.

## Button

`<Button>` wraps a standard `<button>` element.

### Props
- `variant` – `'primary' | 'outline'` (default: `'outline'`)
- Any other `button` attributes like `onClick`, `disabled`, `type`, `className`

## Input

`<Input>` wraps a plain `<input>` element and stretches to full width.

### Props
- Accepts all native `input` attributes

## Modal

`<Modal>` provides a centered overlay container.

### Props
- `onClose` – called when clicking the backdrop
- `className` – extra classes for the inner container
- `children` – modal contents
