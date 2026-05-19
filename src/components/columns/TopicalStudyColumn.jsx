import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

function TopicalStudyColumn({ columnId, data }) {
  const { data: appData, lookups, goToVerse, openStrongs } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedTopic, setExpandedTopic] = useState(null)

  const topics = appData.topicalIndex || []

  // Helper: look up verse count for a Strong's number (handles padding inconsistency)
  const getVerses = (strongNum) => {
    if (!strongNum) return []
    const upper = strongNum.toUpperCase()
    if (lookups.strongsToVerses[upper]) return lookups.strongsToVerses[upper]

    const prefix = upper[0]
    const numPart = upper.slice(1)
    const padded = prefix + numPart.padStart(4, '0')
    if (lookups.strongsToVerses[padded]) return lookups.strongsToVerses[padded]

    const unpadded = prefix + parseInt(numPart, 10).toString()
    if (lookups.strongsToVerses[unpadded]) return lookups.strongsToVerses[unpadded]

    return []
  }

  // Group topics by English word, sorted alphabetically
  const grouped = useMemo(() => {
    const groups = {}
    topics.forEach((topic, idx) => {
      const key = topic.english
      if (!groups[key]) groups[key] = []
      groups[key].push({ ...topic, _idx: idx })
    })
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]))
  }, [topics])

  // Filter by search query
  const filtered = useMemo(() => {
    if (!searchQuery) return grouped
    const q = searchQuery.toLowerCase()
    return grouped.filter(([english, entries]) =>
      english.toLowerCase().includes(q) ||
      entries.some(e =>
        e.sense?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.translit?.toLowerCase().includes(q) ||
        e.original?.toLowerCase().includes(q) ||
        e.strongs?.some(s => s.toLowerCase().includes(q))
      )
    )
  }, [grouped, searchQuery])

  // Parse verse reference for display
  const parseRef = (ref) => {
    const match = ref.match(/^([^.]+)\.(\d+)\.(\d+)/)
    if (match) {
      const rawVerseId = `${match[1]}.${match[2]}.${match[3]}`
      return {
        display: formatVerseRef(rawVerseId),
        verseId: normalizeVerseId(rawVerseId)
      }
    }
    return { display: ref, verseId: normalizeVerseId(ref) }
  }

  // Get total verse count across all Strong's in an entry
  const getEntryVerseCount = (entry) => {
    const allVerses = new Set()
    for (const s of entry.strongs) {
      getVerses(s).forEach(v => allVerses.add(v))
    }
    return allVerses.size
  }

  // Get all verses for an entry, deduplicated
  const getEntryVerses = (entry) => {
    const allVerses = new Set()
    for (const s of entry.strongs) {
      getVerses(s).forEach(v => allVerses.add(v))
    }
    return Array.from(allVerses)
  }

  const renderEntry = (entry) => {
    const verseCount = getEntryVerseCount(entry)
    const isExpanded = expandedTopic === entry._idx
    const verses = isExpanded ? getEntryVerses(entry) : []

    return (
      <div key={entry._idx} className="topical-entry">
        <div
          className="topical-entry-header"
          onClick={() => setExpandedTopic(isExpanded ? null : entry._idx)}
        >
          <span className="topical-expand-arrow">
            {isExpanded ? '▼' : '▶'}
          </span>
          <div className="topical-entry-info">
            <div className="topical-entry-sense">
              {entry.english} ({entry.sense})
            </div>
            <div className="topical-entry-original">
              {entry.original} — {entry.translit}
            </div>
            <div className="topical-entry-desc">{entry.description}</div>
          </div>
          <span className="topical-entry-count">{verseCount}</span>
        </div>

        {isExpanded && (
          <div className="topical-entry-content">
            {/* Strong's chips */}
            <div className="topical-strongs-row">
              {entry.strongs.map((s, i) => (
                <span
                  key={i}
                  className="topical-strong-chip"
                  onClick={(e) => { e.stopPropagation(); openStrongs(s) }}
                  title={`Open word study for ${s}`}
                >
                  {s}
                </span>
              ))}
            </div>

            {/* Verse list */}
            <div className="topical-verses-list">
              {verses.map((v, i) => {
                const parsed = parseRef(v)
                return (
                  <span
                    key={i}
                    className="topical-verse-link"
                    onClick={() => goToVerse(parsed.verseId, entry.strongs[0], true)}
                  >
                    {parsed.display}
                  </span>
                )
              })}
              {verses.length === 0 && (
                <span className="topical-no-verses">No verses found in current alignment</span>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header" style={{ background: 'linear-gradient(to bottom, #f3e5f5, #e1bee7)', borderColor: '#ce93d8' }}>
        <div className="catalogue-title">Topical Study</div>
        <div className="catalogue-subtitle">What does the Bible say about...</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search topics, e.g. love, spirit, money..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ overflow: 'auto', flex: 1 }}>
        {filtered.map(([english, entries]) => (
          <div key={english} className="topical-group">
            <div className="topical-group-header">
              {english}
              <span className="topical-group-count">{entries.length} {entries.length === 1 ? 'word' : 'words'}</span>
            </div>
            {entries.map(entry => renderEntry(entry))}
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            {searchQuery ? 'No topics match your search' : 'No topics available'}
          </div>
        )}
      </div>
    </div>
  )
}

export default TopicalStudyColumn
