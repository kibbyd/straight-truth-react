import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef } from '../../data/bibleBooks'

function StrongsColumn({ columnId, data }) {
  const { data: appData, lookups, goToVerse } = useApp()

  // Strip "Strong's " prefix if present (from Questions/Glossary columns)
  const rawNum = data?.strongNum || ''
  const strongNum = rawNum.replace(/^Strong's\s*/i, '')

  // Get Strong's entry from lexicon
  const strongsEntry = useMemo(() => {
    if (!strongNum) return null

    const lexicon = appData.strongs.lexicon
    if (!lexicon) return null

    // The lexicon has inconsistent key formatting:
    // - Numbers 1-999 are stored WITH leading zeros: "G0001", "H0430"
    // - Numbers 1000+ are stored WITHOUT leading zeros: "G2288", "H1494"
    // Try multiple formats to find the entry

    const upperNum = strongNum.toUpperCase()

    // Try as-is first
    if (lexicon[upperNum]) return lexicon[upperNum]

    if (upperNum.startsWith('H') || upperNum.startsWith('G')) {
      const prefix = upperNum[0]
      const numPart = upperNum.slice(1)

      // Try with leading zeros (padded to 4 digits)
      const paddedNum = prefix + numPart.padStart(4, '0')
      if (lexicon[paddedNum]) return lexicon[paddedNum]

      // Try without leading zeros
      const unpaddedNum = prefix + parseInt(numPart, 10).toString()
      if (lexicon[unpaddedNum]) return lexicon[unpaddedNum]
    }

    return null
  }, [strongNum, appData.strongs.lexicon])

  // Get all verses containing this Strong's number
  const occurrences = useMemo(() => {
    if (!strongNum) return []

    const upperNum = strongNum.toUpperCase()

    // Try multiple formats (same inconsistency as lexicon)
    if (lookups.strongsToVerses[upperNum]) {
      return lookups.strongsToVerses[upperNum]
    }

    if (upperNum.startsWith('H') || upperNum.startsWith('G')) {
      const prefix = upperNum[0]
      const numPart = upperNum.slice(1)

      // Try with leading zeros
      const paddedNum = prefix + numPart.padStart(4, '0')
      if (lookups.strongsToVerses[paddedNum]) {
        return lookups.strongsToVerses[paddedNum]
      }

      // Try without leading zeros
      const unpaddedNum = prefix + parseInt(numPart, 10).toString()
      if (lookups.strongsToVerses[unpaddedNum]) {
        return lookups.strongsToVerses[unpaddedNum]
      }
    }

    return []
  }, [strongNum, lookups.strongsToVerses])

  const isHebrew = strongNum?.startsWith('H')

  if (!strongNum) {
    return (
      <div className="strongs-column-content">
        <div className="strongs-empty">
          Click on an underlined word in a verse to view Strong's data
        </div>
      </div>
    )
  }

  if (!strongsEntry) {
    return (
      <div className="strongs-column-content">
        <div className="strongs-header">
          <div className={`strongs-number-large ${isHebrew ? 'hebrew' : 'greek'}`}>
            {strongNum}
          </div>
          <div className="strongs-meaning-large">
            No entry found for this Strong's number
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="strongs-column-content">
      <div className="strongs-header">
        <div className={`strongs-number-large ${isHebrew ? 'hebrew' : 'greek'}`}>
          {strongsEntry.strong || strongNum}
        </div>
        {strongsEntry.original && (
          <div className="strongs-original-large">{strongsEntry.original}</div>
        )}
        {strongsEntry.translit && (
          <div className="strongs-translit-large">{strongsEntry.translit}</div>
        )}
        {strongsEntry.gloss && (
          <div className="strongs-gloss-large">{strongsEntry.gloss}</div>
        )}
        {strongsEntry.meaning && (
          <div className="strongs-meaning-large">{strongsEntry.meaning}</div>
        )}
      </div>

      <div className="strongs-occurrences-header">
        Occurrences ({occurrences.length})
      </div>

      <div className="strongs-occurrences-list">
        {occurrences.slice(0, 100).map(verseId => (
          <div
            key={verseId}
            className="strongs-occurrence-item"
            onClick={() => goToVerse(verseId)}
          >
            <span className="catalogue-ref-link">{formatVerseRef(verseId)}</span>
          </div>
        ))}
        {occurrences.length > 100 && (
          <div className="strongs-occurrence-more">
            ... and {occurrences.length - 100} more occurrences
          </div>
        )}
      </div>
    </div>
  )
}

export default StrongsColumn
