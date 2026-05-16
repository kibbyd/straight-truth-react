package engine

import (
	"encoding/json"
	"fmt"
	"strings"
)

func jsonMarshal(v interface{}) ([]byte, error) { return json.Marshal(v) }

// ─── DataGrid ─────────────────────────────────────────────────────────────────
// ["data-grid", {
//   "columns": ["Name","Email","Role"],
//   "rows": [["Alice","a@x.com","Admin"]],
//   "sortable": true, "filterable": true
// }]
func renderDataGrid(props map[string]interface{}, children string, e *Engine) (string, error) {
	dataID := propStr(props, "data-id", "data-grid")
	sortable := propBool(props, "sortable", true)
	filterable := propBool(props, "filterable", false)
	emptyMsg := propStr(props, "empty", "No results")

	// Filter bar
	filterHTML := ""
	if filterable {
		filterHTML = fmt.Sprintf(`<div class="cs-data-grid__filter">
  <input class="cs-data-grid__filter-input" type="search" placeholder="Filter..."
    data-id="%s--filter" oninput="csDataGridFilter(this)" />
</div>`, dataID)
	}

	// Header
	var headerHTML strings.Builder
	if cols, ok := props["columns"]; ok {
		if colList, ok := cols.([]interface{}); ok {
			headerHTML.WriteString("<thead><tr>")
			for i, col := range colList {
				if sortable {
					headerHTML.WriteString(fmt.Sprintf(
						`<th class="cs-data-grid__th" data-col-idx="%d" onclick="csDataGridSort(this)">%v <span class="cs-data-grid__sort-icon">&#8597;</span></th>`,
						i, col))
				} else {
					headerHTML.WriteString(fmt.Sprintf("<th>%v</th>", col))
				}
			}
			headerHTML.WriteString("</tr></thead>")
		}
	}

	// Body
	var bodyHTML strings.Builder
	bodyHTML.WriteString("<tbody>")
	if rows, ok := props["rows"]; ok {
		if rowList, ok := rows.([]interface{}); ok {
			for _, row := range rowList {
				bodyHTML.WriteString("<tr>")
				if cells, ok := row.([]interface{}); ok {
					for _, cell := range cells {
						bodyHTML.WriteString(fmt.Sprintf("<td>%v</td>", cell))
					}
				}
				bodyHTML.WriteString("</tr>")
			}
		}
	}
	if children != "" {
		bodyHTML.WriteString(children)
	}
	bodyHTML.WriteString("</tbody>")

	emptyHTML := fmt.Sprintf(`<div class="cs-data-grid__empty" data-id="%s--empty">%s</div>`, dataID, emptyMsg)

	return fmt.Sprintf(`<div class="cs-data-grid" data-id="%s">
  %s
  <div class="cs-data-grid__wrap">
    <table class="cs-table cs-data-grid__table">
      %s
      %s
    </table>
  </div>
  %s
</div>`, dataID, filterHTML, headerHTML.String(), bodyHTML.String(), emptyHTML), nil
}

// ─── Tree / TreeItem ──────────────────────────────────────────────────────────
// ["tree",
//   ["tree-item", { "label": "src", "icon": "folder", "open": true },
//     ["tree-item", { "label": "main.go", "icon": "file" }]
//   ]
// ]
func renderTree(props map[string]interface{}, children string, e *Engine) (string, error) {
	dataID := propStr(props, "data-id", "tree")
	return fmt.Sprintf(`<ul class="cs-tree" data-id="%s">%s</ul>`, dataID, children), nil
}

func renderTreeItem(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	icon := propStr(props, "icon", "")
	active := propBool(props, "active", false)
	open := propBool(props, "open", false)
	dataID := propStr(props, "data-id", "tree-item")
	hasChildren := children != ""

	cls := "cs-tree-item"
	if active {
		cls += " cs-tree-item--active"
	}
	if open && hasChildren {
		cls += " cs-tree-item--open"
	}

	iconHTML := ""
	if icon != "" {
		iconHTML, _ = renderIcon(map[string]interface{}{"name": icon, "size": float64(14)}, "", e)
	}

	chevron := ""
	rowOnclick := ""
	if hasChildren {
		chevron = `<span class="cs-tree-item__chevron">&#9660;</span>`
		rowOnclick = ` onclick="csTreeToggle(this)"`
	}

	nested := ""
	if hasChildren {
		display := "none"
		if open {
			display = ""
		}
		nested = fmt.Sprintf(`<ul class="cs-tree-item__children" style="display:%s">%s</ul>`, display, children)
	}

	return fmt.Sprintf(`<li class="%s" data-id="%s">
  <div class="cs-tree-item__row"%s>%s%s<span class="cs-tree-item__label">%s</span></div>
  %s
</li>`, cls, dataID, rowOnclick, chevron, iconHTML, label, nested), nil
}

// ─── VirtualList ──────────────────────────────────────────────────────────────
// ["virtual-list", { "columns": ["name","email"], "rows": [...], "height": 400, "row-height": 40 }]
// Renders a scrollable container. JS populates only visible rows on scroll.
func renderVirtualList(props map[string]interface{}, children string, e *Engine) (string, error) {
	dataID := propStr(props, "data-id", "virtual-list")
	height := int(propFloat(props, "height", 400))
	rowHeight := int(propFloat(props, "row-height", 40))

	// Marshal columns
	colsJSON := "[]"
	if cols, ok := props["columns"]; ok {
		if b, err := jsonMarshal(cols); err == nil {
			colsJSON = string(b)
		}
	}

	// Marshal rows
	rowsJSON := "[]"
	if rows, ok := props["rows"]; ok {
		if b, err := jsonMarshal(rows); err == nil {
			rowsJSON = string(b)
		}
	}

	return fmt.Sprintf(`<div class="cs-virtual-list" data-id="%s"
  style="height:%dpx;overflow-y:auto;position:relative;"
  onscroll="csVirtualListScroll(this)">
  <div class="cs-virtual-list__inner" style="position:relative;"></div>
</div>
<script>csVirtualListInit('%s',%s,%s,%d);</script>`,
		dataID, height, dataID, colsJSON, rowsJSON, rowHeight), nil
}

// ─── Table ────────────────────────────────────────────────────────────────────
// ["table", {
//   "columns": ["Name", "Email", "Status"],
//   "rows": [["John", "john@x.com", "Active"], ["Jane", "jane@x.com", "Inactive"]]
// }]
func renderTable(props map[string]interface{}, children string, e *Engine) (string, error) {
	striped := propBool(props, "striped", true)
	hoverable := propBool(props, "hoverable", true)

	cls := "table"
	if striped {
		cls += " table-striped"
	}
	if hoverable {
		cls += " table-hover"
	}

	// Build header
	var headerHTML strings.Builder
	if cols, ok := props["columns"]; ok {
		if colList, ok := cols.([]interface{}); ok {
			headerHTML.WriteString("<thead><tr>")
			for _, col := range colList {
				headerHTML.WriteString(fmt.Sprintf("<th>%v</th>", col))
			}
			headerHTML.WriteString("</tr></thead>")
		}
	}

	// Build body from rows
	var bodyHTML strings.Builder
	bodyHTML.WriteString("<tbody>")
	if rows, ok := props["rows"]; ok {
		if rowList, ok := rows.([]interface{}); ok {
			for _, row := range rowList {
				bodyHTML.WriteString("<tr>")
				if cells, ok := row.([]interface{}); ok {
					for _, cell := range cells {
						bodyHTML.WriteString(fmt.Sprintf("<td>%v</td>", cell))
					}
				}
				bodyHTML.WriteString("</tr>")
			}
		}
	}
	// Children can be <tr> atoms passed directly
	if children != "" {
		bodyHTML.WriteString(children)
	}
	bodyHTML.WriteString("</tbody>")

	return fmt.Sprintf(`<div%s>
  <table class="%s">
    %s
    %s
  </table>
</div>`, userAttrs(props, "table-responsive"), cls, headerHTML.String(), bodyHTML.String()), nil
}

// ─── KvList ───────────────────────────────────────────────────────────────────
// ["kv-list",
//   ["kv-item", { "key": "Username", "value": "kibbyd" }],
//   ["kv-item", { "key": "Role", "value": "Admin", "value-variant": "success" }]
// ]
func renderKvList(props map[string]interface{}, children string, e *Engine) (string, error) {
	dataID := propStr(props, "data-id", "kv-list")
	divided := propBool(props, "divided", true)

	cls := "cs-kv-list"
	if divided {
		cls += " cs-kv-list--divided"
	}

	return fmt.Sprintf(`<dl class="%s" data-id="%s">%s</dl>`, cls, dataID, children), nil
}

func renderKvItem(props map[string]interface{}, children string, e *Engine) (string, error) {
	key := propStr(props, "key", "")
	value := propStr(props, "value", children)
	href := propStr(props, "href", "")
	valueVariant := propStr(props, "value-variant", "") // success | warning | danger | muted
	dataID := propStr(props, "data-id", "kv-item")

	valueHTML := value
	if href != "" {
		valueHTML = fmt.Sprintf(`<a class="cs-kv-item__link" href="%s">%s</a>`, href, value)
	}

	variantClass := ""
	if valueVariant != "" {
		variantClass = fmt.Sprintf(` cs-kv-item__value--%s`, valueVariant)
	}

	return fmt.Sprintf(`<div class="cs-kv-item" data-id="%s">
  <dt class="cs-kv-item__key">%s</dt>
  <dd class="cs-kv-item__value%s">%s</dd>
</div>`, dataID, key, variantClass, valueHTML), nil
}

// ─── List ─────────────────────────────────────────────────────────────────────
// ["list",
//   ["list-item", "First item"],
//   ["list-item", { "icon": "check" }, "Second item"]
// ]
func renderList(props map[string]interface{}, children string, e *Engine) (string, error) {
	return fmt.Sprintf(`<div%s>%s</div>`, userAttrs(props, "list-group list-group-flush mb-3"), children), nil
}

func renderListItem(props map[string]interface{}, children string, e *Engine) (string, error) {
	href := propStr(props, "href", "")
	action := propStr(props, "on:click", "")

	onclick := ""
	if action != "" {
		onclick = fmt.Sprintf(` onclick="csAction('%s',this)"`, action)
	}

	content := children
	if href != "" {
		return fmt.Sprintf(`<a class="list-group-item list-group-item-action" href="%s"%s>%s</a>`, href, onclick, content), nil
	}

	return fmt.Sprintf(`<div%s%s>%s</div>`, userAttrs(props, "list-group-item"), onclick, content), nil
}
