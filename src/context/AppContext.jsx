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
    measures: { categories: {}, measures: [] }
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

  // Column state
  const [columns, setColumns] = useState([
    { id: 'passage-1', type: 'passage', data: { book: 'Gen', chapter: 1 } }
  ])

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '' })

  // Load all data on mount
  useEffect(() => {
    async function init() {
      try {
        const loadedData = await loadAllData()
        setData(loadedData)

        // Build lookup sets
        const kingNames = new Set(loadedData.kings.map(k => k.name))
        const prophetNames = new Set(loadedData.prophets.map(p => p.name))
        const placeNames = new Set(loadedData.places.map(p => p.name))
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
        const savedLayout = localStorage.getItem('straight-truth-layout')
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
      localStorage.setItem('straight-truth-layout', JSON.stringify({
        columns,
        currentBook,
        currentChapter
      }))
    }
  }, [columns, currentBook, currentChapter, loading])

  // Column management functions
  const addColumn = useCallback((type, columnData = {}) => {
    // Max 4 columns
    if (columns.length >= 4) {
      showToast('Maximum 4 columns allowed')
      return
    }

    // For most types, only allow one instance
    const singleInstanceTypes = ['crossrefs', 'notes', 'miracles', 'parables', 'prayers',
      'namesofgod', 'quotations', 'covenants', 'festivals', 'familytrees',
      'questions', 'glossary', 'converter', 'strongs']

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

  // Toast function
  const showToast = useCallback((message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }, [])

  // Navigation functions
  const goToVerse = useCallback((verseId) => {
    const [book, chapter, verse] = verseId.split('.')
    setCurrentBook(book)
    setCurrentChapter(parseInt(chapter))
    setSelectedVerse(verseId)

    // Update the first passage column
    const passageColumn = columns.find(c => c.type === 'passage')
    if (passageColumn) {
      updateColumn(passageColumn.id, { book, chapter: parseInt(chapter) })
    }
  }, [columns, updateColumn])

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
    goToVerse,

    // Columns
    columns,
    addColumn,
    closeColumn,
    updateColumn,
    reorderColumns,

    // Actions
    openStrongs,
    openCrossRefs,
    showToast,

    // Toast
    toast
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
