import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

function MiraclesColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [expandedId, setExpandedId] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')

  const miracles = appData.miracles || []

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(miracles.map(m => m.category))
    return ['all', ...Array.from(cats).sort()]
  }, [miracles])

  // Filter by category
  const filteredMiracles = useMemo(() => {
    if (categoryFilter === 'all') return miracles
    return miracles.filter(m => m.category === categoryFilter)
  }, [miracles, categoryFilter])

  // Parse verse range like "Joh.2.1-11" into individual refs
  const parseRefs = (refs) => {
    if (!refs || !Array.isArray(refs)) return []
    return refs.map(ref => {
      // Handle ranges like "Joh.2.1-11"
      const match = ref.match(/^([^.]+)\.(\d+)\.(\d+)(?:-(\d+))?$/)
      if (match) {
        const rawVerseId = `${match[1]}.${match[2]}.${match[3]}`
        return {
          display: formatVerseRef(ref.split('-')[0]),
          verseId: normalizeVerseId(rawVerseId)
        }
      }
      return { display: ref, verseId: normalizeVerseId(ref) }
    })
  }

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header miracles-header">
        <div className="catalogue-title">✨ Miracles of Jesus</div>
        <div className="catalogue-subtitle">{miracles.length} recorded miracles</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
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
        {filteredMiracles.map((miracle, index) => (
          <div key={index} className="catalogue-item">
            <div
              className="catalogue-item-name"
              onClick={() => setExpandedId(expandedId === index ? null : index)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ marginRight: '8px' }}>{expandedId === index ? '▼' : '▶'}</span>
              {miracle.name}
              <span style={{ float: 'right', fontSize: '12px', color: '#888' }}>
                {miracle.category}
              </span>
            </div>

            {expandedId === index && (
              <div style={{ padding: '10px 0 5px 20px' }}>
                {miracle.location && (
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    📍 {miracle.location}
                  </div>
                )}
                <div className="catalogue-refs">
                  {parseRefs(miracle.references).map((ref, i) => (
                    <span
                      key={i}
                      className="catalogue-ref-link"
                      onClick={() => goToVerse(ref.verseId)}
                    >
                      {ref.display}
                    </span>
                  ))}
                </div>
                {miracle.parallels && miracle.parallels.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>Parallels: </span>
                    {parseRefs(miracle.parallels).map((ref, i) => (
                      <span
                        key={i}
                        className="catalogue-ref-link"
                        onClick={() => goToVerse(ref.verseId)}
                        style={{ marginLeft: '4px' }}
                      >
                        {ref.display}
                      </span>
                    ))}
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

export default MiraclesColumn
