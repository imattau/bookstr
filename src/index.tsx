import React from 'react';
import { AppShell } from './AppShell';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ThemeProvider } from './ThemeProvider';
import { DMModal } from './components/DMModal';
import { useNostr } from './nostr';

export const App: React.FC = () => {
  const [active, setActive] = React.useState<
    'discover' | 'library' | 'write' | 'activity' | 'profile'
  >('discover');
  const [chatOpen, setChatOpen] = React.useState(false);
  const { contacts } = useNostr();

  return (
    <ThemeProvider>
      <AppShell>
        <Header onSearch={() => {}}>
          <button
            onClick={() => setChatOpen(true)}
            aria-label="Chat"
            className="p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
          >
            💬
          </button>
        </Header>
        <main />
        <BottomNav active={active} onChange={setActive} />
        {chatOpen && contacts[0] && (
          <DMModal to={contacts[0]} onClose={() => setChatOpen(false)} />
        )}
      </AppShell>
    </ThemeProvider>
  );
};
