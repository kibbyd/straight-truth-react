import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId, formatChapterRange as formatChapterRangeBase } from '../../data/bibleBooks'

// Parse "Exo.35-40" -> "Exodus chs. 35-40"
const formatChapterRange = (rangeStr) => {
  const match = rangeStr.match(/^([^.]+)\.(\d+)-(\d+)$/)
  if (match) {
    return formatChapterRangeBase(match[1], parseInt(match[2]), parseInt(match[3]))
  }
  return rangeStr
}

const categoryConfig = {
  'Lifespans': { icon: '👴', subcategories: ['pre_flood', 'post_flood', 'patriarchs'] },
  'King Reigns': { icon: '👑', subcategories: ['united_kingdom', 'israel_northern', 'judah_southern'] },
  'Foreign Empires': { icon: '🏛️', subcategories: ['egypt', 'assyria', 'babylon', 'persia', 'greece', 'rome', 'herodian'] },
  'Major Periods': { icon: '📅', key: 'periods' },
  'OT Events': { icon: '📜', key: 'events.old_testament' },
  'NT Events': { icon: '✝️', key: 'events.new_testament' },
  'Journeys': { icon: '🚶', subcategories: ['abraham', 'jacob', 'exodus', 'paul_missionary'] },
  'Building Projects': { icon: '🏗️', key: 'building_projects' },
  'Prophetic Periods': { icon: '📢', key: 'prophetic_periods' },
  'Age Milestones': { icon: '🎂', subcategories: ['abraham', 'isaac', 'jacob', 'joseph', 'moses', 'david', 'jesus'] }
}

const subcategoryLabels = {
  pre_flood: 'Pre-Flood Patriarchs',
  post_flood: 'Post-Flood Patriarchs',
  patriarchs: 'Patriarchs & Leaders',
  united_kingdom: 'United Kingdom',
  israel_northern: 'Northern Kingdom (Israel)',
  judah_southern: 'Southern Kingdom (Judah)',
  egypt: 'Egypt',
  assyria: 'Assyria',
  babylon: 'Babylon',
  persia: 'Persia',
  greece: 'Greece',
  rome: 'Rome',
  herodian: 'Herodian Dynasty',
  abraham: "Abraham's Journey",
  jacob: "Jacob's Journey",
  exodus: 'Exodus Route',
  paul_missionary: "Paul's Missionary Journeys",
  isaac: 'Isaac',
  joseph: 'Joseph',
  moses: 'Moses',
  david: 'David',
  jesus: 'Jesus'
}

function TimelinesColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedSubcategory, setExpandedSubcategory] = useState(null)
  const [expandedItem, setExpandedItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const timelines = appData.timelines || {}

  // Helper to get nested data
  const getData = (path) => {
    if (!path) return null
    const parts = path.split('.')
    let result = timelines
    for (const part of parts) {
      if (!result) return null
      result = result[part]
    }
    return result
  }

  // Count items in a category
  const countItems = (category) => {
    const config = categoryConfig[category]
    if (!config) return 0

    if (config.key) {
      const data = getData(config.key)
      return Array.isArray(data) ? data.length : 0
    }

    if (config.subcategories) {
      let total = 0
      for (const sub of config.subcategories) {
        // Handle different data structures
        if (category === 'Lifespans') {
          const data = timelines.lifespans?.[sub]
          total += Array.isArray(data) ? data.length : 0
        } else if (category === 'King Reigns') {
          const data = timelines.reigns?.[sub]
          total += Array.isArray(data) ? data.length : 0
        } else if (category === 'Foreign Empires') {
          const data = timelines.reigns?.foreign_empires?.[sub]
          total += Array.isArray(data) ? data.length : 0
        } else if (category === 'Journeys') {
          const data = timelines.journeys?.[sub]
          total += Array.isArray(data) ? data.length : 0
        } else if (category === 'Age Milestones') {
          const data = timelines.age_milestones?.[sub]
          total += Array.isArray(data) ? data.length : 0
        }
      }
      return total
    }
    return 0
  }

  // Filter categories by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return Object.keys(categoryConfig)

    const query = searchQuery.toLowerCase()
    return Object.keys(categoryConfig).filter(cat => {
      // Check category name
      if (cat.toLowerCase().includes(query)) return true

      // Check items in category
      const config = categoryConfig[cat]
      if (config.key) {
        const items = getData(config.key) || []
        return items.some(item =>
          item.name?.toLowerCase().includes(query) ||
          item.notes?.toLowerCase().includes(query)
        )
      }
      return true // Include categories with subcategories for now
    })
  }, [searchQuery, timelines])

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

  // Format duration display
  const formatDuration = (item) => {
    const parts = []
    if (item.years) parts.push(`${item.years} years`)
    if (item.months) parts.push(`${item.months} months`)
    if (item.days) parts.push(`${item.days} days`)
    if (item.duration_years) parts.push(`${item.duration_years} years`)
    if (item.duration_months) parts.push(`${item.duration_months} months`)
    if (item.duration_days) parts.push(`${item.duration_days} days`)
    return parts.join(', ') || null
  }

  // Render a single timeline item
  const renderItem = (item, key) => {
    const isExpanded = expandedItem === key
    const duration = formatDuration(item)

    return (
      <div key={key} className="glossary-item">
        <div
          className="glossary-header"
          onClick={() => setExpandedItem(isExpanded ? null : key)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px 0' }}
        >
          <span style={{ color: '#888', marginRight: '6px', fontSize: '0.8em' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="glossary-term">{item.name}</span>
          {duration && (
            <span style={{ marginLeft: 'auto', color: '#666', fontSize: '0.9em' }}>
              {duration}
            </span>
          )}
        </div>

        {isExpanded && (
          <div className="glossary-content" style={{ paddingLeft: '20px', paddingBottom: '10px' }}>
            {/* Lifespan specific */}
            {item.age_at_son && (
              <div style={{ marginBottom: '6px', color: '#555' }}>
                Fathered {item.son} at {item.age_at_son}
              </div>
            )}

            {/* Reign specific */}
            {item.years_hebron && (
              <div style={{ marginBottom: '6px', color: '#555' }}>
                Hebron: {item.years_hebron} years, Jerusalem: {item.years_jerusalem} years
              </div>
            )}

            {/* Date estimate */}
            {item.date_estimate && (
              <div style={{ marginBottom: '6px', color: '#555' }}>
                Date: {item.date_estimate}
              </div>
            )}

            {/* Period specific */}
            {item.calculation && (
              <div style={{ marginBottom: '6px', color: '#555', fontSize: '0.9em' }}>
                Calculation: {item.calculation}
              </div>
            )}

            {/* Event specific */}
            {item.deliverer && (
              <div style={{ marginBottom: '6px', color: '#555' }}>
                Deliverer: {item.deliverer}
              </div>
            )}

            {/* Journey specific */}
            {item.from && item.to && (
              <div style={{ marginBottom: '6px', color: '#555' }}>
                {item.from} → {item.to}
              </div>
            )}
            {item.route && (
              <div style={{ marginBottom: '6px', color: '#555', fontSize: '0.9em' }}>
                Route: {item.route}
              </div>
            )}

            {/* Building specific */}
            {item.dimensions && (
              <div style={{ marginBottom: '6px', color: '#555' }}>
                Dimensions: {item.dimensions.length_cubits}×{item.dimensions.width_cubits}×{item.dimensions.height_cubits} cubits
              </div>
            )}

            {/* Prophetic specific */}
            {item.active_during && (
              <div style={{ marginBottom: '6px', color: '#555' }}>
                Active during: {Array.isArray(item.active_during) ? item.active_during.join(', ') : item.active_during}
              </div>
            )}
            {item.kingdom && (
              <div style={{ marginBottom: '6px', color: '#555' }}>
                Kingdom: {item.kingdom}
              </div>
            )}

            {/* Age milestone specific */}
            {item.event && (
              <div style={{ marginBottom: '6px', color: '#555' }}>
                {item.event}
              </div>
            )}
            {item.age !== undefined && (
              <div style={{ marginBottom: '6px', color: '#666' }}>
                Age: {item.age}
              </div>
            )}

            {/* Notes */}
            {item.notes && (
              <div style={{ marginBottom: '6px', color: '#777', fontStyle: 'italic', fontSize: '0.9em' }}>
                {item.notes}
              </div>
            )}

            {/* Chapter ranges (non-clickable) */}
            {item.chapter_range && (
              <div style={{ marginTop: '8px', color: '#555' }}>
                {formatChapterRange(item.chapter_range)}
              </div>
            )}

            {/* References */}
            {item.references && item.references.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                {item.references.map((ref, i) => {
                  const parsed = parseRef(ref)
                  return (
                    <span
                      key={i}
                      className="catalogue-ref-link"
                      onClick={(e) => {
                        e.stopPropagation()
                        goToVerse(parsed.verseId)
                      }}
                      style={{ marginRight: '8px' }}
                    >
                      {parsed.display}
                    </span>
                  )
                })}
              </div>
            )}
            {item.reference && (
              <div style={{ marginTop: '8px' }}>
                <span
                  className="catalogue-ref-link"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToVerse(parseRef(item.reference).verseId)
                  }}
                >
                  {parseRef(item.reference).display}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Render subcategory items
  const renderSubcategory = (category, subcategory) => {
    let items = []
    const subKey = `${category}-${subcategory}`

    if (category === 'Lifespans') {
      items = timelines.lifespans?.[subcategory] || []
    } else if (category === 'King Reigns') {
      items = timelines.reigns?.[subcategory] || []
    } else if (category === 'Foreign Empires') {
      items = timelines.reigns?.foreign_empires?.[subcategory] || []
    } else if (category === 'Journeys') {
      items = timelines.journeys?.[subcategory] || []
    } else if (category === 'Age Milestones') {
      items = timelines.age_milestones?.[subcategory] || []
    }

    if (!items.length) return null

    const isExpanded = expandedSubcategory === subKey

    return (
      <div key={subKey} style={{ marginLeft: '10px', marginBottom: '4px' }}>
        <div
          onClick={() => setExpandedSubcategory(isExpanded ? null : subKey)}
          style={{
            cursor: 'pointer',
            padding: '6px 8px',
            background: '#f8f8f8',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span style={{ color: '#888', marginRight: '6px', fontSize: '0.8em' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span style={{ fontWeight: 500 }}>{subcategoryLabels[subcategory] || subcategory}</span>
          <span style={{ marginLeft: 'auto', color: '#888', fontSize: '0.85em' }}>
            {items.length}
          </span>
        </div>

        {isExpanded && (
          <div style={{ paddingLeft: '10px', paddingTop: '4px' }}>
            {items.map((item, i) => renderItem(item, `${subKey}-${i}`))}
          </div>
        )}
      </div>
    )
  }

  // Render category content
  const renderCategoryContent = (category) => {
    const config = categoryConfig[category]

    // Direct key access (periods, building_projects, etc.)
    if (config.key) {
      const items = getData(config.key) || []
      return items.map((item, i) => renderItem(item, `${category}-${i}`))
    }

    // Subcategories
    if (config.subcategories) {
      return config.subcategories.map(sub => renderSubcategory(category, sub))
    }

    return null
  }

  // Total count
  const totalItems = useMemo(() => {
    let count = 0
    for (const cat of Object.keys(categoryConfig)) {
      count += countItems(cat)
    }
    return count
  }, [timelines])

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header glossary-header">
        <div className="catalogue-title">📅 Biblical Timelines</div>
        <div className="catalogue-subtitle">{totalItems} chronological entries</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search timelines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ overflow: 'auto', flex: 1 }}>
        {filteredCategories.map(category => {
          const config = categoryConfig[category]
          const count = countItems(category)
          const isCategoryExpanded = expandedCategory === category

          return (
            <div key={category} className="accordion-section">
              <div
                className={`accordion-header ${isCategoryExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedCategory(isCategoryExpanded ? null : category)}
              >
                <span className="accordion-icon">▶</span>
                <span className="accordion-title">{config.icon} {category}</span>
                <span className="accordion-count">{count}</span>
              </div>

              {isCategoryExpanded && (
                <div className="accordion-content">
                  {renderCategoryContent(category)}
                </div>
              )}
            </div>
          )
        })}

        {filteredCategories.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            {searchQuery ? 'No entries match your search' : 'No timeline data available'}
          </div>
        )}
      </div>
    </div>
  )
}

export default TimelinesColumn
