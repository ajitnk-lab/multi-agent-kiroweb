import React from 'react';

interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps): React.ReactElement {
  return (
    <div className="error-message" role="alert">
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss error">
        ✕
      </button>
    </div>
  );
}
