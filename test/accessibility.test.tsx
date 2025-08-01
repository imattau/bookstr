import { TextEncoder, TextDecoder } from 'util';
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import SettingsHome from '../src/pages/SettingsHome';

expect.extend(toHaveNoViolations);

test('SettingsHome page has no accessibility violations', async () => {
  const { container } = render(
    <BrowserRouter>
      <SettingsHome />
    </BrowserRouter>
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
