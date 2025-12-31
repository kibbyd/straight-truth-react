import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, formatChapterRef, normalizeVerseId } from '../../data/bibleBooks'

const categoryLabels = {
  israelites: "God's Covenant People",
  empires: 'Major Empires',
  neighbors: 'Neighboring Nations',
  canaan: 'Canaanite Nations',
  religious_groups: 'Religious & Political Groups',
  nt_era: 'New Testament Era',
  customs: 'Customs & Practices'
}

const categoryOrder = ['israelites', 'empires', 'canaan', 'neighbors', 'religious_groups', 'nt_era', 'customs']

// Convert snake_case to Title Case (e.g., "divine_mandate" -> "Divine Mandate")
const formatFieldName = (key) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Map common abbreviations to standard book codes
const bookAbbrevMap = {
  'Gen': 'Gen', 'Exo': 'Exo', 'Lev': 'Lev', 'Num': 'Num', 'Deu': 'Deu',
  'Jos': 'Jos', 'Jdg': 'Jdg', 'Rut': 'Rut', '1Sa': '1Sa', '2Sa': '2Sa',
  '1Ki': '1Ki', '2Ki': '2Ki', '1Ch': '1Ch', '2Ch': '2Ch', 'Ezr': 'Ezr',
  'Neh': 'Neh', 'Est': 'Est', 'Job': 'Job', 'Psa': 'Psa', 'Pro': 'Pro',
  'Ecc': 'Ecc', 'Sol': 'Sol', 'Isa': 'Isa', 'Jer': 'Jer', 'Lam': 'Lam',
  'Eze': 'Eze', 'Dan': 'Dan', 'Hos': 'Hos', 'Joe': 'Joe', 'Amo': 'Amo',
  'Oba': 'Oba', 'Jon': 'Jon', 'Mic': 'Mic', 'Nah': 'Nah', 'Hab': 'Hab',
  'Zep': 'Zep', 'Hag': 'Hag', 'Zec': 'Zec', 'Mal': 'Mal',
  'Mat': 'Mat', 'Mar': 'Mar', 'Luk': 'Luk', 'Joh': 'Joh', 'Act': 'Act',
  'Rom': 'Rom', '1Co': '1Co', '2Co': '2Co', 'Gal': 'Gal', 'Eph': 'Eph',
  'Php': 'Php', 'Col': 'Col', '1Th': '1Th', '2Th': '2Th', '1Ti': '1Ti',
  '2Ti': '2Ti', 'Tit': 'Tit', 'Phm': 'Phm', 'Heb': 'Heb', 'Jam': 'Jam',
  '1Pe': '1Pe', '2Pe': '2Pe', '1Jo': '1Jo', '2Jo': '2Jo', '3Jo': '3Jo',
  'Jud': 'Jud', 'Rev': 'Rev',
  // Long form mappings
  'Genesis': 'Gen', 'Exodus': 'Exo', 'Leviticus': 'Lev', 'Numbers': 'Num',
  'Deuteronomy': 'Deu', 'Joshua': 'Jos', 'Judges': 'Jdg', 'Ruth': 'Rut',
  'Samuel': 'Sa', 'Kings': 'Ki', 'Chronicles': 'Ch', 'Ezra': 'Ezr',
  'Nehemiah': 'Neh', 'Esther': 'Est', 'Psalms': 'Psa', 'Psalm': 'Psa',
  'Proverbs': 'Pro', 'Ecclesiastes': 'Ecc', 'Isaiah': 'Isa', 'Jeremiah': 'Jer',
  'Lamentations': 'Lam', 'Ezekiel': 'Eze', 'Daniel': 'Dan', 'Hosea': 'Hos',
  'Joel': 'Joe', 'Amos': 'Amo', 'Obadiah': 'Oba', 'Jonah': 'Jon', 'Micah': 'Mic',
  'Nahum': 'Nah', 'Habakkuk': 'Hab', 'Zephaniah': 'Zep', 'Haggai': 'Hag',
  'Zechariah': 'Zec', 'Malachi': 'Mal', 'Matthew': 'Mat', 'Mark': 'Mar',
  'Luke': 'Luk', 'John': 'Joh', 'Acts': 'Act', 'Romans': 'Rom',
  'Corinthians': 'Co', 'Galatians': 'Gal', 'Ephesians': 'Eph', 'Philippians': 'Php',
  'Colossians': 'Col', 'Thessalonians': 'Th', 'Timothy': 'Ti', 'Titus': 'Tit',
  'Philemon': 'Phm', 'Hebrews': 'Heb', 'James': 'Jam', 'Peter': 'Pe',
  'Jude': 'Jud', 'Revelation': 'Rev'
}

// Parse text and convert inline references like "(Dan 4)" to clickable links
const parseTextWithRefs = (text, onRefClick) => {
  if (!text) return null

  // Match patterns like (Gen 23), (2Ki 19:37), (Dan 4), (Acts 17:18)
  const refPattern = /\((\d?)([A-Za-z]+)\s+(\d+)(?::(\d+(?:-\d+)?))?\)/g

  const parts = []
  let lastIndex = 0
  let match

  while ((match = refPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    const [fullMatch, bookNum, bookName, chapter, verse] = match
    const bookCode = bookNum ? `${bookNum}${bookAbbrevMap[bookName] || bookName}` : (bookAbbrevMap[bookName] || bookName)

    // Build verse ID - if no verse specified, use verse 1 for navigation
    const verseId = verse ? `${bookCode}.${chapter}.${verse}` : `${bookCode}.${chapter}.1`

    // Display: use chapter format if no verse, verse format if verse exists
    const displayText = verse
      ? formatVerseRef(`${bookCode}.${chapter}.${verse}`)
      : formatChapterRef(bookCode, chapter)

    parts.push(
      <span
        key={match.index}
        className="catalogue-ref-link"
        onClick={(e) => onRefClick(verseId, e)}
        style={{ color: '#0066cc', cursor: 'pointer' }}
      >
        ({displayText})
      </span>
    )

    lastIndex = match.index + fullMatch.length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

function PeoplesCulturesColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(categoryOrder.map(c => [c, false]))
  )
  const [expandedPeople, setExpandedPeople] = useState({})

  const peoples = appData.peoplesCultures || []

  // Filter by search
  const filteredPeoples = searchQuery
    ? peoples.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.region.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : peoples

  // Group by category
  const groupedPeoples = {}
  for (const cat of categoryOrder) {
    groupedPeoples[cat] = filteredPeoples.filter(p => p.category === cat)
  }

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const togglePeople = (peopleId) => {
    setExpandedPeople(prev => ({
      ...prev,
      [peopleId]: !prev[peopleId]
    }))
  }

  const handleRefClick = (ref, e) => {
    e.stopPropagation()
    const normalizedRef = normalizeVerseId(ref)
    goToVerse(normalizedRef)
  }

  const totalCount = peoples.length

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header peoples-header">
        <div className="catalogue-title">Peoples & Cultures</div>
        <div className="catalogue-subtitle">{totalCount} biblical peoples</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search peoples..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div className="catalogue-list">
        {categoryOrder.map(category => {
          const categoryPeoples = groupedPeoples[category]
          if (categoryPeoples.length === 0) return null

          return (
            <div key={category} className="peoples-category">
              <div
                className="peoples-category-header"
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
                  {categoryPeoples.length} {expandedCategories[category] ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategories[category] && (
                <div className="peoples-category-items">
                  {categoryPeoples.map((people) => (
                    <div key={people.id} className="people-item">
                      <div
                        className="people-header"
                        onClick={() => togglePeople(people.id)}
                        style={{
                          padding: '12px 15px',
                          borderBottom: '1px solid #ddd',
                          cursor: 'pointer',
                          background: expandedPeople[people.id] ? '#e3f2fd' : 'white',
                          borderLeft: expandedPeople[people.id] ? '4px solid #1976d2' : '4px solid transparent'
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '4px', color: expandedPeople[people.id] ? '#1565c0' : '#333' }}>
                          {people.name}
                          <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px', fontSize: '0.85em' }}>
                            {expandedPeople[people.id] ? '▼' : '▶'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          {people.region} • {people.period}
                        </div>
                      </div>

                      {expandedPeople[people.id] && (
                        <div className="people-details" style={{ padding: '12px 15px', background: '#fafafa', borderBottom: '1px solid #ddd', borderLeft: '4px solid #1976d2' }}>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Description</div>
                            <div style={{ fontSize: '0.9em', lineHeight: '1.5' }}>{parseTextWithRefs(people.description, handleRefClick)}</div>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Biblical Role</div>
                            <div style={{ fontSize: '0.9em', lineHeight: '1.5' }}>{parseTextWithRefs(people.biblical_role, handleRefClick)}</div>
                          </div>

                          {people.worldview && Object.keys(people.worldview).length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#5c4033' }}>Worldview & Beliefs</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#fff8f0', padding: '10px', borderRadius: '4px', border: '1px solid #e8d8c8' }}>
                                {Object.entries(people.worldview).map(([key, value]) => (
                                  <div key={key} style={{ marginBottom: '8px' }}><strong>{formatFieldName(key)}:</strong> {parseTextWithRefs(value, handleRefClick)}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {people.social_structure && Object.keys(people.social_structure).length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#2e5a4c' }}>Social Structure</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#f0f8f5', padding: '10px', borderRadius: '4px', border: '1px solid #d0e8d8' }}>
                                {Object.entries(people.social_structure).map(([key, value]) => (
                                  <div key={key} style={{ marginBottom: '8px' }}><strong>{formatFieldName(key)}:</strong> {parseTextWithRefs(value, handleRefClick)}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {people.customs && Object.keys(people.customs).length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#4a3c6e' }}>Customs & Practices</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#f8f5ff', padding: '10px', borderRadius: '4px', border: '1px solid #e0d8f0' }}>
                                {Object.entries(people.customs).map(([key, value]) => (
                                  <div key={key} style={{ marginBottom: '8px' }}><strong>{formatFieldName(key)}:</strong> {parseTextWithRefs(value, handleRefClick)}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {people.values && Object.keys(people.values).length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#6e4a3c' }}>Core Values</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#fff5f0', padding: '10px', borderRadius: '4px', border: '1px solid #f0d8d0' }}>
                                {Object.entries(people.values).map(([key, value]) => (
                                  <div key={key} style={{ marginBottom: '8px' }}><strong>{formatFieldName(key)}:</strong> {parseTextWithRefs(value, handleRefClick)}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {people.sub_groups && people.sub_groups.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Sub-Groups</div>
                              {people.sub_groups.map((sg, i) => (
                                <div key={i} style={{ fontSize: '0.85em', marginBottom: '4px', paddingLeft: '8px', borderLeft: '2px solid #ddd' }}>
                                  <strong>{sg.name}</strong> - {sg.location}
                                  {sg.note && <div style={{ color: '#666', fontStyle: 'italic' }}>{parseTextWithRefs(sg.note, handleRefClick)}</div>}
                                </div>
                              ))}
                            </div>
                          )}

                          {people.religion && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Religion</div>
                              <div style={{ fontSize: '0.9em', lineHeight: '1.5' }}>{parseTextWithRefs(people.religion, handleRefClick)}</div>
                            </div>
                          )}

                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Key Interactions</div>
                            {people.key_interactions.map((interaction, i) => (
                              <div key={i} style={{ fontSize: '0.85em', marginBottom: '6px', display: 'flex', gap: '8px' }}>
                                <span
                                  className="catalogue-ref-link"
                                  onClick={(e) => handleRefClick(interaction.reference, e)}
                                  style={{
                                    cursor: 'pointer',
                                    color: '#0066cc',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                  }}
                                >
                                  {formatVerseRef(interaction.reference)}
                                </span>
                                <span style={{ color: '#333' }}>{parseTextWithRefs(interaction.summary, handleRefClick)}</span>
                              </div>
                            ))}
                          </div>

                          {people.key_figures && people.key_figures.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Key Figures</div>
                              {people.key_figures.map((figure, i) => (
                                <div key={i} style={{ fontSize: '0.85em', marginBottom: '6px', display: 'flex', gap: '8px' }}>
                                  {figure.reference ? (
                                    <span
                                      className="catalogue-ref-link"
                                      onClick={(e) => handleRefClick(figure.reference, e)}
                                      style={{ cursor: 'pointer', color: '#0066cc', whiteSpace: 'nowrap', flexShrink: 0 }}
                                    >
                                      {formatVerseRef(figure.reference)}
                                    </span>
                                  ) : (
                                    <span style={{ color: '#999', whiteSpace: 'nowrap', flexShrink: 0 }}>—</span>
                                  )}
                                  <span>
                                    <strong>{figure.name}</strong>
                                    {figure.note && <span style={{ color: '#555' }}> — {parseTextWithRefs(figure.note, handleRefClick)}</span>}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Key References</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {people.references.map((ref, i) => (
                                <span
                                  key={i}
                                  className="catalogue-ref-link"
                                  onClick={(e) => handleRefClick(ref, e)}
                                  style={{
                                    fontSize: '0.85em',
                                    padding: '2px 6px',
                                    background: '#f0f0f0',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    color: '#0066cc'
                                  }}
                                >
                                  {formatVerseRef(ref)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {filteredPeoples.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No peoples found
          </div>
        )}
      </div>
    </div>
  )
}

export default PeoplesCulturesColumn
