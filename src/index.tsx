import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './AppShell';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ThemeProvider } from './ThemeProvider';
import { DMModal } from './components/DMModal';
import { useNostr } from './nostr';
import { BookListScreen } from './screens/BookListScreen';
import { BookDetailScreen } from './screens/BookDetailScreen';

export const App: React.FC = () => {
  const [active, setActive] = React.useState<
    'discover' | 'library' | 'write' | 'activity' | 'profile'
  >('discover');
  const [chatOpen, setChatOpen] = React.useState(false);
  const { contacts } = useNostr();

  return (
    <ThemeProvider>
      <BrowserRouter>
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
          <main className="p-4">
            <Routes>
              <Route path="/books" element={<BookListScreen />} />
              <Route path="/book/:bookId" element={<BookDetailScreen />} />
              <Route path="*" element={<Navigate to="/books" />} />
            </Routes>
          </main>
          <BottomNav active={active} onChange={setActive} />
          {chatOpen && contacts[0] && (
            <DMModal to={contacts[0]} onClose={() => setChatOpen(false)} />
          )}
        </AppShell>
      </BrowserRouter>
    </ThemeProvider>
  );
};
