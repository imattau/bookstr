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
import { search, Suggestion } from './search';
import { BottomNav } from './components/BottomNav';
import { ThemeProvider } from './ThemeProvider';
import { DMModal } from './components/DMModal';
import { useNostr } from './nostr';
import { BookListScreen } from './screens/BookListScreen';
import { BookDetailScreen } from './screens/BookDetailScreen';
import { ReaderScreen } from './screens/ReaderScreen';
import { Discover } from './components/Discover';
import LibraryPage from './pages/Library';
import { BookPublishWizard } from './components/BookPublishWizard';
import { NotificationFeed } from './components/NotificationFeed';
import ProfileSettingsPage from './pages/ProfileSettings';
import { ProfileScreen } from './screens/ProfileScreen';
import { ToastProvider } from './components/ToastProvider';

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
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);

  const handleSearch = async (q: string) => {
    const res = await search(q);
    setSuggestions(res);
  };

  const handleSelectSuggestion = (id: string, type: string) => {
    setSuggestions([]);
    if (type === 'book') {
      navigate(`/book/${id}`);
    } else if (type === 'search') {
      navigate(`/discover?q=${encodeURIComponent(id)}`);
    } else {
      navigate(`/discover?${type}=${encodeURIComponent(id)}`);
    }
  };

  const handleChange = (key: typeof active) => {
    navigate(`/${key}`);
  };

  return (
    <AppShell>
      <Header
        onSearch={handleSearch}
        suggestions={suggestions}
        onSelectSuggestion={handleSelectSuggestion}
      >
        <button
          onClick={() => setChatOpen(true)}
          aria-label="Chat"
          className="p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
        >
          💬
        </button>
      </Header>
      <main id="main" className="p-4">
        <Routes>
          <Route path="/discover" element={<Discover />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/write" element={<BookPublishWizard />} />
          <Route path="/activity" element={<NotificationFeed />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/profile/settings" element={<ProfileSettingsPage />} />
          <Route path="/books" element={<BookListScreen />} />
          <Route path="/book/:bookId" element={<BookDetailScreen />} />
          <Route path="/read/:bookId" element={<ReaderScreen />} />
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
  <ToastProvider>
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  </ToastProvider>
);
