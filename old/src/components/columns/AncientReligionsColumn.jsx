import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, formatChapterRef, normalizeVerseId } from '../../data/bibleBooks'

const categoryLabels = {
  mesopotamian: 'Mesopotamian Religions',
  egyptian: 'Egyptian Religion',
  canaanite: 'Canaanite Religions',
  neighbor: "Israel's Neighbors",
  greco_roman: 'Greek & Roman Religions',
  persian: 'Persian Religion'
}

const categoryOrder = ['mesopotamian', 'egyptian', 'canaanite', 'neighbor', 'greco_roman', 'persian']

const formatFieldName = (key) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

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

const parseTextWithRefs = (text, onRefClick) => {
  if (!text) return null

  const refPattern = /\((\d?)([A-Za-z]+)\s+(\d+)(?::(\d+(?:-\d+)?))?\)/g

  const parts = []
  let lastIndex = 0
  let match

  while ((match = refPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    const [fullMatch, bookNum, bookName, chapter, verse] = match
    const bookCode = bookNum ? `${bookNum}${bookAbbrevMap[bookName] || bookName}` : (bookAbbrevMap[bookName] || bookName)
    const verseId = verse ? `${bookCode}.${chapter}.${verse}` : `${bookCode}.${chapter}.1`
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

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

function AncientReligionsColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(categoryOrder.map(c => [c, false]))
  )
  const [expandedReligions, setExpandedReligions] = useState({})

  const religions = appData.ancientReligions || []

  const filteredReligions = searchQuery
    ? religions.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.pantheon?.some(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : religions

  const groupedReligions = {}
  for (const cat of categoryOrder) {
    groupedReligions[cat] = filteredReligions.filter(r => r.category === cat)
  }

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const toggleReligion = (religionId) => {
    setExpandedReligions(prev => ({
      ...prev,
      [religionId]: !prev[religionId]
    }))
  }

  const handleRefClick = (ref, e) => {
    e.stopPropagation()
    const normalizedRef = normalizeVerseId(ref)
    goToVerse(normalizedRef)
  }

  const totalCount = religions.length

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header religions-header">
        <div className="catalogue-title">Ancient Religions</div>
        <div className="catalogue-subtitle">{totalCount} religions</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search religions or gods..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div className="catalogue-list">
        {categoryOrder.map(category => {
          const categoryReligions = groupedReligions[category]
          if (categoryReligions.length === 0) return null

          return (
            <div key={category} className="religions-category">
              <div
                className="religions-category-header"
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
                  {categoryReligions.length} {expandedCategories[category] ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategories[category] && (
                <div className="religions-category-items">
                  {categoryReligions.map((religion) => (
                    <div key={religion.id} className="religion-item">
                      <div
                        className="religion-header"
                        onClick={() => toggleReligion(religion.id)}
                        style={{
                          padding: '12px 15px',
                          borderBottom: '1px solid #ddd',
                          cursor: 'pointer',
                          background: expandedReligions[religion.id] ? '#e8eaf6' : 'white',
                          borderLeft: expandedReligions[religion.id] ? '4px solid #5c6bc0' : '4px solid transparent'
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '4px', color: expandedReligions[religion.id] ? '#3949ab' : '#333' }}>
                          {religion.name}
                          <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px', fontSize: '0.85em' }}>
                            {expandedReligions[religion.id] ? '▼' : '▶'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          {religion.region} • {religion.period}
                        </div>
                      </div>

                      {expandedReligions[religion.id] && (
                        <div className="religion-details" style={{ padding: '12px 15px', background: '#fafafa', borderBottom: '1px solid #ddd', borderLeft: '4px solid #5c6bc0' }}>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Description</div>
                            <div style={{ fontSize: '0.9em', lineHeight: '1.5' }}>{parseTextWithRefs(religion.description, handleRefClick)}</div>
                          </div>

                          {religion.origins && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#5e35b1' }}>Origins</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#f5f0ff', padding: '10px', borderRadius: '4px', border: '1px solid #e0d0f0' }}>
                                {religion.origins.mythology && (
                                  <div style={{ marginBottom: '8px' }}><strong>Mythology:</strong> {parseTextWithRefs(religion.origins.mythology, handleRefClick)}</div>
                                )}
                                {religion.origins.historical && (
                                  <div><strong>Historical Development:</strong> {parseTextWithRefs(religion.origins.historical, handleRefClick)}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {religion.pantheon && religion.pantheon.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#c62828' }}>Pantheon ({religion.pantheon.length} deities)</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#fff5f5', padding: '10px', borderRadius: '4px', border: '1px solid #f0d0d0' }}>
                                {religion.pantheon.map((god, i) => (
                                  <div key={i} style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: i < religion.pantheon.length - 1 ? '1px solid #f0d0d0' : 'none' }}>
                                    <div style={{ fontWeight: '600', color: '#b71c1c' }}>{god.name}</div>
                                    <div><strong>Role:</strong> {god.role}</div>
                                    {god.symbol && <div><strong>Symbol:</strong> {god.symbol}</div>}
                                    {god.biblical_refs && god.biblical_refs.length > 0 && (
                                      <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                                        <strong>In Scripture:</strong>
                                        {god.biblical_refs.map((ref, j) => (
                                          <span
                                            key={j}
                                            className="catalogue-ref-link"
                                            onClick={(e) => handleRefClick(ref, e)}
                                            style={{
                                              fontSize: '0.9em',
                                              padding: '1px 4px',
                                              background: '#ffe0e0',
                                              borderRadius: '3px',
                                              cursor: 'pointer',
                                              color: '#0066cc'
                                            }}
                                          >
                                            {formatVerseRef(ref)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {religion.practices && Object.keys(religion.practices).length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#1565c0' }}>Practices</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#f0f5ff', padding: '10px', borderRadius: '4px', border: '1px solid #d0e0f0' }}>
                                {Object.entries(religion.practices).map(([key, value]) => (
                                  <div key={key} style={{ marginBottom: '8px' }}><strong>{formatFieldName(key)}:</strong> {parseTextWithRefs(value, handleRefClick)}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {religion.worldview && Object.keys(religion.worldview).length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#2e7d32' }}>Worldview</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#f0fff0', padding: '10px', borderRadius: '4px', border: '1px solid #d0f0d0' }}>
                                {Object.entries(religion.worldview).map(([key, value]) => (
                                  <div key={key} style={{ marginBottom: '8px' }}><strong>{formatFieldName(key)}:</strong> {parseTextWithRefs(value, handleRefClick)}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {religion.biblical_interactions && religion.biblical_interactions.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Biblical Interactions</div>
                              {religion.biblical_interactions.map((interaction, i) => (
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
                                  <span>
                                    <strong>{interaction.event}:</strong> {parseTextWithRefs(interaction.summary, handleRefClick)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {religion.archaeological_evidence && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px', color: '#6d4c41' }}>Archaeological Evidence</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.5', background: '#fff8f0', padding: '10px', borderRadius: '4px', border: '1px solid #e8d8c8' }}>
                                {parseTextWithRefs(religion.archaeological_evidence, handleRefClick)}
                              </div>
                            </div>
                          )}

                          {religion.references && religion.references.length > 0 && (
                            <div>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Key References</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {religion.references.map((ref, i) => (
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
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {filteredReligions.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No religions found
          </div>
        )}
      </div>
    </div>
  )
}

export default AncientReligionsColumn
