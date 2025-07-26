import React from 'react';
import { useOnboarding } from '../useOnboarding';

interface OnboardingTooltipProps {
  storageKey: string;
  text: string;
  children: React.ReactElement;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  storageKey,
  text,
  children,
}) => {
  const { ref, show, dismiss, Tooltip } = useOnboarding(storageKey, text);

  return React.cloneElement(children, {
    ref,
    onClick: (e: React.MouseEvent) => {
      dismiss();
      children.props.onClick?.(e);
    },
    className: `${children.props.className ?? ''} ${
      show ? 'relative rounded ring-2 ring-primary-300' : ''
    }`,
    children: (
      <>
        {children.props.children}
        {Tooltip}
      </>
    ),
  });
};
