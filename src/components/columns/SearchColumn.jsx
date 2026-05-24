import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, bibleBooks } from '../../data/bibleBooks'

function SearchColumn({ columnId, data }) {
  const { data: appData, goToVerse, updateColumn } = useApp()
  const [localQuery, setLocalQuery] = useState(data?.query || '')
  const [expandedBooks, setExpandedBooks] = useState({})

  const query = data?.query || ''

  // Search results grouped by book
  const { grouped, totalCount } = useMemo(() => {
    if (!query || query.length < 2) return { grouped: [], totalCount: 0 }

    const searchRegex = new RegExp(`\\b${escapeRegex(query)}\\b`, 'i')
    const byBook = {}
    let total = 0

    for (const verse of appData.verses) {
      if (searchRegex.test(verse.text)) {
        const book = verse.book
        if (!byBook[book]) byBook[book] = []
        byBook[book].push({
          verseId: `${verse.book}.${verse.chapter}.${verse.verse}`,
          text: verse.text
        })
        total++
      }
    }

    // Order by canonical bible book order
    const ordered = bibleBooks
      .filter(b => byBook[b.abbr])
      .map(b => ({ abbr: b.abbr, name: b.name, results: byBook[b.abbr] }))

    return { grouped: ordered, totalCount: total }
  }, [query, appData.verses])

  const toggleBook = (abbr) => {
    setExpandedBooks(prev => ({ ...prev, [abbr]: !prev[abbr] }))
  }

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
        {query && totalCount > 0 && (
          <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
            {totalCount} result{totalCount !== 1 ? 's' : ''} for "{query}" in {grouped.length} book{grouped.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div style={{ overflow: 'auto', flex: 1 }}>
        {!query && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Enter a search term to find verses
          </div>
        )}

        {query && totalCount === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No verses found matching "{query}"
          </div>
        )}

        {grouped.map(group => (
          <div key={group.abbr} className="accordion-section">
            <div
              className={`accordion-header${expandedBooks[group.abbr] ? ' expanded' : ''}`}
              onClick={() => toggleBook(group.abbr)}
            >
              <span className="accordion-icon">▶</span>
              <span className="accordion-title">{group.name}</span>
              <span className="accordion-count">{group.results.length}</span>
            </div>
            {expandedBooks[group.abbr] && (
              <div className="accordion-content">
                {group.results.map(result => (
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
            )}
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
