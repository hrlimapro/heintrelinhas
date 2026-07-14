// Página de cadastro: cria a conta via signUp do AuthContext
// (POST /api/auth/register) e, em caso de sucesso, exibe confirmação e
// redireciona para /login após 2s (o cadastro NÃO autentica automaticamente).
// Observação: o seletor de "Nível de Acesso" permite escolher qualquer papel,
// inclusive ADMIN — comportamento intencional apenas para fins de demonstração.
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { UserPlus, User, Mail, Key, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'WRITER' | 'EDITOR' | 'ADMIN'>('WRITER');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signUp({ name, email, password, role });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || 'Falha ao realizar cadastro. Verifique os dados fornecidos.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '70vh', padding: '30px 0' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="flex-center" style={{ 
            width: '56px', 
            height: '56px', 
            background: 'rgba(139, 92, 246, 0.1)', 
            borderRadius: '16px', 
            margin: '0 auto 16px',
            color: 'hsl(var(--primary))'
          }}>
            <UserPlus size={28} />
          </div>
          <h2 style={{ fontSize: '1.75rem', color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>Criar Nova Conta</h2>
          <p style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>
            Junte-se à comunidade do heintrelinhas.
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

        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: 'hsl(var(--success))',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>Cadastro realizado com sucesso! Redirecionando...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Nome Completo</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--text-muted))'
              }} />
              <input
                id="name"
                type="text"
                required
                className="form-control"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: '44px' }}
                disabled={isSubmitting || success}
              />
            </div>
          </div>

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
                disabled={isSubmitting || success}
              />
            </div>
          </div>

          <div className="form-group">
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
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                disabled={isSubmitting || success}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="role">Nível de Acesso (Cargo)</label>
            <div style={{ position: 'relative' }}>
              <Shield size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--text-muted))'
              }} />
              <select
                id="role"
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{ paddingLeft: '44px', appearance: 'none', background: 'rgba(15, 23, 42, 0.6)' }}
                disabled={isSubmitting || success}
              >
                <option value="WRITER">Escritor / Autor (Gera Posts e Rascunhos)</option>
                <option value="EDITOR">Editor (Aprova, Edita e Publica todos)</option>
                <option value="ADMIN">Administrador (Controle Total + Categorias/Tags)</option>
              </select>
              <div style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'hsl(var(--text-muted))',
                fontSize: '0.8rem'
              }}>▼</div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginBottom: '20px' }}
            disabled={isSubmitting || success}
          >
            {isSubmitting ? 'Cadastrando...' : 'Criar Conta Grátis'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
          Já possui uma conta?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>
            Entre aqui
          </Link>
        </div>
      </div>
    </div>
  );
};
