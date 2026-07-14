// Página de login: formulário controlado que delega a autenticação ao
// signIn do AuthContext (POST /api/auth/login) e redireciona para a Home.
// Erros da API (ex.: credenciais inválidas) são exibidos em um alerta no card.
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { LogIn, Key, Mail, AlertTriangle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn({ email, password });
      navigate('/');
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || 'Falha ao tentar realizar o login. Verifique suas credenciais.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '60vh', padding: '20px 0' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="flex-center" style={{ 
            width: '56px', 
            height: '56px', 
            background: 'rgba(139, 92, 246, 0.1)', 
            borderRadius: '16px', 
            margin: '0 auto 16px',
            color: 'hsl(var(--primary))'
          }}>
            <LogIn size={28} />
          </div>
          <h2 style={{ fontSize: '1.75rem', color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>Acesse sua Conta</h2>
          <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>
            Seja bem-vindo de volta ao portal heintrelinhas.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: 'hsl(var(--error))',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px'
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Endereço de E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--text-muted))'
              }} />
              <input
                id="email"
                type="email"
                required
                className="form-control"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px' }}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password">Sua Senha</label>
            <div style={{ position: 'relative' }}>
              <Key size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--text-muted))'
              }} />
              <input
                id="password"
                type="password"
                required
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginBottom: '20px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verificando...' : 'Entrar na Plataforma'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
          Não possui uma conta?{' '}
          <Link to="/register" style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>
            Cadastre-se aqui
          </Link>
        </div>
      </div>
    </div>
  );
};
