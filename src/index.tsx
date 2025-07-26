import React from 'react';
import { AppShell } from './AppShell';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ThemeProvider } from './ThemeProvider';

export const App: React.FC = () => {
  const [active, setActive] = React.useState<
    'discover' | 'library' | 'write' | 'activity' | 'profile'
  >('discover');

  return (
    <ThemeProvider>
      <AppShell>
        <Header onSearch={() => {}} />
        <main />
        <BottomNav active={active} onChange={setActive} />
      </AppShell>
    </ThemeProvider>
  );
};
