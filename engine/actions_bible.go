package engine

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"
	"unicode"
)

// RegisterBibleActions registers all action handlers for the Bible app.
func RegisterBibleActions() {
	RegisterAction("column/add", columnAddHandler)
	RegisterAction("passage/load", passageLoadHandler)
	RegisterAction("strongs/lookup", strongsLookupHandler)
	RegisterAction("crossrefs/load", crossRefsLoadHandler)
	RegisterAction("passage/interlinear", interlinearHandler)
	RegisterAction("search/verses", searchVersesHandler)
}

// columnAddHandler renders a column and returns it as a DOM patch appended to the workspace.
func columnAddHandler(w http.ResponseWriter, r *http.Request) ActionResult {
	var req struct {
		Type  string `json:"type"`
		Query string `json:"query,omitempty"`
	}
	if err := DecodeBody(r, &req); err != nil {
		return ActionResult{Error: "Invalid request"}
	}
	if req.Type == "" {
		return ActionResult{Error: "Missing column type"}
	}

	colID := fmt.Sprintf("col-%d", time.Now().UnixNano())
	html := RenderColumnHTML(req.Type, colID)

	return ActionResult{
		Data: map[string]interface{}{
			"target": "workspace",
			"html":   html,
			"append": true,
		},
	}
}

// ── Entity lookup sets ─────────────────────────────────────────────────────

var entitySets struct {
	once     sync.Once
	kings    map[string]bool
	prophets map[string]bool
	places   map[string]bool
	waters   map[string]bool
	mountains map[string]bool
}

func getEntitySets() (kings, prophets, places, waters, mountains map[string]bool) {
	entitySets.once.Do(func() {
		entitySets.kings = buildNameSet("kings", "kings", "name")
		entitySets.prophets = buildNameSet("prophets", "prophets", "name")
		entitySets.places = buildNameSet("places", "places", "name")
		entitySets.waters = buildNameSet("waters", "waters", "name")
		entitySets.mountains = buildNameSet("mountains", "mountains", "name")
	})
	return entitySets.kings, entitySets.prophets, entitySets.places, entitySets.waters, entitySets.mountains
}

func buildNameSet(catalogKey, arrayKey, nameField string) map[string]bool {
	items := catalogItems(catalogKey, arrayKey)
	set := make(map[string]bool, len(items))
	for _, item := range items {
		name := jStr(item, nameField)
		if name != "" {
			set[name] = true
			// Also add first word for multi-word names (e.g. "Sea of Galilee" → "Sea")
			parts := strings.Fields(name)
			if len(parts) > 0 {
				set[parts[0]] = true
			}
		}
		// Also handle alternate names if present
		for _, alt := range jArr(item, "alternateNames") {
			if s, ok := alt.(string); ok && s != "" {
				set[s] = true
			}
		}
	}
	return set
}

func entityIcons(word string) string {
	kings, prophets, places, waters, mountains := getEntitySets()
	clean := strings.TrimFunc(word, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsDigit(r)
	})
	if clean == "" {
		return ""
	}
	var icons string
	if kings[clean] {
		icons += "👑"
	}
	if prophets[clean] {
		icons += "📜"
	}
	if places[clean] {
		icons += "📍"
	}
	if waters[clean] {
		icons += "💧"
	}
	if mountains[clean] {
		icons += "⛰️"
	}
	return icons
}

// ── Passage rendering ──────────────────────────────────────────────────────

// passageLoadHandler fetches verses from bbolt and returns rendered HTML.
func passageLoadHandler(w http.ResponseWriter, r *http.Request) ActionResult {
	var req struct {
		Book    string `json:"book"`
		Chapter int    `json:"chapter"`
		ColID   string `json:"colId"`
	}
	if err := DecodeBody(r, &req); err != nil {
		return ActionResult{Error: "Invalid request"}
	}
	if req.Book == "" || req.Chapter < 1 || req.ColID == "" {
		return ActionResult{Error: "Missing book, chapter, or colId"}
	}

	// Look up book name for the header
	bookName := req.Book
	for _, bk := range BibleBooks {
		if bk.Abbr == req.Book {
			bookName = bk.Name
			break
		}
	}

	// Query bbolt
	s := GetBinarySchema("verses")
	if s == nil {
		return ActionResult{Error: "Verse data not loaded"}
	}

	verses, err := s.BinaryFind(map[string]interface{}{
		"book":    req.Book,
		"chapter": req.Chapter,
	})
	if err != nil {
		return ActionResult{Error: "Query error: " + err.Error()}
	}

	// Render verses HTML with Strong's markup, entity icons, and cross-ref indicators
	var b strings.Builder
	for _, v := range verses {
		vNum := int(jFloat(v, "verse"))
		text := jStr(v, "text")
		verseRef := fmt.Sprintf("%s.%d.%d", req.Book, req.Chapter, vNum)

		// Build verse HTML with markup
		markedUp := renderVerseWithMarkup(text, verseRef)

		// Cross-ref indicator
		crossRefHTML := ""
		if hasCrossRefs(verseRef) {
			crossRefHTML = fmt.Sprintf(`<span class="connection-indicator" data-st-crossref="%s" title="View cross-references">🔗</span>`, verseRef)
		}

		b.WriteString(fmt.Sprintf(`<div class="verse" data-verse="%s">%s<span class="verse-num">%d</span> %s</div>`,
			verseRef, crossRefHTML, vNum, markedUp))
	}

	if b.Len() == 0 {
		b.WriteString(`<div class="empty-message">No verses found</div>`)
	}

	// Return patch: update content
	header := fmt.Sprintf(`<h2 class="passage-header">%s %d</h2><button class="original-toggle" data-col-id="%s" title="Toggle interlinear view">&#1488;</button>`,
		esc(bookName), req.Chapter, req.ColID)

	return ActionResult{
		Data: []interface{}{
			map[string]interface{}{
				"target": req.ColID + "-content",
				"html": fmt.Sprintf(`<div class="passage-header-row">%s</div><div data-id="%s-verses" class="passage-verses">%s</div>`,
					header, req.ColID, b.String()),
			},
		},
	}
}

// renderVerseWithMarkup applies Strong's highlighting and entity icons to verse text.
func renderVerseWithMarkup(text, verseRef string) string {
	words := strings.Fields(text)
	if len(words) == 0 {
		return esc(text)
	}

	// Get alignment data for this verse
	alignment := GetStrongsAlignment(verseRef)

	// Apply corrections — build set of positions to remove
	corrections := GetStrongsCorrections(verseRef)
	removeSet := map[int]map[string]bool{} // pos → set of strong numbers to remove
	if corrections != nil {
		for _, rem := range jArr(corrections, "remove") {
			pos := int(jFloat(rem, "pos"))
			sn := jStr(rem, "strong")
			if removeSet[pos] == nil {
				removeSet[pos] = map[string]bool{}
			}
			removeSet[pos][sn] = true
		}
	}

	// Build position → Strong's number map (after corrections)
	posMap := map[int]string{} // word position → Strong's number
	for _, entry := range alignment {
		pos := int(jFloat(entry, "pos"))
		sn := jStr(entry, "strong")
		if sn == "" {
			continue
		}
		// Skip if this position+strong is in the correction removal set
		if removeSet[pos] != nil && removeSet[pos][sn] {
			continue
		}
		posMap[pos] = sn
	}

	// Render each word
	var b strings.Builder
	for i, word := range words {
		pos := i + 1 // alignment positions are 1-based
		strongNum := posMap[pos]
		icons := entityIcons(word)

		if strongNum != "" {
			// Word has Strong's alignment
			b.WriteString(fmt.Sprintf(`<span class="hl strongs" data-strong="%s">%s`, strongNum, esc(word)))
			if icons != "" {
				b.WriteString(fmt.Sprintf(`<span class="role-icons">%s</span>`, icons))
			}
			b.WriteString(`</span>`)
		} else if icons != "" {
			// Word has entity icons but no Strong's
			b.WriteString(fmt.Sprintf(`<span class="entity-word">%s<span class="role-icons">%s</span></span>`, esc(word), icons))
		} else {
			b.WriteString(esc(word))
		}

		if i < len(words)-1 {
			b.WriteString(" ")
		}
	}

	return b.String()
}

// ── Strong's lookup ────────────────────────────────────────────────────────

func strongsLookupHandler(w http.ResponseWriter, r *http.Request) ActionResult {
	var req struct {
		Strong string `json:"strong"`
		ColID  string `json:"colId"`
	}
	if err := DecodeBody(r, &req); err != nil {
		return ActionResult{Error: "Invalid request"}
	}
	if req.Strong == "" {
		return ActionResult{Error: "Missing Strong's number"}
	}

	entry := GetStrongsEntry(req.Strong)
	if entry == nil {
		return ActionResult{Error: "Strong's entry not found: " + req.Strong}
	}

	original := jStr(entry, "original")
	translit := jStr(entry, "translit")
	gloss := jStr(entry, "gloss")
	meaning := jStr(entry, "meaning")

	lang := "Hebrew"
	langColor := "#1565c0"
	if strings.HasPrefix(req.Strong, "G") {
		lang = "Greek"
		langColor = "#7b1fa2"
	}

	var b strings.Builder
	b.WriteString(`<div class="strongs-entry">`)
	// Number + language badge
	b.WriteString(`<div class="strongs-number" style="display:flex;align-items:center;gap:8px">`)
	b.WriteString(fmt.Sprintf(`<span style="font-size:18px;font-weight:700;color:%s">%s</span>`, langColor, esc(req.Strong)))
	b.WriteString(fmt.Sprintf(`<span style="font-size:12px;padding:2px 8px;border-radius:10px;background:%s22;color:%s">%s</span>`, langColor, langColor, lang))
	b.WriteString(`</div>`)
	// Original + transliteration
	if original != "" {
		b.WriteString(fmt.Sprintf(`<div class="strongs-original" style="font-size:28px;text-align:center;margin:12px 0;color:%s">%s</div>`, langColor, esc(original)))
	}
	if translit != "" {
		b.WriteString(fmt.Sprintf(`<div style="text-align:center;font-style:italic;color:#888;margin-bottom:12px">%s</div>`, esc(translit)))
	}
	// Gloss
	if gloss != "" {
		b.WriteString(fmt.Sprintf(`<div style="font-size:16px;font-weight:600;margin:8px 0">"%s"</div>`, esc(gloss)))
	}
	// Full meaning
	if meaning != "" {
		b.WriteString(fmt.Sprintf(`<div class="strongs-meaning" style="font-size:13px;color:#555;line-height:1.6;margin:8px 0;white-space:pre-wrap">%s</div>`, esc(meaning)))
	}
	b.WriteString(`</div>`)

	// Target the Strong's column display area
	target := req.ColID + "-display"
	if req.ColID == "" {
		target = "strongs-display"
	}

	return ActionResult{
		Data: map[string]interface{}{
			"target": target,
			"html":   b.String(),
		},
	}
}

// ── Cross-references ───────────────────────────────────────────────────────

// hasCrossRefs checks if a verse has cross-reference connections.
func hasCrossRefs(verseRef string) bool {
	data := GetCatalog("crossrefs")
	if data == nil {
		return false
	}
	connections := jMap(data, "connections")
	if connections == nil {
		return false
	}
	arr, ok := connections[verseRef].([]interface{})
	return ok && len(arr) > 0
}

// getCrossRefs returns the cross-reference connections for a verse.
func getCrossRefs(verseRef string) []interface{} {
	data := GetCatalog("crossrefs")
	if data == nil {
		return nil
	}
	connections := jMap(data, "connections")
	if connections == nil {
		return nil
	}
	if arr, ok := connections[verseRef].([]interface{}); ok {
		return arr
	}
	return nil
}

func crossRefsLoadHandler(w http.ResponseWriter, r *http.Request) ActionResult {
	var req struct {
		Verse string `json:"verse"`
		ColID string `json:"colId"`
	}
	if err := DecodeBody(r, &req); err != nil {
		return ActionResult{Error: "Invalid request"}
	}
	if req.Verse == "" {
		return ActionResult{Error: "Missing verse reference"}
	}

	refs := getCrossRefs(req.Verse)

	var b strings.Builder
	b.WriteString(`<div class="crossrefs-results">`)
	b.WriteString(fmt.Sprintf(`<div style="font-size:14px;font-weight:600;margin-bottom:8px;color:#1976d2">Cross-References for %s</div>`, esc(formatVerseRef(req.Verse))))

	if len(refs) == 0 {
		b.WriteString(`<div class="empty-message">No cross-references found</div>`)
	} else {
		for _, ref := range refs {
			target := jStr(ref, "target")
			typ := jStr(ref, "type")
			evidence := jStr(ref, "evidence")
			relationship := jStr(ref, "relationship")

			// Type badge colors
			typeColor := "#666"
			switch typ {
			case "SCRIPTURE_QUOTE":
				typeColor = "#1976d2"
			case "SAME_PERSON":
				typeColor = "#7b1fa2"
			case "SAME_PLACE":
				typeColor = "#2e7d32"
			case "GENEALOGY":
				typeColor = "#e65100"
			case "TEXT_MATCH":
				typeColor = "#00838f"
			}

			b.WriteString(`<div style="margin:6px 0;padding:8px 12px;background:#f8f9fa;border-radius:6px;border-left:3px solid ` + typeColor + `">`)
			b.WriteString(fmt.Sprintf(`<div style="display:flex;align-items:center;gap:8px"><span class="catalogue-ref-link" data-st-ref="%s" style="font-weight:600">%s</span>`,
				esc(target), esc(formatVerseRef(target))))
			if relationship != "" {
				b.WriteString(fmt.Sprintf(`<span style="font-size:11px;color:#888">(%s)</span>`, esc(relationship)))
			}
			b.WriteString(fmt.Sprintf(`<span style="font-size:11px;padding:1px 6px;border-radius:8px;background:%s22;color:%s">%s</span>`,
				typeColor, typeColor, esc(strings.ReplaceAll(typ, "_", " "))))
			b.WriteString(`</div>`)
			if evidence != "" {
				b.WriteString(fmt.Sprintf(`<div style="font-size:12px;color:#666;margin-top:4px">%s</div>`, esc(evidence)))
			}
			b.WriteString(`</div>`)
		}
	}
	b.WriteString(`</div>`)

	target := req.ColID + "-display"
	if req.ColID == "" {
		target = "crossrefs-display"
	}

	return ActionResult{
		Data: map[string]interface{}{
			"target": target,
			"html":   b.String(),
		},
	}
}

// formatVerseRef converts "Gen.1.1" → "Genesis 1:1" for display.
func formatVerseRef(ref string) string {
	parts := strings.Split(ref, ".")
	if len(parts) < 2 {
		return ref
	}
	bookName := parts[0]
	for _, bk := range BibleBooks {
		if bk.Abbr == parts[0] {
			bookName = bk.Name
			break
		}
	}
	if len(parts) == 2 {
		return bookName + " " + parts[1]
	}
	return bookName + " " + parts[1] + ":" + parts[2]
}

// ── Interlinear mode ───────────────────────────────────────────────────────

func interlinearHandler(w http.ResponseWriter, r *http.Request) ActionResult {
	var req struct {
		Book    string `json:"book"`
		Chapter int    `json:"chapter"`
		ColID   string `json:"colId"`
	}
	if err := DecodeBody(r, &req); err != nil {
		return ActionResult{Error: "Invalid request"}
	}
	if req.Book == "" || req.Chapter < 1 || req.ColID == "" {
		return ActionResult{Error: "Missing book, chapter, or colId"}
	}

	s := GetBinarySchema("verses")
	if s == nil {
		return ActionResult{Error: "Verse data not loaded"}
	}

	verses, err := s.BinaryFind(map[string]interface{}{
		"book":    req.Book,
		"chapter": req.Chapter,
	})
	if err != nil {
		return ActionResult{Error: "Query error: " + err.Error()}
	}

	var b strings.Builder
	for _, v := range verses {
		vNum := int(jFloat(v, "verse"))
		text := jStr(v, "text")
		verseRef := fmt.Sprintf("%s.%d.%d", req.Book, req.Chapter, vNum)

		b.WriteString(fmt.Sprintf(`<div class="verse interlinear-verse" data-verse="%s">`, verseRef))
		b.WriteString(fmt.Sprintf(`<span class="verse-num">%d</span> `, vNum))
		b.WriteString(`<span class="interlinear-row">`)

		words := strings.Fields(text)
		alignment := GetStrongsAlignment(verseRef)
		posMap := map[int]string{}
		for _, entry := range alignment {
			pos := int(jFloat(entry, "pos"))
			sn := jStr(entry, "strong")
			if sn != "" {
				posMap[pos] = sn
			}
		}

		for i, word := range words {
			pos := i + 1
			strongNum := posMap[pos]
			translit := ""

			if strongNum != "" {
				entry := GetStrongsEntry(strongNum)
				if entry != nil {
					translit = jStr(entry, "translit")
				}
			}

			hasStrongs := strongNum != ""
			cellClass := "interlinear-cell"
			if hasStrongs {
				cellClass += " has-strongs"
			}

			b.WriteString(fmt.Sprintf(`<span class="%s">`, cellClass))
			if hasStrongs {
				b.WriteString(fmt.Sprintf(`<span class="hl strongs" data-strong="%s">%s</span>`, strongNum, esc(word)))
			} else {
				b.WriteString(esc(word))
			}
			if translit != "" {
				b.WriteString(fmt.Sprintf(`<span class="interlinear-translit">%s</span>`, esc(translit)))
			} else {
				b.WriteString(`<span class="interlinear-translit">&nbsp;</span>`)
			}
			b.WriteString(`</span>`)

			if i < len(words)-1 {
				b.WriteString(" ")
			}
		}

		b.WriteString(`</span></div>`)
	}

	return ActionResult{
		Data: map[string]interface{}{
			"target": req.ColID + "-verses",
			"html":   b.String(),
		},
	}
}

// ── Search ─────────────────────────────────────────────────────────────────

func searchVersesHandler(w http.ResponseWriter, r *http.Request) ActionResult {
	var req struct {
		Query string `json:"query"`
		ColID string `json:"colId"`
	}
	if err := DecodeBody(r, &req); err != nil {
		return ActionResult{Error: "Invalid request"}
	}
	query := strings.TrimSpace(req.Query)
	if query == "" {
		return ActionResult{Error: "Empty search query"}
	}

	s := GetBinarySchema("verses")
	if s == nil {
		return ActionResult{Error: "Verse data not loaded"}
	}

	// Full scan of all verses
	all, err := s.BinaryFindAll()
	if err != nil {
		return ActionResult{Error: "Query error: " + err.Error()}
	}

	queryLower := strings.ToLower(query)
	// Escape regex special chars for highlighting
	escaped := regexp.QuoteMeta(query)
	highlightRe, _ := regexp.Compile("(?i)(" + escaped + ")")

	var results []map[string]interface{}
	for _, v := range all {
		text := jStr(v, "text")
		if strings.Contains(strings.ToLower(text), queryLower) {
			results = append(results, v)
			if len(results) >= 200 {
				break
			}
		}
	}

	var b strings.Builder
	b.WriteString(fmt.Sprintf(`<div class="search-results-header" style="font-size:13px;color:#888;margin-bottom:8px">Found %d results for "%s"</div>`, len(results), esc(query)))

	for _, v := range results {
		book := jStr(v, "book")
		chapter := int(jFloat(v, "chapter"))
		verse := int(jFloat(v, "verse"))
		text := jStr(v, "text")
		ref := fmt.Sprintf("%s.%d.%d", book, chapter, verse)

		// Highlight matching text
		highlighted := highlightRe.ReplaceAllString(esc(text), `<mark>$1</mark>`)

		b.WriteString(fmt.Sprintf(`<div class="search-result-item" data-st-ref="%s" style="padding:8px 12px;margin:4px 0;border-radius:6px;cursor:pointer;border-left:3px solid transparent">`, ref))
		b.WriteString(fmt.Sprintf(`<div style="font-size:12px;font-weight:600;color:#1976d2;margin-bottom:2px">%s</div>`, esc(formatVerseRef(ref))))
		b.WriteString(fmt.Sprintf(`<div style="font-size:13px;line-height:1.5">%s</div>`, highlighted))
		b.WriteString(`</div>`)
	}

	if len(results) == 0 {
		b.WriteString(`<div class="empty-message">No matching verses found</div>`)
	}

	return ActionResult{
		Data: map[string]interface{}{
			"target": req.ColID + "-list",
			"html":   b.String(),
		},
	}
}
