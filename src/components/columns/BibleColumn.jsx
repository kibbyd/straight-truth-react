import { useMemo, useCallback, useEffect, useRef } from 'react'
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
  const columnHighlightVerse = data?.highlightVerse || null
  const verseRefs = useRef({})

  // Determine which verse to highlight - prefer column-specific, fall back to global
  const activeHighlightVerse = columnHighlightVerse || selectedVerse

  // Scroll to highlighted verse when it changes or on mount
  useEffect(() => {
    const verseToScroll = columnHighlightVerse || selectedVerse
    if (verseToScroll) {
      const [selBook, selChapter] = verseToScroll.split('.')
      // Only scroll if the verse is in this column's chapter
      if (selBook === book && parseInt(selChapter) === chapter) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          const verseEl = verseRefs.current[verseToScroll]
          if (verseEl) {
            verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      }
    }
  }, [columnHighlightVerse, selectedVerse, book, chapter])

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

  // Normalize Strong's number for comparison (handle H430 vs H0430)
  const normalizeStrong = (s) => {
    if (!s) return ''
    const upper = s.toUpperCase()
    const match = upper.match(/^([HG])0*(\d+)$/)
    if (match) return `${match[1]}${match[2]}`
    return upper
  }

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

      // Increment BEFORE checking - Strong's positions are 1-indexed
      wordIndex++

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
        // Check if this Strong's number matches the highlighted one (normalize for format differences)
        const isHighlighted = highlightedStrong && normalizeStrong(strongsMatch.strong) === normalizeStrong(highlightedStrong)
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
        const isSelected = activeHighlightVerse === verseId
        const hasRefs = hasCrossRefs(verseId)

        return (
          <div
            key={verseId}
            ref={el => verseRefs.current[verseId] = el}
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
