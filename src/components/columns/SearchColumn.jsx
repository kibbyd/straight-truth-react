import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef } from '../../data/bibleBooks'

function SearchColumn({ columnId, data }) {
  const { data: appData, goToVerse, updateColumn } = useApp()
  const [localQuery, setLocalQuery] = useState(data?.query || '')

  const query = data?.query || ''

  // Search results
  const results = useMemo(() => {
    if (!query || query.length < 2) return []

    const searchLower = query.toLowerCase()
    const matches = []

    for (const verse of appData.verses) {
      if (verse.text.toLowerCase().includes(searchLower)) {
        matches.push({
          verseId: `${verse.book}.${verse.chapter}.${verse.verse}`,
          text: verse.text
        })
      }
      // Limit to 200 results for performance
      if (matches.length >= 200) break
    }

    return matches
  }, [query, appData.verses])

  // Highlight search term in text
  const highlightMatch = (text) => {
    if (!query) return text

    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    )
  }

  const handleSearch = () => {
    if (localQuery.trim()) {
      updateColumn(columnId, { query: localQuery.trim() })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="window-content" style={{ padding: 0 }}>
      <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search verses..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)'
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '8px 16px',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </div>
        {query && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            {results.length >= 200 && ' (showing first 200)'}
          </div>
        )}
      </div>

      <div style={{ overflow: 'auto', flex: 1 }}>
        {!query && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Enter a search term to find verses
          </div>
        )}

        {query && results.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No verses found matching "{query}"
          </div>
        )}

        {results.map(result => (
          <div
            key={result.verseId}
            className="search-result-item"
            onClick={() => goToVerse(result.verseId)}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-light)',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
              {formatVerseRef(result.verseId)}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.5 }}>
              {highlightMatch(result.text)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Escape special regex characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default SearchColumn
