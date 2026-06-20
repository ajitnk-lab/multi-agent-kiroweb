import React from 'react';

export function EmptyPlaceholder(): React.ReactElement {
  return (
    <div className="empty-placeholder">
      <p>No tasks have been created yet. Add your first todo above!</p>
    </div>
  );
}
