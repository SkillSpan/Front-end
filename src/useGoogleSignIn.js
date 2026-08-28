import { useEffect, useRef, useState } from 'react';
import { GOOGLE_CLIENT_ID } from './config';

/**
 * Wires a real, working Google Sign-In to our own custom-styled button.
 *
 * Google Identity Services only lets us fully control the *click target*
 * when we use its own rendered button - it doesn't give us a "just call
 * this function on click" API for the ID-token flow. So instead of
 * swapping in Google's default button look (which would break the design
 * in the Figma/deployed screens), we render Google's real button
 * completely invisibly, positioned exactly on top of our own visible
 * button. Clicks land on the real Google button (which the user never
 * sees) and trigger the normal Google Sign-In popup; our custom button
 * underneath is purely decorative (pointer-events: none).
 *
 * @param {(credential: string) => void} onCredential called with the
 *   Google ID token once the user completes sign-in. May be `null` on the
 *   first render; in that case the component is expected to provide a
 *   ref via the returned `setCredentialRef` once the handler is defined.
 * @param {boolean} enabled whether Google Sign-In should be wired up at all
 */
export function useGoogleSignIn(onCredential, enabled) {
  const wrapRef = useRef(null); // the visible custom button's wrapper - used to measure width
  const overlayRef = useRef(null); // invisible container Google renders its real button into
  const [isReady, setIsReady] = useState(false);
  // Configuration errors are detected once at mount via the lazy initializer
  // below - that way we never call setState inside the effect body.
  const [error, setError] = useState(() =>
    !GOOGLE_CLIENT_ID
      ? 'Google sign-in is not configured (missing VITE_GOOGLE_CLIENT_ID).'
      : ''
  );

  // Keep the latest callback in a ref so the GIS initialize() call (which
  // captures the callback once) always calls the current handler without
  // having to re-initialize Google Sign-In on every render.
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    if (typeof onCredential === 'function') {
      onCredentialRef.current = onCredential;
    }
  }, [onCredential]);

  // Optional external ref slot - lets a component define its handler
  // AFTER the hook is mounted (e.g. when the handler closes over state
  // that isn't ready yet) without having to re-initialize GIS.
  const setCredentialRef = (ref) => {
    if (ref && ref.current) {
      onCredentialRef.current = ref.current;
    }
  };

  useEffect(() => {
    if (!enabled) return undefined;
    if (!GOOGLE_CLIENT_ID) return undefined;

    let cancelled = false;
    let attempts = 0;

    const handleResponse = (response) => {
      if (!response || !response.credential) {
        setError('Google did not return a valid credential. Please try again.');
        return;
      }
      if (typeof onCredentialRef.current === 'function') {
        onCredentialRef.current(response.credential);
      }
    };

    const tryInit = () => {
      if (cancelled) return;
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleResponse,
        });
        if (overlayRef.current) {
          const measuredWidth = wrapRef.current ? wrapRef.current.offsetWidth : 320;
          // GIS only supports a bounded button width - clamp to its range.
          const width = Math.max(200, Math.min(400, measuredWidth || 320));
          window.google.accounts.id.renderButton(overlayRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width,
          });
        }
        setIsReady(true);
        return;
      }
      // The GSI script loads async/defer, so it may not be ready yet.
      attempts += 1;
      if (attempts < 40) {
        setTimeout(tryInit, 150);
      } else {
        setError('Unable to load Google sign-in. Please refresh the page.');
      }
    };

    tryInit();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { wrapRef, overlayRef, isReady, error, setError, setCredentialRef };
}
