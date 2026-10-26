import { useState } from 'react'
import RegisterChooser from './RegisterChooser.jsx'
import { COPY } from './registerCopy.js'
import styles from './RegisterChooser.module.css'

/*
 * One-line usage:
 *   <RegisterButton lang={lang} companyUrl="/register/company" />
 *
 * Every RegisterChooser prop passes through (studentUrl, companyUrl, loginUrl, companyLoginUrl,
 * onSelect, navigate, lang).
 * className replaces the default gradient style (e.g. className="btn btn-primary");
 * children replace the label.
 */
export default function RegisterButton({ className, children, lang = 'en', ...chooserProps }) {
  const [open, setOpen] = useState(false)
  const label = children ?? (COPY[lang] || COPY.en).register
  return (
    <>
      <button
        type="button"
        className={className || styles.registerBtn}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <RegisterChooser open={open} onClose={() => setOpen(false)} lang={lang} {...chooserProps} />
    </>
  )
}
