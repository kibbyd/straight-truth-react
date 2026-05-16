import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

function FamilyTreesColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [expandedLine, setExpandedLine] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const persons = appData.familyTrees?.persons || []
  const lines = appData.familyTrees?.lines || {}

  // Create lookup map for person by ID
  const personMap = useMemo(() => {
    const map = {}
    persons.forEach(p => { map[p.id] = p })
    return map
  }, [persons])

  // Group persons by line
  const groupedByLine = useMemo(() => {
    const groups = {}
    persons.forEach(p => {
      const line = p.line || 'other'
      if (!groups[line]) groups[line] = []
      groups[line].push(p)
    })
    return groups
  }, [persons])

  // Line display order
  const lineOrder = ['adam-jesus', 'adam-jesus-luke', 'levi', 'israel', 'joseph', 'judah', 'ishmael', 'abraham-keturah', 'esau', 'shem', 'ham', 'japheth', 'cain', 'other']

  // Filter and get available lines
  const availableLines = useMemo(() => {
    if (!searchQuery) {
      return lineOrder.filter(lineId => groupedByLine[lineId]?.length > 0)
    }

    const query = searchQuery.toLowerCase()
    const filteredLines = []

    lineOrder.forEach(lineId => {
      const linePersons = groupedByLine[lineId] || []
      const matchingPersons = linePersons.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.meaning?.toLowerCase().includes(query)
      )
      if (matchingPersons.length > 0) {
        filteredLines.push(lineId)
      }
    })

    return filteredLines
  }, [groupedByLine, searchQuery])

  // Get filtered persons for a line
  const getFilteredPersons = (lineId) => {
    const linePersons = groupedByLine[lineId] || []
    if (!searchQuery) return linePersons

    const query = searchQuery.toLowerCase()
    return linePersons.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.meaning?.toLowerCase().includes(query)
    )
  }

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

  // Get person name from ID
  const getPersonName = (id) => personMap[id]?.name || id

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header" style={{ background: 'linear-gradient(to bottom, #e8f5e9, #c8e6c9)', borderColor: '#a5d6a7' }}>
        <div className="catalogue-title">🌳 Biblical Family Trees</div>
        <div className="catalogue-subtitle">{persons.length} people · Click a line to expand</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ overflow: 'auto', flex: 1 }}>
        {availableLines.map(lineId => {
          const lineInfo = lines[lineId] || { name: lineId, color: '#666' }
          const linePersons = getFilteredPersons(lineId)
          const isExpanded = expandedLine === lineId

          return (
            <div key={lineId} className="accordion-section">
              <div
                className={`accordion-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedLine(isExpanded ? null : lineId)}
                style={{ borderLeft: `4px solid ${lineInfo.color}` }}
              >
                <span className="accordion-icon">▶</span>
                <span className="accordion-title">{lineInfo.name}</span>
                <span className="accordion-count">{linePersons.length}</span>
              </div>

              {isExpanded && (
                <div className="accordion-content">
                  {linePersons.map((person, index) => {
                    const primaryRef = person.references?.[0] || ''
                    const fatherName = person.father ? getPersonName(person.father) : null
                    const lifespanText = person.lifespan?.years ? `(${person.lifespan.years} yrs)` : ''

                    return (
                      <div
                        key={person.id || index}
                        className="catalogue-item"
                        onClick={() => primaryRef && goToVerse(parseRef(primaryRef).verseId)}
                        style={{ cursor: primaryRef ? 'pointer' : 'default' }}
                      >
                        <div className="catalogue-item-name">
                          {person.name}
                          {lifespanText && (
                            <span style={{ color: '#888', fontWeight: 'normal', marginLeft: '6px' }}>
                              {lifespanText}
                            </span>
                          )}
                        </div>
                        {person.meaning && (
                          <div className="catalogue-item-meaning">"{person.meaning}"</div>
                        )}
                        {fatherName && (
                          <div className="catalogue-item-details">Son of {fatherName}</div>
                        )}
                        {person.notes && (
                          <div className="catalogue-item-context">{person.notes}</div>
                        )}
                        {person.references && person.references.length > 0 && (
                          <div className="catalogue-refs">
                            {person.references.slice(0, 3).map((ref, i) => {
                              const parsed = parseRef(ref)
                              return (
                                <span
                                  key={i}
                                  className="catalogue-ref-link"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    goToVerse(parsed.verseId)
                                  }}
                                >
                                  {parsed.display}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {availableLines.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            {searchQuery ? 'No persons match your search' : 'No family tree data available'}
          </div>
        )}
      </div>
    </div>
  )
}

export default FamilyTreesColumn
