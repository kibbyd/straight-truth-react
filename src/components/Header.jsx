import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { bibleBooks } from '../data/bibleBooks'

function Header() {
  const {
    currentBook,
    setCurrentBook,
    currentChapter,
    setCurrentChapter,
    columns,
    addColumn,
    updateColumn,
    clearColumns
  } = useApp()

  const [searchQuery, setSearchQuery] = useState('')

  // Get current book data
  const currentBookData = bibleBooks.find(b => b.abbr === currentBook) || bibleBooks[0]

  // Handle book change
  const handleBookChange = (e) => {
    const newBook = e.target.value
    setCurrentBook(newBook)
    setCurrentChapter(1)

    // Update first passage column
    const passageColumn = columns.find(c => c.type === 'passage')
    if (passageColumn) {
      updateColumn(passageColumn.id, { book: newBook, chapter: 1 })
    }
  }

  // Handle chapter change
  const handleChapterChange = (e) => {
    const newChapter = parseInt(e.target.value)
    if (newChapter) {
      setCurrentChapter(newChapter)

      // Update first passage column
      const passageColumn = columns.find(c => c.type === 'passage')
      if (passageColumn) {
        updateColumn(passageColumn.id, { chapter: newChapter })
      }
    }
  }

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      addColumn('search', { query: searchQuery.trim() })
    }
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Handle add column
  const handleAddColumn = (e) => {
    const type = e.target.value
    if (type) {
      addColumn(type)
      e.target.value = '' // Reset select
    }
  }

  // Generate chapter options
  const chapterOptions = []
  for (let i = 1; i <= currentBookData.chapters; i++) {
    chapterOptions.push(
      <option key={i} value={i}>Chapter {i}</option>
    )
  }

  return (
    <div className="header">
      <div className="brand">
        <div className="brand-logo">📖</div>
        <div>
          <div className="brand-name">Straight Truth</div>
          <div className="brand-tagline">Evidence-Based Bible Study</div>
        </div>
      </div>

      <div className="header-divider"></div>

      <div className="toolbar-section">
        <select
          className="toolbar-select"
          value={currentBook}
          onChange={handleBookChange}
        >
          {bibleBooks.map(book => (
            <option key={book.abbr} value={book.abbr}>
              {book.name}
            </option>
          ))}
        </select>

        <select
          className="toolbar-select"
          value={currentChapter}
          onChange={handleChapterChange}
        >
          <option value="">Chapter...</option>
          {chapterOptions}
        </select>
      </div>

      <div className="header-divider"></div>

      <div className="toolbar-section">
        <div className="search-container">
          <input
            id="searchInput"
            type="text"
            placeholder="Search verses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button className="search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }}></div>

      <div className="toolbar-section">
        <select className="add-column-btn" onChange={handleAddColumn} value="">
          <option value="">+ Add Column</option>
          <option value="passage">📖 Passage</option>
          <option value="crossrefs">🔗 Cross-References</option>
          <option value="notes">📝 Notes</option>
          <option value="miracles">✨ Miracles of Jesus</option>
          <option value="parables">📖 Parables of Jesus</option>
          <option value="prayers">🙏 Prayers in the Bible</option>
          <option value="namesofgod">✡️ Names of God</option>
          <option value="quotations">📜 OT → NT Quotations</option>
          <option value="covenants">🤝 Covenants</option>
          <option value="festivals">📅 Calendar & Festivals</option>
          <option value="familytrees">🌳 Family Trees</option>
          <option value="questions">❓ Questions</option>
          <option value="glossary">📚 Glossary</option>
          <option value="converter">📏 Measures & Weights</option>
          <option value="timelines">📅 Timelines</option>
          <option value="maps">🗺️ Maps & Geography</option>
          <option value="places">📍 Places</option>
          <option value="parallels">⇆ Parallel Passages</option>
          <option value="peoples">👥 Peoples & Cultures</option>
          <option value="religions">🏛️ Ancient Religions</option>
          <option value="dailylife">🏠 Daily Life</option>
          <option value="archaeology">🏺 Archaeology</option>
          <option value="definitions">📖 Definitions</option>
          <option value="topical">🔍 Topical Study</option>
        </select>
        <button
          className="clear-btn"
          onClick={clearColumns}
          title="Clear all columns and start fresh"
        >
          Clear
        </button>
      </div>
    </div>
  )
}

export default Header
