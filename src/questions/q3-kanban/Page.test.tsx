import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { renderRoute } from '@/test/renderRoute';

const column = (name: string) => screen.getByRole('region', { name: new RegExp(`^${name}`) });

/** Asserts the count shown in a column header, e.g. "Done 2 cards". */
function expectCount(name: string, count: number) {
  expect(
    screen.getByRole('heading', {
      level: 2,
      name: `${name} ${count} ${count === 1 ? 'card' : 'cards'}`,
    }),
  ).toBeInTheDocument();
}

async function renderBoard() {
  const result = renderRoute('/kanban');
  // The page is lazy-loaded; the first import in a cold test worker can exceed the 1s default.
  await screen.findByRole('heading', { level: 1, name: 'Kanban board' }, { timeout: 5000 });
  return result;
}

async function addCard(user: UserEvent, columnName: string, title: string, description = '') {
  const region = column(columnName);
  const open = within(region).queryByRole('button', { name: `+ Add card to ${columnName}` });
  if (open) await user.click(open);
  await user.type(within(region).getByLabelText('Title'), title);
  if (description) await user.type(within(region).getByLabelText(/Description/), description);
  await user.click(within(region).getByRole('button', { name: 'Add card' }));
}

const card = (title: string) => screen.getByRole('article', { name: title });

afterEach(() => localStorage.clear());

describe('Kanban board', () => {
  it('renders three empty columns with zero counts', async () => {
    await renderBoard();
    expectCount('To do', 0);
    expectCount('In progress', 0);
    expectCount('Done', 0);
  });

  it('requires a title before adding a card', async () => {
    const { user } = await renderBoard();
    const todo = column('To do');
    await user.click(within(todo).getByRole('button', { name: '+ Add card to To do' }));
    await user.click(within(todo).getByRole('button', { name: 'Add card' }));

    const title = within(todo).getByLabelText('Title');
    expect(title).toHaveAttribute('aria-invalid', 'true');
    expect(title).toHaveAccessibleDescription('Title is required');
    expect(title).toHaveFocus();
    expectCount('To do', 0);

    await user.type(title, 'Write the spec');
    expect(within(todo).queryByText('Title is required')).not.toBeInTheDocument();
    await user.click(within(todo).getByRole('button', { name: 'Add card' }));

    expect(card('Write the spec')).toBeInTheDocument();
    expectCount('To do', 1);
  });

  it('ignores a whitespace-only title', async () => {
    const { user } = await renderBoard();
    await addCard(user, 'To do', '   ');
    expect(within(column('To do')).getByText('Title is required')).toBeInTheDocument();
    expectCount('To do', 0);
  });

  it('moves a card between columns with the keyboard and updates both counts', async () => {
    const { user } = await renderBoard();
    await addCard(user, 'To do', 'Alpha');
    await addCard(user, 'To do', 'Beta');
    expectCount('To do', 2);

    const toggle = within(card('Alpha')).getByRole('button', { name: 'Move Alpha' });
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const moves = within(card('Alpha')).getByRole('group', { name: 'Move Alpha' });
    expect(within(moves).getByRole('button', { name: /Move left/ })).toBeDisabled();
    within(moves)
      .getByRole('button', { name: /Move to In progress/ })
      .focus();
    await user.keyboard('{Enter}');

    expectCount('To do', 1);
    expectCount('In progress', 1);
    expect(within(column('In progress')).getByRole('article', { name: 'Alpha' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Moved "Alpha" to In progress, position 1 of 1.',
    );
    // Focus follows the card into its new column, ready for the next move.
    expect(within(card('Alpha')).getByRole('button', { name: /Move to Done/ })).toHaveFocus();

    await user.keyboard('{Enter}');
    expectCount('In progress', 0);
    expectCount('Done', 1);
    expect(screen.getByRole('status')).toHaveTextContent('Moved "Alpha" to Done, position 1 of 1.');
    // "Move to Done" no longer applies, so focus falls back to the Move toggle.
    expect(within(card('Alpha')).getByRole('button', { name: 'Move Alpha' })).toHaveFocus();
  });

  it('reorders cards within a column with move up and down', async () => {
    const { user } = await renderBoard();
    await addCard(user, 'To do', 'First');
    await addCard(user, 'To do', 'Second');
    await addCard(user, 'To do', 'Third');

    await user.click(within(card('Third')).getByRole('button', { name: 'Move Third' }));
    await user.click(within(card('Third')).getByRole('button', { name: /Move up/ }));
    await user.keyboard('{Enter}');

    const titles = within(column('To do'))
      .getAllByRole('article')
      .map((article) => within(article).getByRole('heading').textContent);
    expect(titles).toEqual(['Third', 'First', 'Second']);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Moved "Third" to To do, position 1 of 3.',
    );
    expectCount('To do', 3);
  });

  it('edits a card in place', async () => {
    const { user } = await renderBoard();
    await addCard(user, 'To do', 'Draft');
    await user.click(within(card('Draft')).getByRole('button', { name: 'Edit Draft' }));

    const form = screen.getByRole('form', { name: 'Edit Draft' });
    const title = within(form).getByLabelText('Title');
    await user.clear(title);
    await user.click(within(form).getByRole('button', { name: 'Save' }));
    expect(title).toHaveAccessibleDescription('Title is required');

    await user.type(title, 'Final copy');
    await user.type(within(form).getByLabelText(/Description/), 'Ready for review');
    await user.click(within(form).getByRole('button', { name: 'Save' }));

    expect(within(card('Final copy')).getByText('Ready for review')).toBeInTheDocument();
    expect(
      within(card('Final copy')).getByRole('button', { name: 'Edit Final copy' }),
    ).toHaveFocus();
  });

  it('deletes a card and restores it with undo', async () => {
    const { user } = await renderBoard();
    await addCard(user, 'To do', 'Keep');
    await addCard(user, 'To do', 'Oops');
    await addCard(user, 'To do', 'Last');

    await user.click(within(card('Oops')).getByRole('button', { name: 'Delete Oops' }));
    expect(screen.queryByRole('article', { name: 'Oops' })).not.toBeInTheDocument();
    expectCount('To do', 2);

    const undo = screen.getByRole('button', { name: 'Undo' });
    expect(undo).toHaveFocus();
    await user.click(undo);

    const titles = within(column('To do'))
      .getAllByRole('article')
      .map((article) => within(article).getByRole('heading').textContent);
    expect(titles).toEqual(['Keep', 'Oops', 'Last']);
    expectCount('To do', 3);
  });

  it('keeps the board after a remount (page refresh)', async () => {
    const first = await renderBoard();
    await addCard(first.user, 'Done', 'Persist me', 'Across reloads');
    expectCount('Done', 1);
    first.unmount();

    await renderBoard();
    expectCount('Done', 1);
    expect(within(card('Persist me')).getByText('Across reloads')).toBeInTheDocument();
  });

  it('starts empty when saved data is corrupt', async () => {
    localStorage.setItem('fe-interview-prep:q3-kanban:board', '{"cards":[]');
    await renderBoard();
    expectCount('To do', 0);
  });
});
