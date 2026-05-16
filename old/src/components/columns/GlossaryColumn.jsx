import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

const categoryIcons = {
  'Salvation': '✝️',
  'God': '👑',
  'Scripture': '📖',
  'Worship': '🙏',
  'Church': '⛪',
  'End Times': '⏳',
  'Sin': '⚠️',
  'General': '📚'
}

function GlossaryColumn({ columnId, data }) {
  const { data: appData, goToVerse, openStrongs } = useApp()
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedTerm, setExpandedTerm] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const glossary = appData.glossary || []

  // Group terms by category
  const groupedByCategory = useMemo(() => {
    const groups = {}
    glossary.forEach(term => {
      const cat = term.category || 'General'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(term)
    })
    // Sort terms alphabetically within each category
    for (const cat of Object.keys(groups)) {
      groups[cat].sort((a, b) => a.term.localeCompare(b.term))
    }
    return groups
  }, [glossary])

  // Get available categories (filtered by search if applicable)
  const availableCategories = useMemo(() => {
    const allCategories = Object.keys(groupedByCategory).sort()

    if (!searchQuery) return allCategories

    const query = searchQuery.toLowerCase()
    return allCategories.filter(cat => {
      const terms = groupedByCategory[cat] || []
      return terms.some(term =>
        term.term.toLowerCase().includes(query) ||
        term.simple_definition?.toLowerCase().includes(query) ||
        term.expanded?.toLowerCase().includes(query)
      )
    })
  }, [groupedByCategory, searchQuery])

  // Get filtered terms for a category
  const getFilteredTerms = (category) => {
    const terms = groupedByCategory[category] || []
    if (!searchQuery) return terms

    const query = searchQuery.toLowerCase()
    return terms.filter(term =>
      term.term.toLowerCase().includes(query) ||
      term.simple_definition?.toLowerCase().includes(query) ||
      term.expanded?.toLowerCase().includes(query)
    )
  }

  // Parse verse reference
  const parseRef = (ref) => {
    const match = ref.match(/^([^.]+)\.(\d+)\.(\d+)/)
    if (match) {
      const rawVerseId = `${match[1]}.${match[2]}.${match[3]}`
      return {
        display: formatVerseRef(rawVerseId),
        verseId: normalizeVerseId(rawVerseId)
      }
    }
    return { display: ref, verseId: normalizeVerseId(ref) }
  }

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header glossary-header">
        <div className="catalogue-title">📚 Biblical Glossary</div>
        <div className="catalogue-subtitle">{glossary.length} terms defined from Scripture</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search terms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ overflow: 'auto', flex: 1 }}>
        {availableCategories.map(category => {
          const icon = categoryIcons[category] || '📚'
          const categoryTerms = getFilteredTerms(category)
          const isCategoryExpanded = expandedCategory === category

          return (
            <div key={category} className="accordion-section">
              <div
                className={`accordion-header ${isCategoryExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedCategory(isCategoryExpanded ? null : category)}
              >
                <span className="accordion-icon">▶</span>
                <span className="accordion-title">{icon} {category}</span>
                <span className="accordion-count">{categoryTerms.length}</span>
              </div>

              {isCategoryExpanded && (
                <div className="accordion-content">
                  {categoryTerms.map((item, index) => {
                    const termKey = item.id || `${category}-${index}`
                    const isTermExpanded = expandedTerm === termKey

                    return (
                      <div key={termKey} className="glossary-item">
                        <div
                          className="glossary-header"
                          onClick={() => setExpandedTerm(isTermExpanded ? null : termKey)}
                          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px 0' }}
                        >
                          <span style={{ color: '#888', marginRight: '6px', fontSize: '0.8em' }}>
                            {isTermExpanded ? '▼' : '▶'}
                          </span>
                          <span className="glossary-term">{item.term}</span>
                        </div>

                        {isTermExpanded && (
                          <div className="glossary-content" style={{ paddingLeft: '20px', paddingBottom: '10px' }}>
                            {item.simple_definition && (
                              <div className="glossary-simple">{item.simple_definition}</div>
                            )}

                            {item.expanded && (
                              <div className="glossary-expanded">{item.expanded}</div>
                            )}

                            {item.original_language && (
                              <div className="glossary-language">
                                {(item.original_language.hebrew || item.original_language.greek) && (
                                  <span className="glossary-original">
                                    {item.original_language.hebrew || item.original_language.greek}
                                  </span>
                                )}
                                {item.original_language.strongs && (
                                  <span
                                    className="catalogue-strongs-link"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const num = item.original_language.strongs.replace(/^Strong's\s*/i, '')
                                      openStrongs(num)
                                    }}
                                    style={{ cursor: 'pointer', marginLeft: '6px' }}
                                  >
                                    {item.original_language.strongs}
                                  </span>
                                )}
                                {item.original_language.meaning && (
                                  <span className="glossary-meaning"> "{item.original_language.meaning}"</span>
                                )}
                              </div>
                            )}

                            {item.scripture_references && item.scripture_references.length > 0 && (
                              <div className="glossary-scriptures" style={{ marginTop: '10px' }}>
                                {item.scripture_references.map((sr, i) => (
                                  <div key={i} className="glossary-scripture" style={{ marginBottom: '8px' }}>
                                    {sr.text && (
                                      <div className="glossary-scripture-text" style={{ fontSize: '14px', color: '#555', fontStyle: 'italic', marginBottom: '4px' }}>
                                        "{sr.text}"
                                      </div>
                                    )}
                                    {sr.reference && (
                                      <span
                                        className="catalogue-ref-link"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          goToVerse(parseRef(sr.reference).verseId)
                                        }}
                                      >
                                        {parseRef(sr.reference).display}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {item.related_terms && item.related_terms.length > 0 && (
                              <div style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                                <strong>Related:</strong> {item.related_terms.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {availableCategories.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            {searchQuery ? 'No terms match your search' : 'No glossary terms available'}
          </div>
        )}
      </div>
    </div>
  )
}

export default GlossaryColumn
