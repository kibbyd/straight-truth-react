import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

function DefinitionsColumn({ columnId, data }) {
  const { data: appData, goToVerse, openStrongs } = useApp()
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedTerm, setExpandedTerm] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const definitions = appData.definitions || []

  // Group by category
  const groupedDefinitions = useMemo(() => {
    const groups = {}
    definitions.forEach(def => {
      const cat = def.category || 'Other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(def)
    })
    return groups
  }, [definitions])

  // Filter definitions by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedDefinitions

    const query = searchQuery.toLowerCase()
    const filtered = {}

    Object.entries(groupedDefinitions).forEach(([cat, defs]) => {
      const matchingDefs = defs.filter(def =>
        def.term.toLowerCase().includes(query) ||
        def.original?.toLowerCase().includes(query) ||
        def.strongs?.toLowerCase().includes(query) ||
        def.scripture_definitions?.some(s => s.text.toLowerCase().includes(query))
      )
      if (matchingDefs.length > 0) {
        filtered[cat] = matchingDefs
      }
    })

    return filtered
  }, [groupedDefinitions, searchQuery])

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

  const categories = Object.keys(filteredGroups).sort()

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header" style={{ background: 'linear-gradient(to bottom, #e8f5e9, #c8e6c9)', borderColor: '#a5d6a7' }}>
        <div className="catalogue-title">📖 Definitions</div>
        <div className="catalogue-subtitle">Let Scripture define Scripture</div>
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
        {categories.map(category => (
          <div key={category} className="accordion-section">
            <div
              className={`accordion-header ${expandedCategory === category ? 'expanded' : ''}`}
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
            >
              <span className="accordion-icon">▶</span>
              <span className="accordion-title">{category}</span>
              <span className="accordion-count">{filteredGroups[category].length}</span>
            </div>

            {expandedCategory === category && (
              <div className="accordion-content">
                {filteredGroups[category].map((definition, dIndex) => (
                  <div key={definition.id || dIndex} className="definition-item">
                    <div
                      className="definition-header"
                      onClick={() => setExpandedTerm(expandedTerm === definition.id ? null : definition.id)}
                    >
                      <span style={{ color: '#888', marginRight: '6px' }}>
                        {expandedTerm === definition.id ? '▼' : '▶'}
                      </span>
                      <span className="definition-term">{definition.term}</span>
                      <span
                        className="definition-strongs"
                        onClick={(e) => {
                          e.stopPropagation()
                          openStrongs(definition.strongs)
                        }}
                        title={`View ${definition.strongs} in Strong's`}
                      >
                        {definition.strongs}
                      </span>
                    </div>

                    {expandedTerm === definition.id && (
                      <div className="definition-content">
                        <div className="definition-original">
                          {definition.original}
                        </div>

                        {definition.scripture_definitions && definition.scripture_definitions.length > 0 && (
                          <div className="definition-verses">
                            {definition.scripture_definitions.map((item, i) => {
                              const parsed = parseRef(item.verse)
                              return (
                                <div key={i} className="definition-verse-item">
                                  <div className="definition-verse-text">"{item.text}"</div>
                                  <div
                                    className="definition-verse-ref"
                                    onClick={() => goToVerse(parsed.verseId, null, true)}
                                  >
                                    — {parsed.display}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            {searchQuery ? 'No definitions match your search' : 'No definitions available'}
          </div>
        )}
      </div>
    </div>
  )
}

export default DefinitionsColumn
