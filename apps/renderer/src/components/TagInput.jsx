import { useEffect, useMemo, useRef, useState } from 'react'

const RESERVED_TAGS = new Set(['any'])

function normalizeTagList(tags) {
  const seen = new Set()
  const nextTags = []
  for (const tag of tags || []) {
    const normalized = String(tag || '').trim()
    const key = normalized.toLowerCase()
    if (!normalized || RESERVED_TAGS.has(key) || seen.has(key)) {
      continue
    }
    seen.add(key)
    nextTags.push(normalized)
  }
  return nextTags
}

export default function TagInput({ availableTags, onBlur, onChange, onCommit, placeholder = 'Add tag', value }) {
  const containerRef = useRef(null)
  const blurTimerRef = useRef(null)
  const [inputValue, setInputValue] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const normalizedValue = useMemo(() => normalizeTagList(value), [value])
  const suggestions = useMemo(() => {
    const loweredInput = inputValue.trim().toLowerCase()
    return normalizeTagList(availableTags)
      .filter((tag) => !normalizedValue.some((item) => item.toLowerCase() === tag.toLowerCase()))
      .filter((tag) => !loweredInput || tag.toLowerCase().includes(loweredInput))
      .slice(0, 8)
  }, [availableTags, inputValue, normalizedValue])

  const activeSuggestionIndex =
    highlightedIndex >= 0 && highlightedIndex < suggestions.length
      ? highlightedIndex
      : suggestions.length
        ? 0
        : -1

  useEffect(() => {
    return () => {
      window.clearTimeout(blurTimerRef.current)
    }
  }, [])

  function commitTag(rawTag) {
    const tag = String(rawTag || '').trim()
    if (!tag) {
      return
    }
    const nextValue = normalizeTagList([...normalizedValue, tag])
    onChange(nextValue)
    onCommit?.(nextValue)
    setInputValue('')
    setMenuOpen(false)
    setHighlightedIndex(-1)
  }

  function removeTag(tagToRemove) {
    const nextValue = normalizedValue.filter((tag) => tag.toLowerCase() !== String(tagToRemove).toLowerCase())
    onChange(nextValue)
    onCommit?.(nextValue)
  }

  return (
    <div className="tag-input" ref={containerRef}>
      <div className="tag-input__field" onClick={() => containerRef.current?.querySelector('input')?.focus()} role="presentation">
        {normalizedValue.map((tag) => (
          <span className="tag-input__chip" key={tag}>
            <span>{tag}</span>
            <button
              aria-label={`Remove ${tag}`}
              className="tag-input__chip-remove"
              onClick={() => removeTag(tag)}
              type="button"
            >
              <i aria-hidden="true" className="fa-solid fa-xmark" />
            </button>
          </span>
        ))}
        <input
          className="tag-input__input"
          placeholder={!normalizedValue.length ? placeholder : ''}
          value={inputValue}
          onBlur={() => {
            blurTimerRef.current = window.setTimeout(() => {
              if (inputValue.trim()) {
                commitTag(inputValue)
              }
              setMenuOpen(false)
              onBlur?.()
            }, 120)
          }}
          onChange={(event) => {
            setInputValue(event.target.value)
            setMenuOpen(true)
          }}
          onFocus={() => setMenuOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              if (!suggestions.length) {
                return
              }
              event.preventDefault()
              setMenuOpen(true)
              setHighlightedIndex((current) => {
                const baseIndex = current >= 0 && current < suggestions.length ? current : -1
                return (baseIndex + 1) % suggestions.length
              })
              return
            }
            if (event.key === 'ArrowUp') {
              if (!suggestions.length) {
                return
              }
              event.preventDefault()
              setMenuOpen(true)
              setHighlightedIndex((current) => {
                const baseIndex = current >= 0 && current < suggestions.length ? current : 0
                return baseIndex <= 0 ? suggestions.length - 1 : baseIndex - 1
              })
              return
            }
            if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
              if (!inputValue.trim() && activeSuggestionIndex < 0) {
                return
              }
              event.preventDefault()
              commitTag(activeSuggestionIndex >= 0 ? suggestions[activeSuggestionIndex] : inputValue)
              return
            }
            if (event.key === 'Backspace' && !inputValue && normalizedValue.length) {
              event.preventDefault()
              removeTag(normalizedValue[normalizedValue.length - 1])
            }
          }}
          type="text"
        />
      </div>
      {menuOpen && suggestions.length ? (
        <div className="tag-input__menu">
          {suggestions.map((tag, index) => (
            <button
              className={`tag-input__menu-item ${index === activeSuggestionIndex ? 'tag-input__menu-item--active' : ''}`}
              key={tag}
              onMouseDown={(event) => {
                event.preventDefault()
                window.clearTimeout(blurTimerRef.current)
                commitTag(tag)
              }}
              type="button"
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
