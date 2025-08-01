import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AboutPage from '../src/pages/About';

expect.extend(toHaveNoViolations);

test('About page has no accessibility violations', async () => {
  const { container } = render(<AboutPage />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
