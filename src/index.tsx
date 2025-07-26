import React from 'react';
import { AppShell } from './AppShell';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';

export const App: React.FC = () => {
  const [active, setActive] = React.useState<
    'discover' | 'library' | 'write' | 'activity' | 'profile'
  >('discover');
  return (
    <AppShell>
      <Header onSearch={() => {}} />
      <main className="p-4">Hello, world!</main>
      <BottomNav active={active} onChange={setActive} />
    </AppShell>
  );
};
