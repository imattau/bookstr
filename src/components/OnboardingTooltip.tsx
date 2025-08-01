import React from 'react';
import { useOnboarding } from '../useOnboarding';

interface OnboardingTooltipProps {
  storageKey: string;
  text: string;
  children: React.ReactElement;
}

/**
 * Wraps a child element to show a tooltip on first interaction.
 */
export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  storageKey,
  text,
  children,
}) => {
  const { ref, show, dismiss, Tooltip } = useOnboarding(storageKey, text);

  const child = children as React.ReactElement<any, any>;

  return React.cloneElement(child, {
    ref,
    onClick: (e: React.MouseEvent) => {
      dismiss();
      child.props.onClick?.(e);
    },
    className: `${child.props.className ?? ''} ${
      show ? 'relative rounded ring-2 ring-primary-300' : ''
    }`,
    children: (
      <>
        {child.props.children}
        {Tooltip}
      </>
    ),
  });
};
