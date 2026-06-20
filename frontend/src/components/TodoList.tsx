import React from 'react';
import { TodoItem as TodoItemType, UpdateTodoRequest } from '../types/todo';
import { TodoItem } from './TodoItem';
import { EmptyPlaceholder } from './EmptyPlaceholder';

interface TodoListProps {
  items: TodoItemType[];
  onToggle: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, request: UpdateTodoRequest) => Promise<void>;
}

export function TodoList({ items, onToggle, onDelete, onEdit }: TodoListProps): React.ReactElement {
  if (items.length === 0) {
    return <EmptyPlaceholder />;
  }

  return (
    <ul className="todo-list" role="list">
      {items.map(item => (
        <TodoItem
          key={item.id}
          item={item}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </ul>
  );
}
