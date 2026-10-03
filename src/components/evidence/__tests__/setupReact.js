// vitest here compiles JSX with the classic runtime for files that don't
// import React (e.g. AppLayout.jsx). Expose React globally for this test only.
import React from 'react';
globalThis.React = React;
