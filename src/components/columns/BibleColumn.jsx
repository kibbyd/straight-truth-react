import { useMemo, useCallback } from 'react'
import { useApp } from '../../context/AppContext'
import { formatChapterRef } from '../../data/bibleBooks'

function BibleColumn({ columnId, data }) {
  const {
    data: appData,
    lookups,
    selectedVerse,
    setSelectedVerse,
    highlightedStrong,
    setHighlightedStrong,
    openStrongs,
    openCrossRefs
  } = useApp()

  const book = data?.book || 'Gen'
  const chapter = data?.chapter || 1

  // Get verses for current chapter
  const verses = useMemo(() => {
    return appData.verses.filter(v => v.book === book && v.chapter === chapter)
  }, [appData.verses, book, chapter])

  // Check if verse has cross-references
  const hasCrossRefs = useCallback((verseId) => {
    return appData.crossRefs[verseId] && appData.crossRefs[verseId].length > 0
  }, [appData.crossRefs])

  // Get Strong's data for verse
  const getStrongsForVerse = useCallback((verseId) => {
    return appData.strongs.verses?.[verseId] || []
  }, [appData.strongs.verses])

  // Highlight entities in text
  const highlightText = useCallback((text, verseId) => {
    const strongsData = getStrongsForVerse(verseId)
    const words = text.split(/(\s+)/)
    const result = []

    let wordIndex = 0
    for (let i = 0; i < words.length; i++) {
      const word = words[i]

      // Skip whitespace
      if (/^\s+$/.test(word)) {
        result.push(word)
        continue
      }

      // Check for Strong's number at this position
      const strongsMatch = strongsData.find(s => s.pos === wordIndex)

      // Clean word for entity matching
      const cleanWord = word.replace(/[.,;:!?'"]/g, '')

      // Check for entity matches
      let entityIcons = ''
      if (lookups.kingNames.has(cleanWord)) entityIcons += '👑'
      if (lookups.prophetNames.has(cleanWord)) entityIcons += '📜'
      if (lookups.placeNames.has(cleanWord)) entityIcons += '📍'
      if (lookups.waterNames.has(cleanWord)) entityIcons += '💧'
      if (lookups.mountainNames.has(cleanWord)) entityIcons += '⛰️'

      if (strongsMatch) {
        // Check if this Strong's number matches the highlighted one
        const isHighlighted = highlightedStrong && strongsMatch.strong === highlightedStrong
        result.push(
          <span
            key={`${i}-strong`}
            className={`hl strongs${isHighlighted ? ' selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              setHighlightedStrong(null) // Clear highlight when clicking a new word
              openStrongs(strongsMatch.strong)
            }}
            title={`Strong's ${strongsMatch.strong}`}
          >
            {word}
            {entityIcons && <span className="role-icons">{entityIcons}</span>}
          </span>
        )
      } else if (entityIcons) {
        result.push(
          <span key={i}>
            {word}
            <span className="role-icons">{entityIcons}</span>
          </span>
        )
      } else {
        result.push(word)
      }

      wordIndex++
    }

    return result
  }, [getStrongsForVerse, lookups, openStrongs, highlightedStrong, setHighlightedStrong])

  // Handle verse click
  const handleVerseClick = useCallback((verseId) => {
    setSelectedVerse(verseId === selectedVerse ? null : verseId)
  }, [selectedVerse, setSelectedVerse])

  // Handle cross-ref indicator click
  const handleCrossRefClick = useCallback((e, verseId) => {
    e.stopPropagation()
    openCrossRefs(verseId)
  }, [openCrossRefs])

  return (
    <div className="window-content">
      <h2 className="passage-header">{formatChapterRef(book, chapter)}</h2>

      {verses.map(verse => {
        const verseId = `${verse.book}.${verse.chapter}.${verse.verse}`
        const isSelected = selectedVerse === verseId
        const hasRefs = hasCrossRefs(verseId)

        return (
          <div
            key={verseId}
            className={`verse ${isSelected ? 'selected' : ''}`}
            onClick={() => handleVerseClick(verseId)}
          >
            {hasRefs && (
              <span
                className="connection-indicator"
                onClick={(e) => handleCrossRefClick(e, verseId)}
                title="View cross-references"
              >
                🔗
              </span>
            )}
            <span className="verse-num">{verse.verse}</span>
            {highlightText(verse.text, verseId)}
          </div>
        )
      })}

      {verses.length === 0 && (
        <div className="empty-message">
          No verses found for {formatChapterRef(book, chapter)}
        </div>
      )}
    </div>
  )
}

export default BibleColumn
