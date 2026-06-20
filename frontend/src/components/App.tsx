import React from 'react';
import { useTodos } from '../hooks/useTodos';
import { TodoForm } from './TodoForm';
import { TodoList } from './TodoList';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorMessage } from './ErrorMessage';

export function App(): React.ReactElement {
  const { todos, loading, error, addTodo, updateTodo, toggleStatus, removeTodo, clearError } = useTodos();

  return (
    <div className="app">
      <h1>Todo App</h1>
      <TodoForm onSubmit={addTodo} disabled={loading} />
      <LoadingIndicator isLoading={loading} />
      {error && <ErrorMessage message={error} onDismiss={clearError} />}
      <TodoList
        items={todos}
        onToggle={toggleStatus}
        onDelete={removeTodo}
        onEdit={updateTodo}
      />
    </div>
  );
}
