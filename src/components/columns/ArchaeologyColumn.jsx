import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, formatChapterRef, normalizeVerseId } from '../../data/bibleBooks'

const categoryLabels = {
  sites: 'Excavated Sites',
  artifacts: 'Artifacts & Objects',
  manuscripts: 'Ancient Manuscripts',
  inscriptions: 'Inscriptions'
}

const categoryOrder = ['sites', 'artifacts', 'manuscripts', 'inscriptions']

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

function ArchaeologyColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(categoryOrder.map(c => [c, false]))
  )
  const [expandedItems, setExpandedItems] = useState({})

  const items = appData.archaeology || []

  const filteredItems = searchQuery
    ? items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.significance && item.significance.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.biblical_connection && item.biblical_connection.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items

  const groupedItems = {}
  for (const cat of categoryOrder) {
    groupedItems[cat] = filteredItems.filter(item => item.category === cat)
  }

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const toggleItem = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const handleRefClick = (ref, e) => {
    e.stopPropagation()
    const normalizedRef = normalizeVerseId(ref)
    goToVerse(normalizedRef)
  }

  const totalCount = items.length

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header archaeology-header" style={{ background: 'linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)', color: 'white' }}>
        <div className="catalogue-title" style={{ color: 'white' }}>Archaeology</div>
        <div className="catalogue-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>{totalCount} discoveries</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search archaeological evidence..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div className="catalogue-list">
        {categoryOrder.map(category => {
          const categoryItems = groupedItems[category]
          if (categoryItems.length === 0) return null

          return (
            <div key={category} className="archaeology-category">
              <div
                className="archaeology-category-header"
                onClick={() => toggleCategory(category)}
                style={{
                  padding: '12px 15px',
                  background: '#f5f0e8',
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
                  {categoryItems.length} {expandedCategories[category] ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategories[category] && (
                <div className="archaeology-category-items">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="archaeology-item">
                      <div
                        className="archaeology-item-header"
                        onClick={() => toggleItem(item.id)}
                        style={{
                          padding: '12px 15px',
                          borderBottom: '1px solid #ddd',
                          cursor: 'pointer',
                          background: expandedItems[item.id] ? '#efebe9' : 'white',
                          borderLeft: expandedItems[item.id] ? '4px solid #8d6e63' : '4px solid transparent'
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '4px', color: expandedItems[item.id] ? '#5d4037' : '#333' }}>
                          {item.name}
                          <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px', fontSize: '0.85em' }}>
                            {expandedItems[item.id] ? '▼' : '▶'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          {item.period && <span>{item.period}</span>}
                          {item.location && <span style={{ marginLeft: '8px' }}>• {item.location}</span>}
                        </div>
                      </div>

                      {expandedItems[item.id] && (
                        <div className="archaeology-details" style={{ padding: '12px 15px', background: '#fafaf8', borderBottom: '1px solid #ddd', borderLeft: '4px solid #8d6e63' }}>
                          {item.discovered && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px', color: '#5d4037' }}>Discovered</div>
                              <div style={{ fontSize: '0.9em', lineHeight: '1.5' }}>{item.discovered}</div>
                            </div>
                          )}

                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Description</div>
                            <div style={{ fontSize: '0.9em', lineHeight: '1.5' }}>{parseTextWithRefs(item.description, handleRefClick)}</div>
                          </div>

                          {item.significance && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px', color: '#1565c0' }}>Significance</div>
                              <div style={{ fontSize: '0.9em', lineHeight: '1.5', background: '#e3f2fd', padding: '10px', borderRadius: '4px', border: '1px solid #bbdefb' }}>
                                {parseTextWithRefs(item.significance, handleRefClick)}
                              </div>
                            </div>
                          )}

                          {item.key_finds && item.key_finds.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#6d4c41' }}>Key Finds</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#efebe9', padding: '10px', borderRadius: '4px', border: '1px solid #d7ccc8' }}>
                                {item.key_finds.map((find, i) => (
                                  <div key={i} style={{ marginBottom: i < item.key_finds.length - 1 ? '8px' : 0 }}>
                                    <strong>{find.name}:</strong> {parseTextWithRefs(find.details, handleRefClick)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.biblical_connection && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px', color: '#2e7d32' }}>Biblical Connection</div>
                              <div style={{ fontSize: '0.9em', lineHeight: '1.5', background: '#e8f5e9', padding: '10px', borderRadius: '4px', border: '1px solid #c8e6c9' }}>
                                {parseTextWithRefs(item.biblical_connection, handleRefClick)}
                              </div>
                            </div>
                          )}

                          {item.scholarly_notes && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px', color: '#666' }}>Scholarly Notes</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.5', fontStyle: 'italic', color: '#555' }}>
                                {parseTextWithRefs(item.scholarly_notes, handleRefClick)}
                              </div>
                            </div>
                          )}

                          {item.current_location && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Current Location</div>
                              <div style={{ fontSize: '0.85em', color: '#666' }}>{item.current_location}</div>
                            </div>
                          )}

                          {item.references && item.references.length > 0 && (
                            <div>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Key References</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {item.references.map((ref, i) => (
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

        {filteredItems.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No discoveries found
          </div>
        )}
      </div>
    </div>
  )
}

export default ArchaeologyColumn
