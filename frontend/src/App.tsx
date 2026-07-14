// Raiz da SPA: define o roteamento (react-router) e envolve tudo no AuthProvider
// e no Layout (shell visual comum). Rotas sensíveis usam o guard PrivateRoute.
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { Layout } from './components/Layout.js';

// Pages imports
import { Home } from './pages/Home.js';
import { Login } from './pages/Login.js';
import { Register } from './pages/Register.js';
import { PostDetails } from './pages/PostDetails.js';
import { PostEditor } from './pages/PostEditor.js';
import { AdminPanel } from './pages/AdminPanel.js';

// Guard de rota: exige usuário autenticado e, opcionalmente, um papel permitido.
// Enquanto o AuthContext restaura a sessão do localStorage, mostra "Carregando..."
// (sem isso, o usuário logado seria redirecionado para /login em todo refresh).
// Importante: isso é apenas UX — a autorização real é feita pelo backend.
const PrivateRoute: React.FC<{ children: React.ReactNode; allowedRoles?: ('WRITER' | 'EDITOR' | 'ADMIN')[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ color: 'hsl(var(--text-secondary))', fontSize: '1.1rem', fontWeight: 600 }}>
          Carregando...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/posts/:idOrSlug" element={<PostDetails />} />
            
            {/* Protected Routes */}
            <Route
              path="/new-post"
              element={
                <PrivateRoute>
                  <PostEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-post/:id"
              element={
                <PrivateRoute>
                  <PostEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute allowedRoles={['ADMIN', 'EDITOR']}>
                  <AdminPanel />
                </PrivateRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
