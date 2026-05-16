package engine

import (
	"fmt"
	"strings"
)

// renderSTHeader renders the app header — exact carbon copy of the React Header.jsx.
// Reads BibleBooks and ColumnTypes directly from Go package data.
func renderSTHeader(props map[string]interface{}, children string, e *Engine) (string, error) {
	var b strings.Builder

	b.WriteString(`<div class="st-header">`)

	// Brand section
	b.WriteString(`<div class="brand">`)
	b.WriteString(`<div class="brand-logo">📖</div>`)
	b.WriteString(`<div class="brand-text">`)
	b.WriteString(`<div class="brand-name">Straight Truth</div>`)
	b.WriteString(`<div class="brand-tagline">Evidence-Based Bible Study</div>`)
	b.WriteString(`</div></div>`)

	// Divider
	b.WriteString(`<div class="header-divider"></div>`)

	// Book / Chapter selects
	b.WriteString(`<div class="toolbar-section">`)

	// Book select
	b.WriteString(`<select class="toolbar-select" data-id="book-select">`)
	for _, bk := range BibleBooks {
		sel := ""
		if bk.Abbr == "Gen" {
			sel = ` selected`
		}
		b.WriteString(fmt.Sprintf(`<option value="%s"%s>%s</option>`, bk.Abbr, sel, bk.Name))
	}
	b.WriteString(`</select>`)

	// Chapter select (defaults to Genesis = 50 chapters)
	b.WriteString(`<select class="toolbar-select" data-id="chapter-select">`)
	for i := 1; i <= 50; i++ {
		sel := ""
		if i == 1 {
			sel = ` selected`
		}
		b.WriteString(fmt.Sprintf(`<option value="%d"%s>Chapter %d</option>`, i, sel, i))
	}
	b.WriteString(`</select>`)
	b.WriteString(`</div>`)

	// Divider
	b.WriteString(`<div class="header-divider"></div>`)

	// Search
	b.WriteString(`<div class="toolbar-section">`)
	b.WriteString(`<div class="search-container">`)
	b.WriteString(`<input class="search-input" data-id="search-input" type="text" placeholder="Search verses...">`)
	b.WriteString(`<button class="search-btn" data-id="search-btn">Search</button>`)
	b.WriteString(`</div></div>`)

	// Flex spacer
	b.WriteString(`<div style="flex:1"></div>`)

	// Add Column dropdown + Clear button
	b.WriteString(`<div class="toolbar-section">`)
	b.WriteString(`<select class="add-column-btn" data-id="add-column">`)
	b.WriteString(`<option value="">+ Add Column</option>`)
	for _, ct := range ColumnTypes {
		b.WriteString(fmt.Sprintf(`<option value="%s">%s %s</option>`, ct.Key, ct.Icon, ct.Label))
	}
	b.WriteString(`</select>`)
	b.WriteString(`<button class="clear-btn" data-id="clear-btn" title="Clear all columns and start fresh">Clear</button>`)
	b.WriteString(`</div>`)

	b.WriteString(`</div>`) // close .st-header
	return b.String(), nil
}
