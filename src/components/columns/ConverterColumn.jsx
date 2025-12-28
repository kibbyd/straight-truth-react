import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef } from '../../data/bibleBooks'

function ConverterColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [inputValue, setInputValue] = useState(1)
  const [selectedMeasure, setSelectedMeasure] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)

  const measuresData = appData.measures || { categories: {}, measures: [] }
  const categories = measuresData.categories || {}
  const measures = measuresData.measures || []

  // Group measures by category
  const groupedMeasures = useMemo(() => {
    const groups = {}
    measures.forEach(m => {
      const cat = m.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(m)
    })
    return groups
  }, [measures])

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

  // Calculate conversion
  const conversion = useMemo(() => {
    if (!selectedMeasure || !inputValue) return null

    const value = parseFloat(inputValue)
    if (isNaN(value)) return null

    return {
      metric: value * selectedMeasure.metric,
      metricUnit: selectedMeasure.metric_unit,
      imperial: value * selectedMeasure.imperial,
      imperialUnit: selectedMeasure.imperial_unit
    }
  }, [selectedMeasure, inputValue])

  const categoryList = Object.keys(categories)

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header converter-header">
        <div className="catalogue-title">📏 Measures & Weights</div>
        <div className="catalogue-subtitle">Biblical unit converter</div>
      </div>

      {selectedMeasure && (
        <div className="converter-input-section">
          <div style={{ marginBottom: '8px', fontWeight: 600 }}>
            Convert: {selectedMeasure.name}
          </div>
          <div className="converter-row">
            <input
              type="number"
              className="converter-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              min="0"
              step="any"
            />
            <span style={{ padding: '8px' }}>{selectedMeasure.name}(s)</span>
          </div>

          {conversion && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span className="converter-result-value">{conversion.metric.toFixed(2)}</span>{' '}
                <span className="converter-result-unit">{conversion.metricUnit}</span>
              </div>
              <div>
                <span className="converter-result-value">{conversion.imperial.toFixed(2)}</span>{' '}
                <span className="converter-result-unit">{conversion.imperialUnit}</span>
              </div>
            </div>
          )}

          {selectedMeasure.notes && (
            <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
              {selectedMeasure.notes}
            </div>
          )}

          {selectedMeasure.references && selectedMeasure.references.length > 0 && (
            <div className="catalogue-refs" style={{ marginTop: '10px' }}>
              {selectedMeasure.references.map((ref, i) => {
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
          )}

          <button
            onClick={() => setSelectedMeasure(null)}
            style={{
              marginTop: '12px',
              padding: '6px 12px',
              cursor: 'pointer',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            ← Choose another unit
          </button>
        </div>
      )}

      <div style={{ overflow: 'auto', flex: 1 }}>
        {categoryList.map(catKey => {
          const cat = categories[catKey]
          const catMeasures = groupedMeasures[catKey] || []

          if (catMeasures.length === 0) return null

          return (
            <div key={catKey} className="accordion-section">
              <div
                className={`accordion-header ${activeCategory === catKey ? 'expanded' : ''}`}
                onClick={() => setActiveCategory(activeCategory === catKey ? null : catKey)}
              >
                <span className="accordion-icon">▶</span>
                <span style={{ marginRight: '8px' }}>{cat?.icon || '📐'}</span>
                <span className="accordion-title">{cat?.name || catKey}</span>
                <span className="accordion-count">{catMeasures.length}</span>
              </div>

              {activeCategory === catKey && (
                <div className="accordion-content" style={{ maxHeight: 'none' }}>
                  {catMeasures.map((measure, index) => (
                    <div
                      key={index}
                      className="catalogue-item"
                      onClick={() => setSelectedMeasure(measure)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="catalogue-item-name">
                        {measure.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                        {measure.hebrew && <span style={{ color: '#1565c0' }}>{measure.hebrew} </span>}
                        {measure.greek && <span style={{ color: '#7b1fa2' }}>{measure.greek} </span>}
                        <span>= {measure.metric} {measure.metric_unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {categoryList.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No measures data available
          </div>
        )}
      </div>
    </div>
  )
}

export default ConverterColumn
