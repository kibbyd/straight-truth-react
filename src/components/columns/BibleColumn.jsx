import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatChapterRef, bibleBooks } from '../../data/bibleBooks'

function BibleColumn({ columnId, data }) {
  const {
    data: appData,
    lookups,
    selectedVerse,
    setSelectedVerse,
    highlightedStrong,
    setHighlightedStrong,
    openStrongs,
    openCrossRefs,
    openManuscript,
    updateColumn,
    columns
  } = useApp()

  const book = data?.book || 'Gen'
  const chapter = data?.chapter || 1
  const columnHighlightVerse = data?.highlightVerse || null
  const verseRefs = useRef({})
  const [showOriginal, setShowOriginal] = useState(false)
  const [navBook, setNavBook] = useState(book)
  const [navChapter, setNavChapter] = useState(chapter)

  // Sync nav selects when column data changes
  useEffect(() => {
    setNavBook(book)
    setNavChapter(chapter)
  }, [book, chapter])

  const currentBookData = bibleBooks.find(b => b.abbr === navBook) || bibleBooks[0]

  const handleGo = () => {
    updateColumn(columnId, { book: navBook, chapter: navChapter, highlightVerse: null })
    setSelectedVerse(null)
  }

  // Track which verse has active manuscript highlighting
  const activeManuscriptVerse = useMemo(() => {
    const msCol = columns.find(c => c.type === 'manuscript')
    return msCol?.data?.verseId || null
  }, [columns])

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

  // Check if verse has manuscript variants (NT only)
  const NT_BOOKS = new Set(['Mat','Mar','Luk','Joh','Act','Rom','1Co','2Co','Gal','Eph','Phi','Col','1Th','2Th','1Ti','2Ti','Tit','Phm','Heb','Jam','1Pe','2Pe','1Jo','2Jo','3Jo','Jud','Rev'])
  const hasManuscriptVariants = useCallback((verseId) => {
    const vBook = verseId.split('.')[0]
    if (!NT_BOOKS.has(vBook)) return false
    const verses = appData.manuscriptVariants?.verses
    return verses && verses[verseId] && verses[verseId].length > 0
  }, [appData.manuscriptVariants?.verses])

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

  // Match Strong's entries to ESV words by gloss, not Berean position
  const buildGlossMap = useCallback((verseId) => {
    const strongsData = getStrongsForVerse(verseId)
    if (!strongsData.length) return {}

    const lexicon = appData.strongs.lexicon
    // Map: wordIndex -> strongsEntry
    const map = {}
    // Track which Strong's entries have been claimed
    const claimed = new Set()

    // Get ESV words
    const text = appData.verses.find(v =>
      `${v.book}.${v.chapter}.${v.verse}` === verseId
    )?.text || ''
    const esvWords = text.split(/\s+/)

    // For each Strong's entry, find the ESV word that matches its gloss
    for (const entry of strongsData) {
      const sn = entry.strong.toUpperCase()
      const lex = lexicon?.[sn]
      if (!lex) continue

      const gloss = lex.gloss?.toLowerCase() || ''
      // Split multi-word glosses (e.g., "to walk" -> ["to", "walk"])
      const glossWords = gloss.split(/\s+/).filter(Boolean)

      let matched = false
      for (const gw of glossWords) {
        // Find first unclaimed ESV word matching this gloss word
        for (let wi = 0; wi < esvWords.length; wi++) {
          if (map[wi]) continue // already claimed
          const clean = esvWords[wi].replace(/[.,;:!?'"]/g, '').toLowerCase()
          if (clean === gw || clean === gw + 's' || clean === gw + 'ed' ||
              clean === gw + 'ing' || clean === gw + 'es' ||
              (gw.endsWith('e') && clean === gw + 'd') ||
              (gw.endsWith('y') && clean === gw.slice(0, -1) + 'ies')) {
            map[wi] = entry
            matched = true
            break
          }
        }
        if (matched) break
      }
    }

    return map
  }, [getStrongsForVerse, appData.strongs.lexicon, appData.verses])

  // Build variant markup data: highlighted word indices + insertion markers for missing words
  const getVariantMarkup = useCallback((verseId, esvText) => {
    const variants = appData.manuscriptVariants?.verses?.[verseId]
    if (!variants) return null

    const esvWords = esvText.split(/\s+/)
    const cleanWords = esvWords.map(w => w.replace(/[.,;:!?'"]/g, '').toLowerCase())
    const claimed = new Set()
    const highlights = new Set()
    const insertions = {} // wordIndex -> [{english, greek}] for missing words

    for (const v of variants) {
      if (v.in && v.in.includes('NA28')) {
        // Word IS in the displayed text — highlight it

        // Strategy 1: match via Strong's number through gloss map
        if (v.strong) {
          const normStrong = normalizeStrong(v.strong)
          const glossMap = buildGlossMap(verseId)
          for (const [idx, entry] of Object.entries(glossMap)) {
            if (normalizeStrong(entry.strong) === normStrong && !claimed.has(parseInt(idx))) {
              highlights.add(parseInt(idx))
              claimed.add(parseInt(idx))
            }
          }
        }

        // Strategy 2: match English words against ESV
        const englishSources = [v.english]
        if (v.variant?.english) englishSources.push(v.variant.english)
        for (const eng of englishSources) {
          if (!eng) continue
          const varWords = eng.replace(/[.,;:!?'"<>]/g, '').toLowerCase().split(/\s+/).filter(Boolean)
          for (const vw of varWords) {
            if (vw.length < 3) continue
            for (let wi = 0; wi < cleanWords.length; wi++) {
              if (claimed.has(wi)) continue
              const cw = cleanWords[wi]
              if (cw === vw || cw === vw + 's' || cw === vw + 'd' || cw === vw + 'ed' ||
                  cw === vw + 'ing' || cw === vw + 'es' ||
                  (vw.endsWith('e') && cw === vw + 'd') ||
                  (vw.endsWith('y') && cw === vw.slice(0, -1) + 'ies') ||
                  vw === cw + 's' || vw === cw + 'd' || vw === cw + 'ed') {
                highlights.add(wi)
                claimed.add(wi)
                break
              }
            }
          }
        }
      } else if (v.type === 'extra') {
        // Word is NOT in the displayed text — show insertion marker
        // Place near the word's position in the verse
        const insertAt = Math.min(v.pos - 1, esvWords.length - 1)
        const idx = Math.max(0, insertAt)
        if (!insertions[idx]) insertions[idx] = []
        insertions[idx].push({
          english: v.english?.replace(/[<>]/g, '') || '',
          greek: v.greek || ''
        })
      }
    }

    const hasData = highlights.size > 0 || Object.keys(insertions).length > 0
    return hasData ? { highlights, insertions } : null
  }, [appData.manuscriptVariants?.verses, buildGlossMap])

  // Render verse text — two modes:
  // Normal: inline text with clickable Strong's words (gloss-matched)
  // Interlinear: grid of word columns, English on top, transliteration below
  const renderVerse = useCallback((text, verseId) => {
    const lexicon = appData.strongs.lexicon
    const glossMap = buildGlossMap(verseId)
    const variantMarkup = (verseId === activeManuscriptVerse) ? getVariantMarkup(verseId, text) : null
    const wojRanges = appData.redLetters?.[verseId] || null
    const words = text.split(/(\s+)/)

    const cells = []
    let wordIndex = 0
    let charPos = 0

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      if (/^\s+$/.test(word)) {
        charPos += word.length
        continue
      }

      const strongsMatch = glossMap[wordIndex] || null
      const cleanWord = word.replace(/[.,;:!?'"]/g, '')

      let entityIcons = ''
      if (lookups.kingNames.has(cleanWord)) entityIcons += '👑'
      if (lookups.prophetNames.has(cleanWord)) entityIcons += '📣'
      if (lookups.placeNames.has(cleanWord)) entityIcons += '📍'
      if (lookups.waterNames.has(cleanWord)) entityIcons += '💧'
      if (lookups.mountainNames.has(cleanWord)) entityIcons += '⛰️'

      let translit = null
      if (showOriginal && strongsMatch) {
        const sn = strongsMatch.strong.toUpperCase()
        const lex = lexicon?.[sn]
        if (lex?.translit) translit = lex.translit
      }

      const isHighlighted = strongsMatch && highlightedStrong &&
        normalizeStrong(strongsMatch.strong) === normalizeStrong(highlightedStrong)
      const isVariant = variantMarkup?.highlights?.has(wordIndex)
      const insertionHere = variantMarkup?.insertions?.[wordIndex]
      const isWoj = wojRanges && wojRanges.some(([s, e]) => charPos >= s && charPos < e)

      if (showOriginal) {
        cells.push(
          <span
            key={i}
            className={`interlinear-cell${strongsMatch ? ' has-strongs' : ''}`}
          >
            <span
              className={strongsMatch ? `hl strongs${isHighlighted ? ' selected' : ''}${isVariant ? ' ms-variant-word' : ''}${isWoj ? ' woj' : ''}` : `${isVariant ? 'ms-variant-word' : ''}${isWoj ? ' woj' : ''}`.trim() || undefined}
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
        if (strongsMatch) {
          cells.push(
            <span
              key={`${i}-strong`}
              className={`hl strongs${isHighlighted ? ' selected' : ''}${isVariant ? ' ms-variant-word' : ''}${isWoj ? ' woj' : ''}`}
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
        } else if (isVariant || isWoj) {
          cells.push(
            <span key={i} className={`${isVariant ? 'ms-variant-word' : ''}${isWoj ? ' woj' : ''}`.trim()}>
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
        // Insertion marker for missing words (words in other copies but not this text)
        if (insertionHere) {
          for (const ins of insertionHere) {
            cells.push(
              <span key={`${i}-ins-${ins.english}`} className="ms-insertion-marker" title={`Some copies add: ${ins.english} (${ins.greek})`}>
                [{ins.english}]
              </span>
            )
          }
        }

        if (i < words.length - 1) cells.push(' ')
      }

      charPos += word.length + 1  // +1 for the space
      wordIndex++
    }

    if (showOriginal) {
      return <span className="interlinear-row">{cells}</span>
    }
    return cells
  }, [buildGlossMap, getVariantMarkup, activeManuscriptVerse, lookups, openStrongs, highlightedStrong, setHighlightedStrong, showOriginal, appData.strongs.lexicon, appData.redLetters])

  // Handle verse click
  const handleVerseClick = useCallback((verseId) => {
    setSelectedVerse(verseId === selectedVerse ? null : verseId)
  }, [selectedVerse, setSelectedVerse])

  // Handle cross-ref indicator click
  const handleCrossRefClick = useCallback((e, verseId) => {
    e.stopPropagation()
    openCrossRefs(verseId)
  }, [openCrossRefs])

  // Handle manuscript indicator click
  const handleManuscriptClick = useCallback((e, verseId) => {
    e.stopPropagation()
    openManuscript(verseId)
  }, [openManuscript])

  // Navigate to previous/next chapter
  const navigateChapter = useCallback((direction) => {
    if (direction === 1) {
      const bookInfo = bibleBooks.find(b => b.abbr === book)
      if (chapter < bookInfo?.chapters) {
        updateColumn(columnId, { book, chapter: chapter + 1, highlightVerse: null })
      } else {
        const bookIdx = bibleBooks.findIndex(b => b.abbr === book)
        if (bookIdx < bibleBooks.length - 1) {
          const nextBook = bibleBooks[bookIdx + 1].abbr
          updateColumn(columnId, { book: nextBook, chapter: 1, highlightVerse: null })
        }
      }
    } else {
      if (chapter > 1) {
        updateColumn(columnId, { book, chapter: chapter - 1, highlightVerse: null })
      } else {
        const bookIdx = bibleBooks.findIndex(b => b.abbr === book)
        if (bookIdx > 0) {
          const prevBook = bibleBooks[bookIdx - 1]
          updateColumn(columnId, { book: prevBook.abbr, chapter: prevBook.chapters, highlightVerse: null })
        }
      }
    }
    setSelectedVerse(null)
  }, [book, chapter, columnId, updateColumn, setSelectedVerse])

  return (
    <div className="window-content passage-with-nav">
      <div className="passage-nav-chevron left" onClick={() => navigateChapter(-1)} title="Previous chapter">
        ‹
      </div>
      <div className="passage-nav-inner">
      <div className="passage-header-row">
        <select
          className="passage-book-select"
          value={navBook}
          onChange={(e) => { setNavBook(e.target.value); setNavChapter(1) }}
        >
          {bibleBooks.map(b => (
            <option key={b.abbr} value={b.abbr}>{b.name}</option>
          ))}
        </select>
        <select
          className="passage-chapter-select"
          value={navChapter}
          onChange={(e) => setNavChapter(parseInt(e.target.value))}
        >
          {Array.from({ length: currentBookData.chapters }, (_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>
        <button className="passage-go-btn" onClick={handleGo}>Go</button>
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
        const hasVariants = hasManuscriptVariants(verseId)

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
            {hasVariants && (
              <span
                className="manuscript-indicator"
                onClick={(e) => handleManuscriptClick(e, verseId)}
                title="View manuscript evidence"
              >
                📜
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
      <div className="passage-nav-chevron right" onClick={() => navigateChapter(1)} title="Next chapter">
        ›
      </div>
    </div>
  )
}

export default BibleColumn
