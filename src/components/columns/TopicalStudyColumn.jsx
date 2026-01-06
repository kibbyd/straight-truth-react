import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

function TopicalStudyColumn({ columnId, data }) {
  const { data: appData, goToVerse, openStrongs } = useApp()
  const [expandedCluster, setExpandedCluster] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDiscovered, setShowDiscovered] = useState(false)

  const clusters = appData.topicalClusters || []

  // Separate curated (with description) from discovered clusters
  const { curated, discovered } = useMemo(() => {
    const cur = []
    const disc = []
    clusters.forEach(c => {
      if (c.description) {
        cur.push(c)
      } else {
        disc.push(c)
      }
    })
    return { curated: cur, discovered: disc }
  }, [clusters])

  // Filter clusters by search
  const filteredCurated = useMemo(() => {
    if (!searchQuery) return curated
    const query = searchQuery.toLowerCase()
    return curated.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query) ||
      c.entries?.some(e =>
        e.gloss?.toLowerCase().includes(query) ||
        e.original?.toLowerCase().includes(query)
      )
    )
  }, [curated, searchQuery])

  const filteredDiscovered = useMemo(() => {
    if (!searchQuery) return discovered
    const query = searchQuery.toLowerCase()
    return discovered.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.entries?.some(e =>
        e.gloss?.toLowerCase().includes(query) ||
        e.original?.toLowerCase().includes(query)
      )
    )
  }, [discovered, searchQuery])

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

  const renderCluster = (cluster) => {
    const isExpanded = expandedCluster === cluster.id

    return (
      <div key={cluster.id} className="topical-cluster">
        <div
          className="topical-cluster-header"
          onClick={() => setExpandedCluster(isExpanded ? null : cluster.id)}
        >
          <span style={{ color: '#888', marginRight: '6px' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="topical-cluster-name">{cluster.name}</span>
          {cluster.shared_verses > 0 && (
            <span className="topical-cluster-count">{cluster.shared_verses} shared</span>
          )}
        </div>

        {isExpanded && (
          <div className="topical-cluster-content">
            {cluster.description && (
              <div className="topical-cluster-desc">{cluster.description}</div>
            )}

            <div className="topical-terms-section">
              <div className="topical-section-title">Terms in this cluster:</div>
              <div className="topical-terms-grid">
                {cluster.entries?.slice(0, 12).map((entry, i) => (
                  <div
                    key={i}
                    className="topical-term-chip"
                    onClick={() => openStrongs(entry.strong)}
                    title={`${entry.gloss} - ${entry.frequency} occurrences`}
                  >
                    <span className="topical-term-original">{entry.original}</span>
                    <span className="topical-term-gloss">{entry.gloss}</span>
                    <span className="topical-term-strong">{entry.strong}</span>
                  </div>
                ))}
              </div>
            </div>

            {cluster.sample_verses && cluster.sample_verses.length > 0 && (
              <div className="topical-verses-section">
                <div className="topical-section-title">
                  Verses where these terms appear together:
                </div>
                <div className="topical-verses-list">
                  {cluster.sample_verses.slice(0, 15).map((sv, i) => {
                    const parsed = parseRef(sv.verse)
                    return (
                      <span
                        key={i}
                        className="topical-verse-link"
                        onClick={() => goToVerse(parsed.verseId, null, true)}
                        title={`Contains: ${sv.matches?.join(', ')}`}
                      >
                        {parsed.display}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header" style={{ background: 'linear-gradient(to bottom, #f3e5f5, #e1bee7)', borderColor: '#ce93d8' }}>
        <div className="catalogue-title">🔍 Topical Study</div>
        <div className="catalogue-subtitle">Words that appear together in scripture</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ overflow: 'auto', flex: 1 }}>
        {/* Curated theological clusters */}
        <div className="topical-section">
          <div className="topical-section-header">
            Theological Topics ({filteredCurated.length})
          </div>
          {filteredCurated.map(cluster => renderCluster(cluster))}
        </div>

        {/* Toggle for discovered clusters */}
        {filteredDiscovered.length > 0 && (
          <div className="topical-section">
            <div
              className="topical-section-header topical-toggle"
              onClick={() => setShowDiscovered(!showDiscovered)}
            >
              <span>{showDiscovered ? '▼' : '▶'}</span>
              <span>Discovered Patterns ({filteredDiscovered.length})</span>
            </div>
            {showDiscovered && filteredDiscovered.map(cluster => renderCluster(cluster))}
          </div>
        )}

        {filteredCurated.length === 0 && filteredDiscovered.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            {searchQuery ? 'No topics match your search' : 'No topics available'}
          </div>
        )}
      </div>
    </div>
  )
}

export default TopicalStudyColumn
