import { useRef, useState } from 'react';

const onlyDigits = (value) => String(value ?? '').replace(/\D/g, '');

// State and handlers for a row of single-digit code boxes.
//
// - Typing a digit moves to the next box; Backspace on an empty box goes back.
// - Pasting a code (or the browser / phone filling it in from the email or SMS
//   through autocomplete="one-time-code") spreads the digits over the boxes,
//   whichever box received them.
// - When a whole code arrives at once, `onComplete(code)` is called so the
//   screen can submit it straight away.
export default function useOtpInputs(length = 6, { onComplete } = {}) {
  const [digits, setDigits] = useState(() => Array(length).fill(''));
  const refs = useRef([]);

  const focusBox = (index) => {
    const el = refs.current[Math.max(0, Math.min(length - 1, index))];
    if (el) {
      el.focus();
      el.select();
    }
  };

  const fillFrom = (start, raw) => {
    const chars = onlyDigits(raw).split('');
    if (!chars.length) return;
    const from = chars.length >= length ? 0 : start;
    const next = [...digits];
    chars.slice(0, length - from).forEach((char, offset) => {
      next[from + offset] = char;
    });
    setDigits(next);
    const complete = next.every(Boolean);
    focusBox(complete ? length - 1 : from + chars.length);
    if (complete && chars.length > 1 && onComplete) onComplete(next.join(''));
  };

  const setDigit = (index, value) => {
    const next = [...digits];
    next[index] = value;
    setDigits(next);
  };

  const getInputProps = (index) => ({
    ref: (el) => {
      refs.current[index] = el;
    },
    value: digits[index],
    type: 'text',
    inputMode: 'numeric',
    pattern: '[0-9]*',
    autoComplete: index === 0 ? 'one-time-code' : 'off',
    // Room for a whole code, so an autofilled or pasted code is not cut to
    // its first digit before it can be spread over the boxes.
    maxLength: length,
    'aria-label': `Digit ${index + 1} of ${length}`,
    onFocus: (event) => event.target.select(),
    onChange: (event) => {
      const value = onlyDigits(event.target.value);
      if (!value) {
        setDigit(index, '');
        return;
      }
      if (value.length === 1) {
        setDigit(index, value);
        if (index < length - 1) focusBox(index + 1);
        return;
      }
      fillFrom(index, value);
    },
    onPaste: (event) => {
      event.preventDefault();
      fillFrom(index, event.clipboardData.getData('text'));
    },
    onKeyDown: (event) => {
      if (event.key === 'Backspace' && !digits[index] && index > 0) {
        event.preventDefault();
        setDigit(index - 1, '');
        focusBox(index - 1);
      } else if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault();
        focusBox(index - 1);
      } else if (event.key === 'ArrowRight' && index < length - 1) {
        event.preventDefault();
        focusBox(index + 1);
      }
    },
  });

  const reset = () => {
    setDigits(Array(length).fill(''));
    focusBox(0);
  };

  return { digits, code: digits.join(''), getInputProps, reset, focusBox };
}
