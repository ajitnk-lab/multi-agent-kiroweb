import React, { useState } from 'react';
import { CreateTodoRequest } from '../types/todo';

interface TodoFormProps {
  onSubmit: (request: CreateTodoRequest) => Promise<void>;
  disabled: boolean;
}

export function TodoForm({ onSubmit, disabled }: TodoFormProps): React.ReactElement {
  const [title, setTitle] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTitle = title.trim();
    
    if (trimmedTitle.length === 0) {
      setValidationError('A title is required');
      return;
    }
    
    setValidationError(null);
    await onSubmit({ title: trimmedTitle });
    setTitle('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <div className="form-group">
        <input
          type="text"
          value={title}
          onChange={handleChange}
          maxLength={255}
          placeholder="What needs to be done?"
          disabled={disabled}
          aria-label="Todo title"
        />
        <button type="submit" disabled={disabled}>
          Add Todo
        </button>
      </div>
      {validationError && (
        <p className="validation-error" role="alert">
          {validationError}
        </p>
      )}
    </form>
  );
}
