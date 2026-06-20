import React from 'react';

interface LoadingIndicatorProps {
  isLoading: boolean;
}

export function LoadingIndicator({ isLoading }: LoadingIndicatorProps): React.ReactElement | null {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="loading-indicator" role="status" aria-live="polite">
      <span>Loading...</span>
    </div>
  );
}
