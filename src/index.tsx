import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { AppShell } from './AppShell';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ThemeProvider } from './ThemeProvider';
import { DMModal } from './components/DMModal';
import { useNostr } from './nostr';
import { BookListScreen } from './screens/BookListScreen';
import { BookDetailScreen } from './screens/BookDetailScreen';
import { Discover } from './components/Discover';
import { Library } from './components/Library';
import { BookPublishWizard } from './components/BookPublishWizard';
import { CommunityFeed } from './components/CommunityFeed';
import { ProfileSettings } from './components/ProfileSettings';

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const active = React.useMemo<
    'discover' | 'library' | 'write' | 'activity' | 'profile'
  >(() => {
    const key = location.pathname.split('/')[1];
    if (
      key === 'discover' ||
      key === 'library' ||
      key === 'write' ||
      key === 'activity' ||
      key === 'profile'
    ) {
      return key;
    }
    return 'discover';
  }, [location.pathname]);
  const [chatOpen, setChatOpen] = React.useState(false);
  const { contacts } = useNostr();

  const handleChange = (key: typeof active) => {
    navigate(`/${key}`);
  };

  return (
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
          <Route path="/discover" element={<Discover />} />
          <Route path="/library" element={<Library />} />
          <Route path="/write" element={<BookPublishWizard />} />
          <Route path="/activity" element={<CommunityFeed />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/books" element={<BookListScreen />} />
          <Route path="/book/:bookId" element={<BookDetailScreen />} />
          <Route path="*" element={<Navigate to="/discover" />} />
        </Routes>
      </main>
      <BottomNav active={active} onChange={handleChange} />
      {chatOpen && contacts[0] && (
        <DMModal to={contacts[0]} onClose={() => setChatOpen(false)} />
      )}
    </AppShell>
  );
};

export const App: React.FC = () => (
  <ThemeProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </ThemeProvider>
);
