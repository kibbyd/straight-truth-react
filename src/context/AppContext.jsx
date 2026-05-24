import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loadAllData } from '../services/dataLoader'

const AppContext = createContext()

export function AppProvider({ children }) {
  // Loading state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // All loaded data
  const [data, setData] = useState({
    verses: [],
    crossRefs: {},
    strongs: { lexicon: {}, verses: {} },
    kings: [],
    prophets: [],
    places: [],
    waters: [],
    mountains: [],
    miracles: [],
    parables: [],
    prayers: [],
    namesOfGod: [],
    quotations: [],
    covenants: [],
    festivals: { calendar: {}, festivals: [] },
    familyTrees: [],
    questions: [],
    glossary: [],
    measures: { categories: {}, measures: [] },
    ancientTexts: {},
    timelines: {},
    maps: { categories: [] },
    parallelPassages: [],
    peoplesCultures: [],
    ancientReligions: [],
    dailyLife: [],
    archaeology: [],
    definitions: [],
    topicalClusters: [],
    topicalIndex: [],
    manuscriptVariants: { editions: {}, disputed: [], verses: {} }
  })

  // Lookup sets for O(1) entity checking
  const [lookups, setLookups] = useState({
    kingNames: new Set(),
    prophetNames: new Set(),
    placeNames: new Set(),
    waterNames: new Set(),
    mountainNames: new Set(),
    strongsToVerses: {}
  })

  // Current navigation state
  const [currentBook, setCurrentBook] = useState('Gen')
  const [currentChapter, setCurrentChapter] = useState(1)
  const [selectedVerse, setSelectedVerse] = useState(null)
  const [highlightedStrong, setHighlightedStrong] = useState(null)

  // Column state
  const [columns, setColumns] = useState([
    { id: 'passage-1', type: 'passage', data: { book: 'Gen', chapter: 1 } }
  ])

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '' })

  // Ancient text modal state
  const [ancientTextModal, setAncientTextModal] = useState({ show: false, source: null })

  // Load all data on mount
  useEffect(() => {
    async function init() {
      try {
        const loadedData = await loadAllData()
        setData(loadedData)

        // Build lookup sets
        const kingNames = new Set(loadedData.kings.map(k => k.name))
        const prophetNames = new Set(loadedData.prophets.map(p => p.name))
        const placeNames = new Set()
        for (const p of loadedData.places) {
          placeNames.add(p.name)
          if (p.altNames) p.altNames.forEach(a => placeNames.add(a))
        }
        const waterNames = new Set(loadedData.waters.map(w => w.name))
        const mountainNames = new Set(loadedData.mountains.map(m => m.name))

        // Build strongs to verses lookup (using Set to avoid duplicates)
        const strongsToVersesSet = {}
        if (loadedData.strongs.verses) {
          for (const [verseId, words] of Object.entries(loadedData.strongs.verses)) {
            for (const word of words) {
              if (!strongsToVersesSet[word.strong]) {
                strongsToVersesSet[word.strong] = new Set()
              }
              strongsToVersesSet[word.strong].add(verseId)
            }
          }
        }
        // Convert Sets to Arrays
        const strongsToVerses = {}
        for (const [strong, verseSet] of Object.entries(strongsToVersesSet)) {
          strongsToVerses[strong] = Array.from(verseSet)
        }

        setLookups({
          kingNames,
          prophetNames,
          placeNames,
          waterNames,
          mountainNames,
          strongsToVerses
        })

        // Restore layout from localStorage
        const savedLayout = localStorage.getItem('new-layout')
        if (savedLayout) {
          try {
            const parsed = JSON.parse(savedLayout)
            if (parsed.columns && parsed.columns.length > 0) {
              setColumns(parsed.columns)
            }
            if (parsed.currentBook) setCurrentBook(parsed.currentBook)
            if (parsed.currentChapter) setCurrentChapter(parsed.currentChapter)
          } catch (e) {
            console.warn('Failed to restore layout:', e)
          }
        }

        setLoading(false)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError(err.message)
        setLoading(false)
      }
    }
    init()
  }, [])

  // Save layout to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('new-layout', JSON.stringify({
        columns,
        currentBook,
        currentChapter
      }))
    }
  }, [columns, currentBook, currentChapter, loading])

  // Column management functions
  const addColumn = useCallback((type, columnData = {}) => {
    // Max 5 columns
    if (columns.length >= 5) {
      showToast('Maximum 5 columns allowed')
      return
    }

    // For most types, only allow one instance (via dropdown)
    // Note: comparePassages/compareMultiplePassages bypass this by using setColumns directly
    const singleInstanceTypes = ['passage', 'search', 'crossrefs', 'notes', 'miracles', 'parables', 'prayers',
      'namesofgod', 'quotations', 'covenants', 'festivals', 'familytrees',
      'questions', 'glossary', 'converter', 'strongs', 'timelines', 'maps', 'places', 'parallels', 'peoples', 'religions', 'dailylife', 'archaeology', 'definitions', 'topical', 'manuscript']

    if (singleInstanceTypes.includes(type)) {
      const existing = columns.find(c => c.type === type)
      if (existing) {
        showToast('Column already open')
        return
      }
    }

    const newColumn = {
      id: `${type}-${Date.now()}`,
      type,
      data: columnData
    }

    setColumns(prev => [...prev, newColumn])
  }, [columns])

  const closeColumn = useCallback((columnId) => {
    setColumns(prev => prev.filter(c => c.id !== columnId))
  }, [])

  const updateColumn = useCallback((columnId, newData) => {
    setColumns(prev => prev.map(c =>
      c.id === columnId ? { ...c, data: { ...c.data, ...newData } } : c
    ))
  }, [])

  const reorderColumns = useCallback((fromIndex, toIndex) => {
    setColumns(prev => {
      const result = [...prev]
      const [removed] = result.splice(fromIndex, 1)
      result.splice(toIndex, 0, removed)
      return result
    })
  }, [])

  const clearColumns = useCallback(() => {
    setColumns([
      { id: `passage-${Date.now()}`, type: 'passage', data: { book: 'Gen', chapter: 1 } }
    ])
    setCurrentBook('Gen')
    setCurrentChapter(1)
    setSelectedVerse(null)
    setHighlightedStrong(null)
  }, [])

  // Toast function
  const showToast = useCallback((message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }, [])

  // Ancient text modal functions
  const openAncientText = useCallback((sourceId) => {
    const source = data.ancientTexts[sourceId]
    if (source) {
      setAncientTextModal({ show: true, source })
    } else {
      showToast(`Source "${sourceId}" not yet available`)
    }
  }, [data.ancientTexts, showToast])

  const closeAncientText = useCallback(() => {
    setAncientTextModal({ show: false, source: null })
  }, [])

  // Navigation functions
  // highlight=false navigates without highlighting (for chapter ranges)
  const goToVerse = useCallback((verseId, strongNum = null, highlight = true) => {
    const [book, chapter, verse] = verseId.split('.')
    setCurrentBook(book)
    setCurrentChapter(parseInt(chapter))
    if (highlight) {
      setSelectedVerse(verseId)
    } else {
      setSelectedVerse(null)
    }
    setHighlightedStrong(strongNum)

    // Update the first passage column, or create one if none exists
    const passageColumn = columns.find(c => c.type === 'passage')
    if (passageColumn) {
      updateColumn(passageColumn.id, { book, chapter: parseInt(chapter), highlightVerse: highlight ? verseId : null })
    } else {
      addColumn('passage', { book, chapter: parseInt(chapter), highlightVerse: highlight ? verseId : null })
    }
  }, [columns, updateColumn, addColumn])

  // Open Strong's column
  const openStrongs = useCallback((strongNum) => {
    // Check if strongs column already exists
    const existing = columns.find(c => c.type === 'strongs')
    if (existing) {
      updateColumn(existing.id, { strongNum })
    } else {
      addColumn('strongs', { strongNum })
    }
  }, [columns, addColumn, updateColumn])

  // Open cross-references column
  const openCrossRefs = useCallback((verseId) => {
    const existing = columns.find(c => c.type === 'crossrefs')
    if (existing) {
      updateColumn(existing.id, { verseId })
    } else {
      addColumn('crossrefs', { verseId })
    }
  }, [columns, addColumn, updateColumn])

  // Open manuscript evidence column
  const openManuscript = useCallback((verseId) => {
    const existing = columns.find(c => c.type === 'manuscript')
    if (existing) {
      updateColumn(existing.id, { verseId })
    } else {
      addColumn('manuscript', { verseId })
    }
  }, [columns, addColumn, updateColumn])

  // Compare two passages side-by-side (for OT→NT quotations)
  const comparePassages = useCallback((otVerseRef, ntVerseRef) => {
    const otParts = otVerseRef.split('.')
    const ntParts = ntVerseRef.split('.')
    if (otParts.length < 3 || ntParts.length < 3) return

    const [otBook, otChapter] = otParts
    const [ntBook, ntChapter] = ntParts
    const otChapterNum = parseInt(otChapter)
    const ntChapterNum = parseInt(ntChapter)

    // Get existing passage columns
    const passageColumns = columns.filter(c => c.type === 'passage')
    const nonPassageColumns = columns.filter(c => c.type !== 'passage')

    // Create two passage columns - OT first (left), NT second (right)
    const newPassageColumns = [
      {
        id: `passage-ot-${Date.now()}`,
        type: 'passage',
        data: { book: otBook, chapter: otChapterNum, highlightVerse: otVerseRef }
      },
      {
        id: `passage-nt-${Date.now() + 1}`,
        type: 'passage',
        data: { book: ntBook, chapter: ntChapterNum, highlightVerse: ntVerseRef }
      }
    ]

    // Replace passage columns, keeping other columns
    setColumns([...newPassageColumns, ...nonPassageColumns.slice(0, 2)])

    // Set the OT verse as selected for highlighting
    setSelectedVerse(otVerseRef)
  }, [columns])

  // Compare multiple passages side-by-side (for parallel passages - up to 4)
  const compareMultiplePassages = useCallback((verseRefs) => {
    if (!verseRefs || verseRefs.length < 2) return

    // Limit to 4 passages
    const refs = verseRefs.slice(0, 4)

    const newPassageColumns = refs.map((ref, index) => {
      const parts = ref.split('.')
      if (parts.length < 3) return null

      const [book, chapter] = parts
      return {
        id: `passage-${index}-${Date.now() + index}`,
        type: 'passage',
        data: { book, chapter: parseInt(chapter), highlightVerse: ref }
      }
    }).filter(Boolean)

    if (newPassageColumns.length < 2) return

    // Get non-passage columns, keep only 1 to stay within 5 column limit
    const nonPassageColumns = columns.filter(c => c.type !== 'passage')
    const keepNonPassage = nonPassageColumns.slice(0, 5 - newPassageColumns.length)

    setColumns([...newPassageColumns, ...keepNonPassage])
    setSelectedVerse(refs[0])
  }, [columns])

  const value = {
    // Loading state
    loading,
    error,

    // Data
    data,
    lookups,

    // Navigation
    currentBook,
    setCurrentBook,
    currentChapter,
    setCurrentChapter,
    selectedVerse,
    setSelectedVerse,
    highlightedStrong,
    setHighlightedStrong,
    goToVerse,

    // Columns
    columns,
    addColumn,
    closeColumn,
    updateColumn,
    reorderColumns,
    clearColumns,

    // Actions
    openStrongs,
    openCrossRefs,
    openManuscript,
    comparePassages,
    compareMultiplePassages,
    showToast,

    // Toast
    toast,

    // Ancient text modal
    ancientTextModal,
    openAncientText,
    closeAncientText
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
