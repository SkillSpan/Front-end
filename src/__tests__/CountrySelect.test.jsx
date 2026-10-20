import '../components/evidence/__tests__/setupReact.js'
import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchableSelect from '../components/common/SearchableSelect'
import { ALL_COUNTRIES, mergeCountries } from '../components/common/countries'

function Harness({ options }) {
  const [v, setV] = useState('')
  return (
    <SearchableSelect options={options} value={v} onChange={setV} placeholder="All countries"
      allowClear clearLabel="All countries" keepOpenOnClear />
  )
}

describe('country dropdown', () => {
  it('shows the full country list as soon as it opens', () => {
    const { container } = render(<Harness options={ALL_COUNTRIES} />)
    fireEvent.click(container.querySelector('.searchable-select-control'))
    // all countries + the "All countries" clear row
    expect(container.querySelectorAll('.searchable-select-option').length).toBe(ALL_COUNTRIES.length + 1)
    expect(ALL_COUNTRIES.length).toBeGreaterThan(190)
  })

  it('clicking "All countries" again resets and keeps the full list visible', () => {
    const { container } = render(<Harness options={ALL_COUNTRIES} />)
    fireEvent.click(container.querySelector('.searchable-select-control'))
    fireEvent.click(screen.getByText('Jordan'))
    expect(container.querySelector('.searchable-select-panel')).toBeNull() // normal pick closes
    fireEvent.click(container.querySelector('.searchable-select-control'))
    fireEvent.click(container.querySelector('.searchable-select-clear'))
    expect(container.querySelector('.searchable-select-panel')).not.toBeNull()
    expect(container.querySelector('.searchable-select-value')).toBeNull() // value cleared
    expect(container.querySelectorAll('.searchable-select-option').length).toBe(ALL_COUNTRIES.length + 1)
  })

  it('merges a short backend list into the full list without duplicates', () => {
    const merged = mergeCountries(['palestine', 'Atlantis'])
    expect(merged.filter((c) => c.toLowerCase() === 'palestine').length).toBe(1)
    expect(merged).toContain('Atlantis')
    expect(merged.length).toBe(ALL_COUNTRIES.length + 1)
  })

  it('has no duplicate countries in the static list', () => {
    expect(new Set(ALL_COUNTRIES).size).toBe(ALL_COUNTRIES.length)
  })
})
