import * as fc from 'fast-check';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { TodoList } from '../../src/components/TodoList';
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

describe('Property 10: Frontend renders all TodoItem data', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render title, description, and status for each item', () => {
    fc.assert(
      fc.property(
        fc.array(todoItemArb, { minLength: 1, maxLength: 10 }),
        (items: TodoItemType[]) => {
          cleanup();
          const { container } = render(
            <TodoList
              items={items}
              onToggle={noopAsync}
              onDelete={noopAsync}
              onEdit={noopAsync}
            />
          );

          items.forEach(item => {
            // Title should be present
            expect(container.textContent).toContain(item.title);
            
            // Description should be present when not null
            if (item.description !== null) {
              expect(container.textContent).toContain(item.description);
            }
            
            // Status should be present
            expect(container.textContent).toContain(item.status);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});
