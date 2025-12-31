import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatVerseRef, normalizeVerseId } from '../../data/bibleBooks'

const categoryLabels = {
  empires: 'Major Empires',
  neighbors: 'Neighboring Nations',
  canaan: 'Canaanite Nations',
  nt_era: 'New Testament Era'
}

const categoryOrder = ['empires', 'canaan', 'neighbors', 'nt_era']

function PeoplesCulturesColumn({ columnId, data }) {
  const { data: appData, goToVerse } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(
    Object.fromEntries(categoryOrder.map(c => [c, true]))
  )
  const [expandedPeople, setExpandedPeople] = useState({})

  const peoples = appData.peoplesCultures || []

  // Filter by search
  const filteredPeoples = searchQuery
    ? peoples.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.region.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : peoples

  // Group by category
  const groupedPeoples = {}
  for (const cat of categoryOrder) {
    groupedPeoples[cat] = filteredPeoples.filter(p => p.category === cat)
  }

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const togglePeople = (peopleId) => {
    setExpandedPeople(prev => ({
      ...prev,
      [peopleId]: !prev[peopleId]
    }))
  }

  const handleRefClick = (ref, e) => {
    e.stopPropagation()
    const normalizedRef = normalizeVerseId(ref)
    goToVerse(normalizedRef)
  }

  const totalCount = peoples.length

  return (
    <div className="catalogue-column-content">
      <div className="catalogue-header peoples-header">
        <div className="catalogue-title">Peoples & Cultures</div>
        <div className="catalogue-subtitle">{totalCount} biblical peoples</div>
      </div>

      <div style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>
        <input
          type="text"
          placeholder="Search peoples..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div className="catalogue-list">
        {categoryOrder.map(category => {
          const categoryPeoples = groupedPeoples[category]
          if (categoryPeoples.length === 0) return null

          return (
            <div key={category} className="peoples-category">
              <div
                className="peoples-category-header"
                onClick={() => toggleCategory(category)}
                style={{
                  padding: '12px 15px',
                  background: '#f5f5f5',
                  borderBottom: '1px solid #ddd',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 'bold'
                }}
              >
                <span>{categoryLabels[category]}</span>
                <span style={{ color: '#666', fontSize: '0.9em' }}>
                  {categoryPeoples.length} {expandedCategories[category] ? '▼' : '▶'}
                </span>
              </div>

              {expandedCategories[category] && (
                <div className="peoples-category-items">
                  {categoryPeoples.map((people) => (
                    <div key={people.id} className="people-item">
                      <div
                        className="people-header"
                        onClick={() => togglePeople(people.id)}
                        style={{
                          padding: '12px 15px',
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer',
                          background: expandedPeople[people.id] ? '#f9f9f9' : 'white'
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {people.name}
                          <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px', fontSize: '0.85em' }}>
                            {expandedPeople[people.id] ? '▼' : '▶'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                          {people.region} • {people.period}
                        </div>
                      </div>

                      {expandedPeople[people.id] && (
                        <div className="people-details" style={{ padding: '12px 15px', background: '#fafafa', borderBottom: '1px solid #eee' }}>
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Description</div>
                            <div style={{ fontSize: '0.9em', lineHeight: '1.5' }}>{people.description}</div>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Biblical Role</div>
                            <div style={{ fontSize: '0.9em', lineHeight: '1.5' }}>{people.biblical_role}</div>
                          </div>

                          {people.worldview && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#5c4033' }}>Worldview & Beliefs</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#fff8f0', padding: '10px', borderRadius: '4px', border: '1px solid #e8d8c8' }}>
                                {people.worldview.cosmos && (
                                  <div style={{ marginBottom: '8px' }}><strong>Cosmos:</strong> {people.worldview.cosmos}</div>
                                )}
                                {people.worldview.humanity && (
                                  <div style={{ marginBottom: '8px' }}><strong>Humanity:</strong> {people.worldview.humanity}</div>
                                )}
                                {people.worldview.afterlife && (
                                  <div style={{ marginBottom: '8px' }}><strong>Afterlife:</strong> {people.worldview.afterlife}</div>
                                )}
                                {people.worldview.divine_order && (
                                  <div style={{ marginBottom: '8px' }}><strong>Divine Order:</strong> {people.worldview.divine_order}</div>
                                )}
                                {people.worldview.fertility_cycle && (
                                  <div style={{ marginBottom: '8px' }}><strong>Fertility Cycle:</strong> {people.worldview.fertility_cycle}</div>
                                )}
                                {people.worldview.nature && (
                                  <div style={{ marginBottom: '8px' }}><strong>Nature:</strong> {people.worldview.nature}</div>
                                )}
                                {people.worldview.law && (
                                  <div style={{ marginBottom: '8px' }}><strong>Law:</strong> {people.worldview.law}</div>
                                )}
                                {people.worldview.fate && (
                                  <div style={{ marginBottom: '8px' }}><strong>Fate:</strong> {people.worldview.fate}</div>
                                )}
                                {people.worldview.tribal_identity && (
                                  <div style={{ marginBottom: '8px' }}><strong>Tribal Identity:</strong> {people.worldview.tribal_identity}</div>
                                )}
                                {people.worldview.warfare && (
                                  <div style={{ marginBottom: '8px' }}><strong>Warfare:</strong> {people.worldview.warfare}</div>
                                )}
                                {people.worldview.greek_influence && (
                                  <div style={{ marginBottom: '8px' }}><strong>Greek Influence:</strong> {people.worldview.greek_influence}</div>
                                )}
                                {people.worldview.political && (
                                  <div style={{ marginBottom: '8px' }}><strong>Political:</strong> {people.worldview.political}</div>
                                )}
                                {people.worldview.purity && (
                                  <div style={{ marginBottom: '8px' }}><strong>Purity:</strong> {people.worldview.purity}</div>
                                )}
                                {people.worldview.practical && (
                                  <div style={{ marginBottom: '8px' }}><strong>Practical:</strong> {people.worldview.practical}</div>
                                )}
                                {people.worldview.religious && (
                                  <div style={{ marginBottom: '8px' }}><strong>Religious:</strong> {people.worldview.religious}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {people.social_structure && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#2e5a4c' }}>Social Structure</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#f0f8f5', padding: '10px', borderRadius: '4px', border: '1px solid #d0e8d8' }}>
                                {people.social_structure.hierarchy && (
                                  <div style={{ marginBottom: '8px' }}><strong>Hierarchy:</strong> {people.social_structure.hierarchy}</div>
                                )}
                                {people.social_structure.family && (
                                  <div style={{ marginBottom: '8px' }}><strong>Family:</strong> {people.social_structure.family}</div>
                                )}
                                {people.social_structure.slavery && (
                                  <div style={{ marginBottom: '8px' }}><strong>Slavery:</strong> {people.social_structure.slavery}</div>
                                )}
                                {people.social_structure.political && (
                                  <div style={{ marginBottom: '8px' }}><strong>Political:</strong> {people.social_structure.political}</div>
                                )}
                                {people.social_structure.religious && (
                                  <div style={{ marginBottom: '8px' }}><strong>Religious:</strong> {people.social_structure.religious}</div>
                                )}
                                {people.social_structure.military && (
                                  <div style={{ marginBottom: '8px' }}><strong>Military:</strong> {people.social_structure.military}</div>
                                )}
                                {people.social_structure.classes && (
                                  <div style={{ marginBottom: '8px' }}><strong>Classes:</strong> {people.social_structure.classes}</div>
                                )}
                                {people.social_structure.tribal && (
                                  <div style={{ marginBottom: '8px' }}><strong>Tribal:</strong> {people.social_structure.tribal}</div>
                                )}
                                {people.social_structure.economy && (
                                  <div style={{ marginBottom: '8px' }}><strong>Economy:</strong> {people.social_structure.economy}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {people.customs && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#4a3c6e' }}>Customs & Practices</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#f8f5ff', padding: '10px', borderRadius: '4px', border: '1px solid #e0d8f0' }}>
                                {people.customs.worship && (
                                  <div style={{ marginBottom: '8px' }}><strong>Worship:</strong> {people.customs.worship}</div>
                                )}
                                {people.customs.burial && (
                                  <div style={{ marginBottom: '8px' }}><strong>Burial:</strong> {people.customs.burial}</div>
                                )}
                                {people.customs.marriage && (
                                  <div style={{ marginBottom: '8px' }}><strong>Marriage:</strong> {people.customs.marriage}</div>
                                )}
                                {people.customs.sacrifice && (
                                  <div style={{ marginBottom: '8px' }}><strong>Sacrifice:</strong> {people.customs.sacrifice}</div>
                                )}
                                {people.customs.fertility_rites && (
                                  <div style={{ marginBottom: '8px' }}><strong>Fertility Rites:</strong> {people.customs.fertility_rites}</div>
                                )}
                                {people.customs.festivals && (
                                  <div style={{ marginBottom: '8px' }}><strong>Festivals:</strong> {people.customs.festivals}</div>
                                )}
                                {people.customs.divination && (
                                  <div style={{ marginBottom: '8px' }}><strong>Divination:</strong> {people.customs.divination}</div>
                                )}
                                {people.customs.warfare && (
                                  <div style={{ marginBottom: '8px' }}><strong>Warfare:</strong> {people.customs.warfare}</div>
                                )}
                                {people.customs.trade && (
                                  <div style={{ marginBottom: '8px' }}><strong>Trade:</strong> {people.customs.trade}</div>
                                )}
                                {people.customs.hospitality && (
                                  <div style={{ marginBottom: '8px' }}><strong>Hospitality:</strong> {people.customs.hospitality}</div>
                                )}
                                {people.customs.seafaring && (
                                  <div style={{ marginBottom: '8px' }}><strong>Seafaring:</strong> {people.customs.seafaring}</div>
                                )}
                                {people.customs.crafts && (
                                  <div style={{ marginBottom: '8px' }}><strong>Crafts:</strong> {people.customs.crafts}</div>
                                )}
                                {people.customs.diet && (
                                  <div style={{ marginBottom: '8px' }}><strong>Diet:</strong> {people.customs.diet}</div>
                                )}
                                {people.customs.nomadic && (
                                  <div style={{ marginBottom: '8px' }}><strong>Nomadic Life:</strong> {people.customs.nomadic}</div>
                                )}
                                {people.customs.raiding && (
                                  <div style={{ marginBottom: '8px' }}><strong>Raiding:</strong> {people.customs.raiding}</div>
                                )}
                                {people.customs.circumcision && (
                                  <div style={{ marginBottom: '8px' }}><strong>Circumcision:</strong> {people.customs.circumcision}</div>
                                )}
                                {people.customs.temple && (
                                  <div style={{ marginBottom: '8px' }}><strong>Temple:</strong> {people.customs.temple}</div>
                                )}
                                {people.customs.law && (
                                  <div style={{ marginBottom: '8px' }}><strong>Law:</strong> {people.customs.law}</div>
                                )}
                                {people.customs.taxation && (
                                  <div style={{ marginBottom: '8px' }}><strong>Taxation:</strong> {people.customs.taxation}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {people.values && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '6px', color: '#6e4a3c' }}>Core Values</div>
                              <div style={{ fontSize: '0.85em', lineHeight: '1.6', background: '#fff5f0', padding: '10px', borderRadius: '4px', border: '1px solid #f0d8d0' }}>
                                {people.values.primary && (
                                  <div style={{ marginBottom: '8px' }}><strong>Primary Values:</strong> {people.values.primary}</div>
                                )}
                                {people.values.moral_code && (
                                  <div style={{ marginBottom: '8px' }}><strong>Moral Code:</strong> {people.values.moral_code}</div>
                                )}
                                {people.values.honor && (
                                  <div style={{ marginBottom: '8px' }}><strong>Honor:</strong> {people.values.honor}</div>
                                )}
                                {people.values.tribal && (
                                  <div style={{ marginBottom: '8px' }}><strong>Tribal:</strong> {people.values.tribal}</div>
                                )}
                                {people.values.military && (
                                  <div style={{ marginBottom: '8px' }}><strong>Military:</strong> {people.values.military}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {people.sub_groups && people.sub_groups.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Sub-Groups</div>
                              {people.sub_groups.map((sg, i) => (
                                <div key={i} style={{ fontSize: '0.85em', marginBottom: '4px', paddingLeft: '8px', borderLeft: '2px solid #ddd' }}>
                                  <strong>{sg.name}</strong> - {sg.location}
                                  {sg.note && <div style={{ color: '#666', fontStyle: 'italic' }}>{sg.note}</div>}
                                </div>
                              ))}
                            </div>
                          )}

                          {people.religion && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Religion</div>
                              <div style={{ fontSize: '0.9em', lineHeight: '1.5' }}>{people.religion}</div>
                            </div>
                          )}

                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Key Interactions</div>
                            {people.key_interactions.map((interaction, i) => (
                              <div key={i} style={{ fontSize: '0.85em', marginBottom: '6px', display: 'flex', gap: '8px' }}>
                                <span
                                  className="catalogue-ref-link"
                                  onClick={(e) => handleRefClick(interaction.reference, e)}
                                  style={{
                                    cursor: 'pointer',
                                    color: '#0066cc',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                  }}
                                >
                                  {formatVerseRef(interaction.reference)}
                                </span>
                                <span style={{ color: '#333' }}>{interaction.summary}</span>
                              </div>
                            ))}
                          </div>

                          {people.key_figures && people.key_figures.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontWeight: '500', marginBottom: '4px' }}>Key Figures</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {people.key_figures.map((figure, i) => (
                                  <span
                                    key={i}
                                    style={{
                                      fontSize: '0.85em',
                                      padding: '2px 8px',
                                      background: '#e8f4f8',
                                      borderRadius: '3px'
                                    }}
                                    title={figure.note || ''}
                                  >
                                    {figure.name}
                                    {figure.reference && (
                                      <span
                                        className="catalogue-ref-link"
                                        onClick={(e) => handleRefClick(figure.reference, e)}
                                        style={{ marginLeft: '4px', color: '#0066cc', cursor: 'pointer' }}
                                      >
                                        ({formatVerseRef(figure.reference)})
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>Key References</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {people.references.map((ref, i) => (
                                <span
                                  key={i}
                                  className="catalogue-ref-link"
                                  onClick={(e) => handleRefClick(ref, e)}
                                  style={{
                                    fontSize: '0.85em',
                                    padding: '2px 6px',
                                    background: '#f0f0f0',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    color: '#0066cc'
                                  }}
                                >
                                  {formatVerseRef(ref)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {filteredPeoples.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            No peoples found
          </div>
        )}
      </div>
    </div>
  )
}

export default PeoplesCulturesColumn
