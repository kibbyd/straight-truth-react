import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef } from '../../data/bibleBooks'

function ParablesColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [expandedId, setExpandedId] = useState(null)
  const [themeFilter, setThemeFilter] = useState('all')

  const parables = appData.parables || []

  // Get unique themes
  const themes = useMemo(() => {
    const t = new Set(parables.map(p => p.theme))
    return ['all', ...Array.from(t).sort()]
  }, [parables])

  // Filter by theme
  const filteredParables = useMemo(() => {
    if (themeFilter === 'all') return parables
    return parables.filter(p => p.theme === themeFilter)
  }, [parables, themeFilter])

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
      <div className="catalogue-header parables-header">
        <div className="catalogue-title">📖 Parables of Jesus</div>
        <div className="catalogue-subtitle">{parables.length} recorded parables</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <select
          value={themeFilter}
          onChange={(e) => setThemeFilter(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          {themes.map(theme => (
            <option key={theme} value={theme}>
              {theme === 'all' ? 'All Themes' : theme}
            </option>
          ))}
        </select>
      </div>

      <div className="catalogue-list">
        {filteredParables.map((parable, index) => (
          <div key={index} className="catalogue-item">
            <div
              className="catalogue-item-name"
              onClick={() => setExpandedId(expandedId === index ? null : index)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ marginRight: '8px' }}>{expandedId === index ? '▼' : '▶'}</span>
              {parable.name}
              <span style={{ float: 'right', fontSize: '12px', color: '#888' }}>
                {parable.theme}
              </span>
            </div>

            {expandedId === index && (
              <div style={{ padding: '10px 0 5px 20px' }}>
                {parable.location && (
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    📍 {parable.location}
                  </div>
                )}
                <div className="catalogue-refs">
                  {(parable.references || []).map((ref, i) => {
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
                {parable.parallels && parable.parallels.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>Parallels: </span>
                    {parable.parallels.map((ref, i) => {
                      const parsed = parseRef(ref)
                      return (
                        <span
                          key={i}
                          className="catalogue-ref-link"
                          onClick={() => goToVerse(parsed.verseId)}
                          style={{ marginLeft: '4px' }}
                        >
                          {parsed.display}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ParablesColumn
