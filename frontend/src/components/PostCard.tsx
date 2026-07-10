import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, User, ArrowUpRight } from 'lucide-react';
import './PostCard.css';

interface Tag {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
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

interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="badge badge-warning">Rascunho</span>;
      case 'PENDING_REVIEW':
        return <span className="badge badge-primary">Pendente</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">Rejeitado</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Select a random cover color based on post ID to make it colorful
  const getCoverGradient = (id: string) => {
    const gradients = [
      'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', // Indigo to Violet
      'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', // Cyan to Blue
      'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', // Pink to Violet
      'linear-gradient(135deg, #10b981 0%, #059669 100%)', // Emerald to Green
      'linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)', // Amber to Rose
    ];
    // Simple hash to consistently pick a gradient
    const charSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[charSum % gradients.length];
  };

  return (
    <article className="glass-card post-card animate-fade-in">
      <div 
        className="post-card-cover" 
        style={{ background: getCoverGradient(post.id) }}
      >
        <span className="post-category-tag">{post.category.name}</span>
        {post.status !== 'PUBLISHED' && (
          <div className="post-status-badge">{getStatusBadge(post.status)}</div>
        )}
      </div>

      <div className="post-card-content">
        <h3 className="post-card-title">
          <Link to={`/posts/${post.slug}`} className="post-card-link">
            <span>{post.title}</span>
            <ArrowUpRight className="post-card-arrow" size={18} />
          </Link>
        </h3>

        <p className="post-card-summary">{post.summary}</p>

        <div className="post-tags-list">
          {post.tags.map((tag) => (
            <span key={tag.id} className="post-tag-item">
              #{tag.name}
            </span>
          ))}
        </div>

        <div className="post-card-footer">
          <div className="post-author">
            <div className="post-author-avatar">
              <User size={14} />
            </div>
            <span className="post-author-name">{post.author.name}</span>
          </div>

          <div className="post-meta">
            <div className="post-meta-item">
              <Calendar size={14} />
              <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            </div>
            <div className="post-meta-item">
              <Clock size={14} />
              <span>{post.readingTime} min</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
