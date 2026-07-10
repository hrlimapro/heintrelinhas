import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { 
  BookOpen, 
  Home as HomeIcon, 
  PlusCircle, 
  Settings, 
  LogOut, 
  LogIn, 
  Sparkles, 
  Send, 
  X, 
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react';
import './Layout.css';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('@heintrelinhas:theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light'; // default
  });

  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
    localStorage.setItem('@heintrelinhas:theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  // Copilot Chat States
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Olá! Sou o Copilot do heintrelinhas. Pergunte-me sobre publicações recentes, temas de leitura ou como participar do projeto!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSignOut = () => {
    signOut();
    setShowProfileMenu(false);
    navigate('/');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: inputValue,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    const prompt = inputValue.toLowerCase();
    setInputValue('');
    setIsTyping(true);

    // Mock AI responses based on keywords
    setTimeout(() => {
      let replyText = 'Entendi! Atualmente o heintrelinhas conta com seções de Tecnologia, Literatura, Ciência, Design e Filosofia. Você pode publicar novos textos se cadastrando como autor.';
      
      if (prompt.includes('olá') || prompt.includes('oi')) {
        replyText = 'Olá! Como posso te ajudar hoje? Posso te sugerir leituras ou explicar as permissões de escrita do heintrelinhas.';
      } else if (prompt.includes('ajuda') || prompt.includes('como funciona')) {
        replyText = 'O heintrelinhas é uma plataforma colaborativa. Escritores podem rascunhar posts, editores revisam e publicam, e administradores controlam todo o sistema.';
      } else if (prompt.includes('admin') || prompt.includes('painel')) {
        replyText = 'O Painel Admin está acessível para usuários com função de ADMIN ou EDITOR através do ícone de engrenagem na barra esquerda.';
      } else if (prompt.includes('tecnologia') || prompt.includes('react')) {
        replyText = 'Temos artigos excelentes sobre React 19 e desenvolvimento front-end moderno na categoria de Tecnologia!';
      } else if (prompt.includes('post') || prompt.includes('escrever') || prompt.includes('criar')) {
        replyText = 'Para criar um post, clique no botão "+" na barra lateral esquerda. Você precisará estar logado em sua conta de autor.';
      }

      setMessages(prev => [...prev, {
        sender: 'ai',
        text: replyText,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 800);
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`app-shell ${isCopilotOpen ? 'copilot-expanded' : ''}`}>
      {/* 1. LEFTMOST NAVIGATION BAR */}
      <aside className="nav-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-circle">
            <BookOpen size={20} />
          </div>
        </div>

        <nav className="sidebar-menu">
          <Link 
            to="/" 
            className={`menu-item-circle ${location.pathname === '/' ? 'active' : ''}`}
            title="Início"
          >
            <HomeIcon size={20} />
          </Link>

          {user && (
            <Link 
              to="/new-post" 
              className={`menu-item-circle ${location.pathname === '/new-post' ? 'active' : ''}`}
              title="Escrever Novo Post"
            >
              <PlusCircle size={20} />
            </Link>
          )}

          {user && (user.role === 'ADMIN' || user.role === 'EDITOR') && (
            <Link 
              to="/admin" 
              className={`menu-item-circle ${location.pathname === '/admin' ? 'active' : ''}`}
              title="Painel Administrativo"
            >
              <Settings size={20} />
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={toggleTheme} 
            className="menu-item-circle theme-toggle-btn" 
            title={theme === 'light' ? 'Alternar para Tema Escuro' : 'Alternar para Tema Claro'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <a href="#" className="menu-item-circle" title="Como Funciona">
            <HelpCircle size={20} />
          </a>

          {user ? (
            <div className="profile-container">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`profile-bubble-btn ${showProfileMenu ? 'active' : ''}`}
                title={user.name}
              >
                {getInitials(user.name)}
              </button>
              
              {showProfileMenu && (
                <div className="profile-dropdown glass">
                  <div className="dropdown-user-info">
                    <span className="dropdown-name">{user.name}</span>
                    <span className="dropdown-role">{user.role}</span>
                  </div>
                  <hr className="dropdown-divider" />
                  <button onClick={handleSignOut} className="dropdown-item text-danger">
                    <LogOut size={16} />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="menu-item-circle login-trigger" title="Entrar na Conta">
              <LogIn size={20} />
            </Link>
          )}
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE PANEL */}
      <div className="main-workspace">
        <header className="workspace-header glass">
          <div className="header-left">
            <h2 className="workspace-title">heintrelinhas</h2>
          </div>

          <div className="header-actions">
            {!user && (
              <div className="auth-action-buttons">
                <Link to="/login" className="btn-auth-header secondary">Entrar</Link>
                <Link to="/register" className="btn-auth-header primary">Cadastrar</Link>
              </div>
            )}

            <button 
              onClick={() => setIsCopilotOpen(!isCopilotOpen)}
              className={`copilot-toggle-btn ${isCopilotOpen ? 'active' : ''}`}
              title="Toggle Copilot"
            >
              <Sparkles size={18} />
              <span>Copilot</span>
            </button>
          </div>
        </header>

        <main className="workspace-content animate-fade-in">
          {children}
        </main>
      </div>

      {/* 3. COLLAPSIBLE AI SIDEBAR */}
      <aside className="copilot-sidebar">
        <div className="copilot-header">
          <div className="copilot-header-title">
            <span className="copilot-badge">FOLLOWASY AI</span>
            <h3>Controle tudo por aqui</h3>
            <p>Navegue, pesquise e gerencie tudo apenas conversando.</p>
          </div>
          <button onClick={() => setIsCopilotOpen(false)} className="copilot-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="copilot-chat-history">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.sender}`}>
              <div className="message-bubble">
                <p>{msg.text}</p>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-message ai">
              <div className="message-bubble typing">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="copilot-input-area">
          <div className="copilot-input-wrapper">
            <input 
              type="text" 
              placeholder="Pergunte algo..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" disabled={!inputValue.trim()}>
              <Send size={16} />
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
};
