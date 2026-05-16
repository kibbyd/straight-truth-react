import { useState, useMemo, useRef } from 'react'
import { useApp } from '../../context/AppContext'

function MapsColumn({ columnId, data }) {
  const { data: appData } = useApp()
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [selectedMap, setSelectedMap] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageContainerRef = useRef(null)

  const mapsData = appData.maps || { categories: [] }

  // Filter maps by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return mapsData.categories

    const query = searchQuery.toLowerCase()
    return mapsData.categories.map(category => {
      const filteredMaps = category.maps.filter(map =>
        map.name.toLowerCase().includes(query) ||
        map.description?.toLowerCase().includes(query)
      )
      return { ...category, maps: filteredMaps }
    }).filter(category => category.maps.length > 0)
  }, [mapsData.categories, searchQuery])

  // Total map count
  const totalMaps = useMemo(() => {
    return mapsData.categories.reduce((sum, cat) => sum + cat.maps.length, 0)
  }, [mapsData.categories])

  // Open map in modal
  const openMap = (map) => {
    setSelectedMap(map)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Close modal
  const closeModal = () => {
    setSelectedMap(null)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Zoom controls
  const zoomIn = () => setZoom(z => Math.min(z * 1.5, 5))
  const zoomOut = () => setZoom(z => Math.max(z / 1.5, 0.5))
  const resetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Pan handlers for dragging
  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Scroll wheel zoom
  const handleWheel = (e) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      setZoom(z => Math.min(z * 1.2, 5))
    } else {
      setZoom(z => Math.max(z / 1.2, 0.5))
    }
  }

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header glossary-header">
        <div className="catalogue-title">🗺️ Maps & Geography</div>
        <div className="catalogue-subtitle">{totalMaps} biblical maps</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search maps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ overflow: 'auto', flex: 1 }}>
        {filteredCategories.map(category => {
          const isExpanded = expandedCategory === category.id

          return (
            <div key={category.id} className="accordion-section">
              <div
                className={`accordion-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
              >
                <span className="accordion-icon">▶</span>
                <span className="accordion-title">{category.icon} {category.name}</span>
                <span className="accordion-count">{category.maps.length}</span>
              </div>

              {isExpanded && (
                <div className="accordion-content">
                  <div style={{ display: 'grid', gap: '8px', padding: '8px 0' }}>
                    {category.maps.map(map => (
                      <div
                        key={map.id}
                        className="map-item"
                        onClick={() => openMap(map)}
                        style={{
                          padding: '10px 12px',
                          background: '#f8f9fa',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                      >
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                          {map.name}
                          {map.highRes && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '10px',
                              background: '#28a745',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '3px'
                            }}>
                              HD
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666' }}>
                          {map.description}
                        </div>
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                          Source: {map.source}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredCategories.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            {searchQuery ? 'No maps match your search' : 'No maps available'}
          </div>
        )}
      </div>

      {/* Map Modal */}
      {selectedMap && (
        <div
          className="map-modal-overlay"
          onClick={closeModal}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div
            className="map-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              maxWidth: '95vw',
              maxHeight: '95vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header with title and controls */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>{selectedMap.name}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>{selectedMap.description}</div>
              </div>

              {/* Zoom controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={zoomOut}
                  style={{
                    background: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Zoom out"
                >
                  −
                </button>
                <span style={{
                  fontSize: '13px',
                  color: '#666',
                  minWidth: '50px',
                  textAlign: 'center'
                }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  style={{
                    background: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Zoom in"
                >
                  +
                </button>
                <button
                  onClick={resetZoom}
                  style={{
                    background: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '0 10px',
                    height: '32px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  title="Reset zoom"
                >
                  Reset
                </button>
              </div>

              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {/* Image container with zoom/pan */}
            <div
              ref={imageContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              style={{
                overflow: 'hidden',
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                background: '#f5f5f5'
              }}
            >
              <img
                src={`/images/maps/${selectedMap.path}`}
                alt={selectedMap.name}
                draggable={false}
                style={{
                  maxWidth: zoom === 1 ? '100%' : 'none',
                  maxHeight: zoom === 1 ? 'calc(95vh - 120px)' : 'none',
                  width: zoom > 1 ? 'auto' : undefined,
                  height: zoom > 1 ? 'auto' : undefined,
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  userSelect: 'none'
                }}
              />
            </div>

            {/* Footer */}
            <div style={{
              padding: '8px 16px',
              borderTop: '1px solid #eee',
              fontSize: '12px',
              color: '#888',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Source: {selectedMap.source}</span>
              <span style={{ color: '#aaa' }}>Scroll to zoom • Drag to pan when zoomed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapsColumn
