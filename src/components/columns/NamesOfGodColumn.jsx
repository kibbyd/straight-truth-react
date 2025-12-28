import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef } from '../../data/bibleBooks'

function NamesOfGodColumn({ columnId, data }) {
  const { data: appData, goToVerse, openStrongs } = useApp()
  const [expandedId, setExpandedId] = useState(null)
  const [languageFilter, setLanguageFilter] = useState('all')

  const names = appData.namesOfGod || []

  // Filter by language
  const filteredNames = useMemo(() => {
    if (languageFilter === 'all') return names
    return names.filter(n => n.language === languageFilter)
  }, [names, languageFilter])

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

  const hebrewCount = names.filter(n => n.language === 'Hebrew').length
  const greekCount = names.filter(n => n.language === 'Greek').length

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header namesofgod-header">
        <div className="catalogue-title">✡️ Names of God</div>
        <div className="catalogue-subtitle">{names.length} divine names & titles</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <select
          value={languageFilter}
          onChange={(e) => setLanguageFilter(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="all">All Names ({names.length})</option>
          <option value="Hebrew">Hebrew ({hebrewCount})</option>
          <option value="Greek">Greek ({greekCount})</option>
        </select>
      </div>

      <div className="catalogue-list">
        {filteredNames.map((name, index) => (
          <div key={index} className="catalogue-item">
            <div
              className="catalogue-item-name"
              onClick={() => setExpandedId(expandedId === index ? null : index)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ marginRight: '8px' }}>{expandedId === index ? '▼' : '▶'}</span>
              {name.name}
              <span style={{ float: 'right', fontSize: '12px', color: name.language === 'Hebrew' ? '#1565c0' : '#7b1fa2' }}>
                {name.language}
              </span>
            </div>

            {expandedId === index && (
              <div style={{ padding: '10px 0 5px 20px' }}>
                {name.meaning && (
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#333', marginBottom: '8px' }}>
                    "{name.meaning}"
                  </div>
                )}
                {name.usage && (
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    {name.usage}
                  </div>
                )}
                <div className="catalogue-refs">
                  {name.strongs && (
                    <span
                      className="catalogue-strongs-link"
                      onClick={() => {
                        // Strip "Strong's " prefix if present
                        const num = name.strongs.replace(/^Strong's\s*/i, '')
                        openStrongs(num)
                      }}
                      style={{ marginRight: '8px' }}
                    >
                      {name.strongs}
                    </span>
                  )}
                  {(name.references || []).map((ref, i) => {
                    const parsed = parseRef(ref)
                    return (
                      <span
                        key={i}
                        className="catalogue-ref-link"
                        onClick={() => goToVerse(parsed.verseId)}
                      >
                        {parsed.display}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default NamesOfGodColumn
