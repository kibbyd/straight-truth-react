import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, formatChapterRef, formatChapterRange, normalizeVerseId, normalizeBookAbbr, bookByAbbr, parseHumanVerseRef } from '../../data/bibleBooks'

function QuestionsColumn({ columnId, data }) {
  const { data: appData, goToVerse, openStrongs, openAncientText } = useApp()
  const [expandedCategory, setExpandedCategory] = useState(null)
  const [expandedQuestion, setExpandedQuestion] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const questions = appData.questions || []

  // Group by category
  const groupedQuestions = useMemo(() => {
    const groups = {}
    questions.forEach(q => {
      const cat = q.category || 'Other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(q)
    })
    return groups
  }, [questions])

  // Filter questions by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedQuestions

    const query = searchQuery.toLowerCase()
    const filtered = {}

    Object.entries(groupedQuestions).forEach(([cat, qs]) => {
      const matchingQs = qs.filter(q =>
        q.question.toLowerCase().includes(query) ||
        q.scripture_says?.some(s => s.text.toLowerCase().includes(query)) ||
        q.history_records?.some(h => h.text.toLowerCase().includes(query))
      )
      if (matchingQs.length > 0) {
        filtered[cat] = matchingQs
      }
    })

    return filtered
  }, [groupedQuestions, searchQuery])

  // Parse verse reference - handles multiple formats:
  // - Book.Chapter.Verse (Gen.1.1)
  // - Book.Chapter.Verse-Verse (Gen.1.1-3)
  // - Book.Chapter-Chapter (Exo.7-12) - chapter ranges
  const parseRef = (ref) => {
    // First try Book.Chapter.Verse format
    const verseMatch = ref.match(/^([^.]+)\.(\d+)\.(\d+)/)
    if (verseMatch) {
      const rawVerseId = `${verseMatch[1]}.${verseMatch[2]}.${verseMatch[3]}`
      return {
        display: formatVerseRef(rawVerseId),
        verseId: normalizeVerseId(rawVerseId),
        isChapterRange: false
      }
    }

    // Try Book.Chapter-Chapter format (chapter range)
    const chapterRangeMatch = ref.match(/^([^.]+)\.(\d+)-(\d+)$/)
    if (chapterRangeMatch) {
      const rawVerseId = `${chapterRangeMatch[1]}.${chapterRangeMatch[2]}.1`
      return {
        display: formatChapterRange(chapterRangeMatch[1], chapterRangeMatch[2], chapterRangeMatch[3]),
        verseId: normalizeVerseId(rawVerseId),
        isChapterRange: true
      }
    }

    // Try Book.Chapter format (single chapter)
    const chapterMatch = ref.match(/^([^.]+)\.(\d+)$/)
    if (chapterMatch) {
      const rawVerseId = `${chapterMatch[1]}.${chapterMatch[2]}.1`
      return {
        display: formatChapterRef(chapterMatch[1], chapterMatch[2]),
        verseId: normalizeVerseId(rawVerseId),
        isChapterRange: false
      }
    }

    return { display: ref, verseId: normalizeVerseId(ref), isChapterRange: false }
  }

  const categories = Object.keys(filteredGroups).sort()

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header" style={{ background: 'linear-gradient(to bottom, #fff3e0, #ffe0b2)', borderColor: '#ffcc80' }}>
        <div className="catalogue-title">❓ Questions</div>
        <div className="catalogue-subtitle">{questions.length} questions answered</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ overflow: 'auto', flex: 1 }}>
        {categories.map(category => (
          <div key={category} className="accordion-section">
            <div
              className={`accordion-header ${expandedCategory === category ? 'expanded' : ''}`}
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
            >
              <span className="accordion-icon">▶</span>
              <span className="accordion-title">{category}</span>
              <span className="accordion-count">{filteredGroups[category].length}</span>
            </div>

            {expandedCategory === category && (
              <div className="accordion-content">
                {filteredGroups[category].map((question, qIndex) => (
                  <div key={question.id || qIndex} className="question-item">
                    <div
                      className="question-header"
                      onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                    >
                      <span style={{ color: '#888', marginRight: '6px' }}>
                        {expandedQuestion === question.id ? '▼' : '▶'}
                      </span>
                      <span className="question-title">{question.question}</span>
                    </div>

                    {expandedQuestion === question.id && (
                      <div className="question-content">
                        {question.scripture_says && question.scripture_says.length > 0 && (
                          <div className="question-section">
                            <div className="question-section-title">📖 What Scripture Says</div>
                            {question.scripture_says.map((item, i) => (
                              <div key={i} className="question-point">
                                <div style={{ marginBottom: '8px' }}>{item.text}</div>
                                {item.references && item.references.length > 0 && (
                                  <div className="catalogue-refs" style={{ marginTop: '4px' }}>
                                    {item.references.map((ref, j) => {
                                      const parsed = parseRef(ref)
                                      return (
                                        <span
                                          key={j}
                                          className="catalogue-ref-link"
                                          onClick={(e) => { e.stopPropagation(); goToVerse(parsed.verseId, null, !parsed.isChapterRange); }}
                                        >
                                          {parsed.display}
                                        </span>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.history_records && question.history_records.length > 0 && (
                          <div className="question-section">
                            <div className="question-section-title">📜 What History Records</div>
                            {question.history_records.map((item, i) => (
                              <div key={i} className="question-point">
                                <div>{item.text}</div>
                                {item.sources && item.sources.length > 0 && (
                                  <div className="question-sources">
                                    Sources:{' '}
                                    {item.sources.map((source, j) => (
                                      <span key={j}>
                                        {j > 0 && ', '}
                                        {source.strongs ? (
                                          <span
                                            className="catalogue-strongs-link"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              // Strip "Strong's " prefix if present
                                              const num = source.strongs.replace(/^Strong's\s*/i, '')
                                              openStrongs(num)
                                            }}
                                            style={{ cursor: 'pointer' }}
                                          >
                                            {source.strongs}
                                          </span>
                                        ) : source.id ? (
                                          <span
                                            className="catalogue-source-link"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openAncientText(source.id)
                                            }}
                                            style={{ cursor: 'pointer' }}
                                          >
                                            {source.label || source.id}
                                          </span>
                                        ) : (() => {
                                          // Try dotted format first (e.g., "Gen.1.1")
                                          if (source.text && /^[123]?[A-Z][a-z]{1,2}\.\d+/.test(source.text)) {
                                            const parsed = parseRef(source.text)
                                            return (
                                              <span
                                                className="catalogue-ref-link"
                                                onClick={(e) => { e.stopPropagation(); goToVerse(parsed.verseId, null, !parsed.isChapterRange); }}
                                              >
                                                {parsed.display}
                                              </span>
                                            )
                                          }
                                          // Try human-readable format (e.g., "Jude 1:9")
                                          const humanParsed = parseHumanVerseRef(source.text)
                                          if (humanParsed) {
                                            const parsed = parseRef(humanParsed)
                                            return (
                                              <span
                                                className="catalogue-ref-link"
                                                onClick={(e) => { e.stopPropagation(); goToVerse(parsed.verseId, null, !parsed.isChapterRange); }}
                                              >
                                                {parsed.display}
                                              </span>
                                            )
                                          }
                                          // Fallback to plain text
                                          return <span>{source.label || source.text}</span>
                                        })()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.related_passages && question.related_passages.length > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <strong style={{ fontSize: '13px', color: '#666' }}>Related Passages:</strong>
                            <div className="catalogue-refs" style={{ marginTop: '6px' }}>
                              {question.related_passages.map((ref, i) => {
                                const parsed = parseRef(ref)
                                return (
                                  <span
                                    key={i}
                                    className="catalogue-ref-link"
                                    onClick={(e) => { e.stopPropagation(); goToVerse(parsed.verseId, null, !parsed.isChapterRange); }}
                                  >
                                    {parsed.display}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {categories.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            {searchQuery ? 'No questions match your search' : 'No questions available'}
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionsColumn
