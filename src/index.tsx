import React from 'react';
import { AppShell } from './AppShell';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ThemeProvider } from './ThemeProvider';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { ProfileSettings } from './components/ProfileSettings';


export const App: React.FC = () => {
  const [active, setActive] = React.useState<
    'discover' | 'library' | 'write' | 'activity' | 'profile'
  >('discover');
  return (
    <ThemeProvider>
      <NostrProvider>
        <AppShell>
          <Header onSearch={() => {}}>
            <ThemeSwitcher />
          </Header>

            {active === 'write' && <BookForm />}
            {active === 'profile' && (
              <div className="space-y-4">
                <Login />
                <ProfileSettings />
              </div>
            )}
          </main>
          <BottomNav active={active} onChange={setActive} />
        </AppShell>
      </NostrProvider>
    </ThemeProvider>
  );
};
