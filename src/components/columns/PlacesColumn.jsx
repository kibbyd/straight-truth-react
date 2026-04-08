import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef } from '../../data/bibleBooks'

function PlacesColumn({ columnId, data }) {
  const { data: appData, goToVerse, openStrongs } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedPlace, setExpandedPlace] = useState(null)

  const places = appData.places || []

  const filtered = useMemo(() => {
    if (!searchQuery) return places
    const q = searchQuery.toLowerCase()
    return places.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.region && p.region.toLowerCase().includes(q)) ||
      (p.altNames && p.altNames.some(a => a.toLowerCase().includes(q)))
    )
  }, [places, searchQuery])

  const handleRefClick = (ref, e) => {
    e.stopPropagation()
    goToVerse(ref)
  }

  const handleStrongsClick = (strong, e) => {
    e.stopPropagation()
    openStrongs(strong)
  }

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header" style={{ background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', color: 'white' }}>
        <div className="catalogue-title" style={{ color: 'white' }}>Places</div>
        <div className="catalogue-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>{places.length} biblical locations</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search places..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div className="catalogue-list">
        {filtered.map((place, idx) => {
          const key = `${place.name}-${idx}`
          const isExpanded = expandedPlace === key

          return (
            <div key={key} style={{ borderBottom: '1px solid #eee' }}>
              <div
                onClick={() => setExpandedPlace(isExpanded ? null : key)}
                style={{
                  padding: '10px 15px',
                  cursor: 'pointer',
                  background: isExpanded ? '#e8f5e9' : 'white',
                  borderLeft: isExpanded ? '4px solid #2e7d32' : '4px solid transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: isExpanded ? '#1b5e20' : '#333' }}>
                    {place.name}
                  </span>
                  {place.region && (
                    <span style={{ fontSize: '0.8em', color: '#888', marginLeft: 8 }}>
                      {place.region}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.8em', color: '#999' }}>
                  {place.refs.length} ref{place.refs.length !== 1 ? 's' : ''} {isExpanded ? '▼' : '▶'}
                </span>
              </div>

              {isExpanded && (
                <div style={{ padding: '10px 15px 14px', background: '#fafafa', borderLeft: '4px solid #2e7d32' }}>
                  {place.description && (
                    <div style={{ fontSize: '0.9em', color: '#444', marginBottom: 10, lineHeight: 1.5 }}>
                      {place.description}
                    </div>
                  )}

                  {place.altNames && place.altNames.length > 0 && (
                    <div style={{ fontSize: '0.85em', color: '#666', marginBottom: 10 }}>
                      <strong>Also known as:</strong> {place.altNames.join(', ')}
                    </div>
                  )}

                  {place.coords && (
                    <div style={{ fontSize: '0.85em', marginBottom: 10 }}>
                      <a
                        href={`https://www.google.com/maps/@${place.coords.lat},${place.coords.lng},14z`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: '#1976d2', textDecoration: 'none' }}
                      >
                        View on Map
                      </a>
                    </div>
                  )}

                  {place.strongs && place.strongs.length > 0 && (
                    <div style={{ fontSize: '0.85em', color: '#666', marginBottom: 10 }}>
                      {place.strongs.map(s => (
                        <span
                          key={s}
                          onClick={(e) => handleStrongsClick(s, e)}
                          style={{
                            color: '#1976d2',
                            cursor: 'pointer',
                            marginRight: 8,
                            textDecoration: 'underline dotted'
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: '0.85em' }}>
                    <strong style={{ color: '#555' }}>References:</strong>
                    <div style={{ marginTop: 4, lineHeight: 1.8 }}>
                      {place.refs.map((ref, ri) => (
                        <span key={ri}>
                          <span
                            onClick={(e) => handleRefClick(ref, e)}
                            style={{ color: '#1976d2', cursor: 'pointer' }}
                          >
                            {formatVerseRef(ref)}
                          </span>
                          {ri < place.refs.length - 1 && <span style={{ color: '#ccc' }}> · </span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
            {searchQuery ? 'No places match your search' : 'No places available'}
          </div>
        )}
      </div>
    </div>
  )
}

export default PlacesColumn
