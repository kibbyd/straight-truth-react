import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef } from '../../data/bibleBooks'

function FestivalsColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [activeTab, setActiveTab] = useState('festivals')
  const [expandedId, setExpandedId] = useState(null)

  const festivalData = appData.festivals || { calendar: {}, festivals: [] }
  const months = festivalData.calendar?.months || []
  const festivals = festivalData.festivals || []

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

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header festivals-header">
        <div className="catalogue-title">📅 Calendar & Festivals</div>
        <div className="catalogue-subtitle">Hebrew calendar and sacred times</div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #eee' }}>
        <button
          onClick={() => setActiveTab('festivals')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            background: activeTab === 'festivals' ? '#fff3e0' : 'transparent',
            borderBottom: activeTab === 'festivals' ? '2px solid #ffc107' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'festivals' ? 600 : 400
          }}
        >
          Festivals ({festivals.length})
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            background: activeTab === 'calendar' ? '#fff3e0' : 'transparent',
            borderBottom: activeTab === 'calendar' ? '2px solid #ffc107' : 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'calendar' ? 600 : 400
          }}
        >
          Calendar ({months.length})
        </button>
      </div>

      <div className="catalogue-list">
        {activeTab === 'festivals' && festivals.map((festival, index) => (
          <div key={index} className="catalogue-item">
            <div
              className="catalogue-item-name"
              onClick={() => setExpandedId(expandedId === index ? null : index)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ marginRight: '8px' }}>{expandedId === index ? '▼' : '▶'}</span>
              {festival.name}
              {festival.hebrew && (
                <span style={{ float: 'right', fontSize: '14px', color: '#666' }}>
                  {festival.hebrew}
                </span>
              )}
            </div>

            {expandedId === index && (
              <div style={{ padding: '10px 0 5px 20px' }}>
                {festival.date && (
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                    <strong>Date:</strong> {festival.date}
                  </div>
                )}
                {festival.duration && (
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                    <strong>Duration:</strong> {festival.duration}
                  </div>
                )}
                {festival.type && (
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                    <strong>Type:</strong> {festival.type}
                  </div>
                )}
                {festival.purpose && (
                  <div style={{ fontSize: '14px', color: '#555', marginBottom: '8px' }}>
                    {festival.purpose}
                  </div>
                )}
                {festival.observances && festival.observances.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '14px' }}>Observances:</strong>
                    <ul style={{ margin: '4px 0 0 20px', fontSize: '14px', color: '#555' }}>
                      {festival.observances.map((obs, i) => (
                        <li key={i}>{obs}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="catalogue-refs">
                  {(festival.references || []).map((ref, i) => {
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
              </div>
            )}
          </div>
        ))}

        {activeTab === 'calendar' && months.map((month, index) => (
          <div key={index} className="catalogue-item" style={{ padding: '12px 15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600, color: '#333' }}>{month.number}. {month.hebrew}</span>
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {month.modern}
              </div>
            </div>
            {month.notes && (
              <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
                {month.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FestivalsColumn
