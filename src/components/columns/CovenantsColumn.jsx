import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

function CovenantsColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [expandedId, setExpandedId] = useState(null)

  const covenants = appData.covenants || []

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

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header covenants-header">
        <div className="catalogue-title">🤝 Biblical Covenants</div>
        <div className="catalogue-subtitle">{covenants.length} covenants recorded</div>
      </div>

      <div className="catalogue-list">
        {covenants.map((covenant, index) => (
          <div key={index} className="catalogue-item">
            <div
              className="catalogue-item-name"
              onClick={() => setExpandedId(expandedId === index ? null : index)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ marginRight: '8px' }}>{expandedId === index ? '▼' : '▶'}</span>
              {covenant.name}
            </div>

            {expandedId === index && (
              <div style={{ padding: '10px 0 5px 20px' }}>
                {covenant.parties && (
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Parties:</strong> {covenant.parties.join(', ')}
                  </div>
                )}
                {covenant.context && (
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    {covenant.context}
                  </div>
                )}
                {covenant.terms && covenant.terms.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ fontSize: '14px' }}>Terms:</strong>
                    <ul style={{ margin: '4px 0 0 20px', fontSize: '14px', color: '#555' }}>
                      {covenant.terms.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {covenant.sign && (
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Sign:</strong> {covenant.sign}
                  </div>
                )}
                <div className="catalogue-refs">
                  {(covenant.references || []).map((ref, i) => {
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
      </div>
    </div>
  )
}

export default CovenantsColumn
