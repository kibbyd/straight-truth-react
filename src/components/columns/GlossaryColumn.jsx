import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef } from '../../data/bibleBooks'

function GlossaryColumn({ columnId, data }) {
  const { data: appData, goToVerse, openStrongs } = useApp()
  const [expandedId, setExpandedId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const glossary = appData.glossary || []

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(glossary.map(g => g.category))
    return ['all', ...Array.from(cats).filter(c => c).sort()]
  }, [glossary])

  // Filter by category and search
  const filteredGlossary = useMemo(() => {
    let filtered = glossary

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(g => g.category === categoryFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(g =>
        g.term.toLowerCase().includes(query) ||
        g.simple_definition?.toLowerCase().includes(query) ||
        g.expanded?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [glossary, categoryFilter, searchQuery])

  // Parse verse reference
  const parseRef = (ref) => {
    const match = ref.match(/^([^.]+)\.(\d+)\.(\d+)/)
    if (match) {
      return {
        display: formatVerseRef(`${match[1]}.${match[2]}.${match[3]}`),
        verseId: `${match[1]}.${match[2]}.${match[3]}`
      }
    }
    return { display: ref, verseId: ref }
  }

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header glossary-header">
        <div className="catalogue-title">📚 Glossary</div>
        <div className="catalogue-subtitle">{glossary.length} theological terms</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search terms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '8px' }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat}
            </option>
          ))}
        </select>
      </div>

      <div className="catalogue-list">
        {filteredGlossary.map((item, index) => (
          <div key={item.id || index} className="glossary-item">
            <div
              className="question-header"
              onClick={() => setExpandedId(expandedId === index ? null : index)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ color: '#888', marginRight: '6px' }}>
                {expandedId === index ? '▼' : '▶'}
              </span>
              <span className="glossary-term">{item.term}</span>
              {item.category && (
                <span style={{ float: 'right', fontSize: '12px', color: '#888' }}>
                  {item.category}
                </span>
              )}
            </div>

            {expandedId === index && (
              <div className="glossary-content">
                {item.simple_definition && (
                  <div className="glossary-simple">{item.simple_definition}</div>
                )}

                {item.expanded && (
                  <div className="glossary-expanded">{item.expanded}</div>
                )}

                {item.original_language && (
                  <div className="glossary-language">
                    {item.original_language.hebrew && (
                      <span className="glossary-original" style={{ color: '#1565c0' }}>
                        {item.original_language.hebrew}
                      </span>
                    )}
                    {item.original_language.greek && (
                      <span className="glossary-original" style={{ color: '#7b1fa2' }}>
                        {item.original_language.greek}
                      </span>
                    )}
                    {item.original_language.meaning && (
                      <span className="glossary-meaning">{item.original_language.meaning}</span>
                    )}
                    {item.original_language.strongs && (
                      <span
                        className="catalogue-strongs-link"
                        onClick={() => openStrongs(item.original_language.strongs)}
                        style={{ cursor: 'pointer' }}
                      >
                        {item.original_language.strongs}
                      </span>
                    )}
                  </div>
                )}

                {item.scripture_references && item.scripture_references.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    {item.scripture_references.map((sr, i) => (
                      <div key={i} style={{ marginBottom: '8px' }}>
                        {sr.text && (
                          <div style={{ fontSize: '14px', color: '#555', fontStyle: 'italic', marginBottom: '4px' }}>
                            "{sr.text}"
                          </div>
                        )}
                        {sr.reference && (
                          <span
                            className="catalogue-ref-link"
                            onClick={() => goToVerse(parseRef(sr.reference).verseId)}
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
        ))}

        {filteredGlossary.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            {searchQuery || categoryFilter !== 'all' ? 'No terms match your filter' : 'No glossary terms available'}
          </div>
        )}
      </div>
    </div>
  )
}

export default GlossaryColumn
