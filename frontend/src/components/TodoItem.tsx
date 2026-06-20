import React, { useState } from 'react';
import { TodoItem as TodoItemType, UpdateTodoRequest } from '../types/todo';

interface TodoItemProps {
  item: TodoItemType;
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, request: UpdateTodoRequest) => Promise<void>;
}

export function TodoItem({ item, onToggle, onDelete, onEdit }: TodoItemProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(item.id);
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    await onDelete(item.id);
    setLoading(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editTitle.trim();
    if (trimmed.length === 0 || trimmed === item.title) {
      setIsEditing(false);
      setEditTitle(item.title);
      return;
    }
    setLoading(true);
    await onEdit(item.id, { title: trimmed });
    setIsEditing(false);
    setLoading(false);
  };

  const isComplete = item.status === 'complete';

  return (
    <li className={`todo-item ${isComplete ? 'completed' : ''}`}>
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="edit-form">
          <input
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            maxLength={255}
            autoFocus
            disabled={loading}
          />
          <button type="submit" disabled={loading}>Save</button>
          <button type="button" onClick={() => { setIsEditing(false); setEditTitle(item.title); }} disabled={loading}>
            Cancel
          </button>
        </form>
      ) : (
        <div className="todo-content">
          <span
            className={`todo-title ${isComplete ? 'strikethrough' : ''}`}
            style={isComplete ? { textDecoration: 'line-through' } : undefined}
          >
            {item.title}
          </span>
          {item.description && (
            <span className="todo-description">{item.description}</span>
          )}
          <span className="todo-status">{item.status}</span>
          <div className="todo-actions">
            <button onClick={() => setIsEditing(true)} disabled={loading} aria-label="Edit">
              Edit
            </button>
            <button onClick={handleToggle} disabled={loading} aria-label="Toggle status">
              {isComplete ? 'Undo' : 'Complete'}
            </button>
            <button onClick={handleDelete} disabled={loading} aria-label="Delete">
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
