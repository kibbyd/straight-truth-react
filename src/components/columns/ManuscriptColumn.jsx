import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef } from '../../data/bibleBooks'

const typeLabels = {
  extra: 'Word added or removed',
  reading: 'Different word used',
  spelling: 'Different spelling'
}

const typeColors = {
  extra: 'ms-badge-orange',
  reading: 'ms-badge-blue',
  spelling: 'ms-badge-gray'
}

function ManuscriptColumn({ columnId, data }) {
  const { data: appData, openStrongs } = useApp()
  const [showGuide, setShowGuide] = useState(false)

  const verseId = data?.verseId
  const variants = appData.manuscriptVariants

  // Get variants for this verse
  const verseVariants = useMemo(() => {
    if (!verseId || !variants?.verses) return []
    return variants.verses[verseId] || []
  }, [verseId, variants?.verses])

  // Check if verse falls in a disputed passage
  const disputedInfo = useMemo(() => {
    if (!verseId || !variants?.disputed) return null
    const [book, ch, vs] = verseId.split('.')
    const chNum = parseInt(ch)
    const vsNum = parseInt(vs)

    for (const d of variants.disputed) {
      const [sBook, sCh, sVs] = d.start.split('.')
      const [eBook, eCh, eVs] = d.end.split('.')
      if (book !== sBook) continue

      const sChNum = parseInt(sCh), sVsNum = parseInt(sVs)
      const eChNum = parseInt(eCh), eVsNum = parseInt(eVs)

      // Check if verse is within range
      if (chNum > sChNum || (chNum === sChNum && vsNum >= sVsNum)) {
        if (chNum < eChNum || (chNum === eChNum && vsNum <= eVsNum)) {
          return d
        }
      }
    }
    return null
  }, [verseId, variants?.disputed])

  // Group variants by type
  const grouped = useMemo(() => {
    const groups = {}
    verseVariants.forEach(v => {
      const t = v.type || 'extra'
      if (!groups[t]) groups[t] = []
      groups[t].push(v)
    })
    return groups
  }, [verseVariants])

  const handleStrongsClick = (e, strongNum) => {
    e.stopPropagation()
    if (strongNum) openStrongs(strongNum)
  }

  if (!verseId) {
    return (
      <div className="manuscript-column-content">
        <div className="manuscript-empty">
          Click the 📜 icon on a New Testament verse to see where ancient copies differ
        </div>
      </div>
    )
  }

  if (verseVariants.length === 0) {
    return (
      <div className="manuscript-column-content">
        <div className="manuscript-source">
          Manuscript evidence for {formatVerseRef(verseId)}
        </div>
        {disputedInfo && (
          <div className="manuscript-disputed-banner">
            {disputedInfo.note}
          </div>
        )}
        <div className="manuscript-empty">
          All known copies agree on this verse
        </div>
      </div>
    )
  }

  return (
    <div className="manuscript-column-content">
      <div className="manuscript-source">
        {formatVerseRef(verseId)}
      </div>

      <div className="manuscript-intro">
        No single original copy of the New Testament survives. What we have are thousands of ancient copies, and they don't always match word-for-word. Below are the places where different copies disagree on this verse.
      </div>

      {disputedInfo && (
        <div className="manuscript-disputed-banner">
          {disputedInfo.note}
        </div>
      )}

      <div className="manuscript-summary">
        {verseVariants.length} difference{verseVariants.length !== 1 ? 's' : ''} found between copies
      </div>

      <div className="manuscript-list">
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="manuscript-group">
            <div className="manuscript-type-header">
              <span className={`ms-badge ${typeColors[type] || 'ms-badge-gray'}`}>
                {typeLabels[type] || type}
              </span>
              <span className="ms-count">({items.length})</span>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="manuscript-card">
                <div className="ms-card-greek">
                  <span className="ms-greek">{item.greek}</span>
                  {item.translit && <span className="ms-translit">({item.translit})</span>}
                  {item.english && <span className="ms-english">&mdash; {item.english}</span>}
                </div>

                <div className="ms-card-editions">
                  <span className="ms-editions-label">Found in:</span>
                  {item.in.map(ed => (
                    <span key={ed} className="ms-edition-tag ms-ed-in" title={variants?.editions?.[ed]?.name || ed}>{ed}</span>
                  ))}
                </div>

                {item.notIn.length > 0 && (
                  <div className="ms-card-editions">
                    <span className="ms-editions-label">Missing from:</span>
                    {item.notIn.map(ed => (
                      <span key={ed} className="ms-edition-tag ms-ed-out" title={variants?.editions?.[ed]?.name || ed}>{ed}</span>
                    ))}
                  </div>
                )}

                {item.variant && (
                  <div className="ms-card-variant">
                    <span className="ms-var-label">Other copies use this word instead:</span>
                    <span className="ms-greek">{item.variant.greek}</span>
                    {item.variant.translit && <span className="ms-translit">({item.variant.translit})</span>}
                    {item.variant.english && <span className="ms-english">&mdash; {item.variant.english}</span>}
                    {item.variant.in && item.variant.in.length > 0 && (
                      <div className="ms-card-editions ms-var-editions">
                        <span className="ms-editions-label">In:</span>
                        {item.variant.in.map(ed => (
                          <span key={ed} className="ms-edition-tag ms-ed-in" title={variants?.editions?.[ed]?.name || ed}>{ed}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {item.strong && (
                  <span
                    className="ms-strong-link"
                    onClick={(e) => handleStrongsClick(e, item.strong)}
                  >
                    {item.strong}
                  </span>
                )}

                <div className="ms-card-note">{item.note}</div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="manuscript-guide">
        <button
          className="ms-guide-toggle"
          onClick={() => setShowGuide(!showGuide)}
        >
          {showGuide ? 'Hide' : 'About these editions'}
        </button>
        {showGuide && variants?.editions && (
          <div className="ms-guide-list">
            {Object.entries(variants.editions).map(([key, ed]) => (
              <div key={key} className="ms-guide-item">
                <span className="ms-guide-abbr">{key}</span>
                <span className="ms-guide-name">{ed.name}</span>
                <span className="ms-guide-desc">{ed.plain}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ManuscriptColumn
