import { useEffect, useRef, useState } from 'react';
import './SearchableSelect.css';

// ---------------------------------------------------------------------------
// A plain native <select> renders its option list via the OS's own popup,
// which we can't restyle - once a list gets long (countries, universities
// pulled from GET /api/v1/reference/*, see api.js), that popup's font size
// and row height look inconsistent with the rest of the form, and there's
// no way to search/filter it - just scroll through everything.
//
// This renders our own small combobox instead: a button that looks like
// the other fields, and (when opened) a search box + filtered list we
// fully control the styling of. Drop-in replacement for a controlled
// <select> - same `value` / `onChange(nextValue)` contract, just with
// `options` as a plain array of strings instead of children.
// ---------------------------------------------------------------------------

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Type to search…',
  loading = false,
  disabled = false,
  hasError = false,
  allowClear = false,
  clearLabel = 'All',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    // Autofocus the search box the moment the panel opens.
    const t = setTimeout(() => searchRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
      clearTimeout(t);
    };
  }, [open]);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const handleToggle = () => {
    if (disabled || loading) return;
    setOpen((o) => !o);
  };

  const handleSelect = (option) => {
    onChange(option);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="searchable-select" ref={rootRef}>
      <button
        type="button"
        className={`searchable-select-control ${hasError ? 'has-error' : ''} ${open ? 'open' : ''}`}
        onClick={handleToggle}
        disabled={disabled || loading}
      >
        <span className={value ? 'searchable-select-value' : 'searchable-select-placeholder'}>
          {loading ? 'Loading…' : value || placeholder}
        </span>
        <svg
          className="searchable-select-caret"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && !loading && (
        <div className="searchable-select-panel">
          <input
            ref={searchRef}
            type="text"
            className="searchable-select-search"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="searchable-select-list">
            {allowClear && !query.trim() && (
              <li
                className={`searchable-select-option searchable-select-clear ${!value ? 'selected' : ''}`}
                onClick={() => handleSelect('')}
              >
                {clearLabel}
              </li>
            )}
            {filtered.length === 0 && <li className="searchable-select-empty">No matches</li>}
            {filtered.map((option) => (
              <li
                key={option}
                className={`searchable-select-option ${option === value ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
