import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.js';
import { Calendar, Clock, User, Tag, ChevronLeft, Edit, Trash2, Check, X, AlertTriangle } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';
  readingTime: number;
  createdAt: string;
  publishedAt: string | null;
  category: { id: string; name: string };
  tags: { id: string; name: string }[];
  author: { id: string; name: string; role: string };
}

export const PostDetails: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchPost = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/posts/${idOrSlug}`);
      setPost(response.data);
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || 'Erro ao carregar os detalhes da publicação.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [idOrSlug]);

  const handleDelete = async () => {
    if (!post) return;
    if (!window.confirm('Tem certeza que deseja excluir esta publicação definitivamente?')) return;

    setIsDeleting(true);
    try {
      await api.delete(`/api/posts/${post.id}`);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      alert('Não foi possível excluir a publicação.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'PUBLISHED' | 'REJECTED' | 'PENDING_REVIEW' | 'DRAFT') => {
    if (!post) return;
    setStatusLoading(true);
    try {
      const response = await api.patch(`/api/posts/${post.id}/status`, { status: newStatus });
      setPost(response.data);
    } catch (err: any) {
      console.error(err);
      alert('Falha ao alterar o status do post.');
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner"></div>
        <p style={{ color: 'hsl(var(--text-muted))' }}>Carregando postagem...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="glass-card flex-center" style={{ padding: '60px 40px', flexDirection: 'column', textAlign: 'center' }}>
        <AlertTriangle size={48} className="text-danger" style={{ marginBottom: '16px' }} />
        <h3>Erro ao Carregar Post</h3>
        <p style={{ color: 'hsl(var(--text-secondary))', marginTop: '8px', maxWidth: '400px' }}>
          {error || 'Esta publicação pode ter sido excluída ou você não possui permissões para visualizá-la.'}
        </p>
        <Link to="/" className="btn btn-outline" style={{ marginTop: '24px' }}>
          <ChevronLeft size={16} />
          Voltar para o Início
        </Link>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isAuthor = user && user.id === post.author.id;
  const isEditorOrAdmin = user && (user.role === 'EDITOR' || user.role === 'ADMIN');
  const canModify = isAuthor || isEditorOrAdmin;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Back Button */}
      <Link to="/" className="btn btn-outline btn-sm flex-link" style={{ marginBottom: '32px' }}>
        <ChevronLeft size={16} />
        <span>Voltar</span>
      </Link>

      <article className="glass-card" style={{ padding: '40px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative Top Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent-purple)))'
        }} />

        {/* Post Metadata Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
          <span className="badge badge-primary">{post.category.name}</span>
          
          {post.status !== 'PUBLISHED' && (
            <span className={`badge ${
              post.status === 'DRAFT' ? 'badge-warning' : 
              post.status === 'PENDING_REVIEW' ? 'badge-primary' : 'badge-danger'
            }`}>
              {post.status === 'DRAFT' && 'Rascunho'}
              {post.status === 'PENDING_REVIEW' && 'Pendente de Revisão'}
              {post.status === 'REJECTED' && 'Rejeitado'}
            </span>
          )}

          <div style={{ display: 'flex', gap: '12px', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
            <div className="flex-link">
              <Calendar size={14} />
              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            </div>
            <div className="flex-link">
              <Clock size={14} />
              <span>{post.readingTime} min de leitura</span>
            </div>
          </div>
        </div>

        {/* Post Title */}
        <h1 style={{ fontSize: '2.5rem', color: 'hsl(var(--text-primary))', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
          {post.title}
        </h1>

        {/* Summary Card */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.02)',
          borderLeft: '3px solid hsl(var(--primary))',
          padding: '16px 20px',
          borderRadius: '0 8px 8px 0',
          marginBottom: '32px',
          fontSize: '1rem',
          color: 'hsl(var(--text-secondary))',
          lineHeight: '1.6',
          fontStyle: 'italic'
        }}>
          {post.summary}
        </div>

        {/* Author details */}
        <div className="flex-link" style={{ 
          marginBottom: '40px',
          paddingBottom: '20px',
          borderBottom: '1px solid hsl(var(--border-color))'
        }}>
          <div className="flex-center" style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: 'rgba(139, 92, 246, 0.15)',
            color: 'hsl(var(--primary))'
          }}>
            <User size={16} />
          </div>
          <div>
            <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-primary))', fontWeight: 600 }}>{post.author.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginLeft: '8px' }}>
              ({post.author.role === 'WRITER' ? 'Autor' : post.author.role === 'EDITOR' ? 'Editor' : 'Admin'})
            </span>
          </div>
        </div>

        {/* Post Content */}
        <div style={{ 
          fontSize: '1.1rem', 
          lineHeight: '1.8', 
          color: 'hsl(var(--text-secondary))',
          marginBottom: '40px' 
        }}>
          {post.content.split('\n').map((paragraph, index) => {
            if (!paragraph.trim()) return null;
            return <p key={index} style={{ marginBottom: '24px' }}>{paragraph}</p>;
          })}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
          {post.tags.map((tag) => (
            <span key={tag.id} className="badge" style={{ display: 'inline-flex', gap: '4px', textTransform: 'none' }}>
              <Tag size={12} />
              <span>{tag.name}</span>
            </span>
          ))}
        </div>

        {/* Action Controls Section */}
        {canModify && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '24px',
            marginTop: '40px'
          }}>
            {/* Edit / Delete (Author or Admin/Editor) */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to={`/edit-post/${post.id}`} className="btn btn-outline btn-sm flex-link">
                <Edit size={16} />
                <span>Editar</span>
              </Link>
              <button 
                onClick={handleDelete} 
                className="btn btn-danger btn-sm flex-link"
                disabled={isDeleting}
              >
                <Trash2 size={16} />
                <span>{isDeleting ? 'Excluindo...' : 'Excluir'}</span>
              </button>
            </div>

            {/* Approval Workflow (Editor / Admin Only) */}
            {isEditorOrAdmin && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                  Ações de Editor:
                </span>
                
                {post.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => handleUpdateStatus('PUBLISHED')}
                    className="btn btn-primary btn-sm flex-link"
                    style={{ background: 'rgba(34, 197, 94, 0.15)', color: 'hsl(var(--success))', border: '1px solid rgba(34, 197, 94, 0.2)' }}
                    disabled={statusLoading}
                  >
                    <Check size={16} />
                    <span>Aprovar/Publicar</span>
                  </button>
                )}

                {post.status !== 'REJECTED' && post.status !== 'DRAFT' && (
                  <button
                    onClick={() => handleUpdateStatus('REJECTED')}
                    className="btn btn-danger btn-sm flex-link"
                    disabled={statusLoading}
                  >
                    <X size={16} />
                    <span>Rejeitar</span>
                  </button>
                )}

                {post.status === 'PUBLISHED' && (
                  <button
                    onClick={() => handleUpdateStatus('PENDING_REVIEW')}
                    className="btn btn-outline btn-sm flex-link"
                    disabled={statusLoading}
                  >
                    <span>Mover para Revisão</span>
                  </button>
                )}
              </div>
            )}

            {/* Writer Submission Action (Only Writer, if Draft) */}
            {isAuthor && !isEditorOrAdmin && post.status === 'DRAFT' && (
              <button
                onClick={() => handleUpdateStatus('PENDING_REVIEW')}
                className="btn btn-primary btn-sm flex-link"
                disabled={statusLoading}
              >
                <span>Enviar para Revisão</span>
              </button>
            )}
          </div>
        )}
      </article>
    </div>
  );
};
