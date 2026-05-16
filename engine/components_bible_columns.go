package engine

import (
	"fmt"
	"sort"
	"strings"
)

// Column title mapping — matches React Column.jsx exactly.
var columnTitles = map[string]string{
	"passage":     "Bible",
	"strongs":     "Strong's Concordance",
	"crossrefs":   "Cross-References",
	"search":      "Search Results",
	"miracles":    "Miracles of Jesus",
	"parables":    "Parables of Jesus",
	"prayers":     "Prayers in the Bible",
	"namesofgod":  "Names of God",
	"quotations":  "OT → NT Quotations",
	"covenants":   "Biblical Covenants",
	"festivals":   "Calendar & Festivals",
	"familytrees": "Family Trees",
	"questions":   "Questions",
	"glossary":    "Glossary",
	"converter":   "Measures & Weights",
	"timelines":   "Biblical Timelines",
	"maps":        "Maps & Geography",
	"places":      "Places",
	"parallels":   "Parallel Passages",
	"peoples":     "Peoples & Cultures",
	"religions":   "Ancient Religions",
	"dailylife":   "Daily Life",
	"archaeology": "Archaeology",
	"definitions": "Definitions",
	"topical":     "Topical Study",
}

// RenderColumnHTML builds the full column wrapper + content for a given type.
func RenderColumnHTML(colType, colID string) string {
	title := columnTitles[colType]
	if title == "" {
		title = colType
	}
	content := renderColumnContent(colType, colID)
	var b strings.Builder
	b.WriteString(fmt.Sprintf(`<div class="window" data-id="%s" data-type="%s" draggable="true">`, colID, colType))
	b.WriteString(`<div class="window-titlebar">`)
	b.WriteString(fmt.Sprintf(`<div class="window-title">%s</div>`, title))
	b.WriteString(`<div class="window-controls">`)
	b.WriteString(fmt.Sprintf(`<button class="window-btn close" data-col-id="%s">&times;</button>`, colID))
	b.WriteString(`</div></div>`)
	b.WriteString(fmt.Sprintf(`<div class="window-content" data-id="%s-content">`, colID))
	b.WriteString(content)
	b.WriteString(`</div></div>`)
	return b.String()
}

func renderColumnContent(colType, colID string) string {
	switch colType {
	case "passage":
		return renderPassageContent(colID)
	case "strongs":
		return renderStrongsContent(colID)
	case "crossrefs":
		return renderCrossRefsContent(colID)
	case "search":
		return renderSearchContent(colID)
	case "miracles":
		return renderMiraclesContent(colID)
	case "parables":
		return renderParablesContent(colID)
	case "prayers":
		return renderPrayersContent(colID)
	case "namesofgod":
		return renderNamesOfGodContent(colID)
	case "quotations":
		return renderQuotationsContent(colID)
	case "covenants":
		return renderCovenantsContent(colID)
	case "festivals":
		return renderFestivalsContent(colID)
	case "familytrees":
		return renderFamilyTreesContent(colID)
	case "questions":
		return renderQuestionsContent(colID)
	case "glossary":
		return renderGlossaryContent(colID)
	case "converter":
		return renderConverterContent(colID)
	case "timelines":
		return renderTimelinesContent(colID)
	case "maps":
		return renderMapsContent(colID)
	case "places":
		return renderPlacesContent(colID)
	case "parallels":
		return renderParallelsContent(colID)
	case "peoples":
		return renderPeoplesContent(colID)
	case "religions":
		return renderReligionsContent(colID)
	case "dailylife":
		return renderDailyLifeContent(colID)
	case "archaeology":
		return renderArchaeologyContent(colID)
	case "definitions":
		return renderDefinitionsContent(colID)
	case "topical":
		return renderTopicalContent(colID)
	default:
		return `<div class="empty-message">Unknown column type</div>`
	}
}

// ── Helpers ──────────────────────────────────────────────────────────────────

func titleCase(s string) string {
	words := strings.Fields(s)
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + w[1:]
		}
	}
	return strings.Join(words, " ")
}

func catalogItems(catalogKey, arrayKey string) []interface{} {
	data := GetCatalog(catalogKey)
	if data == nil {
		return nil
	}
	if arrayKey == "" {
		if arr, ok := data.([]interface{}); ok {
			return arr
		}
		return nil
	}
	return jArr(data, arrayKey)
}

func writeRefs(b *strings.Builder, refs []interface{}) {
	if len(refs) == 0 {
		return
	}
	b.WriteString(`<div class="catalogue-refs">`)
	for _, r := range refs {
		if s, ok := r.(string); ok {
			b.WriteString(fmt.Sprintf(`<span class="catalogue-ref-link" data-st-ref="%s">%s</span> `, esc(s), esc(s)))
		}
	}
	b.WriteString(`</div>`)
}

func writeSearchBox(b *strings.Builder, placeholder string) {
	b.WriteString(`<div class="questions-search-container">`)
	b.WriteString(fmt.Sprintf(`<input class="questions-search-input" data-st-search type="text" placeholder="%s">`, placeholder))
	b.WriteString(`</div>`)
}

func writeCatalogHeader(b *strings.Builder, cssClass, emoji, title string, count int) {
	hc := "catalogue-header"
	if cssClass != "" {
		hc += " " + cssClass
	}
	b.WriteString(fmt.Sprintf(`<div class="%s">`, hc))
	b.WriteString(fmt.Sprintf(`<div class="catalogue-title">%s %s</div>`, emoji, title))
	b.WriteString(fmt.Sprintf(`<div class="catalogue-subtitle">%d entries</div>`, count))
	b.WriteString(`</div>`)
}

func groupByField(items []interface{}, field string) ([]string, map[string][]interface{}) {
	groups := map[string][]interface{}{}
	var order []string
	seen := map[string]bool{}
	for _, item := range items {
		key := jStr(item, field)
		if key == "" {
			key = "Other"
		}
		if !seen[key] {
			order = append(order, key)
			seen[key] = true
		}
		groups[key] = append(groups[key], item)
	}
	return order, groups
}

func writeAccordionOpen(b *strings.Builder, title string, count int, borderColor string) {
	b.WriteString(`<div class="accordion-section">`)
	style := ""
	if borderColor != "" {
		style = fmt.Sprintf(` style="border-left:4px solid %s"`, borderColor)
	}
	b.WriteString(fmt.Sprintf(`<div class="accordion-header" data-st-accordion%s>`, style))
	b.WriteString(`<span class="accordion-icon">▶</span>`)
	b.WriteString(fmt.Sprintf(`<span class="accordion-title">%s</span>`, esc(title)))
	b.WriteString(fmt.Sprintf(`<span class="accordion-count">%d</span>`, count))
	b.WriteString(`</div>`)
	b.WriteString(`<div class="accordion-content" style="display:none">`)
}

func writeAccordionClose(b *strings.Builder) {
	b.WriteString(`</div></div>`)
}

func writeObjBox(b *strings.Builder, obj map[string]interface{}, title, bgColor string) {
	if obj == nil || len(obj) == 0 {
		return
	}
	b.WriteString(fmt.Sprintf(`<div style="margin:6px 0;padding:8px 12px;background:%s;border-radius:6px;font-size:13px">`, bgColor))
	b.WriteString(fmt.Sprintf(`<strong>%s:</strong>`, esc(title)))
	for k, v := range obj {
		if s, ok := v.(string); ok && s != "" {
			b.WriteString(fmt.Sprintf(`<div style="margin:2px 0;color:#555"><em>%s:</em> %s</div>`, esc(k), esc(s)))
		}
	}
	b.WriteString(`</div>`)
}

// ── Special columns (no catalog data) ────────────────────────────────────────

func renderPassageContent(colID string) string {
	var b strings.Builder
	b.WriteString(`<div class="passage-header-row">`)
	b.WriteString(`<h2 class="passage-header">Genesis 1</h2>`)
	b.WriteString(fmt.Sprintf(`<button class="original-toggle" data-id="%s-interlinear" title="Toggle interlinear view">&#1488;</button>`, colID))
	b.WriteString(`</div>`)
	b.WriteString(fmt.Sprintf(`<div data-id="%s-verses" class="passage-verses">`, colID))
	b.WriteString(`<div class="empty-message" style="height:100%">Loading passage...</div>`)
	b.WriteString(`</div>`)
	return b.String()
}

func renderStrongsContent(colID string) string {
	return fmt.Sprintf(`<div class="strongs-column-content"><div class="strongs-empty" data-id="%s-display">Click a highlighted word in a passage to view Strong's data</div></div>`, colID)
}

func renderCrossRefsContent(colID string) string {
	return fmt.Sprintf(`<div class="crossrefs-column-content"><div class="crossrefs-empty" data-id="%s-display">Click 🔗 next to a verse to view cross-references</div></div>`, colID)
}

func renderSearchContent(colID string) string {
	var b strings.Builder
	b.WriteString(`<div class="search-results-content">`)
	b.WriteString(`<div class="search-header">`)
	b.WriteString(fmt.Sprintf(`<div style="display:flex;gap:8px;align-items:center"><input class="questions-search-input" data-id="%s-search" type="text" placeholder="Search verses..." style="flex:1">`, colID))
	b.WriteString(fmt.Sprintf(`<button class="search-btn" data-id="%s-search-btn">Search</button></div>`, colID))
	b.WriteString(`</div>`)
	b.WriteString(fmt.Sprintf(`<div class="search-results-list" data-id="%s-list"></div>`, colID))
	b.WriteString(`</div>`)
	return b.String()
}

// ── Miracles ─────────────────────────────────────────────────────────────────

func renderMiraclesContent(colID string) string {
	items := catalogItems("miracles", "miracles")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "miracles-header", "✨", "Miracles of Jesus", len(items))
	b.WriteString(`<div class="catalogue-list">`)
	for _, item := range items {
		name, cat, loc := jStr(item, "name"), jStr(item, "category"), jStr(item, "location")
		refs, pars := jArr(item, "references"), jArr(item, "parallels")
		st := strings.ToLower(name + " " + cat + " " + loc)
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-expand data-st-search-text="%s">`, esc(st)))
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s`, esc(name)))
		if cat != "" {
			b.WriteString(fmt.Sprintf(` <span style="float:right;font-size:12px;color:#888;background:#f0f0f0;padding:2px 8px;border-radius:10px">%s</span>`, esc(cat)))
		}
		b.WriteString(`</div>`)
		b.WriteString(`<div data-st-detail style="display:none">`)
		if loc != "" {
			b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#666;margin:4px 0">📍 %s</div>`, esc(loc)))
		}
		writeRefs(&b, refs)
		if len(pars) > 0 {
			b.WriteString(`<div style="font-size:12px;color:#888;margin-top:6px">Parallels: `)
			for _, p := range pars {
				if s, ok := p.(string); ok {
					b.WriteString(fmt.Sprintf(`<span class="catalogue-ref-link" data-st-ref="%s">%s</span> `, esc(s), esc(s)))
				}
			}
			b.WriteString(`</div>`)
		}
		b.WriteString(`</div></div>`)
	}
	b.WriteString(`</div></div>`)
	return b.String()
}

// ── Parables ─────────────────────────────────────────────────────────────────

func renderParablesContent(colID string) string {
	items := catalogItems("parables", "parables")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "parables-header", "📖", "Parables of Jesus", len(items))
	b.WriteString(`<div class="catalogue-list">`)
	for _, item := range items {
		name, theme, loc := jStr(item, "name"), jStr(item, "theme"), jStr(item, "location")
		refs, pars := jArr(item, "references"), jArr(item, "parallels")
		st := strings.ToLower(name + " " + theme + " " + loc)
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-expand data-st-search-text="%s">`, esc(st)))
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s`, esc(name)))
		if theme != "" {
			b.WriteString(fmt.Sprintf(` <span style="float:right;font-size:12px;color:#888;background:#f0f0f0;padding:2px 8px;border-radius:10px">%s</span>`, esc(theme)))
		}
		b.WriteString(`</div>`)
		b.WriteString(`<div data-st-detail style="display:none">`)
		if loc != "" {
			b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#666;margin:4px 0">📍 %s</div>`, esc(loc)))
		}
		writeRefs(&b, refs)
		if len(pars) > 0 {
			b.WriteString(`<div style="font-size:12px;color:#888;margin-top:6px">Parallels: `)
			for _, p := range pars {
				if s, ok := p.(string); ok {
					b.WriteString(fmt.Sprintf(`<span class="catalogue-ref-link" data-st-ref="%s">%s</span> `, esc(s), esc(s)))
				}
			}
			b.WriteString(`</div>`)
		}
		b.WriteString(`</div></div>`)
	}
	b.WriteString(`</div></div>`)
	return b.String()
}

// ── Prayers ──────────────────────────────────────────────────────────────────

func renderPrayersContent(colID string) string {
	items := catalogItems("prayers", "prayers")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "prayers-header", "🙏", "Prayers in the Bible", len(items))
	b.WriteString(`<div class="catalogue-list">`)
	for _, item := range items {
		name, person, ctx, test := jStr(item, "name"), jStr(item, "person"), jStr(item, "context"), jStr(item, "testament")
		refs := jArr(item, "references")
		st := strings.ToLower(name + " " + person + " " + ctx)
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-expand data-st-search-text="%s">`, esc(st)))
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s`, esc(name)))
		if test != "" {
			bg := "#e3f2fd"
			if test == "OT" {
				bg = "#e8f5e9"
			}
			b.WriteString(fmt.Sprintf(` <span style="float:right;font-size:12px;color:#555;background:%s;padding:2px 8px;border-radius:10px">%s</span>`, bg, esc(test)))
		}
		b.WriteString(`</div>`)
		b.WriteString(`<div data-st-detail style="display:none">`)
		if person != "" {
			b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#666;margin:4px 0"><strong>Person:</strong> %s</div>`, esc(person)))
		}
		if ctx != "" {
			b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#666;margin:4px 0"><strong>Context:</strong> %s</div>`, esc(ctx)))
		}
		writeRefs(&b, refs)
		b.WriteString(`</div></div>`)
	}
	b.WriteString(`</div></div>`)
	return b.String()
}

// ── Names of God ─────────────────────────────────────────────────────────────

func renderNamesOfGodContent(colID string) string {
	items := catalogItems("namesofgod", "names")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "namesofgod-header", "✡️", "Names of God", len(items))
	b.WriteString(`<div class="catalogue-list">`)
	for _, item := range items {
		name, lang, meaning, strongs := jStr(item, "name"), jStr(item, "language"), jStr(item, "meaning"), jStr(item, "strongs")
		refs := jArr(item, "references")
		st := strings.ToLower(name + " " + meaning + " " + lang)
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-expand data-st-search-text="%s">`, esc(st)))
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s`, esc(name)))
		lc, lb := "#1565c0", "#e3f2fd"
		if lang == "Greek" {
			lc, lb = "#7b1fa2", "#f3e5f5"
		}
		if lang != "" {
			b.WriteString(fmt.Sprintf(` <span style="float:right;font-size:12px;color:%s;background:%s;padding:2px 8px;border-radius:10px">%s</span>`, lc, lb, esc(lang)))
		}
		b.WriteString(`</div>`)
		b.WriteString(`<div data-st-detail style="display:none">`)
		if meaning != "" {
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item-meaning">"%s"</div>`, esc(meaning)))
		}
		if strongs != "" {
			b.WriteString(fmt.Sprintf(`<span class="catalogue-strongs-link" data-st-strongs="%s">%s</span> `, esc(strongs), esc(strongs)))
		}
		writeRefs(&b, refs)
		b.WriteString(`</div></div>`)
	}
	b.WriteString(`</div></div>`)
	return b.String()
}

// ── Quotations ───────────────────────────────────────────────────────────────

func renderQuotationsContent(colID string) string {
	items := catalogItems("quotations", "quotations")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "quotations-header", "📜", "OT → NT Quotations", len(items))
	writeSearchBox(&b, "Search quotations...")
	b.WriteString(`<div class="catalogue-list">`)
	for _, item := range items {
		ot := jStr(item, "ot")
		nt := jArr(item, "nt")
		st := strings.ToLower(ot)
		for _, n := range nt {
			if s, ok := n.(string); ok {
				st += " " + strings.ToLower(s)
			}
		}
		b.WriteString(fmt.Sprintf(`<div class="quotation-item" data-st-search-text="%s">`, esc(st)))
		b.WriteString(`<div class="quotation-ot"><span class="quotation-label">OT:</span>`)
		b.WriteString(fmt.Sprintf(`<span class="catalogue-ref-link ot-ref" data-st-ref="%s">%s</span></div>`, esc(ot), esc(ot)))
		if len(nt) > 0 {
			b.WriteString(`<div class="quotation-nt"><span class="quotation-label">NT:</span>`)
			for _, n := range nt {
				if s, ok := n.(string); ok {
					b.WriteString(fmt.Sprintf(`<span class="catalogue-ref-link nt-ref" data-st-ref="%s">%s</span> `, esc(s), esc(s)))
				}
			}
			b.WriteString(`</div>`)
		}
		b.WriteString(`</div>`)
	}
	b.WriteString(`</div></div>`)
	return b.String()
}

// ── Covenants ────────────────────────────────────────────────────────────────

func renderCovenantsContent(colID string) string {
	items := catalogItems("covenants", "covenants")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "covenants-header", "🤝", "Biblical Covenants", len(items))
	b.WriteString(`<div class="catalogue-list">`)
	for _, item := range items {
		name, ctx, sign := jStr(item, "name"), jStr(item, "context"), jStr(item, "sign")
		parties, terms, refs := jArr(item, "parties"), jArr(item, "terms"), jArr(item, "references")
		st := strings.ToLower(name + " " + ctx)
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-expand data-st-search-text="%s">`, esc(st)))
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s</div>`, esc(name)))
		b.WriteString(`<div data-st-detail style="display:none">`)
		if len(parties) > 0 {
			var ps []string
			for _, p := range parties {
				if s, ok := p.(string); ok {
					ps = append(ps, s)
				}
			}
			b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#666;margin:4px 0"><strong>Parties:</strong> %s</div>`, esc(strings.Join(ps, ", "))))
		}
		if ctx != "" {
			b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#666;margin:4px 0"><strong>Context:</strong> %s</div>`, esc(ctx)))
		}
		if len(terms) > 0 {
			b.WriteString(`<div style="margin:6px 0"><strong style="font-size:13px">Terms:</strong><ul style="margin:4px 0 4px 20px;font-size:13px;color:#555">`)
			for _, t := range terms {
				if s, ok := t.(string); ok {
					b.WriteString(fmt.Sprintf(`<li>%s</li>`, esc(s)))
				}
			}
			b.WriteString(`</ul></div>`)
		}
		if sign != "" {
			b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#666;margin:4px 0"><strong>Sign:</strong> %s</div>`, esc(sign)))
		}
		writeRefs(&b, refs)
		b.WriteString(`</div></div>`)
	}
	b.WriteString(`</div></div>`)
	return b.String()
}

// ── Festivals ────────────────────────────────────────────────────────────────

func renderFestivalsContent(colID string) string {
	items := catalogItems("festivals", "festivals")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "festivals-header", "📅", "Calendar & Festivals", len(items))
	b.WriteString(`<div class="catalogue-list">`)
	for _, item := range items {
		name, hebrew, date, dur, typ, purpose := jStr(item, "name"), jStr(item, "hebrew"), jStr(item, "date"), jStr(item, "duration"), jStr(item, "type"), jStr(item, "purpose")
		obs, refs := jArr(item, "observances"), jArr(item, "references")
		note := jStr(item, "note")
		st := strings.ToLower(name + " " + hebrew + " " + purpose)
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-expand data-st-search-text="%s">`, esc(st)))
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s</div>`, esc(name)))
		b.WriteString(`<div data-st-detail style="display:none">`)
		if hebrew != "" {
			b.WriteString(fmt.Sprintf(`<div style="font-size:14px;color:#8d6e63;margin:4px 0">%s</div>`, esc(hebrew)))
		}
		var meta []string
		if date != "" {
			meta = append(meta, date)
		}
		if dur != "" {
			meta = append(meta, dur)
		}
		if typ != "" {
			meta = append(meta, typ)
		}
		if len(meta) > 0 {
			b.WriteString(fmt.Sprintf(`<div style="font-size:12px;color:#888;margin:4px 0">%s</div>`, esc(strings.Join(meta, " · "))))
		}
		if purpose != "" {
			b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#555;margin:6px 0">%s</div>`, esc(purpose)))
		}
		if len(obs) > 0 {
			b.WriteString(`<ul style="margin:4px 0 4px 20px;font-size:13px;color:#555">`)
			for _, o := range obs {
				if s, ok := o.(string); ok {
					b.WriteString(fmt.Sprintf(`<li>%s</li>`, esc(s)))
				}
			}
			b.WriteString(`</ul>`)
		}
		if note != "" {
			b.WriteString(fmt.Sprintf(`<div style="font-size:12px;color:#888;font-style:italic;margin:4px 0">%s</div>`, esc(note)))
		}
		writeRefs(&b, refs)
		b.WriteString(`</div></div>`)
	}
	b.WriteString(`</div></div>`)
	return b.String()
}

// ── Family Trees ─────────────────────────────────────────────────────────────

func renderFamilyTreesContent(colID string) string {
	items := catalogItems("familytrees", "persons")
	lineColors := map[string]string{
		"Adam to Jesus": "#4caf50", "Levi": "#1976d2", "Israel": "#ff9800",
		"Judah": "#9c27b0", "David": "#e91e63", "Priests": "#00bcd4",
	}
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "", "🌳", "Family Trees", len(items))
	writeSearchBox(&b, "Search people...")
	order, groups := groupByField(items, "line")
	for _, line := range order {
		persons := groups[line]
		color := lineColors[line]
		if color == "" {
			color = "#757575"
		}
		writeAccordionOpen(&b, line, len(persons), color)
		for _, p := range persons {
			name, meaning, father, notes := jStr(p, "name"), jStr(p, "meaning"), jStr(p, "father"), jStr(p, "notes")
			lifespan := jMap(p, "lifespan")
			refs := jArr(p, "references")
			years := ""
			if lifespan != nil {
				if y, ok := lifespan["years"].(float64); ok && y > 0 {
					years = fmt.Sprintf(" (%d years)", int(y))
				}
			}
			st := strings.ToLower(name + " " + meaning + " " + father + " " + line)
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-expand data-st-search-text="%s">`, esc(st)))
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s%s</div>`, esc(name), years))
			b.WriteString(`<div data-st-detail style="display:none">`)
			if meaning != "" {
				b.WriteString(fmt.Sprintf(`<div class="catalogue-item-meaning">"%s"</div>`, esc(meaning)))
			}
			if father != "" {
				b.WriteString(fmt.Sprintf(`<div class="catalogue-item-details">Son of %s</div>`, esc(father)))
			}
			if notes != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#666;margin:4px 0">%s</div>`, esc(notes)))
			}
			writeRefs(&b, refs)
			b.WriteString(`</div></div>`)
		}
		writeAccordionClose(&b)
	}
	b.WriteString(`</div>`)
	return b.String()
}

// ── Questions ────────────────────────────────────────────────────────────────

func renderQuestionsContent(colID string) string {
	items := catalogItems("questions", "")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "", "❓", "Questions", len(items))
	writeSearchBox(&b, "Search questions...")
	order, groups := groupByField(items, "category")
	for _, cat := range order {
		qs := groups[cat]
		writeAccordionOpen(&b, cat, len(qs), "")
		for _, q := range qs {
			question := jStr(q, "question")
			scriptSays := jArr(q, "scripture_says")
			histRecs := jArr(q, "history_records")
			related := jArr(q, "related_passages")
			st := strings.ToLower(question)
			b.WriteString(fmt.Sprintf(`<div class="question-item" data-st-expand data-st-search-text="%s">`, esc(st)))
			b.WriteString(`<div class="question-header">`)
			b.WriteString(`<span data-st-arrow style="color:#888;font-size:12px">▶</span>`)
			b.WriteString(fmt.Sprintf(`<span class="question-title">%s</span>`, esc(question)))
			b.WriteString(`</div>`)
			b.WriteString(`<div class="question-content" data-st-detail style="display:none">`)
			if len(scriptSays) > 0 {
				b.WriteString(`<div class="question-section"><div class="question-section-title">📖 Scripture Says</div>`)
				for _, ss := range scriptSays {
					text := jStr(ss, "text")
					ssRefs := jArr(ss, "references")
					b.WriteString(fmt.Sprintf(`<div class="question-point">%s</div>`, esc(text)))
					if len(ssRefs) > 0 {
						b.WriteString(`<div class="question-sources">`)
						for _, r := range ssRefs {
							if s, ok := r.(string); ok {
								b.WriteString(fmt.Sprintf(`<span class="catalogue-ref-link" data-st-ref="%s">%s</span> `, esc(s), esc(s)))
							}
						}
						b.WriteString(`</div>`)
					}
				}
				b.WriteString(`</div>`)
			}
			if len(histRecs) > 0 {
				b.WriteString(`<div class="question-section"><div class="question-section-title">📜 History Records</div>`)
				for _, hr := range histRecs {
					text := jStr(hr, "text")
					sources := jArr(hr, "sources")
					b.WriteString(fmt.Sprintf(`<div class="question-point">%s</div>`, esc(text)))
					if len(sources) > 0 {
						b.WriteString(`<div class="question-sources">`)
						for _, s := range sources {
							if str, ok := s.(string); ok {
								b.WriteString(fmt.Sprintf(`<span class="catalogue-ref-link" data-st-ref="%s">%s</span> `, esc(str), esc(str)))
							}
						}
						b.WriteString(`</div>`)
					}
				}
				b.WriteString(`</div>`)
			}
			if len(related) > 0 {
				b.WriteString(`<div class="question-section"><div class="question-section-title">Related Passages</div><div class="catalogue-refs">`)
				for _, r := range related {
					if s, ok := r.(string); ok {
						b.WriteString(fmt.Sprintf(`<span class="catalogue-ref-link" data-st-ref="%s">%s</span> `, esc(s), esc(s)))
					}
				}
				b.WriteString(`</div></div>`)
			}
			b.WriteString(`</div></div>`)
		}
		writeAccordionClose(&b)
	}
	b.WriteString(`</div>`)
	return b.String()
}

// ── Glossary ─────────────────────────────────────────────────────────────────

func renderGlossaryContent(colID string) string {
	items := catalogItems("glossary", "")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "glossary-header", "📚", "Glossary", len(items))
	writeSearchBox(&b, "Search terms...")
	order, groups := groupByField(items, "category")
	for _, cat := range order {
		terms := groups[cat]
		writeAccordionOpen(&b, cat, len(terms), "")
		for _, t := range terms {
			term, simple, expanded := jStr(t, "term"), jStr(t, "simple_definition"), jStr(t, "expanded")
			origLang := jMap(t, "original_language")
			scripRefs := jArr(t, "scripture_references")
			relTerms := jArr(t, "related_terms")
			st := strings.ToLower(term + " " + simple)
			b.WriteString(fmt.Sprintf(`<div class="glossary-item" data-st-expand data-st-search-text="%s">`, esc(st)))
			b.WriteString(`<div><span data-st-arrow style="color:#888;font-size:12px">▶</span>`)
			b.WriteString(fmt.Sprintf(` <span class="glossary-term">%s</span></div>`, esc(term)))
			b.WriteString(`<div class="glossary-content" data-st-detail style="display:none">`)
			if simple != "" {
				b.WriteString(fmt.Sprintf(`<div class="glossary-simple">%s</div>`, esc(simple)))
			}
			if expanded != "" {
				b.WriteString(fmt.Sprintf(`<div class="glossary-expanded">%s</div>`, esc(expanded)))
			}
			if origLang != nil {
				b.WriteString(`<div class="glossary-language">`)
				if heb, ok := origLang["hebrew"].(string); ok && heb != "" {
					b.WriteString(fmt.Sprintf(`<span class="glossary-original">%s</span>`, esc(heb)))
				}
				if grk, ok := origLang["greek"].(string); ok && grk != "" {
					b.WriteString(fmt.Sprintf(`<span class="glossary-original">%s</span>`, esc(grk)))
				}
				if str, ok := origLang["strongs"].(string); ok && str != "" {
					b.WriteString(fmt.Sprintf(`<span class="catalogue-strongs-link" data-st-strongs="%s">%s</span>`, esc(str), esc(str)))
				}
				if mean, ok := origLang["meaning"].(string); ok && mean != "" {
					b.WriteString(fmt.Sprintf(`<span class="glossary-meaning">%s</span>`, esc(mean)))
				}
				b.WriteString(`</div>`)
			}
			if len(scripRefs) > 0 {
				b.WriteString(`<div class="glossary-scriptures">`)
				for _, sr := range scripRefs {
					text, ref := jStr(sr, "text"), jStr(sr, "reference")
					b.WriteString(`<div class="glossary-scripture">`)
					if text != "" {
						b.WriteString(fmt.Sprintf(`<div class="glossary-scripture-text">"%s"</div>`, esc(text)))
					}
					if ref != "" {
						b.WriteString(fmt.Sprintf(`<span class="catalogue-ref-link" data-st-ref="%s">%s</span>`, esc(ref), esc(ref)))
					}
					b.WriteString(`</div>`)
				}
				b.WriteString(`</div>`)
			}
			if len(relTerms) > 0 {
				var rt []string
				for _, r := range relTerms {
					if s, ok := r.(string); ok {
						rt = append(rt, s)
					}
				}
				if len(rt) > 0 {
					b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#888;margin-top:6px">Related: %s</div>`, esc(strings.Join(rt, ", "))))
				}
			}
			b.WriteString(`</div></div>`)
		}
		writeAccordionClose(&b)
	}
	b.WriteString(`</div>`)
	return b.String()
}

// ── Converter ────────────────────────────────────────────────────────────────

func renderConverterContent(colID string) string {
	items := catalogItems("converter", "measures")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "converter-header", "📏", "Measures &amp; Weights", len(items))
	b.WriteString(`<div class="converter-input-section"><div class="converter-row">`)
	b.WriteString(fmt.Sprintf(`<input class="converter-input" data-id="%s-value" type="number" value="1" min="0" step="any">`, colID))
	b.WriteString(fmt.Sprintf(`<select class="converter-select" data-id="%s-unit"><option value="">Select a measure...</option>`, colID))
	for _, item := range items {
		name := jStr(item, "name")
		metric, metricU := jFloat(item, "metric"), jStr(item, "metric_unit")
		imp, impU := jFloat(item, "imperial"), jStr(item, "imperial_unit")
		b.WriteString(fmt.Sprintf(`<option value="%s" data-metric="%g" data-metric-unit="%s" data-imperial="%g" data-imperial-unit="%s">%s</option>`,
			esc(name), metric, esc(metricU), imp, esc(impU), esc(name)))
	}
	b.WriteString(`</select></div>`)
	b.WriteString(fmt.Sprintf(`<div class="converter-result" data-id="%s-result"></div></div>`, colID))
	order, groups := groupByField(items, "category")
	for _, cat := range order {
		measures := groups[cat]
		writeAccordionOpen(&b, cat, len(measures), "")
		for _, m := range measures {
			name, heb, grk := jStr(m, "name"), jStr(m, "hebrew"), jStr(m, "greek")
			metric, metricUnit := jFloat(m, "metric"), jStr(m, "metric_unit")
			imperial, imperialUnit := jFloat(m, "imperial"), jStr(m, "imperial_unit")
			b.WriteString(`<div class="converter-item" data-st-expand>`)
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s</div>`, esc(name)))
			b.WriteString(`<div data-st-detail style="display:none">`)
			if heb != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#1565c0;margin:2px 0">Hebrew: %s</div>`, esc(heb)))
			}
			if grk != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#7b1fa2;margin:2px 0">Greek: %s</div>`, esc(grk)))
			}
			if metric > 0 && metricUnit != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#666;margin:2px 0">≈ %.4g %s</div>`, metric, esc(metricUnit)))
			}
			if imperial > 0 && imperialUnit != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#666;margin:2px 0">≈ %.4g %s</div>`, imperial, esc(imperialUnit)))
			}
			b.WriteString(`</div></div>`)
		}
		writeAccordionClose(&b)
	}
	b.WriteString(`</div>`)
	return b.String()
}

// ── Timelines ────────────────────────────────────────────────────────────────

func renderTimelinesContent(colID string) string {
	data := GetCatalog("timelines")
	if data == nil {
		return `<div class="empty-message">No timeline data</div>`
	}
	dm, ok := data.(map[string]interface{})
	if !ok {
		return `<div class="empty-message">No timeline data</div>`
	}
	var catKeys []string
	for k := range dm {
		if k != "_meta" {
			catKeys = append(catKeys, k)
		}
	}
	sort.Strings(catKeys)
	catIcons := map[string]string{
		"lifespans": "👤", "reigns": "👑", "periods": "📅", "events": "⚡",
		"journeys": "🚶", "constructions": "🏗️", "prophets": "📢",
	}
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "", "📅", "Biblical Timelines", len(catKeys))
	writeSearchBox(&b, "Search timelines...")
	for _, catKey := range catKeys {
		icon := catIcons[catKey]
		if icon == "" {
			icon = "📋"
		}
		catMap, ok := dm[catKey].(map[string]interface{})
		if !ok {
			continue
		}
		totalItems := 0
		var subKeys []string
		for sk := range catMap {
			subKeys = append(subKeys, sk)
			if subArr, ok := catMap[sk].([]interface{}); ok {
				totalItems += len(subArr)
			}
		}
		sort.Strings(subKeys)
		label := icon + " " + titleCase(strings.ReplaceAll(catKey, "_", " "))
		writeAccordionOpen(&b, label, totalItems, "")
		for _, subKey := range subKeys {
			subArr, ok := catMap[subKey].([]interface{})
			if !ok || len(subArr) == 0 {
				continue
			}
			subLabel := titleCase(strings.ReplaceAll(subKey, "_", " "))
			b.WriteString(fmt.Sprintf(`<div style="padding:8px 15px;font-weight:600;font-size:13px;color:#555;background:#f9f9f9;border-bottom:1px solid #eee">%s (%d)</div>`, esc(subLabel), len(subArr)))
			for _, item := range subArr {
				name := jStr(item, "name")
				if name == "" {
					name = jStr(item, "event")
				}
				years := jStr(item, "years")
				date := jStr(item, "date_estimate")
				dur := jFloat(item, "duration_years")
				notes := jStr(item, "notes")
				refs := jArr(item, "references")
				st := strings.ToLower(name + " " + years + " " + date)
				b.WriteString(fmt.Sprintf(`<div class="glossary-item" data-st-expand data-st-search-text="%s">`, esc(st)))
				b.WriteString(fmt.Sprintf(`<div><span data-st-arrow style="color:#888;font-size:12px">▶</span> <span style="font-weight:500">%s</span>`, esc(name)))
				if years != "" {
					b.WriteString(fmt.Sprintf(` <span style="font-size:12px;color:#888;float:right">%s</span>`, esc(years)))
				}
				b.WriteString(`</div>`)
				b.WriteString(`<div class="glossary-content" data-st-detail style="display:none">`)
				if date != "" {
					b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#666">Date: %s</div>`, esc(date)))
				}
				if dur > 0 {
					b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#666">Duration: %d years</div>`, int(dur)))
				}
				if notes != "" {
					b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#555;margin-top:4px">%s</div>`, esc(notes)))
				}
				writeRefs(&b, refs)
				b.WriteString(`</div></div>`)
			}
		}
		writeAccordionClose(&b)
	}
	b.WriteString(`</div>`)
	return b.String()
}

// ── Maps ─────────────────────────────────────────────────────────────────────

func renderMapsContent(colID string) string {
	cats := jArr(GetCatalog("maps"), "categories")
	totalMaps := 0
	for _, c := range cats {
		totalMaps += len(jArr(c, "maps"))
	}
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "", "🗺️", "Maps & Geography", totalMaps)
	writeSearchBox(&b, "Search maps...")
	for _, cat := range cats {
		catName, catIcon := jStr(cat, "name"), jStr(cat, "icon")
		maps := jArr(cat, "maps")
		if catIcon == "" {
			catIcon = "🗺️"
		}
		writeAccordionOpen(&b, catIcon+" "+catName, len(maps), "")
		for _, m := range maps {
			mName, desc, source := jStr(m, "name"), jStr(m, "description"), jStr(m, "source")
			highRes := jBool(m, "highRes")
			st := strings.ToLower(mName + " " + desc)
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-search-text="%s" style="cursor:pointer">`, esc(st)))
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name">%s`, esc(mName)))
			if highRes {
				b.WriteString(` <span style="font-size:10px;color:#4caf50;background:#e8f5e9;padding:1px 6px;border-radius:8px">HD</span>`)
			}
			b.WriteString(`</div>`)
			if desc != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:12px;color:#888">%s</div>`, esc(desc)))
			}
			if source != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:11px;color:#aaa">%s</div>`, esc(source)))
			}
			b.WriteString(`</div>`)
		}
		writeAccordionClose(&b)
	}
	b.WriteString(`</div>`)
	return b.String()
}

// ── Places ───────────────────────────────────────────────────────────────────

func renderPlacesContent(colID string) string {
	items := catalogItems("places", "places")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "", "📍", "Places", len(items))
	writeSearchBox(&b, "Search places...")
	b.WriteString(`<div class="catalogue-list">`)
	for _, item := range items {
		name, desc := jStr(item, "name"), jStr(item, "description")
		refs := jArr(item, "refs")
		coords := jMap(item, "coords")
		st := strings.ToLower(name + " " + desc)
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-expand data-st-search-text="%s">`, esc(st)))
		b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s</div>`, esc(name)))
		b.WriteString(`<div data-st-detail style="display:none">`)
		if desc != "" {
			b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#555;margin:4px 0">%s</div>`, esc(desc)))
		}
		if coords != nil {
			lat, _ := coords["lat"].(float64)
			lng, _ := coords["lng"].(float64)
			if lat != 0 || lng != 0 {
				b.WriteString(fmt.Sprintf(`<div style="font-size:12px;color:#888;margin:4px 0">📍 %.4f, %.4f</div>`, lat, lng))
			}
		}
		writeRefs(&b, refs)
		b.WriteString(`</div></div>`)
	}
	b.WriteString(`</div></div>`)
	return b.String()
}

// ── Parallel Passages ────────────────────────────────────────────────────────

func renderParallelsContent(colID string) string {
	items := catalogItems("parallels", "parallel_sets")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "", "⇆", "Parallel Passages", len(items))
	writeSearchBox(&b, "Search parallel passages...")
	order, groups := groupByField(items, "category")
	for _, cat := range order {
		sets := groups[cat]
		writeAccordionOpen(&b, cat, len(sets), "")
		for _, s := range sets {
			name := jStr(s, "name")
			passages := jArr(s, "passages")
			note := jStr(s, "note")
			st := strings.ToLower(name)
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-search-text="%s">`, esc(st)))
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name">%s</div>`, esc(name)))
			b.WriteString(`<div class="catalogue-refs" style="margin-top:6px">`)
			for _, p := range passages {
				ref := jStr(p, "reference")
				if ref != "" {
					b.WriteString(fmt.Sprintf(`<span class="catalogue-ref-link" data-st-ref="%s" style="background:#e3f2fd">%s</span> `, esc(ref), esc(ref)))
				}
			}
			b.WriteString(`</div>`)
			if note != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:12px;color:#888;font-style:italic;margin-top:4px">%s</div>`, esc(note)))
			}
			b.WriteString(`</div>`)
		}
		writeAccordionClose(&b)
	}
	b.WriteString(`</div>`)
	return b.String()
}

// ── Peoples & Cultures ───────────────────────────────────────────────────────

func renderPeoplesContent(colID string) string {
	items := catalogItems("peoples", "peoples")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "", "👥", "Peoples & Cultures", len(items))
	writeSearchBox(&b, "Search peoples...")
	order, groups := groupByField(items, "category")
	for _, cat := range order {
		peoples := groups[cat]
		writeAccordionOpen(&b, cat, len(peoples), "")
		for _, p := range peoples {
			name, region, period, desc, role := jStr(p, "name"), jStr(p, "region"), jStr(p, "period"), jStr(p, "description"), jStr(p, "biblical_role")
			refs := jArr(p, "references")
			religion := jStr(p, "religion")
			st := strings.ToLower(name + " " + region + " " + period + " " + desc)
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-expand data-st-search-text="%s">`, esc(st)))
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s`, esc(name)))
			if period != "" {
				b.WriteString(fmt.Sprintf(` <span style="float:right;font-size:11px;color:#888">%s</span>`, esc(period)))
			}
			b.WriteString(`</div>`)
			if region != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:12px;color:#888">%s</div>`, esc(region)))
			}
			b.WriteString(`<div data-st-detail style="display:none;border-left:3px solid #1976d2;padding-left:10px;margin-top:6px">`)
			if desc != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#555;margin:6px 0">%s</div>`, esc(desc)))
			}
			if role != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#555;margin:6px 0"><strong>Biblical Role:</strong> %s</div>`, esc(role)))
			}
			if religion != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#555;margin:4px 0"><strong>Religion:</strong> %s</div>`, esc(religion)))
			}
			writeObjBox(&b, jMap(p, "worldview"), "Worldview", "#e8eaf6")
			writeObjBox(&b, jMap(p, "social_structure"), "Social Structure", "#e3f2fd")
			writeObjBox(&b, jMap(p, "customs"), "Customs", "#fff3e0")
			writeObjBox(&b, jMap(p, "values"), "Values", "#e8f5e9")
			writeRefs(&b, refs)
			b.WriteString(`</div></div>`)
		}
		writeAccordionClose(&b)
	}
	b.WriteString(`</div>`)
	return b.String()
}

// ── Ancient Religions ────────────────────────────────────────────────────────

func renderReligionsContent(colID string) string {
	items := catalogItems("religions", "religions")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "", "🏛️", "Ancient Religions", len(items))
	writeSearchBox(&b, "Search religions...")
	order, groups := groupByField(items, "category")
	for _, cat := range order {
		religions := groups[cat]
		writeAccordionOpen(&b, cat, len(religions), "")
		for _, r := range religions {
			name, region, period, desc := jStr(r, "name"), jStr(r, "region"), jStr(r, "period"), jStr(r, "description")
			origins := jMap(r, "origins")
			pantheon := jArr(r, "pantheon")
			refs := jArr(r, "references")
			st := strings.ToLower(name + " " + region + " " + desc)
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-expand data-st-search-text="%s">`, esc(st)))
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s`, esc(name)))
			if period != "" {
				b.WriteString(fmt.Sprintf(` <span style="float:right;font-size:11px;color:#888">%s</span>`, esc(period)))
			}
			b.WriteString(`</div>`)
			if region != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:12px;color:#888">%s</div>`, esc(region)))
			}
			b.WriteString(`<div data-st-detail style="display:none;border-left:3px solid #5c6bc0;padding-left:10px;margin-top:6px">`)
			if desc != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#555;margin:6px 0">%s</div>`, esc(desc)))
			}
			writeObjBox(&b, origins, "Origins", "#f3e5f5")
			if len(pantheon) > 0 {
				b.WriteString(`<div style="margin:6px 0;padding:8px 12px;background:#ffebee;border-radius:6px;font-size:13px"><strong>Pantheon:</strong>`)
				for _, deity := range pantheon {
					dName, dRole, dSymbol := jStr(deity, "name"), jStr(deity, "role"), jStr(deity, "symbol")
					b.WriteString(`<div style="margin:4px 0;padding:4px 8px;background:#fff;border-radius:4px">`)
					b.WriteString(fmt.Sprintf(`<strong>%s</strong>`, esc(dName)))
					if dRole != "" {
						b.WriteString(fmt.Sprintf(` — %s`, esc(dRole)))
					}
					if dSymbol != "" {
						b.WriteString(fmt.Sprintf(` <span style="color:#888">(Symbol: %s)</span>`, esc(dSymbol)))
					}
					biblRefs := jArr(deity, "biblical_refs")
					if len(biblRefs) > 0 {
						b.WriteString(`<div style="margin-top:2px">`)
						for _, br := range biblRefs {
							if s, ok := br.(string); ok {
								b.WriteString(fmt.Sprintf(`<span class="catalogue-ref-link" data-st-ref="%s">%s</span> `, esc(s), esc(s)))
							}
						}
						b.WriteString(`</div>`)
					}
					b.WriteString(`</div>`)
				}
				b.WriteString(`</div>`)
			}
			writeObjBox(&b, jMap(r, "practices"), "Practices", "#e3f2fd")
			writeObjBox(&b, jMap(r, "worldview"), "Worldview", "#e8f5e9")
			writeRefs(&b, refs)
			b.WriteString(`</div></div>`)
		}
		writeAccordionClose(&b)
	}
	b.WriteString(`</div>`)
	return b.String()
}

// ── Daily Life ───────────────────────────────────────────────────────────────

func renderDailyLifeContent(colID string) string {
	items := catalogItems("dailylife", "items")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "", "🏠", "Daily Life", len(items))
	writeSearchBox(&b, "Search daily life...")
	order, groups := groupByField(items, "category")
	for _, cat := range order {
		catItems := groups[cat]
		writeAccordionOpen(&b, cat, len(catItems), "")
		for _, item := range catItems {
			name, period, desc := jStr(item, "name"), jStr(item, "period"), jStr(item, "description")
			details := jMap(item, "details")
			examples := jArr(item, "biblical_examples")
			archEvidence := jStr(item, "archaeological_evidence")
			refs := jArr(item, "references")
			st := strings.ToLower(name + " " + desc + " " + period)
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-expand data-st-search-text="%s">`, esc(st)))
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s`, esc(name)))
			if period != "" {
				b.WriteString(fmt.Sprintf(` <span style="float:right;font-size:11px;color:#888">%s</span>`, esc(period)))
			}
			b.WriteString(`</div>`)
			b.WriteString(`<div data-st-detail style="display:none;border-left:3px solid #4caf50;padding-left:10px;margin-top:6px">`)
			if desc != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#555;margin:6px 0">%s</div>`, esc(desc)))
			}
			writeObjBox(&b, details, "Details", "#e3f2fd")
			if len(examples) > 0 {
				b.WriteString(`<div style="margin:6px 0;font-size:13px"><strong>Biblical Examples:</strong>`)
				for _, ex := range examples {
					ref, exDesc := jStr(ex, "reference"), jStr(ex, "description")
					b.WriteString(`<div style="margin:4px 0;padding:4px 8px;background:#fff;border-radius:4px">`)
					if ref != "" {
						b.WriteString(fmt.Sprintf(`<span class="catalogue-ref-link" data-st-ref="%s">%s</span> `, esc(ref), esc(ref)))
					}
					if exDesc != "" {
						b.WriteString(esc(exDesc))
					}
					b.WriteString(`</div>`)
				}
				b.WriteString(`</div>`)
			}
			if archEvidence != "" {
				b.WriteString(fmt.Sprintf(`<div style="margin:6px 0;padding:8px 12px;background:#efebe9;border-radius:6px;font-size:13px"><strong>Archaeological Evidence:</strong> %s</div>`, esc(archEvidence)))
			}
			writeRefs(&b, refs)
			b.WriteString(`</div></div>`)
		}
		writeAccordionClose(&b)
	}
	b.WriteString(`</div>`)
	return b.String()
}

// ── Archaeology ──────────────────────────────────────────────────────────────

func renderArchaeologyContent(colID string) string {
	items := catalogItems("archaeology", "items")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "", "🏺", "Archaeology", len(items))
	writeSearchBox(&b, "Search archaeology...")
	order, groups := groupByField(items, "category")
	for _, cat := range order {
		catItems := groups[cat]
		writeAccordionOpen(&b, cat, len(catItems), "")
		for _, item := range catItems {
			name, loc, period, disc := jStr(item, "name"), jStr(item, "location"), jStr(item, "period"), jStr(item, "discovered")
			desc, sig := jStr(item, "description"), jStr(item, "significance")
			keyFinds := jArr(item, "key_finds")
			biblConn := jStr(item, "biblical_connection")
			scholNotes := jStr(item, "scholarly_notes")
			curLoc := jStr(item, "current_location")
			refs := jArr(item, "references")
			st := strings.ToLower(name + " " + loc + " " + desc)
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item" data-st-expand data-st-search-text="%s">`, esc(st)))
			b.WriteString(fmt.Sprintf(`<div class="catalogue-item-name"><span data-st-arrow>▶</span> %s`, esc(name)))
			if period != "" {
				b.WriteString(fmt.Sprintf(` <span style="float:right;font-size:11px;color:#888">%s</span>`, esc(period)))
			}
			b.WriteString(`</div>`)
			b.WriteString(`<div data-st-detail style="display:none;border-left:3px solid #8d6e63;padding-left:10px;margin-top:6px">`)
			if disc != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:12px;color:#888;margin:2px 0">Discovered: %s</div>`, esc(disc)))
			}
			if loc != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:12px;color:#888;margin:2px 0">📍 %s</div>`, esc(loc)))
			}
			if desc != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:13px;color:#555;margin:6px 0">%s</div>`, esc(desc)))
			}
			if sig != "" {
				b.WriteString(fmt.Sprintf(`<div style="margin:6px 0;padding:8px 12px;background:#e3f2fd;border-radius:6px;font-size:13px"><strong>Significance:</strong> %s</div>`, esc(sig)))
			}
			if len(keyFinds) > 0 {
				b.WriteString(`<div style="margin:6px 0;padding:8px 12px;background:#efebe9;border-radius:6px;font-size:13px"><strong>Key Finds:</strong>`)
				for _, f := range keyFinds {
					if s, ok := f.(string); ok {
						b.WriteString(fmt.Sprintf(`<div style="margin:2px 0">• %s</div>`, esc(s)))
					} else if m, ok := f.(map[string]interface{}); ok {
						for fk, fv := range m {
							if fs, ok := fv.(string); ok {
								b.WriteString(fmt.Sprintf(`<div style="margin:2px 0"><em>%s:</em> %s</div>`, esc(fk), esc(fs)))
							}
						}
					}
				}
				b.WriteString(`</div>`)
			}
			if biblConn != "" {
				b.WriteString(fmt.Sprintf(`<div style="margin:6px 0;padding:8px 12px;background:#e8f5e9;border-radius:6px;font-size:13px"><strong>Biblical Connection:</strong> %s</div>`, esc(biblConn)))
			}
			if scholNotes != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:12px;color:#888;font-style:italic;margin:4px 0">%s</div>`, esc(scholNotes)))
			}
			if curLoc != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:12px;color:#888;margin:4px 0">📍 Current location: %s</div>`, esc(curLoc)))
			}
			writeRefs(&b, refs)
			b.WriteString(`</div></div>`)
		}
		writeAccordionClose(&b)
	}
	b.WriteString(`</div>`)
	return b.String()
}

// ── Definitions ──────────────────────────────────────────────────────────────

func renderDefinitionsContent(colID string) string {
	items := catalogItems("definitions", "")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "", "📖", "Definitions", len(items))
	writeSearchBox(&b, "Search definitions...")
	b.WriteString(`<div class="catalogue-list">`)
	for _, item := range items {
		term, strongs, original := jStr(item, "term"), jStr(item, "strongs"), jStr(item, "original")
		scripDefs := jArr(item, "scripture_definitions")
		st := strings.ToLower(term + " " + original)
		b.WriteString(fmt.Sprintf(`<div class="definition-item" data-st-expand data-st-search-text="%s">`, esc(st)))
		b.WriteString(`<div class="definition-header">`)
		b.WriteString(`<span data-st-arrow style="color:#888;font-size:12px">▶</span>`)
		b.WriteString(fmt.Sprintf(`<span class="definition-term">%s</span>`, esc(term)))
		if strongs != "" {
			b.WriteString(fmt.Sprintf(`<span class="definition-strongs">%s</span>`, esc(strongs)))
		}
		b.WriteString(`</div>`)
		b.WriteString(`<div class="definition-content" data-st-detail style="display:none">`)
		if original != "" {
			b.WriteString(fmt.Sprintf(`<div class="definition-original">%s</div>`, esc(original)))
		}
		if len(scripDefs) > 0 {
			b.WriteString(`<div class="definition-verses">`)
			for _, sd := range scripDefs {
				text, verse := jStr(sd, "text"), jStr(sd, "verse")
				b.WriteString(`<div class="definition-verse-item">`)
				if text != "" {
					b.WriteString(fmt.Sprintf(`<div class="definition-verse-text">"%s"</div>`, esc(text)))
				}
				if verse != "" {
					b.WriteString(fmt.Sprintf(`<div class="definition-verse-ref">— %s</div>`, esc(verse)))
				}
				b.WriteString(`</div>`)
			}
			b.WriteString(`</div>`)
		}
		b.WriteString(`</div></div>`)
	}
	b.WriteString(`</div></div>`)
	return b.String()
}

// ── Topical Study ────────────────────────────────────────────────────────────

func renderTopicalContent(colID string) string {
	items := catalogItems("topical", "topics")
	var b strings.Builder
	b.WriteString(`<div class="catalogue-column-content">`)
	writeCatalogHeader(&b, "", "🔍", "Topical Study", len(items))
	writeSearchBox(&b, "Search topics...")
	order, groups := groupByField(items, "english")
	for _, eng := range order {
		entries := groups[eng]
		b.WriteString(`<div class="topical-group">`)
		b.WriteString(`<div class="topical-group-header">`)
		b.WriteString(esc(eng))
		b.WriteString(fmt.Sprintf(` <span class="topical-group-count">%d entries</span>`, len(entries)))
		b.WriteString(`</div>`)
		for _, entry := range entries {
			sense, orig, translit, desc := jStr(entry, "sense"), jStr(entry, "original"), jStr(entry, "translit"), jStr(entry, "description")
			strongsArr := jArr(entry, "strongs")
			st := strings.ToLower(eng + " " + sense + " " + orig + " " + desc)
			b.WriteString(fmt.Sprintf(`<div class="topical-entry" data-st-expand data-st-search-text="%s">`, esc(st)))
			b.WriteString(`<div class="topical-entry-header">`)
			b.WriteString(`<span class="topical-expand-arrow" data-st-arrow>▶</span>`)
			b.WriteString(`<div class="topical-entry-info">`)
			if sense != "" {
				b.WriteString(fmt.Sprintf(`<div class="topical-entry-sense">%s</div>`, esc(sense)))
			}
			if orig != "" || translit != "" {
				b.WriteString(`<div class="topical-entry-original">`)
				if orig != "" {
					b.WriteString(esc(orig))
				}
				if translit != "" {
					b.WriteString(fmt.Sprintf(` (%s)`, esc(translit)))
				}
				b.WriteString(`</div>`)
			}
			if desc != "" {
				b.WriteString(fmt.Sprintf(`<div class="topical-entry-desc">%s</div>`, esc(desc)))
			}
			b.WriteString(`</div></div>`)
			b.WriteString(`<div class="topical-entry-content" data-st-detail style="display:none">`)
			if len(strongsArr) > 0 {
				b.WriteString(`<div class="topical-strongs-row">`)
				for _, s := range strongsArr {
					if str, ok := s.(string); ok {
						b.WriteString(fmt.Sprintf(`<span class="topical-strong-chip">%s</span>`, esc(str)))
					}
				}
				b.WriteString(`</div>`)
			}
			b.WriteString(`</div></div>`)
		}
		b.WriteString(`</div>`)
	}
	b.WriteString(`</div>`)
	return b.String()
}
