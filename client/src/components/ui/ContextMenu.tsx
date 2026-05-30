import React from 'react';

export type ContextMenuItem = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
};

export const ContextMenu: React.FC<{
  open: boolean;
  x: number;
  y: number;
  onClose: () => void;
  items: ContextMenuItem[];
}> = ({ open, x, y, onClose, items }) => {
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState({ left: x, top: y, ready: false });

  React.useEffect(() => {
    if (!open) return;
    const handler = () => onClose();
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open, onClose]);

  React.useLayoutEffect(() => {
    if (!open) return;

    const menu = menuRef.current;
    const margin = 8;
    const width = menu?.offsetWidth ?? 260;
    const height = menu?.offsetHeight ?? Math.max(44, items.length * 44 + 8);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = x;
    let top = y;

    if (left + width + margin > viewportWidth) {
      left = x - width;
    }

    if (top + height + margin > viewportHeight) {
      top = y - height;
    }

    left = Math.max(margin, Math.min(left, viewportWidth - width - margin));
    top = Math.max(margin, Math.min(top, viewportHeight - height - margin));

    setPosition({ left, top, ready: true });
  }, [open, x, y, items.length]);

  React.useEffect(() => {
    if (!open) {
      setPosition({ left: x, top: y, ready: false });
    }
  }, [open, x, y]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="user-menu-dropdown"
      style={{
        position: 'fixed',
        top: position.ready ? position.top : y,
        left: position.ready ? position.left : x,
        right: 'auto',
        maxHeight: 'calc(100vh - 1rem)',
        overflowY: 'auto',
        visibility: position.ready ? 'visible' : 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ padding: '4px 0' }}>
        {items.map((it, idx) => (
          <button
            key={idx}
            disabled={it.disabled}
            onClick={() => {
              it.onClick();
              onClose();
            }}
            className='menu-item'
            style={{
              color: it.danger ? 'var(--danger)' : 'inherit',
            }}
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
};
