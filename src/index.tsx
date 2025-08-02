/**
 * Defines the application routes and shared layout components.
 */
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Outlet,
} from 'react-router-dom';
import { AppShell } from './AppShell';
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { search, Suggestion } from './search';
import { BottomNav } from './components/BottomNav';
import { ThemeProvider } from './ThemeProvider';
import { DMModal } from './components/DMModal';
import { useNostr } from './nostr';
import { BookListScreen } from './screens/BookListScreen';
import { BookDetailScreen } from './screens/BookDetailScreen';
import { ReaderScreen } from './screens/ReaderScreen';
import { Discover } from './components/Discover';
import { HomeFeed } from './screens/HomeFeed';
import LibraryPage from './pages/Library';
import ManageChaptersPage from './pages/ManageChapters';
import { BookPublishWizard } from './components/BookPublishWizard';
import ListCreatePage from './pages/ListCreate';
import { NotificationFeed } from './components/NotificationFeed';
import ProfileSettingsPage from './pages/ProfileSettings';
import UISettingsPage from './pages/UISettings';
import OfflineSettingsPage from './pages/OfflineSettings';
import RelaySettingsPage from './pages/RelaySettings';
import SettingsHome from './pages/SettingsHome';
import { ProfileScreen } from './screens/ProfileScreen';
import { ToastProvider } from './components/ToastProvider';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const active = React.useMemo<
    'home' | 'discover' | 'library' | 'write' | 'activity' | 'profile'
  >(() => {
    const key = location.pathname.split('/')[1];
    if (
      key === 'home' ||
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
  const [loginOpen, setLoginOpen] = React.useState(false);
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
        onLogin={() => setLoginOpen(true)}
      >
        <button
          onClick={() => setChatOpen(true)}
          aria-label="Chat"
          className="p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6B3AF7]/50"
        >
          💬
        </button>
      </Header>
      <main id="main" className="p-[var(--space-4)]">
        <Outlet />
      </main>
      <BottomNav active={active} onChange={handleChange} />
      {chatOpen && contacts[0] && (
        <DMModal to={contacts[0]} onClose={() => setChatOpen(false)} />
      )}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </AppShell>
  );
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<Navigate to="home" />} />
      <Route path="home" element={<HomeFeed />} />
      <Route path="discover" element={<Discover />} />
      <Route path="library" element={<LibraryPage />} />
      <Route path="write" element={<BookPublishWizard />} />
      <Route path="lists/new" element={<ListCreatePage />} />
      <Route path="activity" element={<NotificationFeed />} />
      <Route path="profile" element={<ProfileScreen />} />
      <Route path="settings" element={<SettingsHome />} />
      <Route path="settings/profile" element={<ProfileSettingsPage />} />
      <Route path="settings/ui" element={<UISettingsPage />} />
      <Route path="settings/offline" element={<OfflineSettingsPage />} />
      <Route path="settings/relays" element={<RelaySettingsPage />} />
      <Route path="profile/settings" element={<Navigate replace to="/settings/profile" />} />
      <Route path="books" element={<BookListScreen />} />
      <Route path="book/:bookId" element={<BookDetailScreen />} />
      <Route path="book/:bookId/chapters" element={<ManageChaptersPage />} />
      <Route path="read/:bookId" element={<ReaderScreen />} />
      <Route path="*" element={<Navigate to="/discover" />} />
    </Route>
  </Routes>
);

export const App: React.FC = () => (
  <ToastProvider>
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  </ToastProvider>
);
