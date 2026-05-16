package engine

import "fmt"

// Component is the interface every registered component implements
type Component interface {
	Render(props map[string]interface{}, children string, e *Engine) (string, error)
}

// ComponentFunc is a convenience type so you can register plain functions
type ComponentFunc func(props map[string]interface{}, children string, e *Engine) (string, error)

func (f ComponentFunc) Render(props map[string]interface{}, children string, e *Engine) (string, error) {
	return f(props, children, e)
}

// RegisterDefaults loads the starter component library
func RegisterDefaults(e *Engine) {
	// Layout primitives
	e.Register("header", ComponentFunc(renderHeader))
	e.Register("footer", ComponentFunc(renderFooter))
	e.Register("nav", ComponentFunc(renderNav))
	e.Register("nav-link", ComponentFunc(renderNavLink))
	e.Register("container", ComponentFunc(renderContainer))
	e.Register("row", ComponentFunc(renderRow))
	e.Register("col", ComponentFunc(renderCol))
	e.Register("card", ComponentFunc(renderCard))

	// Typography
	e.Register("heading", ComponentFunc(renderHeading))
	e.Register("text", ComponentFunc(renderText))

	// Actions
	e.Register("button", ComponentFunc(renderButton))
	e.Register("icon", ComponentFunc(renderIcon))

	// Data display
	e.Register("stat-card", ComponentFunc(renderStatCard))
	e.Register("table", ComponentFunc(renderTable))
	e.Register("list", ComponentFunc(renderList))
	e.Register("list-item", ComponentFunc(renderListItem))

	// Form
	e.Register("input", ComponentFunc(renderInput))
	e.Register("textarea", ComponentFunc(renderTextarea))
	e.Register("select", ComponentFunc(renderSelect))
	e.Register("autocomplete", ComponentFunc(renderAutocomplete))
	e.Register("checkbox", ComponentFunc(renderCheckbox))
	e.Register("radio", ComponentFunc(renderRadio))
	e.Register("switch", ComponentFunc(renderSwitch))

	// Feedback
	e.Register("alert", ComponentFunc(renderAlert))
	e.Register("badge", ComponentFunc(renderBadge))
	e.Register("chip", ComponentFunc(renderChip))
	e.Register("spinner", ComponentFunc(renderSpinner))
	e.Register("skeleton", ComponentFunc(renderSkeleton))
	e.Register("progress", ComponentFunc(renderProgress))
	e.Register("tooltip", ComponentFunc(renderTooltip))

	// Layout & Navigation
	e.Register("divider", ComponentFunc(renderDivider))
	e.Register("tabs", ComponentFunc(renderTabs))
	e.Register("tab", ComponentFunc(renderTab))
	e.Register("accordion", ComponentFunc(renderAccordion))
	e.Register("accordion-item", ComponentFunc(renderAccordionItem))
	e.Register("modal", ComponentFunc(renderModal))
	e.Register("drawer", ComponentFunc(renderDrawer))
	e.Register("breadcrumb", ComponentFunc(renderBreadcrumb))
	e.Register("breadcrumb-item", ComponentFunc(renderBreadcrumbItem))
	e.Register("pagination", ComponentFunc(renderPagination))

	// Display
	e.Register("avatar", ComponentFunc(renderAvatar))
	e.Register("avatar-group", ComponentFunc(renderAvatarGroup))
	e.Register("empty-state", ComponentFunc(renderEmptyState))
	e.Register("kbd", ComponentFunc(renderKbd))
	e.Register("code", ComponentFunc(renderCode))
	e.Register("code-block", ComponentFunc(renderCodeBlock))
	e.Register("timeline", ComponentFunc(renderTimeline))
	e.Register("timeline-item", ComponentFunc(renderTimelineItem))
	e.Register("rating", ComponentFunc(renderRating))

	// Inputs v2
	e.Register("slider", ComponentFunc(renderSlider))
	e.Register("number-input", ComponentFunc(renderNumberInput))
	e.Register("file-upload", ComponentFunc(renderFileUpload))
	e.Register("tag-input", ComponentFunc(renderTagInput))
	e.Register("date-input", ComponentFunc(renderDateInput))

	// Overlay
	e.Register("menu", ComponentFunc(renderMenu))
	e.Register("menu-item", ComponentFunc(renderMenuItem))
	e.Register("popover", ComponentFunc(renderPopover))

	// Navigation v2
	e.Register("stepper", ComponentFunc(renderStepper))
	e.Register("stepper-step", ComponentFunc(renderStepperStep))
	e.Register("toolbar", ComponentFunc(renderToolbar))

	// Chat
	e.Register("chat-widget", ComponentFunc(renderChatWidget))
	e.Register("data-chat", ComponentFunc(renderDataChat))

	// Content
	e.Register("form", ComponentFunc(renderForm))
	e.Register("carousel", ComponentFunc(renderCarousel))
	e.Register("rich-text", ComponentFunc(renderRichText))

	// Layout v2
	e.Register("sidebar", ComponentFunc(renderSidebar))
	e.Register("section", ComponentFunc(renderSection))

	// Display v2
	e.Register("callout", ComponentFunc(renderCallout))
	e.Register("image", ComponentFunc(renderImage))
	e.Register("link", ComponentFunc(renderLink))

	// Input v3
	e.Register("search", ComponentFunc(renderSearch))
	e.Register("color-input", ComponentFunc(renderColorInput))

	// Overlay v2
	e.Register("snackbar", ComponentFunc(renderSnackbar))
	e.Register("confirm", ComponentFunc(renderConfirm))

	// Charts
	e.Register("chart", ComponentFunc(renderChart))

	// Feedback v2
	e.Register("banner", ComponentFunc(renderBanner))

	// Form v2
	e.Register("form-field", ComponentFunc(renderFormField))
	e.Register("multi-select", ComponentFunc(renderMultiSelect))
	e.Register("native-select", ComponentFunc(renderNativeSelect))

	// Data v2
	e.Register("kv-list", ComponentFunc(renderKvList))
	e.Register("kv-item", ComponentFunc(renderKvItem))

	// Content v2
	e.Register("button-group", ComponentFunc(renderButtonGroup))
	e.Register("copy-button", ComponentFunc(renderCopyButton))
	e.Register("icon-button", ComponentFunc(renderIconButton))
	e.Register("tag", ComponentFunc(renderTag))

	// Data v2
	e.Register("data-grid", ComponentFunc(renderDataGrid))
	e.Register("tree", ComponentFunc(renderTree))
	e.Register("tree-item", ComponentFunc(renderTreeItem))
	e.Register("virtual-list", ComponentFunc(renderVirtualList))

	// Overlay v2
	e.Register("notification", ComponentFunc(renderNotification))
	e.Register("notification-item", ComponentFunc(renderNotificationItem))
	e.Register("command", ComponentFunc(renderCommand))
	e.Register("command-item", ComponentFunc(renderCommandItem))
	e.Register("context-menu", ComponentFunc(renderContextMenu))
	e.Register("hover-card", ComponentFunc(renderHoverCard))

	// Layout v3
	e.Register("split-view", ComponentFunc(renderSplitView))
	e.Register("split-pane", ComponentFunc(renderSplitPane))

	// Media
	e.Register("video", ComponentFunc(renderVideo))
	e.Register("audio", ComponentFunc(renderAudio))
	e.Register("iframe", ComponentFunc(renderIframe))
	e.Register("aspect-ratio", ComponentFunc(renderAspectRatio))

	// Calendar
	e.Register("calendar", ComponentFunc(renderCalendar))
}

// --- Components (Bootstrap 5) ---

func renderHeader(props map[string]interface{}, children string, e *Engine) (string, error) {
	title := propStr(props, "title", "")
	subtitle := propStr(props, "subtitle", "")

	inner := children
	if title != "" {
		sub := ""
		if subtitle != "" {
			sub = fmt.Sprintf(`<p class="text-body-secondary mb-0">%s</p>`, subtitle)
		}
		inner = fmt.Sprintf(`<h1 class="h3 mb-1">%s</h1>%s`, title, sub)
	}

	return fmt.Sprintf(`<div%s>%s</div>`, userAttrs(props, "mb-4 pt-3"), inner), nil
}

func renderText(props map[string]interface{}, children string, e *Engine) (string, error) {
	return fmt.Sprintf(`<p%s>%s</p>`, userAttrs(props, "mb-1"), children), nil
}

func renderButton(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", children)
	action := propStr(props, "on:click", "")
	rawOnclick := propStr(props, "onclick", "")
	variant := propStr(props, "variant", "primary")

	// Map variants to Bootstrap
	bsVariant := variant
	switch variant {
	case "solid":
		bsVariant = "primary"
	case "outline":
		bsVariant = "outline-secondary"
	case "ghost":
		bsVariant = "link"
	}

	size := propStr(props, "size", "")
	sizeClass := ""
	if size == "sm" {
		sizeClass = " btn-sm"
	} else if size == "lg" {
		sizeClass = " btn-lg"
	}

	cls := fmt.Sprintf("btn btn-%s%s", bsVariant, sizeClass)
	props["class"] = cls

	onclick := ""
	typeAttr := ""
	if rawOnclick != "" {
		onclick = fmt.Sprintf(` onclick="%s"`, rawOnclick)
		typeAttr = ` type="button"`
	} else if action != "" {
		onclick = fmt.Sprintf(` onclick="csAction('%s',this)"`, action)
		typeAttr = ` type="button"`
	}

	disabledAttr := ""
	if d, ok := props["disabled"]; ok && d == true {
		disabledAttr = " disabled"
	}

	return fmt.Sprintf(`<button%s%s%s%s>%s</button>`, typeAttr, userAttrs(props, ""), onclick, disabledAttr, label), nil
}

func renderRow(props map[string]interface{}, children string, e *Engine) (string, error) {
	gap := propFloat(props, "gap", 0)
	if gap > 0 {
		existing := propStr(props, "style", "")
		if existing != "" {
			props["style"] = fmt.Sprintf("gap:%dpx;%s", int(gap), existing)
		} else {
			props["style"] = fmt.Sprintf("gap:%dpx", int(gap))
		}
	}
	return fmt.Sprintf(`<div%s>%s</div>`, userAttrs(props, "row g-3 mb-3"), children), nil
}

func renderCol(props map[string]interface{}, children string, e *Engine) (string, error) {
	return fmt.Sprintf(`<div%s>%s</div>`, userAttrs(props, "col"), children), nil
}

func renderContainer(props map[string]interface{}, children string, e *Engine) (string, error) {
	return fmt.Sprintf(`<div%s>%s</div>`, userAttrs(props, "container py-3"), children), nil
}

func renderCard(props map[string]interface{}, children string, e *Engine) (string, error) {
	return fmt.Sprintf(`<div%s><div class="card-body">%s</div></div>`, userAttrs(props, "card mb-3"), children), nil
}

func renderHeading(props map[string]interface{}, children string, e *Engine) (string, error) {
	level := int(propFloat(props, "level", 2))
	if level < 1 || level > 6 {
		level = 2
	}
	return fmt.Sprintf(`<h%d%s>%s</h%d>`, level, userAttrs(props, ""), children, level), nil
}

func renderFooter(props map[string]interface{}, children string, e *Engine) (string, error) {
	return fmt.Sprintf(`<footer%s><hr>%s</footer>`, userAttrs(props, "text-center text-body-secondary py-3 small"), children), nil
}

func renderNav(props map[string]interface{}, children string, e *Engine) (string, error) {
	brand := propStr(props, "brand", "")
	brandHTML := ""
	if brand != "" {
		brandHTML = fmt.Sprintf(`<a class="navbar-brand fw-bold" href="/">%s</a>`, brand)
	}
	return fmt.Sprintf(`<nav class="navbar navbar-expand bg-body-tertiary border-bottom sticky-top mb-0">
  <div class="container-fluid">%s<div class="navbar-nav">%s</div></div></nav>`,
		brandHTML, children), nil
}

func renderNavLink(props map[string]interface{}, children string, e *Engine) (string, error) {
	href := propStr(props, "href", "#")
	return fmt.Sprintf(`<a class="nav-link" href="%s">%s</a>`, href, children), nil
}

func renderStatCard(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	value := propStr(props, "value", "0")
	trend := propStr(props, "trend", "")

	trendHTML := ""
	if trend == "up" {
		trendHTML = `<div class="trend-up">↑</div>`
	} else if trend == "down" {
		trendHTML = `<div class="trend-down">↓</div>`
	}

	return fmt.Sprintf(`<div%s>
  <div class="stat-label">%s</div>
  <div class="stat-value">%s</div>%s
</div>`, userAttrs(props, "cs-stat-card"), label, value, trendHTML), nil
}

// data-chat: Natural language query widget for any MongoDB collection.
// ["data-chat", { "schema": "schemas/tickets.json", "placeholder": "Ask about tickets..." }]
func renderDataChat(props map[string]interface{}, children string, e *Engine) (string, error) {
	schema := propStr(props, "schema", "")
	placeholder := propStr(props, "placeholder", "Ask a question about the data...")
	id := propStr(props, "id", "data-chat")

	return fmt.Sprintf(`<div%s>
  <div class="card">
    <div class="card-header d-flex align-items-center gap-2">
      <i class="bi bi-chat-dots"></i> <strong>Data Query</strong>
    </div>
    <div class="card-body" id="%s-messages" style="height:300px;overflow-y:auto;font-size:0.9rem">
      <div class="text-body-secondary small">Ask questions in plain English. Answers come from the data, not AI guesswork.</div>
    </div>
    <div class="card-footer">
      <div class="input-group">
        <input type="text" class="form-control" id="%s-input" placeholder="%s"
          onkeydown="if(event.key==='Enter'){event.preventDefault();csDataChat('%s','%s')}" />
        <button class="btn btn-outline-secondary" onclick="csDataChat('%s','%s')">
          <i class="bi bi-send"></i>
        </button>
      </div>
    </div>
  </div>
</div>`, userAttrs(props, "mb-3"), id, id, placeholder, id, schema, id, schema), nil
}

// --- Prop helpers ---

// userAttrs extracts style, id, data-id, class (appended) from props and returns an HTML attr string.
// baseClass is the component's own class — user "class" prop is appended to it.
func userAttrs(props map[string]interface{}, baseClass string) string {
	cls := baseClass
	if extra := propStr(props, "class", ""); extra != "" {
		cls += " " + extra
	}
	out := fmt.Sprintf(` class="%s"`, cls)
	if id := propStr(props, "id", ""); id != "" {
		out += fmt.Sprintf(` id="%s"`, id)
	}
	if did := propStr(props, "data-id", ""); did != "" {
		out += fmt.Sprintf(` data-id="%s"`, did)
	}
	if style := propStr(props, "style", ""); style != "" {
		out += fmt.Sprintf(` style="%s"`, style)
	}
	return out
}

func propStr(props map[string]interface{}, key, fallback string) string {
	if v, ok := props[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return fallback
}

// propAnyStr converts any prop value to string — handles int, float, bool, string.
// Returns "" if key is missing. Never silently drops non-string values.
func propAnyStr(props map[string]interface{}, key string) string {
	v, ok := props[key]
	if !ok || v == nil {
		return ""
	}
	switch val := v.(type) {
	case string:
		return val
	case float64:
		if val == float64(int64(val)) {
			return fmt.Sprintf("%d", int64(val))
		}
		return fmt.Sprintf("%g", val)
	case int:
		return fmt.Sprintf("%d", val)
	case bool:
		if val {
			return "true"
		}
		return "false"
	default:
		return fmt.Sprintf("%v", val)
	}
}

func propFloat(props map[string]interface{}, key string, fallback float64) float64 {
	if v, ok := props[key]; ok {
		if f, ok := v.(float64); ok {
			return f
		}
	}
	return fallback
}

func propBool(props map[string]interface{}, key string, fallback bool) bool {
	if v, ok := props[key]; ok {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return fallback
}

// ── Helpers for MUI atoms ───────────────────────────────────────────────

// esc escapes a string for safe HTML attribute output.
func esc(s string) string {
	// Minimal escaping for attribute values
	var out []byte
	for i := 0; i < len(s); i++ {
		switch s[i] {
		case '&':
			out = append(out, []byte("&amp;")...)
		case '<':
			out = append(out, []byte("&lt;")...)
		case '>':
			out = append(out, []byte("&gt;")...)
		case '"':
			out = append(out, []byte("&quot;")...)
		default:
			out = append(out, s[i])
		}
	}
	return string(out)
}

// toString converts any value to string.
func toString(v interface{}) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	return fmt.Sprintf("%v", v)
}

// toInt converts any numeric value to int.
func propInt(props map[string]interface{}, key string, fallback int) int {
	if v, ok := props[key]; ok {
		switch n := v.(type) {
		case float64:
			return int(n)
		case int:
			return n
		case int64:
			return int(n)
		}
	}
	return fallback
}

// toInterfaceSlice converts a value to []interface{}.
func toInterfaceSlice(v interface{}) []interface{} {
	if v == nil {
		return nil
	}
	if s, ok := v.([]interface{}); ok {
		return s
	}
	return nil
}

// bsIcon returns an inline Bootstrap Icon HTML element.
func bsIcon(name string, size int) string {
	if name == "" {
		return ""
	}
	return fmt.Sprintf("<i class=\"bi bi-%s\" style=\"font-size:%dpx\"></i>", name, size)
}

func propVariant(props map[string]interface{}, fallback string) string {
	v := propStr(props, "variant", fallback)
	if buttonVariants[v] {
		return v
	}
	return fallback
}

func propSize(props map[string]interface{}, fallback string) string {
	v := propStr(props, "size", fallback)
	if validSizes[v] {
		return v
	}
	return fallback
}
