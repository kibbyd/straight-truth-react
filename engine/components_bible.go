package engine

import (
	_ "embed"
	"strings"
)

//go:embed bible_app.css
var bibleAppCSS string

// RegisterBibleComponents registers bible-app atoms, actions, and the home page.
// Called from RegisterApp() in app.go.
func RegisterBibleComponents(e *Engine) {
	e.Register("st-header", ComponentFunc(renderSTHeader))
	e.Register("bible-workspace", ComponentFunc(renderBibleWorkspace))
	RegisterPage("home", nil)
	RegisterBibleActions()
	LoadCatalogData()
}

// ── bible-workspace atom ────────────────────────────────────────────────────
// Empty horizontal-flex container that JS populates with column nodes as the
// user adds columns. Also injects the complete app stylesheet.
func renderBibleWorkspace(props map[string]interface{}, children string, e *Engine) (string, error) {
	var b strings.Builder
	b.WriteString(`<div class="bible-workspace" data-id="workspace"></div>`)
	b.WriteString(`<style>`)
	b.WriteString(bibleAppCSS)
	b.WriteString(`</style>`)
	return b.String(), nil
}

// ── Reference data shared across bible components ──────────────────────────

// BibleBook is a single book's metadata.
type BibleBook struct {
	Abbr     string
	Name     string
	Chapters int
}

// BibleBooks is the canonical ordered list of all 66 books.
var BibleBooks = []BibleBook{
	{"Gen", "Genesis", 50}, {"Exo", "Exodus", 40}, {"Lev", "Leviticus", 27},
	{"Num", "Numbers", 36}, {"Deu", "Deuteronomy", 34}, {"Jos", "Joshua", 24},
	{"Jdg", "Judges", 21}, {"Rut", "Ruth", 4}, {"1Sa", "1 Samuel", 31},
	{"2Sa", "2 Samuel", 24}, {"1Ki", "1 Kings", 22}, {"2Ki", "2 Kings", 25},
	{"1Ch", "1 Chronicles", 29}, {"2Ch", "2 Chronicles", 36}, {"Ezr", "Ezra", 10},
	{"Neh", "Nehemiah", 13}, {"Est", "Esther", 10}, {"Job", "Job", 42},
	{"Psa", "Psalms", 150}, {"Pro", "Proverbs", 31}, {"Ecc", "Ecclesiastes", 12},
	{"Sol", "Song of Solomon", 8}, {"Isa", "Isaiah", 66}, {"Jer", "Jeremiah", 52},
	{"Lam", "Lamentations", 5}, {"Eze", "Ezekiel", 48}, {"Dan", "Daniel", 12},
	{"Hos", "Hosea", 14}, {"Joe", "Joel", 3}, {"Amo", "Amos", 9},
	{"Oba", "Obadiah", 1}, {"Jon", "Jonah", 4}, {"Mic", "Micah", 7},
	{"Nah", "Nahum", 3}, {"Hab", "Habakkuk", 3}, {"Zep", "Zephaniah", 3},
	{"Hag", "Haggai", 2}, {"Zec", "Zechariah", 14}, {"Mal", "Malachi", 4},
	{"Mat", "Matthew", 28}, {"Mar", "Mark", 16}, {"Luk", "Luke", 24},
	{"Joh", "John", 21}, {"Act", "Acts", 28}, {"Rom", "Romans", 16},
	{"1Co", "1 Corinthians", 16}, {"2Co", "2 Corinthians", 13}, {"Gal", "Galatians", 6},
	{"Eph", "Ephesians", 6}, {"Phi", "Philippians", 4}, {"Col", "Colossians", 4},
	{"1Th", "1 Thessalonians", 5}, {"2Th", "2 Thessalonians", 3}, {"1Ti", "1 Timothy", 6},
	{"2Ti", "2 Timothy", 4}, {"Tit", "Titus", 3}, {"Phm", "Philemon", 1},
	{"Heb", "Hebrews", 13}, {"Jam", "James", 5}, {"1Pe", "1 Peter", 5},
	{"2Pe", "2 Peter", 3}, {"1Jo", "1 John", 5}, {"2Jo", "2 John", 1},
	{"3Jo", "3 John", 1}, {"Jud", "Jude", 1}, {"Rev", "Revelation", 22},
}

// ColumnType is one Add Column dropdown entry.
type ColumnType struct {
	Key   string
	Icon  string
	Label string
}

// ColumnTypes enumerates every column type the user can open.
var ColumnTypes = []ColumnType{
	{"passage", "📖", "Passage"},
	{"crossrefs", "🔗", "Cross-References"},
	{"miracles", "✨", "Miracles of Jesus"},
	{"parables", "📖", "Parables of Jesus"},
	{"prayers", "🙏", "Prayers in the Bible"},
	{"namesofgod", "✡️", "Names of God"},
	{"quotations", "📜", "OT → NT Quotations"},
	{"covenants", "🤝", "Covenants"},
	{"festivals", "📅", "Calendar & Festivals"},
	{"familytrees", "🌳", "Family Trees"},
	{"questions", "❓", "Questions"},
	{"glossary", "📚", "Glossary"},
	{"converter", "📏", "Measures & Weights"},
	{"timelines", "📅", "Timelines"},
	{"maps", "🗺️", "Maps & Geography"},
	{"places", "📍", "Places"},
	{"parallels", "⇆", "Parallel Passages"},
	{"peoples", "👥", "Peoples & Cultures"},
	{"religions", "🏛️", "Ancient Religions"},
	{"dailylife", "🏠", "Daily Life"},
	{"archaeology", "🏺", "Archaeology"},
	{"definitions", "📖", "Definitions"},
	{"topical", "🔍", "Topical Study"},
}
