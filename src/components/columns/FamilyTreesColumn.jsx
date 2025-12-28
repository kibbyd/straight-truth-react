import { useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef } from '../../data/bibleBooks'

function FamilyTreesColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const persons = appData.familyTrees || []

  // Create lookup map
  const personMap = useMemo(() => {
    const map = {}
    persons.forEach(p => { map[p.id] = p })
    return map
  }, [persons])

  // Filter persons by search
  const filteredPersons = searchQuery
    ? persons.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : persons

  // Parse verse reference
  const parseRef = (ref) => {
    const match = ref.match(/^([^.]+)\.(\d+)\.(\d+)/)
    if (match) {
      return {
        display: formatVerseRef(`${match[1]}.${match[2]}.${match[3]}`),
        verseId: `${match[1]}.${match[2]}.${match[3]}`
      }
    }
    return { display: ref, verseId: ref }
  }

  // Get person name from ID
  const getPersonName = (id) => {
    return personMap[id]?.name || id
  }

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header" style={{ background: 'linear-gradient(to bottom, #e8f5e9, #c8e6c9)', borderColor: '#a5d6a7' }}>
        <div className="catalogue-title">🌳 Family Trees</div>
        <div className="catalogue-subtitle">{persons.length} persons recorded</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      {selectedPerson ? (
        <div style={{ padding: '15px' }}>
          <button
            onClick={() => setSelectedPerson(null)}
            style={{ marginBottom: '15px', padding: '6px 12px', cursor: 'pointer' }}
          >
            ← Back to list
          </button>

          <h3 style={{ marginBottom: '10px', color: '#333' }}>{selectedPerson.name}</h3>

          {selectedPerson.meaning && (
            <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#666', marginBottom: '12px' }}>
              "{selectedPerson.meaning}"
            </div>
          )}

          {selectedPerson.lifespan?.years && (
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Lifespan:</strong> {selectedPerson.lifespan.years} years
              {selectedPerson.lifespan.ageAtFirstSon && ` (first son at ${selectedPerson.lifespan.ageAtFirstSon})`}
            </div>
          )}

          {selectedPerson.father && (
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>
              <strong>Father:</strong>{' '}
              <span
                style={{ color: '#1976d2', cursor: 'pointer' }}
                onClick={() => personMap[selectedPerson.father] && setSelectedPerson(personMap[selectedPerson.father])}
              >
                {getPersonName(selectedPerson.father)}
              </span>
            </div>
          )}

          {selectedPerson.mother && (
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>
              <strong>Mother:</strong>{' '}
              <span
                style={{ color: '#1976d2', cursor: 'pointer' }}
                onClick={() => personMap[selectedPerson.mother] && setSelectedPerson(personMap[selectedPerson.mother])}
              >
                {getPersonName(selectedPerson.mother)}
              </span>
            </div>
          )}

          {selectedPerson.spouses && selectedPerson.spouses.length > 0 && (
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>
              <strong>Spouse(s):</strong>{' '}
              {selectedPerson.spouses.map((spouse, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  <span
                    style={{ color: '#1976d2', cursor: 'pointer' }}
                    onClick={() => personMap[spouse] && setSelectedPerson(personMap[spouse])}
                  >
                    {getPersonName(spouse)}
                  </span>
                </span>
              ))}
            </div>
          )}

          {selectedPerson.children && selectedPerson.children.length > 0 && (
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>
              <strong>Children:</strong>{' '}
              {selectedPerson.children.map((child, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  <span
                    style={{ color: '#1976d2', cursor: 'pointer' }}
                    onClick={() => personMap[child] && setSelectedPerson(personMap[child])}
                  >
                    {getPersonName(child)}
                  </span>
                </span>
              ))}
            </div>
          )}

          {selectedPerson.notes && (
            <div style={{ fontSize: '14px', color: '#555', marginTop: '10px', marginBottom: '10px' }}>
              {selectedPerson.notes}
            </div>
          )}

          <div className="catalogue-refs" style={{ marginTop: '12px' }}>
            {(selectedPerson.references || []).map((ref, i) => {
              const parsed = parseRef(ref)
              return (
                <span
                  key={i}
                  className="catalogue-ref-link"
                  onClick={() => goToVerse(parsed.verseId)}
                >
                  {parsed.display}
                </span>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="catalogue-list">
          {filteredPersons.map((person, index) => (
            <div
              key={index}
              className="catalogue-item"
              onClick={() => setSelectedPerson(person)}
              style={{ cursor: 'pointer' }}
            >
              <div className="catalogue-item-name">
                {person.name}
                {person.line && (
                  <span style={{ float: 'right', fontSize: '12px', color: '#888' }}>
                    {person.line}
                  </span>
                )}
              </div>
              {person.meaning && (
                <div style={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                  "{person.meaning}"
                </div>
              )}
            </div>
          ))}

          {filteredPersons.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
              No persons found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FamilyTreesColumn
