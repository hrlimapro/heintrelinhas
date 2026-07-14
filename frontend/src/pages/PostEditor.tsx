// Editor de posts — um único componente para dois modos, decididos pela URL:
// /new-post (criação, POST /api/posts) e /edit-post/:id (edição, PUT /api/posts/:id).
// Carrega categorias e tags para os seletores; WRITER só enxerga as opções de
// status DRAFT e PENDING_REVIEW (PUBLISHED/REJECTED aparecem apenas para
// EDITOR/ADMIN, espelhando a regra do backend). Após salvar, navega para o
// post usando o slug retornado pela API.
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import { Save, ChevronLeft, AlertTriangle, BookOpen } from 'lucide-react';
import './PostEditor.css';

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

export const PostEditor: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEditMode = !!id;

  // Form states
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [readingTime, setReadingTime] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [status, setStatus] = useState<'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED'>('DRAFT');

  // Loader & Error states
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoriesAndTags = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/tags'),
      ]);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
    } catch (err) {
      console.error('Erro ao buscar taxonomias:', err);
    }
  };

  const fetchPost = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/posts/${id}`);
      const post = response.data;

      // Access checks
      // WRITER tentando editar post de outro autor é devolvido para a Home
      // (o backend também bloquearia a gravação com 403).
      if (user && user.role === 'WRITER' && post.authorId !== user.id) {
        navigate('/');
        return;
      }

      setTitle(post.title);
      setSummary(post.summary);
      setContent(post.content);
      setReadingTime(post.readingTime);
      setCategoryId(post.categoryId);
      setSelectedTagIds(post.tags.map((t: any) => t.id));
      setStatus(post.status);
    } catch (err: any) {
      console.error(err);
      setError('Não foi possível carregar os detalhes do post para edição.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      fetchPost();
    }
  }, [id]);

  // Alterna a seleção de uma tag (adiciona se ausente, remove se presente).
  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!categoryId) {
      setError('Por favor, selecione uma categoria.');
      setSaving(false);
      return;
    }

    const postData = {
      title,
      summary,
      content,
      // Campo vazio vira undefined para o backend calcular o tempo automaticamente.
      readingTime: readingTime === '' ? undefined : Number(readingTime),
      categoryId,
      tagIds: selectedTagIds,
      status,
    };

    try {
      let response;
      if (isEditMode) {
        response = await api.put(`/api/posts/${id}`, postData);
      } else {
        response = await api.post('/api/posts', postData);
      }
      navigate(`/posts/${response.data.slug}`);
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || 'Ocorreu um erro ao salvar a publicação.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const isEditorOrAdmin = user && (user.role === 'EDITOR' || user.role === 'ADMIN');

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner"></div>
        <p style={{ color: 'hsl(var(--text-muted))' }}>Carregando dados da publicação...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/" className="btn btn-outline btn-sm flex-link" style={{ marginBottom: '32px' }}>
        <ChevronLeft size={16} />
        <span>Cancelar</span>
      </Link>

      <div className="glass-card" style={{ padding: '40px', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent-purple)))'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div className="flex-center" style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.1)',
            color: 'hsl(var(--primary))'
          }}>
            <BookOpen size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.75rem', color: 'hsl(var(--text-primary))' }}>
              {isEditMode ? 'Editar Publicação' : 'Criar Nova Publicação'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
              Compartilhe suas ideias e ensaios com o mundo.
            </p>
          </div>
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
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="title">Título do Post</label>
            <input
              id="title"
              type="text"
              required
              className="form-control"
              placeholder="Digite um título impactante..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Summary */}
          <div className="form-group">
            <label className="form-label" htmlFor="summary">Resumo / Subtítulo</label>
            <textarea
              id="summary"
              required
              rows={3}
              className="form-control"
              placeholder="Um breve resumo sobre o que trata esta publicação..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={saving}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Content */}
          <div className="form-group">
            <label className="form-label" htmlFor="content">Conteúdo Completo</label>
            <textarea
              id="content"
              required
              rows={12}
              className="form-control"
              placeholder="Escreva sua história, ensaio ou artigo aqui..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={saving}
              style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.7' }}
            />
          </div>

          {/* Grid Layout for details */}
          <div className="editor-grid">
            {/* Category selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="category">Categoria</label>
              <select
                id="category"
                required
                className="form-control"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={saving}
              >
                <option value="">Selecione uma Categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Reading Time input */}
            <div className="form-group">
              <label className="form-label" htmlFor="readingTime">Tempo de Leitura (minutos)</label>
              <input
                id="readingTime"
                type="number"
                min={1}
                className="form-control"
                placeholder="Cálculo automático se vazio"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={saving}
              />
            </div>

            {/* Status selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="status">Status</label>
              <select
                id="status"
                required
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                disabled={saving}
              >
                <option value="DRAFT">Salvar como Rascunho (Draft)</option>
                <option value="PENDING_REVIEW">Enviar para Revisão (Pending Review)</option>
                
                {isEditorOrAdmin && (
                  <>
                    <option value="PUBLISHED">Aprovar e Publicar (Published)</option>
                    <option value="REJECTED">Rejeitado (Rejected)</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Tags Checkbox Panel */}
          <div className="form-group" style={{ marginTop: '12px', marginBottom: '32px' }}>
            <label className="form-label">Tags Associadas</label>
            {tags.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
                Nenhuma tag cadastrada. Peça a um administrador para criá-las.
              </p>
            ) : (
              <div className="tags-checkbox-grid">
                {tags.map((tag) => {
                  const isChecked = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`editor-tag-checkbox ${isChecked ? 'checked' : ''}`}
                      disabled={saving}
                    >
                      <span>#{tag.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={saving}
          >
            <Save size={18} />
            <span>{saving ? 'Salvando publicação...' : 'Salvar Publicação'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
