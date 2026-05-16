package engine

import (
	"fmt"
	"strconv"
	"strings"
)

// ─── Divider ──────────────────────────────────────────────────────────────────
// ["divider"] or ["divider", { "label": "OR" }]
func renderDivider(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", children)
	if label != "" {
		return fmt.Sprintf(`<div class="d-flex align-items-center my-2"><hr class="flex-grow-1"><span class="mx-2 text-body-secondary small">%s</span><hr class="flex-grow-1"></div>`, label), nil
	}
	return `<hr class="my-2">`, nil
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
// ["tabs", { "id": "t1" },
//   ["tab", { "label": "Overview", "panel": "ov" }, "Content here"],
//   ["tab", { "label": "Details", "panel": "dt" }, "Details here"]
// ]
func renderTabs(props map[string]interface{}, children string, e *Engine) (string, error) {
	dataID := propStr(props, "data-id", "tabs")
	return fmt.Sprintf(`<div class="cs-tabs" data-id="%s">%s</div>`, dataID, children), nil
}

// renderTabGroup renders the full tabs structure with trigger bar + panels
// Tab children are collected and split into triggers + panels
func renderTabSet(props map[string]interface{}, children string, e *Engine) (string, error) {
	dataID := propStr(props, "data-id", "tabset")
	return fmt.Sprintf(`<div class="cs-tabs" data-id="%s">%s</div>`, dataID, children), nil
}

// ─── Tab ──────────────────────────────────────────────────────────────────────
// Must be child of tabs. First tab is active by default.
// ["tab", { "label": "Overview", "panel": "ov", "active": true }, "Content"]
func renderTab(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "Tab")
	panel := propStr(props, "panel", label)
	active := propBool(props, "active", false)
	dataID := propStr(props, "data-id", "tab--"+panel)

	triggerClass := "cs-tab"
	if active {
		triggerClass += " cs-tab--active"
	}

	panelClass := "cs-tab-panel"
	if active {
		panelClass += " cs-tab-panel--active"
	}

	// Render trigger + panel together; tabs container uses CSS to separate them
	return fmt.Sprintf(`<button class="%s" data-tab-trigger="%s" data-id="%s">%s</button>
<div class="%s" data-tab-panel="%s">%s</div>`,
		triggerClass, panel, dataID, label,
		panelClass, panel, children), nil
}

// ─── Accordion ────────────────────────────────────────────────────────────────
// ["accordion",
//   ["accordion-item", { "title": "Question?" }, "Answer here"]
// ]
func renderAccordion(props map[string]interface{}, children string, e *Engine) (string, error) {
	dataID := propStr(props, "data-id", "accordion")
	return fmt.Sprintf(`<div class="cs-accordion" data-id="%s">%s</div>`, dataID, children), nil
}

func renderAccordionItem(props map[string]interface{}, children string, e *Engine) (string, error) {
	title := propStr(props, "title", "")
	open := propBool(props, "open", false)
	dataID := propStr(props, "data-id", "accordion-item")

	cls := "cs-accordion-item"
	bodyStyle := "max-height:0;overflow:hidden;"
	if open {
		cls += " cs-accordion-item--open"
		bodyStyle = "max-height:none;overflow:hidden;"
	}

	return fmt.Sprintf(`<div class="%s" data-id="%s">
  <button class="cs-accordion-trigger" data-accordion-trigger>
    <span>%s</span>
    <span class="cs-accordion-icon">&#9660;</span>
  </button>
  <div class="cs-accordion-body" style="%s">
    <div class="cs-accordion-content">%s</div>
  </div>
</div>`, cls, dataID, title, bodyStyle, children), nil
}

// ─── Modal ────────────────────────────────────────────────────────────────────
// ["modal", { "id": "confirm", "title": "Confirm Action" }, ...children]
// Triggered via: ["button", { "on:click": "modal:confirm" }]
func renderModal(props map[string]interface{}, children string, e *Engine) (string, error) {
	id := propStr(props, "id", "modal")
	title := propStr(props, "title", "")
	size := propStr(props, "size", "md") // sm | md | lg | full
	dataID := propStr(props, "data-id", "modal--"+id)

	titleHTML := ""
	if title != "" {
		titleHTML = fmt.Sprintf(`<div class="cs-modal__header">
    <h2 class="cs-modal__title">%s</h2>
    <button class="cs-modal__close" data-modal-close="%s" aria-label="Close">&#10005;</button>
  </div>`, title, id)
	}

	return fmt.Sprintf(`<div class="cs-modal" id="modal-%s" data-id="%s">
  <div class="cs-modal__backdrop"></div>
  <div class="cs-modal__dialog cs-modal__dialog--%s">
    %s
    <div class="cs-modal__body">%s</div>
  </div>
</div>`, id, dataID, size, titleHTML, children), nil
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
// ["drawer", { "id": "settings", "title": "Settings", "side": "right" }, ...children]
// Triggered via: ["button", { "on:click": "drawer:settings" }]
func renderDrawer(props map[string]interface{}, children string, e *Engine) (string, error) {
	id := propStr(props, "id", "drawer")
	title := propStr(props, "title", "")
	side := propStr(props, "side", "right") // left | right
	dataID := propStr(props, "data-id", "drawer--"+id)

	titleHTML := ""
	if title != "" {
		titleHTML = fmt.Sprintf(`<div class="cs-drawer__header">
    <h2 class="cs-drawer__title">%s</h2>
    <button class="cs-drawer__close" data-drawer-close="%s" aria-label="Close">&#10005;</button>
  </div>`, title, id)
	}

	return fmt.Sprintf(`<div class="cs-drawer cs-drawer--%s" id="drawer-%s" data-id="%s">
  <div class="cs-drawer__backdrop"></div>
  <div class="cs-drawer__panel">
    %s
    <div class="cs-drawer__body">%s</div>
  </div>
</div>`, side, id, dataID, titleHTML, children), nil
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
// ["breadcrumb",
//   ["breadcrumb-item", { "href": "/" }, "Home"],
//   ["breadcrumb-item", "Current Page"]
// ]
func renderBreadcrumb(props map[string]interface{}, children string, e *Engine) (string, error) {
	dataID := propStr(props, "data-id", "breadcrumb")
	return fmt.Sprintf(`<nav class="cs-breadcrumb" aria-label="Breadcrumb" data-id="%s">
  <ol class="cs-breadcrumb__list">%s</ol>
</nav>`, dataID, children), nil
}

func renderBreadcrumbItem(props map[string]interface{}, children string, e *Engine) (string, error) {
	href := propStr(props, "href", "")
	dataID := propStr(props, "data-id", "breadcrumb-item")

	content := children
	if href != "" {
		content = fmt.Sprintf(`<a class="cs-breadcrumb__link" href="%s">%s</a>`, href, children)
	}

	return fmt.Sprintf(`<li class="cs-breadcrumb__item" data-id="%s">%s</li>`, dataID, content), nil
}

// ─── SplitView ────────────────────────────────────────────────────────────────
// ["split-view", { "id": "sp1", "direction": "horizontal", "default-size": 30 },
//   ["split-pane", {}, "Left content"],
//   ["split-pane", {}, "Right content"]
// ]
// JS injects the draggable divider between split-panes on DOMContentLoaded.
// direction: horizontal (left/right) | vertical (top/bottom)
func renderSplitView(props map[string]interface{}, children string, e *Engine) (string, error) {
	return fmt.Sprintf(`<div%s>%s</div>`, userAttrs(props, "d-flex"), children), nil
}

func renderSplitPane(props map[string]interface{}, children string, e *Engine) (string, error) {
	return fmt.Sprintf(`<div%s>%s</div>`, userAttrs(props, ""), children), nil
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
// ["sidebar", { "brand": "MyApp" },
//   ["nav-link", { "href": "/page/dashboard" }, "Dashboard"],
//   ["nav-link", { "href": "/page/settings" }, "Settings"]
// ]
func renderSidebar(props map[string]interface{}, children string, e *Engine) (string, error) {
	brand := propStr(props, "brand", "")
	dataID := propStr(props, "data-id", "sidebar")

	brandHTML := ""
	if brand != "" {
		brandHTML = fmt.Sprintf(`<div class="cs-sidebar__brand">%s</div>`, brand)
	}

	return fmt.Sprintf(`<aside class="cs-sidebar" data-id="%s">
  %s
  <nav class="cs-sidebar__nav">%s</nav>
</aside>`, dataID, brandHTML, children), nil
}

// ─── Section ──────────────────────────────────────────────────────────────────
// ["section", { "title": "Overview", "description": "Key metrics at a glance" }, ...children]
func renderSection(props map[string]interface{}, children string, e *Engine) (string, error) {
	title := propStr(props, "title", "")
	description := propStr(props, "description", "")
	dataID := propStr(props, "data-id", "section")

	titleHTML := ""
	if title != "" {
		titleHTML = fmt.Sprintf(`<h2 class="cs-section__title">%s</h2>`, title)
	}
	descHTML := ""
	if description != "" {
		descHTML = fmt.Sprintf(`<p class="cs-section__desc">%s</p>`, description)
	}
	headerHTML := ""
	if title != "" || description != "" {
		headerHTML = fmt.Sprintf(`<div class="cs-section__header">%s%s</div>`, titleHTML, descHTML)
	}

	return fmt.Sprintf(`<section class="cs-section" data-id="%s">%s<div class="cs-section__body">%s</div></section>`,
		dataID, headerHTML, children), nil
}

// ─── Pagination ───────────────────────────────────────────────────────────────
// ["pagination", { "total": 100, "page": 3, "per-page": 10, "on:change": "paginate" }]
func renderPagination(props map[string]interface{}, children string, e *Engine) (string, error) {
	total := int(propFloat(props, "total", 0))
	page := int(propFloat(props, "page", 1))
	perPage := int(propFloat(props, "per-page", 10))
	action := propStr(props, "on:change", "")
	dataID := propStr(props, "data-id", "pagination")

	if perPage <= 0 {
		perPage = 10
	}
	totalPages := (total + perPage - 1) / perPage
	if totalPages <= 0 {
		totalPages = 1
	}

	onclick := func(p int) string {
		if action != "" {
			return fmt.Sprintf(` onclick="csAction('%s:%d',this)"`, action, p)
		}
		return ""
	}

	var pages strings.Builder

	// Prev
	prevDisabled := ""
	if page <= 1 {
		prevDisabled = " cs-pagination__btn--disabled"
	}
	pages.WriteString(fmt.Sprintf(`<button class="cs-pagination__btn%s"%s>&#8249;</button>`, prevDisabled, onclick(page-1)))

	// Pages (show up to 7 with ellipsis)
	for i := 1; i <= totalPages; i++ {
		if totalPages > 7 {
			if i != 1 && i != totalPages && (i < page-2 || i > page+2) {
				if i == page-3 || i == page+3 {
					pages.WriteString(`<span class="cs-pagination__ellipsis">…</span>`)
				}
				continue
			}
		}
		activeClass := ""
		if i == page {
			activeClass = " cs-pagination__btn--active"
		}
		pages.WriteString(fmt.Sprintf(`<button class="cs-pagination__btn%s"%s>%s</button>`,
			activeClass, onclick(i), strconv.Itoa(i)))
	}

	// Next
	nextDisabled := ""
	if page >= totalPages {
		nextDisabled = " cs-pagination__btn--disabled"
	}
	pages.WriteString(fmt.Sprintf(`<button class="cs-pagination__btn%s"%s>&#8250;</button>`, nextDisabled, onclick(page+1)))

	return fmt.Sprintf(`<nav class="cs-pagination" data-id="%s">%s</nav>`, dataID, pages.String()), nil
}
