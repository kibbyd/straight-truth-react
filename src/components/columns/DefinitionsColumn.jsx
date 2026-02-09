import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

function DefinitionsColumn({ columnId, data }) {
  const { data: appData, goToVerse, openStrongs } = useApp()
  const [expandedTerm, setExpandedTerm] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const definitions = appData.definitions || []

  // Filter definitions by search
  const filtered = useMemo(() => {
    if (!searchQuery) return definitions
    const query = searchQuery.toLowerCase()
    return definitions.filter(def =>
      def.term.toLowerCase().includes(query) ||
      def.original?.toLowerCase().includes(query) ||
      def.strongs?.toLowerCase().includes(query) ||
      def.scripture_definitions?.some(s => s.text.toLowerCase().includes(query))
    )
  }, [definitions, searchQuery])

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
      <div className="catalogue-header" style={{ background: 'linear-gradient(to bottom, #e8f5e9, #c8e6c9)', borderColor: '#a5d6a7' }}>
        <div className="catalogue-title">Definitions</div>
        <div className="catalogue-subtitle">Scripture says...</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search terms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ overflow: 'auto', flex: 1 }}>
        {filtered.map((definition, dIndex) => (
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

        {filtered.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            {searchQuery ? 'No definitions match your search' : 'No definitions available'}
          </div>
        )}
      </div>
    </div>
  )
}

export default DefinitionsColumn
