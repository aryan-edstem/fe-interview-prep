import { useId } from 'react';

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

const buttonClass =
  'rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent';

/**
 * Keyboard/pointer alternative to dragging: a disclosure button revealing a group of move buttons.
 * Directions that aren't possible stay visible but disabled, so the layout doesn't jump.
 */
export function MoveMenu({ cardTitle, isOpen, options, onToggle, onClose, onMove }: MoveMenuProps) {
  const panelId = useId();

  return (
    <>
      <button
        type="button"
        data-focus="fallback"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={onToggle}
        className={buttonClass}
      >
        Move <span className="sr-only">{cardTitle}</span>
      </button>
      {isOpen && (
        <div
          id={panelId}
          role="group"
          aria-label={`Move ${cardTitle}`}
          className="flex w-full flex-wrap gap-1 border-t border-slate-100 pt-1"
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
                className={buttonClass}
              >
                <span aria-hidden="true">{ARROWS[direction]} </span>
                {label ?? defaultLabel(direction)}
              </button>
            );
          })}
        </div>
      )}
    </>
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
