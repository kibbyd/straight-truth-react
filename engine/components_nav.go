package engine

import "fmt"

// ─── Stepper ──────────────────────────────────────────────────────────────────

func renderStepper(props map[string]interface{}, children string, e *Engine) (string, error) {
	return fmt.Sprintf(`<div%s>%s</div>`, userAttrs(props, "list-group list-group-numbered mb-3"), children), nil
}

func renderStepperStep(props map[string]interface{}, children string, e *Engine) (string, error) {
	title := propStr(props, "title", "")

	titleHTML := ""
	if title != "" {
		titleHTML = fmt.Sprintf(`<strong>%s</strong>`, title)
	}

	body := ""
	if children != "" {
		body = fmt.Sprintf(`<p class="mb-0 small text-body-secondary">%s</p>`, children)
	}

	return fmt.Sprintf(`<div class="list-group-item">%s%s</div>`, titleHTML, body), nil
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

func renderToolbar(props map[string]interface{}, children string, e *Engine) (string, error) {
	title := propStr(props, "title", "")
	dataID := propStr(props, "data-id", "toolbar")
	bordered := propBool(props, "bordered", false)

	titleHTML := ""
	if title != "" {
		titleHTML = fmt.Sprintf(`<span class="cs-toolbar__title">%s</span>`, title)
	}

	cls := "cs-toolbar"
	if bordered {
		cls += " cs-toolbar--bordered"
	}

	return fmt.Sprintf(`<div class="%s" data-id="%s">
  <div class="cs-toolbar__start">%s</div>
  <div class="cs-toolbar__end">%s</div>
</div>`, cls, dataID, titleHTML, children), nil
}
