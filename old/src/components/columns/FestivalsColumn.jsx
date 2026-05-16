import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

function FestivalsColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()

  const festivalData = appData.festivals || { calendar: {}, festivals: [], postExilic: [] }
  const months = festivalData.calendar?.months || []
  const festivals = festivalData.festivals || []
  const postExilic = festivalData.postExilic || []

  const totalFestivals = festivals.length + postExilic.length

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

  // Render a festival item
  const renderFestival = (festival, index) => {
    const primaryRef = festival.references?.[0]
    const primaryParsed = primaryRef ? parseRef(primaryRef) : null

    return (
      <div
        key={index}
        className="catalogue-item festival-item"
        onClick={() => primaryParsed && goToVerse(primaryParsed.verseId)}
        style={{ cursor: primaryRef ? 'pointer' : 'default' }}
      >
        <div className="catalogue-item-name">
          {festival.name}
          {festival.hebrew && (
            <span className="festival-hebrew" style={{ marginLeft: '8px', color: '#666' }}>
              {festival.hebrew}
            </span>
          )}
        </div>
        <div className="festival-meta" style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#666', margin: '4px 0' }}>
          {festival.date && <span>📅 {festival.date}</span>}
          {festival.duration && <span>{festival.duration}</span>}
          {festival.type && <span style={{ color: '#888' }}>{festival.type}</span>}
        </div>
        {festival.purpose && (
          <div className="festival-purpose" style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>
            {festival.purpose}
          </div>
        )}
        {festival.observances && festival.observances.length > 0 && (
          <ul className="festival-observances" style={{ margin: '4px 0 8px 20px', fontSize: '13px', color: '#555' }}>
            {festival.observances.map((obs, i) => (
              <li key={i}>{obs}</li>
            ))}
          </ul>
        )}
        {festival.note && (
          <div className="festival-note" style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', marginBottom: '8px' }}>
            {festival.note}
          </div>
        )}
        <div className="catalogue-refs">
          {(festival.references || []).map((ref, i) => {
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
      </div>
    )
  }

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header festivals-header">
        <div className="catalogue-title">📅 Jewish Calendar & Festivals</div>
        <div className="catalogue-subtitle">{totalFestivals} sacred times recorded in Scripture</div>
      </div>

      <div className="catalogue-list" style={{ overflow: 'auto', flex: 1 }}>
        {/* Calendar months section */}
        {months.length > 0 && (
          <>
            <div className="catalogue-category">
              <div className="catalogue-category-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: '#f5f5f5', fontWeight: 600 }}>
                <span className="catalogue-category-name">Hebrew Calendar Months</span>
                <span className="catalogue-category-count" style={{ color: '#888' }}>(12 months)</span>
              </div>
            </div>
            <div
              className="calendar-months-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                padding: '12px 15px',
                background: '#fafafa'
              }}
            >
              {months.map((month, index) => (
                <div
                  key={index}
                  className="calendar-month"
                  style={{
                    padding: '8px 10px',
                    background: '#fff',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0',
                    textAlign: 'center'
                  }}
                >
                  <div className="month-number" style={{ fontWeight: 600, color: '#1976d2', fontSize: '14px' }}>
                    {month.number}
                  </div>
                  <div className="month-hebrew" style={{ fontSize: '13px', fontWeight: 500 }}>
                    {month.hebrew}
                  </div>
                  <div className="month-modern" style={{ fontSize: '11px', color: '#888' }}>
                    {month.modern}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Torah-Commanded Observances */}
        {festivals.length > 0 && (
          <>
            <div className="catalogue-category">
              <div className="catalogue-category-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: '#f5f5f5', fontWeight: 600, marginTop: '8px' }}>
                <span className="catalogue-category-name">Torah-Commanded Observances</span>
                <span className="catalogue-category-count" style={{ color: '#888' }}>({festivals.length})</span>
              </div>
            </div>
            {festivals.map((festival, index) => renderFestival(festival, index))}
          </>
        )}

        {/* Post-Exilic Festivals */}
        {postExilic.length > 0 && (
          <>
            <div className="catalogue-category">
              <div className="catalogue-category-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', background: '#f5f5f5', fontWeight: 600, marginTop: '8px' }}>
                <span className="catalogue-category-name">Post-Exilic Festivals</span>
                <span className="catalogue-category-count" style={{ color: '#888' }}>({postExilic.length})</span>
              </div>
            </div>
            {postExilic.map((festival, index) => renderFestival(festival, `post-${index}`))}
          </>
        )}
      </div>
    </div>
  )
}

export default FestivalsColumn
