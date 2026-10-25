import { createContext, useContext } from 'react'
import en from '../content/en.js'
import ar from '../content/ar.js'

export const dictionaries = { en, ar }
export const LangContext = createContext({ lang: 'en', t: en, setLang: () => {} })
export const useLang = () => useContext(LangContext)
