import React from 'react';

/**
 * Simple onboarding tooltip helper.
 *
 * Shows a small tooltip next to the referenced element until the user
 * dismisses it. Dismissal state is stored in `localStorage` keyed by the
 * provided identifier.
 */
export function useOnboarding(key: string, text: string) {
  const [show, setShow] = React.useState(false);
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!localStorage.getItem(`onboard-${key}`)) {
      setShow(true);
    }
  }, [key]);

  const dismiss = React.useCallback(() => {
    if (show) {
      localStorage.setItem(`onboard-${key}`, '1');
      setShow(false);
    }
  }, [show, key]);

  const Tooltip =
    show && ref.current ? (
      <div className="pointer-events-none absolute z-10 mt-[var(--space-1)] whitespace-nowrap rounded bg-primary-600 px-2 py-1 text-[12px] text-white shadow">
        {text}
      </div>
    ) : null;

  return { ref, show, dismiss, Tooltip };
}
