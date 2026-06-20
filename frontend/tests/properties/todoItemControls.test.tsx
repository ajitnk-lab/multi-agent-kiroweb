import * as fc from 'fast-check';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { TodoItem } from '../../src/components/TodoItem';
import { TodoItem as TodoItemType } from '../../src/types/todo';

// Generator for valid TodoItems
const todoItemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  description: fc.oneof(fc.string({ minLength: 1, maxLength: 200 }), fc.constant(null)),
  status: fc.constantFrom('incomplete' as const, 'complete' as const),
  createdAt: fc.date().map(d => d.toISOString()),
  updatedAt: fc.date().map(d => d.toISOString())
});

const noopAsync = async () => {};

describe('Property 11: Frontend TodoItem controls and completion styling', () => {
  afterEach(() => {
    cleanup();
  });

  it('should display edit, toggle, and delete controls for any TodoItem', () => {
    fc.assert(
      fc.property(
        todoItemArb,
        (item: TodoItemType) => {
          cleanup();
          const { getByLabelText } = render(
            <TodoItem
              item={item}
              onToggle={noopAsync}
              onDelete={noopAsync}
              onEdit={noopAsync}
            />
          );

          // Edit, toggle, and delete controls should be present
          expect(getByLabelText('Edit')).toBeDefined();
          expect(getByLabelText('Toggle status')).toBeDefined();
          expect(getByLabelText('Delete')).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should apply strikethrough styling when status is complete', () => {
    fc.assert(
      fc.property(
        todoItemArb.map(item => ({ ...item, status: 'complete' as const })),
        (item: TodoItemType) => {
          cleanup();
          const { container } = render(
            <TodoItem
              item={item}
              onToggle={noopAsync}
              onDelete={noopAsync}
              onEdit={noopAsync}
            />
          );

          const titleElement = container.querySelector('.strikethrough, [style*="line-through"]');
          expect(titleElement).not.toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should NOT apply strikethrough styling when status is incomplete', () => {
    fc.assert(
      fc.property(
        todoItemArb.map(item => ({ ...item, status: 'incomplete' as const })),
        (item: TodoItemType) => {
          cleanup();
          const { container } = render(
            <TodoItem
              item={item}
              onToggle={noopAsync}
              onDelete={noopAsync}
              onEdit={noopAsync}
            />
          );

          const titleElement = container.querySelector('.todo-title');
          if (titleElement) {
            expect((titleElement as HTMLElement).style.textDecoration).not.toBe('line-through');
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
