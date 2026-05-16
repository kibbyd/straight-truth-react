package engine

import (
	"fmt"
	"strings"
)

// ─── IconButton ───────────────────────────────────────────────────────────────
// ["icon-button", { "icon": "trash", "aria-label": "Delete item", "on:click": "items/delete", "variant": "ghost" }]
func renderIconButton(props map[string]interface{}, children string, e *Engine) (string, error) {
	icon := propStr(props, "icon", "")
	ariaLabel := propStr(props, "aria-label", icon)
	size := propSize(props, "md")
	variant := propVariant(props, "ghost")
	action := propStr(props, "on:click", "")
	color := propStr(props, "color", "")
	dataID := propStr(props, "data-id", "icon-button")

	iconHTML := ""
	if icon != "" {
		iconHTML, _ = renderIcon(map[string]interface{}{"name": icon}, "", e)
	} else {
		iconHTML = children
	}

	cls := fmt.Sprintf("cs-icon-button cs-icon-button--%s cs-icon-button--%s", variant, size)
	if color != "" {
		cls += fmt.Sprintf(" cs-icon-button--color-%s", color)
	}

	onclick := ""
	if action != "" {
		onclick = fmt.Sprintf(` onclick="csAction('%s',this)"`, action)
	}

	return fmt.Sprintf(`<button class="%s" aria-label="%s" type="button" data-id="%s"%s>%s</button>`,
		cls, ariaLabel, dataID, onclick, iconHTML), nil
}

// ─── Tag ──────────────────────────────────────────────────────────────────────
// ["tag", { "label": "Go", "color": "cyan" }]
// Read-only taxonomy label. badge=status, chip=interactive, tag=content category.
// color: default | cyan | purple | orange | pink | green | red | yellow
func renderTag(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", children)
	variant := propStr(props, "variant", "secondary")
	bsVariant := variant
	if variant == "error" {
		bsVariant = "danger"
	}
	return fmt.Sprintf(`<span%s>%s</span>`, userAttrs(props, "badge text-bg-"+bsVariant), label), nil
}

// ─── Form ─────────────────────────────────────────────────────────────────────
// ["form", { "id": "my-form", "data-autosave": "key" }, ...children]
func renderForm(props map[string]interface{}, children string, e *Engine) (string, error) {
	id := propStr(props, "id", "")
	autosave := propStr(props, "data-autosave", "")
	dataID := propStr(props, "data-id", "form")

	idAttr := ""
	if id != "" {
		idAttr = fmt.Sprintf(` id="%s"`, id)
	}
	autosaveAttr := ""
	if autosave != "" {
		autosaveAttr = fmt.Sprintf(` data-autosave="%s"`, autosave)
	}

	return fmt.Sprintf(`<form class="cs-form"%s%s data-id="%s" onsubmit="event.preventDefault();var b=this.querySelector('[onclick]');if(b)b.click();">%s</form>`,
		idAttr, autosaveAttr, dataID, children), nil
}

// ─── Carousel ─────────────────────────────────────────────────────────────────
// ["carousel", { "id": "hero" },
//   ["div", { "class": "cs-carousel__slide" }, "Slide 1"],
//   ["div", { "class": "cs-carousel__slide" }, "Slide 2"]
// ]
func renderCarousel(props map[string]interface{}, children string, e *Engine) (string, error) {
	id := propStr(props, "id", "carousel")
	dataID := propStr(props, "data-id", "carousel--"+id)
	trackID := id + "--track"

	prevOnclick := fmt.Sprintf(
		`document.getElementById('%s').scrollBy({left:-document.getElementById('%s').offsetWidth,behavior:'smooth'})`,
		trackID, trackID)
	nextOnclick := fmt.Sprintf(
		`document.getElementById('%s').scrollBy({left:document.getElementById('%s').offsetWidth,behavior:'smooth'})`,
		trackID, trackID)

	return fmt.Sprintf(`<div class="cs-carousel" id="%s" data-id="%s">
  <div class="cs-carousel__track" id="%s">%s</div>
  <button class="cs-carousel__btn cs-carousel__btn--prev" type="button" data-id="%s--prev"
    onclick="%s">&#8249;</button>
  <button class="cs-carousel__btn cs-carousel__btn--next" type="button" data-id="%s--next"
    onclick="%s">&#8250;</button>
</div>`, id, dataID, trackID, children, dataID, prevOnclick, dataID, nextOnclick), nil
}

// ─── ButtonGroup ──────────────────────────────────────────────────────────────
// ["button-group", { "data-id": "btn-group--view" },
//   ["button", { "variant": "outline", "label": "Grid" }],
//   ["button", { "variant": "outline", "label": "List" }]
// ]
func renderButtonGroup(props map[string]interface{}, children string, e *Engine) (string, error) {
	dataID := propStr(props, "data-id", "button-group")
	return fmt.Sprintf(`<div class="cs-button-group" data-id="%s">%s</div>`, dataID, children), nil
}

// ─── CopyButton ───────────────────────────────────────────────────────────────
// ["copy-button", { "value": "{{data.apiKey}}", "label": "Copy key", "data-id": "copy--api-key" }]
func renderCopyButton(props map[string]interface{}, children string, e *Engine) (string, error) {
	value := propStr(props, "value", "")
	label := propStr(props, "label", "Copy")
	size := propSize(props, "md")
	variant := propVariant(props, "outline")
	dataID := propStr(props, "data-id", "copy-button")

	cls := fmt.Sprintf("cs-button cs-button--%s cs-button--%s cs-copy-button", variant, size)
	escaped := strings.ReplaceAll(value, `"`, `&quot;`)
	escaped = strings.ReplaceAll(escaped, `'`, `&#39;`)

	onclick := fmt.Sprintf(
		`navigator.clipboard.writeText('%s').then(function(){var b=document.querySelector('[data-id="%s"]');var orig=b.textContent;b.textContent='✓ Copied';setTimeout(function(){b.textContent=orig},2000)})`,
		escaped, dataID)

	return fmt.Sprintf(`<button class="%s" type="button" data-id="%s" onclick="%s">%s</button>`,
		cls, dataID, onclick, label), nil
}

// ─── RichText ─────────────────────────────────────────────────────────────────
// ["rich-text", { "content": "<p>Pre-rendered HTML here</p>" }]
// Use for CMS output or pre-rendered markdown. Content is injected as-is.
func renderRichText(props map[string]interface{}, children string, e *Engine) (string, error) {
	content := propStr(props, "content", children)
	dataID := propStr(props, "data-id", "rich-text")

	return fmt.Sprintf(`<div class="cs-rich-text" data-id="%s">%s</div>`, dataID, content), nil
}
