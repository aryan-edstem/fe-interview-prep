import { useId } from 'react';
import { MoveIcon } from './icons';

export type MoveDirection = 'up' | 'down' | 'left' | 'right';

/** For each direction: the button label, or null when the card can't move that way. */
export type MoveOptions = Record<MoveDirection, string | null>;

export interface MoveMenuProps {
  cardTitle: string;
  isOpen: boolean;
  options: MoveOptions;
  onToggle: () => void;
  onClose: () => void;
  onMove: (direction: MoveDirection) => void;
}

const DIRECTIONS: readonly MoveDirection[] = ['up', 'down', 'left', 'right'];
const ARROWS: Record<MoveDirection, string> = { up: '↑', down: '↓', left: '←', right: '→' };

/**
 * Keyboard/pointer alternative to dragging: a disclosure button revealing a small popover with a
 * group of move buttons.
 * Directions that aren't possible stay visible but disabled, so the layout doesn't jump.
 */
export function MoveMenu({ cardTitle, isOpen, options, onToggle, onClose, onMove }: MoveMenuProps) {
  const panelId = useId();

  return (
    <div className="relative">
      <button
        type="button"
        data-focus="fallback"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={onToggle}
        title="Move"
        className={`btn btn-ghost btn-sm btn-icon ${isOpen ? 'bg-brand-50 text-brand-700' : ''}`}
      >
        <MoveIcon />
        <span className="sr-only">Move {cardTitle}</span>
      </button>
      {isOpen && (
        <div
          id={panelId}
          role="group"
          aria-label={`Move ${cardTitle}`}
          className="card absolute top-full right-0 z-20 mt-1 flex w-48 flex-col gap-0.5 p-1.5 shadow-card-hover"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              onClose();
            }
          }}
        >
          {DIRECTIONS.map((direction) => {
            const label = options[direction];
            return (
              <button
                key={direction}
                type="button"
                data-focus={direction}
                disabled={label === null}
                onClick={() => onMove(direction)}
                className="btn btn-ghost btn-sm w-full justify-start"
              >
                <span aria-hidden="true" className="w-4 text-center text-slate-400">
                  {ARROWS[direction]}
                </span>{' '}
                {label ?? defaultLabel(direction)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function defaultLabel(direction: MoveDirection): string {
  switch (direction) {
    case 'up':
      return 'Move up';
    case 'down':
      return 'Move down';
    case 'left':
      return 'Move left';
    case 'right':
      return 'Move right';
  }
}
