import { TextEncoder, TextDecoder } from 'util';
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Header } from '../src/components/Header';

expect.extend(toHaveNoViolations);

test('Header suggestions list has no accessibility violations', async () => {
  const { container } = render(
    <BrowserRouter>
      <Header
        onSearch={() => {}}
        suggestions={[
          { id: '1', label: 'One', type: 'book' },
          { id: '2', label: 'Two', type: 'book' },
        ]}
      />
    </BrowserRouter>
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
