// Load all JSON data files in parallel

const DATA_PATH = '/data'

async function fetchJSON(filename) {
  const response = await fetch(`${DATA_PATH}/${filename}`)
  if (!response.ok) {
    throw new Error(`Failed to load ${filename}: ${response.status}`)
  }
  return response.json()
}

export async function loadAllData() {
  // Load all files in parallel
  const [
    verses,
    strongs,
    connections,
    quotations,
    kings,
    prophets,
    places,
    waters,
    mountains,
    miracles,
    parables,
    prayers,
    namesOfGod,
    covenants,
    festivals,
    familyTrees,
    questions,
    glossary,
    measures,
    ancientTexts,
    timelines,
    maps,
    parallelPassages,
    peoplesCultures,
    ancientReligions,
    dailyLife,
    archaeology,
    definitions
  ] = await Promise.all([
    fetchJSON('bible_verses.json'),
    fetchJSON('strongs_data.json'),
    fetchJSON('verified_connections.json'),
    fetchJSON('ot_nt_quotations.json'),
    fetchJSON('kings_refined.json'),
    fetchJSON('prophets.json'),
    fetchJSON('places.json'),
    fetchJSON('waters.json'),
    fetchJSON('mountains.json'),
    fetchJSON('miracles_jesus.json'),
    fetchJSON('parables_jesus.json'),
    fetchJSON('prayers_bible.json'),
    fetchJSON('names_of_god.json'),
    fetchJSON('covenants.json'),
    fetchJSON('festivals.json'),
    fetchJSON('family_trees.json'),
    fetchJSON('questions.json'),
    fetchJSON('glossary.json'),
    fetchJSON('biblical_measures.json'),
    fetchJSON('ancient_texts.json'),
    fetchJSON('timelines.json'),
    fetchJSON('maps.json'),
    fetchJSON('parallel_passages.json'),
    fetchJSON('peoples_cultures.json'),
    fetchJSON('ancient_religions.json'),
    fetchJSON('daily_life.json'),
    fetchJSON('archaeology.json'),
    fetchJSON('definitions.json')
  ])

  // Process cross-references from connections
  const crossRefs = connections.connections || {}

  return {
    verses,
    strongs,
    crossRefs,
    quotations: quotations.quotations || [],
    kings: kings.kings || [],
    prophets: prophets.prophets || [],
    places: places.places || [],
    waters: waters.waters || [],
    mountains: mountains.mountains || [],
    miracles: miracles.miracles || [],
    parables: parables.parables || [],
    prayers: prayers.prayers || [],
    namesOfGod: namesOfGod.names || [],
    covenants: covenants.covenants || [],
    festivals: {
      calendar: festivals.calendar || {},
      festivals: festivals.festivals || [],
      postExilic: festivals.post_exilic_festivals || []
    },
    familyTrees: {
      persons: familyTrees.persons || [],
      lines: familyTrees.lines || {}
    },
    questions,
    glossary,
    measures: {
      categories: measures.categories || {},
      measures: measures.measures || []
    },
    ancientTexts: ancientTexts.sources || {},
    timelines,
    maps,
    parallelPassages: parallelPassages.parallel_sets || [],
    peoplesCultures: peoplesCultures.peoples || [],
    ancientReligions: ancientReligions.religions || [],
    dailyLife: dailyLife.items || [],
    archaeology: archaeology.items || [],
    definitions: definitions.definitions || []
  }
}
