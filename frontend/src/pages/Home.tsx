// Página inicial: lista as publicações em um layout de "workspace" com três áreas:
// sidebar de filtros (busca, categorias, tags e — para logados — status),
// destaque das 4 publicações mais recentes em formato de "pastas" e a lista
// completa de textos com ordenação. Os filtros de categoria/tag/status são
// enviados à API (server-side); a busca textual e a ordenação são client-side.
import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Link } from 'react-router-dom';
import { 
  Search, 
  RefreshCw, 
  BookOpen, 
  AlertCircle, 
  Folder, 
  FileText, 
  Plus, 
  ArrowUpDown,
  SlidersHorizontal 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';
import './Home.css';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Author {
  id: string;
  name: string;
  role: string;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
  readingTime: number;
  createdAt: string;
  publishedAt: string | null;
  category: Category;
  tags: Tag[];
  author: Author;
}

export const Home: React.FC = () => {
  const { user } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'readingTime'>('date');

  // Paginação server-side: a API retorna { data, total, page, perPage }.
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  // Carrega categorias e tags em paralelo para montar a sidebar de filtros.
  const fetchFilters = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/tags'),
      ]);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
    } catch (err) {
      console.error('Erro ao buscar categorias/tags:', err);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, perPage: PER_PAGE };
      if (selectedCategory) params.categoryId = selectedCategory;
      if (selectedTag) params.tagId = selectedTag;
      if (selectedStatus) params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      // Filtros e busca textual são todos server-side; a resposta vem paginada.
      const response = await api.get('/api/posts', { params });

      setPosts(response.data.data);
      setTotal(response.data.total);
    } catch (err: any) {
      console.error('Erro ao buscar posts:', err);
      setError('Não foi possível carregar as publicações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  // Qualquer mudança de filtro volta para a primeira página.
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedTag, selectedStatus, search]);

  // Rebusca os posts sempre que qualquer filtro ou a página muda.
  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, selectedTag, selectedStatus, search, page]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedTag('');
    setSelectedStatus('');
    setSortBy('date');
    setPage(1);
  };

  // Filter out recent posts (folders) - top 4 published or drafts
  const recentPosts = posts.slice(0, 4);

  // Sort posts for the list below
  // Ordenação client-side (data, título ou tempo de leitura). Para a data,
  // usa publishedAt quando existe e cai para createdAt em rascunhos.
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'readingTime') {
      return a.readingTime - b.readingTime;
    }
    // Default to date (newest first)
    const dateA = new Date(a.publishedAt || a.createdAt).getTime();
    const dateB = new Date(b.publishedAt || b.createdAt).getTime();
    return dateB - dateA;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Rascunho';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusLabelAndColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return { label: 'Pronto', color: 'status-ready' };
      case 'DRAFT':
        return { label: 'Rascunho', color: 'status-draft' };
      case 'PENDING_REVIEW':
        return { label: 'Em Revisão', color: 'status-pending' };
      default:
        return { label: 'Rejeitado', color: 'status-rejected' };
    }
  };

  return (
    <div className="home-workspace-container">
      {/* 1. INNER FOLDER TREE / FILTER SIDEBAR */}
      <aside className="home-filter-sidebar glass-card">
        <div className="search-box-wrapper">
          <Search className="sidebar-search-icon" size={16} />
          <input 
            type="text" 
            placeholder="Buscar post..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sidebar-search-input"
          />
        </div>

        <div className="sidebar-section">
          <div 
            onClick={() => { setSelectedCategory(''); setSelectedTag(''); }}
            className={`sidebar-section-item everything-item ${(!selectedCategory && !selectedTag) ? 'active' : ''}`}
          >
            <SlidersHorizontal size={16} />
            <span>Tudo</span>
            <span className="count-badge">{total}</span>
          </div>
        </div>

        <div className="sidebar-section">
          <h4 className="section-title-label">CATEGORIAS</h4>
          <div className="sidebar-section-list">
            {categories.map((cat) => (
              <div 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat.id)}
                className={`sidebar-section-item ${selectedCategory === cat.id ? 'active' : ''}`}
              >
                <Folder size={16} className="folder-icon-color" />
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <h4 className="section-title-label">TAGS</h4>
          <div className="sidebar-section-list">
            {tags.map((tag) => (
              <div 
                key={tag.id} 
                onClick={() => setSelectedTag(tag.id)}
                className={`sidebar-section-item ${selectedTag === tag.id ? 'active' : ''}`}
              >
                <span className="tag-hash-symbol">#</span>
                <span>{tag.name}</span>
              </div>
            ))}
          </div>
        </div>

        {user && (
          <div className="sidebar-section">
            <h4 className="section-title-label">STATUS DO POST</h4>
            <select
              className="form-control status-select-sidebar"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="PUBLISHED">Publicados</option>
              <option value="DRAFT">Rascunhos</option>
              <option value="PENDING_REVIEW">Pendente de Revisão</option>
            </select>
          </div>
        )}

        <button onClick={handleResetFilters} className="sidebar-reset-btn">
          <RefreshCw size={14} />
          <span>Limpar Filtros</span>
        </button>
      </aside>

      {/* 2. MAIN CENTER CONTENT */}
      <div className="home-main-content-flow">
        {/* Top Banner (Participe do projeto) */}
        <section className="project-hero-card">
          <div className="hero-banner-content">
            <h2>Participe do projeto</h2>
            <p>
              Tudo o que estiver aqui é lido pelo agente antes de responder. Adicione
              documentos e textos literários para refinar a inteligência coletiva do EnterLinhas.
            </p>
            <Link to={user ? "/new-post" : "/login"} className="hero-cta-btn">
              <Plus size={16} />
              <span>Escrever Artigo</span>
            </Link>
          </div>
          <div className="hero-banner-illustration">
            {/* Visual cards stacks matching the illustration */}
            <div className="illust-card card-1"></div>
            <div className="illust-card card-2"></div>
            <div className="illust-card card-3"></div>
          </div>
        </section>

        {/* Folder section (Novas publicações) */}
        <section className="folders-section-wrapper">
          <div className="section-header-row">
            <h3>Novas publicações</h3>
            <span className="folder-count">{recentPosts.length} pastas</span>
          </div>

          <div className="folders-grid-layout">
            {recentPosts.map((post) => (
              <Link to={`/posts/${post.slug}`} key={post.id} className="folder-card-item">
                <div className="folder-icon-tab"></div>
                <div className="folder-card-body">
                  <div className="folder-graphic-icon">
                    <Folder size={24} className="folder-icon-monochrome" />
                  </div>
                  <h4 className="folder-card-title">{post.title}</h4>
                  <p className="folder-card-meta">
                    {post.author.name} • {post.readingTime} min
                  </p>
                </div>
              </Link>
            ))}
            {recentPosts.length === 0 && (
              <div className="folders-empty-state">
                <p>Nenhuma nova publicação recente.</p>
              </div>
            )}
          </div>
        </section>

        {/* Document section (Todos os textos) */}
        <section className="documents-section-wrapper">
          <div className="section-header-row with-sort">
            <div className="doc-section-tabs">
              <button className="doc-tab active">Todos os textos</button>
            </div>
            
            <div className="sorting-selector-wrapper">
              <ArrowUpDown size={14} className="sort-icon-ui" />
              <select 
                value={sortBy} 
                onChange={(e: any) => setSortBy(e.target.value)}
                className="sort-select-element"
              >
                <option value="date">Mais Recentes</option>
                <option value="title">Ordem Alfabética</option>
                <option value="readingTime">Tempo de Leitura</option>
              </select>
            </div>
          </div>

          <div className="documents-list-layout">
            {loading ? (
              <div className="flex-center" style={{ padding: '60px 0', flexDirection: 'column', gap: '12px' }}>
                <div className="spinner"></div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Buscando publicações...</p>
              </div>
            ) : error ? (
              <div className="error-state-card">
                <AlertCircle size={28} className="text-danger" />
                <p>{error}</p>
                <button onClick={fetchPosts} className="btn-retry-ui">Tentar Novamente</button>
              </div>
            ) : sortedPosts.length === 0 ? (
              <div className="empty-state-card">
                <BookOpen size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <h4>Nenhum texto encontrado</h4>
                <p>Altere os filtros de busca para encontrar o que procura.</p>
              </div>
            ) : (
              sortedPosts.map((post) => {
                const statusDetails = getStatusLabelAndColor(post.status);
                return (
                  <Link to={`/posts/${post.slug}`} key={post.id} className="document-row-card">
                    <div className="doc-type-icon-wrapper">
                      <div className="doc-type-icon">
                        <FileText size={20} />
                      </div>
                    </div>

                    <div className="doc-row-details">
                      <h4 className="doc-row-title">{post.title}</h4>
                      <p className="doc-row-excerpt">{post.summary}</p>
                      <div className="doc-row-meta">
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                        <span className="meta-separator">•</span>
                        <span>{post.category.name}</span>
                        <span className="meta-separator">•</span>
                        <span>{post.readingTime} min de leitura</span>
                      </div>
                    </div>

                    <div className="doc-row-status-col">
                      <span className={`status-pill ${statusDetails.color}`}>
                        <span className="status-dot"></span>
                        <span>{statusDetails.label}</span>
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Paginação (server-side) */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex-center" style={{ gap: '16px', padding: '24px 0 8px' }}>
              <button
                className="btn"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>
              <span style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))' }}>
                Página {page} de {totalPages}
              </span>
              <button
                className="btn"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Próxima
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
