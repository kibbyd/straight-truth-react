import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
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
  const [showOriginal, setShowOriginal] = useState(false)

  // Determine which verse to highlight - prefer column-specific, fall back to global
  const activeHighlightVerse = columnHighlightVerse || selectedVerse

  // Check if a verse falls within a highlight range (e.g., "Mat.14.13-21")
  const isVerseHighlighted = (verseId, highlightRef) => {
    if (!highlightRef) return false
    if (highlightRef === verseId) return true

    // Parse highlight reference for range
    const [hBook, hChapter, hVerseRange] = highlightRef.split('.')
    const [vBook, vChapter, vVerse] = verseId.split('.')

    if (hBook !== vBook || hChapter !== vChapter) return false

    // Check for range (e.g., "13-21")
    if (hVerseRange && hVerseRange.includes('-')) {
      const [start, end] = hVerseRange.split('-').map(Number)
      const verse = parseInt(vVerse)
      return verse >= start && verse <= end
    }

    return hVerseRange === vVerse
  }

  // Scroll to highlighted verse when it changes or on mount
  useEffect(() => {
    const verseToScroll = columnHighlightVerse || selectedVerse
    if (verseToScroll) {
      const [selBook, selChapter, selVerseRange] = verseToScroll.split('.')
      // Only scroll if the verse is in this column's chapter
      if (selBook === book && parseInt(selChapter) === chapter) {
        // Get first verse of range for scrolling
        const firstVerse = selVerseRange?.includes('-')
          ? selVerseRange.split('-')[0]
          : selVerseRange
        const scrollTarget = `${selBook}.${selChapter}.${firstVerse}`
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          const verseEl = verseRefs.current[scrollTarget]
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

  // Render verse text — two modes:
  // Normal: inline text with clickable Strong's words
  // Interlinear: grid of word columns, English on top, transliteration below
  const renderVerse = useCallback((text, verseId) => {
    const strongsData = getStrongsForVerse(verseId)
    const words = text.split(/(\s+)/)
    const lexicon = appData.strongs.lexicon

    // Build word cells
    const cells = []
    let wordIndex = 0

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      if (/^\s+$/.test(word)) continue

      const strongsMatch = strongsData.find(s => s.pos === wordIndex)
      wordIndex++
      const cleanWord = word.replace(/[.,;:!?'"]/g, '')

      let entityIcons = ''
      if (lookups.kingNames.has(cleanWord)) entityIcons += '👑'
      if (lookups.prophetNames.has(cleanWord)) entityIcons += '📜'
      if (lookups.placeNames.has(cleanWord)) entityIcons += '📍'
      if (lookups.waterNames.has(cleanWord)) entityIcons += '💧'
      if (lookups.mountainNames.has(cleanWord)) entityIcons += '⛰️'

      // Look up transliteration if showing original
      let translit = null
      if (showOriginal && strongsMatch) {
        const sn = strongsMatch.strong.toUpperCase()
        const lex = lexicon?.[sn]
        if (lex?.translit) translit = lex.translit
      }

      const isHighlighted = strongsMatch && highlightedStrong &&
        normalizeStrong(strongsMatch.strong) === normalizeStrong(highlightedStrong)

      if (showOriginal) {
        // Interlinear mode: each word is a column cell
        cells.push(
          <span
            key={i}
            className={`interlinear-cell${strongsMatch ? ' has-strongs' : ''}`}
          >
            <span
              className={strongsMatch ? `hl strongs${isHighlighted ? ' selected' : ''}` : undefined}
              onClick={strongsMatch ? (e) => {
                e.stopPropagation()
                setHighlightedStrong(null)
                openStrongs(strongsMatch.strong)
              } : undefined}
              title={strongsMatch ? `Strong's ${strongsMatch.strong}` : undefined}
            >
              {word}
              {entityIcons && <span className="role-icons">{entityIcons}</span>}
            </span>
            <span className="interlinear-translit">{translit || '\u00A0'}</span>
          </span>
        )
      } else {
        // Normal mode: inline text
        if (strongsMatch) {
          cells.push(
            <span
              key={`${i}-strong`}
              className={`hl strongs${isHighlighted ? ' selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setHighlightedStrong(null)
                openStrongs(strongsMatch.strong)
              }}
              title={`Strong's ${strongsMatch.strong}`}
            >
              {word}
              {entityIcons && <span className="role-icons">{entityIcons}</span>}
            </span>
          )
        } else if (entityIcons) {
          cells.push(
            <span key={i}>
              {word}
              <span className="role-icons">{entityIcons}</span>
            </span>
          )
        } else {
          cells.push(word)
        }
        // Add space between words in normal mode
        if (i < words.length - 1) cells.push(' ')
      }
    }

    if (showOriginal) {
      return <span className="interlinear-row">{cells}</span>
    }
    return cells
  }, [getStrongsForVerse, lookups, openStrongs, highlightedStrong, setHighlightedStrong, showOriginal, appData.strongs.lexicon])

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
      <div className="passage-header-row">
        <h2 className="passage-header">{formatChapterRef(book, chapter)}</h2>
        <button
          className={`original-toggle${showOriginal ? ' active' : ''}`}
          onClick={() => setShowOriginal(!showOriginal)}
          title={showOriginal ? 'Hide original language' : 'Show original language'}
        >
          &#1488;
        </button>
      </div>

      {verses.map(verse => {
        const verseId = `${verse.book}.${verse.chapter}.${verse.verse}`
        const isSelected = isVerseHighlighted(verseId, activeHighlightVerse)
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
            {renderVerse(verse.text, verseId)}
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
