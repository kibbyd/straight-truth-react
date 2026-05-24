import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

const categoryLabels = {
  identical: 'Identical Passages',
  samuel_chronicles: 'Samuel / Chronicles',
  kings_chronicles: 'Kings / Chronicles',
  synoptic: 'Synoptic Gospels'
}

const categoryOrder = ['identical', 'samuel_chronicles', 'kings_chronicles', 'synoptic']

function ParallelPassagesColumn({ columnId, data }) {
  const { data: appData, compareMultiplePassages } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(categoryOrder.map(c => [c, false]))
  )

  const parallelSets = appData.parallelPassages || []

  // Filter by search
  const filteredSets = searchQuery
    ? parallelSets.filter(set =>
        set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        set.passages.some(p =>
          p.book.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.reference.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : parallelSets

  // Group by category
  const groupedSets = {}
  for (const cat of categoryOrder) {
    groupedSets[cat] = filteredSets.filter(s => s.category === cat)
  }

  // Parse verse reference - preserve ranges for highlighting
  const parseRef = (ref) => {
    // Format: "Mat.14.13-21" or "Gen.1.1"
    // Keep full range for highlighting, normalize book abbreviation
    const match = ref.match(/^([^.]+)\.(.+)$/)
    if (match) {
      const book = match[1]
      const rest = match[2] // "14.13-21" or "1.1"
      const normalizedBook = normalizeVerseId(`${book}.1.1`).split('.')[0]
      return {
        display: formatVerseRef(ref),
        verseId: `${normalizedBook}.${rest}`
      }
    }
    return { display: ref, verseId: ref }
  }

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const handleSetClick = (set) => {
    if (set.passages.length >= 2) {
      const refs = set.passages.map(p => parseRef(p.reference).verseId)
      compareMultiplePassages(refs)
    }
  }

  const totalCount = parallelSets.length

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header parallels-header">
        <div className="catalogue-title">Parallel Passages</div>
        <div className="catalogue-subtitle">{totalCount} parallel passage sets</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search parallels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div className="catalogue-list">
        {categoryOrder.map(category => {
          const sets = groupedSets[category]
          if (sets.length === 0) return null

          return (
            <div key={category} className="parallel-category">
              <div
                className="parallel-category-header"
                onClick={() => toggleCategory(category)}
                style={{
                  padding: '12px 15px',
                  background: '#f5f5f5',
                  borderBottom: '1px solid #ddd',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 'bold'
                }}
              >
                <span>{categoryLabels[category]}</span>
                <span style={{ color: '#666', fontSize: '0.9em' }}>
                  {sets.length} {expandedCategories[category] ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategories[category] && (
                <div className="parallel-category-items">
                  {sets.map((set) => (
                    <div
                      key={set.id}
                      className="parallel-item"
                      onClick={() => handleSetClick(set)}
                      style={{
                        padding: '10px 15px',
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontWeight: '500', marginBottom: '6px' }}>
                        {set.name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {set.passages.map((passage, i) => {
                          const parsed = parseRef(passage.reference)
                          return (
                            <span
                              key={i}
                              className="catalogue-ref-link"
                              style={{
                                fontSize: '0.9em',
                                padding: '2px 6px',
                                background: '#e8f4f8',
                                borderRadius: '3px'
                              }}
                            >
                              {parsed.display}
                            </span>
                          )
                        })}
                      </div>
                      {set.note && (
                        <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px', fontStyle: 'italic' }}>
                          {set.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {filteredSets.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No parallel passages found
          </div>
        )}
      </div>
    </div>
  )
}

export default ParallelPassagesColumn
