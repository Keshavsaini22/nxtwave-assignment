import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { store, useAppDispatch, useAppSelector } from './store/index.js';
import { restoreAuth } from './store/authSlice.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { MainWorkspace } from './components/MainWorkspace.js';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);
  const [view, setView] = useState<'login' | 'register'>('login');

  useEffect(() => {
    dispatch(restoreAuth());
  }, [dispatch]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '16px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid hsl(var(--card-border))',
          borderTopColor: 'hsl(var(--accent-violet))',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ fontSize: '0.95rem', color: 'hsl(var(--text-secondary))' }}>
          Establishing secure environment session...
        </span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return view === 'login' ? (
      <Login onNavigateToRegister={() => setView('register')} />
    ) : (
      <Register onNavigateToLogin={() => setView('login')} />
    );
  }

  return <MainWorkspace />;
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </Provider>
  );
};

export default App;
