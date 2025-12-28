import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef } from '../../data/bibleBooks'

function PrayersColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [expandedId, setExpandedId] = useState(null)
  const [testamentFilter, setTestamentFilter] = useState('all')

  const prayers = appData.prayers || []

  // Filter by testament
  const filteredPrayers = useMemo(() => {
    if (testamentFilter === 'all') return prayers
    return prayers.filter(p => p.testament === testamentFilter)
  }, [prayers, testamentFilter])

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

  const otCount = prayers.filter(p => p.testament === 'OT').length
  const ntCount = prayers.filter(p => p.testament === 'NT').length

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header prayers-header">
        <div className="catalogue-title">🙏 Prayers in the Bible</div>
        <div className="catalogue-subtitle">{prayers.length} recorded prayers</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <select
          value={testamentFilter}
          onChange={(e) => setTestamentFilter(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="all">All Prayers ({prayers.length})</option>
          <option value="OT">Old Testament ({otCount})</option>
          <option value="NT">New Testament ({ntCount})</option>
        </select>
      </div>

      <div className="catalogue-list">
        {filteredPrayers.map((prayer, index) => (
          <div key={index} className="catalogue-item">
            <div
              className="catalogue-item-name"
              onClick={() => setExpandedId(expandedId === index ? null : index)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ marginRight: '8px' }}>{expandedId === index ? '▼' : '▶'}</span>
              {prayer.name}
              <span style={{ float: 'right', fontSize: '12px', color: '#888' }}>
                {prayer.testament}
              </span>
            </div>

            {expandedId === index && (
              <div style={{ padding: '10px 0 5px 20px' }}>
                {prayer.person && (
                  <div style={{ fontSize: '14px', color: '#555', marginBottom: '4px' }}>
                    <strong>Person:</strong> {prayer.person}
                  </div>
                )}
                {prayer.context && (
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    {prayer.context}
                  </div>
                )}
                <div className="catalogue-refs">
                  {(prayer.references || []).map((ref, i) => {
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

export default PrayersColumn
