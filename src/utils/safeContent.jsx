import { Fragment } from 'react';

// Render the tiny **bold** subset used by assistant messages without parsing
// or injecting HTML. React escapes every text segment, including server and
// user supplied content.
export function SafeBoldText({ text, strongClassName, strongStyle }) {
  const parts = String(text ?? '').split(/(\*\*.+?\*\*)/gs);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className={strongClassName} style={strongStyle}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}
