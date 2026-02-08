'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye, CheckCircle, AlertTriangle, LogOut, MessageSquare, Star, X } from 'lucide-react';
import { Entity, Comment, defaultComments } from '@/data/db';
import EntityForm from '@/components/EntityForm';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'flagged' | 'unverified'>('all');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedEntityForComments, setSelectedEntityForComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // Для чекбоксов

  useEffect(() => {
    // Check authorization on mount only
    const auth = localStorage.getItem('admin_auth');
    setIsAuthorized(auth === 'true');
    
    if (auth === 'true') {
      loadEntities();
    } else {
      setLoading(false);
    }
  }, [filter]);

  const loadEntities = async () => {
    setLoading(true);
    try {
      // Load from API
      const response = await fetch(`/api/entities?status=${filter === 'all' ? '' : filter}&limit=1000`);
      const data = await response.json();
      
      setEntities(data.entities || []);
    } catch (error) {
      console.error('Failed to load entities:', error);
      setEntities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
    setIsAuthorized(false);
    setEntities([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту карточку?')) return;
    
    try {
      const response = await fetch(`/api/entities/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      // Reload
      await loadEntities();
    } catch (error) {
      alert('Ошибка при удалении');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/entities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
      
      if (!response.ok) throw new Error('Approve failed');
      
      // Reload
      await loadEntities();
      
      alert('✅ Карточка одобрена и теперь отображается на сайте!');
    } catch (error) {
      alert('❌ Ошибка при одобрении');
    }
  };

  const handleUnapprove = async (id: string) => {
    try {
      const response = await fetch(`/api/entities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'unverified' })
      });
      
      if (!response.ok) throw new Error('Unapprove failed');
      
      // Reload
      await loadEntities();
      
      alert('✅ Одобрение снято, карточка скрыта с сайта');
    } catch (error) {
      alert('❌ Ошибка при снятии одобрения');
    }
  };

  // Массовые действия
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/entities/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active' })
          })
        )
      );
      
      await loadEntities();
      setSelectedIds([]);
      
      alert(`✅ Одобрено карточек: ${selectedIds.length}`);
    } catch (error) {
      alert('❌ Ошибка при одобрении');
    }
  };

  const handleBulkUnapprove = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/entities/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'unverified' })
          })
        )
      );
      
      await loadEntities();
      setSelectedIds([]);
      
      alert(`✅ Снято одобрение с ${selectedIds.length} карточек`);
    } catch (error) {
      alert('❌ Ошибка при снятии одобрения');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Удалить ${selectedIds.length} карточек?`)) return;
    
    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`/api/entities/${id}`, {
            method: 'DELETE'
          })
        )
      );
      
      await loadEntities();
      setSelectedIds([]);
      
      alert(`✅ Удалено карточек: ${selectedIds.length}`);
    } catch (error) {
      alert('❌ Ошибка при удалении');
    }
  };

  const handleBulkOpen = () => {
    if (selectedIds.length === 0) return;
    
    selectedIds.forEach(id => {
      window.open(`/entity/${id}`, '_blank');
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === entities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(entities.map(e => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const getStatusColor = (status: string, rating: number) => {
    if (status === 'flagged' || status === 'active_problem') return 'bg-red-100 text-red-800';
    if (status === 'unverified') return 'bg-yellow-100 text-yellow-800';
    if (status === 'active') {
      if (rating >= 4.0) return 'bg-green-100 text-green-800';
      if (rating >= 3.0) return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (password === 'bali2025') {
      localStorage.setItem('admin_auth', 'true');
      setIsAuthorized(true);
      loadEntities();
    } else {
      setLoginError('Неверный пароль');
      setPassword('');
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-bali-ocean/10 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-primary to-bali-ocean p-4 rounded-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-display font-bold text-gray-900 text-center mb-2">
            Админ-панель
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Введите пароль для доступа
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                autoFocus
              />
              {loginError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {loginError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-bali-ocean text-white px-6 py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all font-medium text-lg"
            >
              Войти
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400">
              Bali Explorer Admin v3.0.6
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">
                Админ-панель
              </h1>
              <p className="text-gray-600 mt-1">
                Управление базой данных Bali Explorer
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditingEntity(null);
                  setShowEntityForm(true);
                }}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                <Plus size={20} />
                Добавить карточку
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                title="Выйти"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'Все', icon: Eye },
              { value: 'active', label: 'Активные', icon: CheckCircle },
              { value: 'unverified', label: 'Непроверенные', icon: AlertTriangle },
              { value: 'flagged', label: 'С жалобами', icon: AlertTriangle },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as any)}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  filter === f.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <f.icon size={16} />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Entities Table */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-card p-8">
            <div className="skeleton h-8 mb-4"></div>
            <div className="skeleton h-8 mb-4"></div>
            <div className="skeleton h-8"></div>
          </div>
        ) : entities.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <p className="text-gray-500">Карточек пока нет</p>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">
                  Выбрано: {selectedIds.length}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkApprove}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    Одобрить
                  </button>
                  <button
                    onClick={handleBulkUnapprove}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                  >
                    Снять одобрение
                  </button>
                  <button
                    onClick={handleBulkOpen}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Открыть
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-card overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === entities.length && entities.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Название</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Тип</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Район</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Доверие</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Статус</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entities.map(entity => (
                    <tr key={entity.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(entity.id)}
                          onChange={() => toggleSelect(entity.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{entity.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{entity.short_description}</div>
                      </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                        {entity.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{entity.area}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={star <= Math.floor((entity as any).totalScore || entity.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}>
                              ⭐
                            </span>
                          ))}
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {((entity as any).totalScore || entity.rating) ? Number((entity as any).totalScore || entity.rating).toFixed(1) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(entity.status, Number((entity as any).totalScore || entity.rating) || 0)}`}>
                        {entity.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 min-w-max">
                        {/* Approve/Unapprove button */}
                        {entity.status === 'unverified' ? (
                          <button
                            onClick={() => handleApprove(entity.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Одобрить"
                          >
                            <CheckCircle size={18} />
                          </button>
                        ) : entity.status === 'active' ? (
                          <button
                            onClick={() => handleUnapprove(entity.id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Снять одобрение"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="15" y1="9" x2="9" y2="15"></line>
                              <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                          </button>
                        ) : null}
                        <button
                          onClick={() => window.open(`/entity/${entity.id}`, '_blank')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Просмотр"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEntityForComments(entity.id);
                            setShowCommentsModal(true);
                          }}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Комментарии"
                        >
                          <MessageSquare size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingEntity(entity);
                            setShowEntityForm(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(entity.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        <div className="mt-6 text-center text-gray-500">
          Всего карточек: {entities.length}
        </div>
      </div>

      {/* Comments Modal */}
      {showCommentsModal && selectedEntityForComments && (
        <CommentsModal
          entityId={selectedEntityForComments}
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedEntityForComments(null);
          }}
        />
      )}

      {/* Entity Form Modal */}
      {showEntityForm && (
        <EntityForm
          onClose={() => {
            setShowEntityForm(false);
            setEditingEntity(null); // Reset editing entity
            loadEntities(); // Reload after close
          }}
          onSave={(data) => {
            console.log('Saving entity:', data);
            setShowEntityForm(false);
            setEditingEntity(null); // Reset editing entity
            loadEntities(); // Reload after save
          }}
          initialData={editingEntity}
        />
      )}
    </div>
  );
}

// Comments Modal Component
function CommentsModal({ entityId, onClose }: { entityId: string; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [entity, setEntity] = useState<Entity | null>(null);

  useEffect(() => {
    loadComments();
    loadEntity();
  }, [entityId]);

  const loadEntity = async () => {
    try {
      const response = await fetch(`/api/entities`);
      const data = await response.json();
      const found = data.entities.find((e: Entity) => e.id === entityId);
      setEntity(found || null);
    } catch (error) {
      console.error('Failed to load entity:', error);
    }
  };

  const loadComments = () => {
    // Load from localStorage (user comments)
    const stored = JSON.parse(localStorage.getItem('bali-explorer-comments') || '{}');
    const userComments = stored[entityId] || [];
    
    // Load from entity.reviews (imported from JSON)
    let entityReviews: Comment[] = [];
    const allEntities = JSON.parse(localStorage.getItem('bali_entities') || '[]');
    const foundEntity = allEntities.find((e: any) => e.id === entityId);
    if (foundEntity && foundEntity.reviews && Array.isArray(foundEntity.reviews)) {
      entityReviews = foundEntity.reviews.map((review: any, index: number) => ({
        id: `review-${entityId}-${index}`,
        entity_id: entityId,
        rating: review.stars || review.rating || 0,
        text: review.text || review.textTranslated || '',
        author: review.name || 'Аноним',
        created_at: review.created_at || review.publishedAtDate || new Date().toISOString(),
      }));
    }
    
    // Load default comment
    const defaultComment = defaultComments.find(c => c.entity_id === entityId);
    
    // Combine all: entity reviews + user comments + default
    const allComments = defaultComment 
      ? [...entityReviews, ...userComments, defaultComment]
      : [...entityReviews, ...userComments];
    
    allComments.sort((a: Comment, b: Comment) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setComments(allComments);
  };

  const deleteComment = (commentId: string) => {
    if (!confirm('Удалить этот комментарий?')) return;

    const stored = JSON.parse(localStorage.getItem('bali-explorer-comments') || '{}');
    if (stored[entityId]) {
      stored[entityId] = stored[entityId].filter((c: Comment) => c.id !== commentId);
      localStorage.setItem('bali-explorer-comments', JSON.stringify(stored));
      loadComments();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              💬 Комментарии
            </h2>
            {entity && (
              <p className="text-sm text-gray-600 mt-1">{entity.title}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6">
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Комментариев пока нет</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                >
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={
                          star <= comment.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </div>

                  {/* Text */}
                  {comment.text && (
                    <p className="text-gray-800 mb-3 leading-relaxed">
                      {comment.text}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{comment.author}</span>
                      {' • '}
                      <span>{formatDate(comment.created_at)}</span>
                    </div>

                    {/* Delete button (only for non-default comments) */}
                    {!defaultComments.find(c => c.id === comment.id) && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Всего отзывов: {comments.length}
          </p>
        </div>
      </div>
    </div>
  );
}
