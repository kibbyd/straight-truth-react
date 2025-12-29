import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

function QuotationsColumn({ columnId, data }) {
  const { data: appData, comparePassages } = useApp()
  const [searchQuery, setSearchQuery] = useState('')

  const quotations = appData.quotations || []

  // Filter quotations by search
  const filteredQuotations = searchQuery
    ? quotations.filter(q =>
        q.ot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.nt.some(nt => nt.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : quotations

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
      <div className="catalogue-header quotations-header">
        <div className="catalogue-title">📜 OT → NT Quotations</div>
        <div className="catalogue-subtitle">{quotations.length} OT passages quoted in NT</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search quotations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div className="catalogue-list">
        {filteredQuotations.map((quotation, index) => {
          const otParsed = parseRef(quotation.ot)
          const ntRefs = quotation.nt || []
          const firstNtParsed = ntRefs.length > 0 ? parseRef(ntRefs[0]) : null

          return (
            <div
              key={index}
              className="quotation-item"
              onClick={() => firstNtParsed && comparePassages(otParsed.verseId, firstNtParsed.verseId)}
              style={{ cursor: 'pointer' }}
            >
              <div className="quotation-ot">
                <span className="quotation-label">OT:</span>
                <span className="catalogue-ref-link ot-ref">
                  {otParsed.display}
                </span>
              </div>
              <div className="quotation-nt">
                <span className="quotation-label">→ NT:</span>
                {ntRefs.map((ntRef, i) => {
                  const ntParsed = parseRef(ntRef)
                  return (
                    <span
                      key={i}
                      className="catalogue-ref-link nt-ref"
                      style={{ marginLeft: i > 0 ? '4px' : '0' }}
                    >
                      {ntParsed.display}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}

        {filteredQuotations.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No quotations found
          </div>
        )}
      </div>
    </div>
  )
}

export default QuotationsColumn
