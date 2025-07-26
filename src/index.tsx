import React from 'react';
import { AppShell } from './AppShell';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ThemeProvider } from './ThemeProvider';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { ReaderDemo } from './components/ReaderDemo';

export const App: React.FC = () => {
  const [active, setActive] = React.useState<
    'discover' | 'library' | 'write' | 'activity' | 'profile'
  >('discover');
  return (
    <ThemeProvider>
      <AppShell>
        <Header onSearch={() => {}}>
          <ThemeSwitcher />
        </Header>
        <main className="p-4">
          {active === 'discover' ? <ReaderDemo /> : 'Hello, world!'}
        </main>
        <BottomNav active={active} onChange={setActive} />
      </AppShell>
    </ThemeProvider>
  );
};
