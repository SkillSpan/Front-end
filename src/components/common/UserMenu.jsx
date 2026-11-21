import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './UserMenu.css';

function initialsOf(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

/**
 * The account chip in the top bar (avatar + name + role + chevron) and its
 * dropdown. One component for both workspaces (company and learner), so the
 * two shells behave the same.
 *
 * items: [{ key, label, Icon, onSelect, danger }] in order; a `danger` item is
 * drawn after a divider, in red (Log out).
 * closeKey: anything that changes on navigation (the active page); the menu
 * closes when it changes, so it never stays open over a new page.
 *
 * Opens on click / Enter / Space (native button) and ArrowDown; closes on a
 * click outside, Esc (focus goes back to the chip), Tab out, picking an item
 * or a route change. The panel is anchored to the chip's inline-end edge, so
 * in Arabic it opens towards the left edge correctly.
 */
export default function UserMenu({
  name,
  role,
  avatarUrl = null,
  items = [],
  closeKey,
  menuLabel = 'Account menu',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [lastKey, setLastKey] = useState(closeKey);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const menuId = useId();

  // Route change → close (adjusting state during render, not in an effect).
  if (closeKey !== lastKey) {
    setLastKey(closeKey);
    if (open) setOpen(false);
  }

  const focusItem = useCallback((index) => {
    const nodes = listRef.current?.querySelectorAll('[role="menuitem"]');
    if (!nodes || nodes.length === 0) return;
    const i = (index + nodes.length) % nodes.length;
    nodes[i].focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    // First item gets focus so the keyboard can carry on from the chip.
    const id = window.requestAnimationFrame(() => focusItem(0));
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
      window.cancelAnimationFrame(id);
    };
  }, [open, focusItem]);

  const onListKeyDown = (event) => {
    const nodes = Array.from(listRef.current?.querySelectorAll('[role="menuitem"]') || []);
    const current = nodes.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') { event.preventDefault(); focusItem(current + 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); focusItem(current - 1); }
    else if (event.key === 'Home') { event.preventDefault(); focusItem(0); }
    else if (event.key === 'End') { event.preventDefault(); focusItem(nodes.length - 1); }
    else if (event.key === 'Tab') setOpen(false);
  };

  const pick = (item) => {
    setOpen(false);
    item.onSelect?.();
  };

  const regular = items.filter((item) => !item.danger);
  const danger = items.filter((item) => item.danger);

  const renderItem = (item) => {
    const { key, label, Icon } = item;
    return (
      <li key={key} role="none">
        <button
          type="button"
          role="menuitem"
          className={`um-item${item.danger ? ' is-danger' : ''}`}
          onClick={() => pick(item)}
        >
          {Icon && <Icon className="um-item-ic" size={17} strokeWidth={1.8} aria-hidden="true" />}
          <span>{label}</span>
        </button>
      </li>
    );
  };

  return (
    <div className={`um${open ? ' is-open' : ''} ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        ref={buttonRef}
        className="um-chip"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${menuLabel}: ${name || ''}`.trim()}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) { event.preventDefault(); setOpen(true); }
        }}
      >
        {avatarUrl ? (
          <img className="um-av" src={avatarUrl} alt="" />
        ) : (
          <span className="um-av" aria-hidden="true">{initialsOf(name)}</span>
        )}
        <span className="um-text">
          <span className="um-name">{name}</span>
          {role && <span className="um-role">{role}</span>}
        </span>
        <ChevronDown className="um-chev" size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>

      {open && (
        <div className="um-panel" id={menuId}>
          <div className="um-head">
            <span className="um-head-name">{name}</span>
            {role && <span className="um-head-role">{role}</span>}
          </div>
          <ul className="um-list" role="menu" aria-label={menuLabel} ref={listRef} onKeyDown={onListKeyDown}>
            {regular.map(renderItem)}
            {danger.length > 0 && <li role="separator" className="um-sep" />}
            {danger.map(renderItem)}
          </ul>
        </div>
      )}
    </div>
  );
}
