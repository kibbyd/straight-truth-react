import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

// Connection type display names
const typeLabels = {
  SCRIPTURE_QUOTE: 'Scripture Quote',
  SAME_PERSON: 'Same Person',
  SAME_PLACE: 'Same Place',
  GENEALOGY: 'Genealogy',
  TEXT_MATCH: 'Text Match'
}

function CrossRefsColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()

  const verseId = data?.verseId

  // Get cross-references for this verse
  const crossRefs = useMemo(() => {
    if (!verseId) return []
    return appData.crossRefs[verseId] || []
  }, [verseId, appData.crossRefs])

  // Group by type
  const groupedRefs = useMemo(() => {
    const groups = {}
    crossRefs.forEach(ref => {
      const type = ref.type || 'OTHER'
      if (!groups[type]) groups[type] = []
      groups[type].push(ref)
    })
    return groups
  }, [crossRefs])

  // Get verse text for display
  const getVerseText = (vId) => {
    const verse = appData.verses.find(v =>
      `${v.book}.${v.chapter}.${v.verse}` === vId
    )
    return verse?.text || ''
  }

  if (!verseId) {
    return (
      <div className="crossrefs-column-content">
        <div className="crossrefs-empty">
          Click the 🔗 icon on a verse to view cross-references
        </div>
      </div>
    )
  }

  if (crossRefs.length === 0) {
    return (
      <div className="crossrefs-column-content">
        <div className="crossrefs-source">
          Cross-references for {formatVerseRef(verseId)}
        </div>
        <div className="crossrefs-empty">
          No cross-references found for this verse
        </div>
      </div>
    )
  }

  return (
    <div className="crossrefs-column-content">
      <div className="crossrefs-source">
        Cross-references for {formatVerseRef(verseId)}
      </div>

      <div className="crossrefs-list">
        {Object.entries(groupedRefs).map(([type, refs]) => (
          <div key={type} className="crossrefs-group">
            <div className="crossrefs-type-header">
              {typeLabels[type] || type} ({refs.length})
            </div>
            {refs.map((ref, index) => (
              <div
                key={index}
                className="crossref-col-item"
                onClick={() => goToVerse(normalizeVerseId(ref.target))}
              >
                <div className="crossref-col-verse">
                  {formatVerseRef(ref.target)}
                </div>
                <div className="crossref-col-type">
                  {ref.evidence}
                </div>
                <div className="crossref-col-text">
                  {getVerseText(ref.target).substring(0, 150)}
                  {getVerseText(ref.target).length > 150 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CrossRefsColumn
