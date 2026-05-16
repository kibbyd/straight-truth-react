package engine

import (
	"fmt"
	"strings"
)

// ─── Slider ───────────────────────────────────────────────────────────────────

func renderSlider(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	name := propStr(props, "name", "slider")
	min := int(propFloat(props, "min", 0))
	max := int(propFloat(props, "max", 100))
	value := int(propFloat(props, "value", 50))
	step := int(propFloat(props, "step", 1))
	dataID := propStr(props, "data-id", "slider")

	labelHTML := ""
	if label != "" {
		labelHTML = fmt.Sprintf(`<div class="cs-slider__header">
    <label class="cs-slider__label">%s</label>
    <span class="cs-slider__value" data-slider-value="%s">%d</span>
  </div>`, label, dataID, value)
	}

	return fmt.Sprintf(`<div class="cs-slider-wrap" data-id="%s">
  %s
  <input type="range" class="cs-slider" name="%s"
    min="%d" max="%d" value="%d" step="%d"
    data-slider-id="%s"
    oninput="csSliderUpdate(this)" />
</div>`, dataID, labelHTML, name, min, max, value, step, dataID), nil
}

// ─── NumberInput ──────────────────────────────────────────────────────────────

func renderNumberInput(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	name := propStr(props, "name", "number")
	min := propStr(props, "min", "")
	max := propStr(props, "max", "")
	value := int(propFloat(props, "value", 0))
	step := int(propFloat(props, "step", 1))
	dataID := propStr(props, "data-id", "number-input")

	minAttr := ""
	if min != "" {
		minAttr = fmt.Sprintf(` min="%s"`, min)
	}
	maxAttr := ""
	if max != "" {
		maxAttr = fmt.Sprintf(` max="%s"`, max)
	}

	labelHTML := ""
	if label != "" {
		labelHTML = fmt.Sprintf(`<label class="cs-number-input__label">%s</label>`, label)
	}

	return fmt.Sprintf(`<div class="cs-number-input-wrap" data-id="%s">
  %s
  <div class="cs-number-input">
    <button type="button" class="cs-number-input__btn" data-id="%s--dec" onclick="csNumberStep(this,-1)">−</button>
    <input type="number" class="cs-number-input__field" name="%s"
      value="%d" step="%d"%s%s data-id="%s--input" />
    <button type="button" class="cs-number-input__btn" data-id="%s--inc" onclick="csNumberStep(this,1)">+</button>
  </div>
</div>`, dataID, labelHTML, dataID, name, value, step, minAttr, maxAttr, dataID, dataID), nil
}

// ─── FileUpload ───────────────────────────────────────────────────────────────

func renderFileUpload(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "Drop files here or click to upload")
	hint := propStr(props, "hint", "")
	accept := propStr(props, "accept", "*")
	name := propStr(props, "name", "file")
	multiple := propBool(props, "multiple", false)
	dataID := propStr(props, "data-id", "file-upload")

	multipleAttr := ""
	if multiple {
		multipleAttr = " multiple"
	}

	hintHTML := ""
	if hint != "" {
		hintHTML = fmt.Sprintf(`<div class="cs-file-upload__hint">%s</div>`, hint)
	}

	inputID := fmt.Sprintf("fu-%s", dataID)

	return fmt.Sprintf(`<div class="cs-file-upload" data-id="%s" data-file-upload>
  <input type="file" class="cs-file-upload__input" id="%s"
    name="%s" accept="%s"%s
    onchange="csFileUploadChange(this)" />
  <label class="cs-file-upload__zone" for="%s"
    ondragover="csFileDragOver(event,this)" ondragleave="csFileDragLeave(this)" ondrop="csFileDrop(event,this,'%s')">
    <svg class="cs-file-upload__icon" viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
    </svg>
    <div class="cs-file-upload__text">%s</div>
    %s
  </label>
  <div class="cs-file-upload__list" data-file-list="%s"></div>
</div>`, dataID, inputID, name, accept, multipleAttr, inputID, dataID, label, hintHTML, dataID), nil
}

// ─── TagInput ─────────────────────────────────────────────────────────────────

func renderTagInput(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	placeholder := propStr(props, "placeholder", "Add tag...")
	name := propStr(props, "name", "tags")
	tagsRaw := propStr(props, "tags", "")
	dataID := propStr(props, "data-id", "tag-input")

	labelHTML := ""
	if label != "" {
		labelHTML = fmt.Sprintf(`<label class="cs-tag-input__label">%s</label>`, label)
	}

	initialTags := ""
	initialValues := ""
	if tagsRaw != "" {
		tags := strings.Split(tagsRaw, ",")
		for _, t := range tags {
			t = strings.TrimSpace(t)
			if t == "" {
				continue
			}
			initialTags += fmt.Sprintf(`<span class="cs-tag-input__tag">%s<button type="button" class="cs-tag-input__remove" onclick="csTagRemove(this)" aria-label="Remove">×</button></span>`, t)
			if initialValues != "" {
				initialValues += ","
			}
			initialValues += t
		}
	}

	return fmt.Sprintf(`<div class="cs-tag-input-wrap" data-id="%s">
  %s
  <div class="cs-tag-input" data-tag-input="%s">
    %s
    <input type="text" class="cs-tag-input__field" placeholder="%s"
      data-id="%s--input"
      onkeydown="csTagKeydown(event,this)" />
  </div>
  <input type="hidden" name="%s" value="%s" data-tag-value="%s" />
</div>`, dataID, labelHTML, dataID, initialTags, placeholder, dataID, name, initialValues, dataID), nil
}

// ─── Search ───────────────────────────────────────────────────────────────────
// ["search", { "placeholder": "Search users...", "name": "q", "on:search": "users/search" }]
func renderSearch(props map[string]interface{}, children string, e *Engine) (string, error) {
	placeholder := propStr(props, "placeholder", "Search...")

	return fmt.Sprintf(`<div%s><input type="search" class="form-control" placeholder="%s"></div>`,
		userAttrs(props, "mb-3"), placeholder), nil
}

// ─── ColorInput ───────────────────────────────────────────────────────────────
// ["color-input", { "label": "Accent Color", "name": "color", "value": "#00b4d8" }]
func renderColorInput(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	name := propStr(props, "name", "color")
	value := propStr(props, "value", "#000000")
	dataID := propStr(props, "data-id", "color-input")

	labelHTML := ""
	if label != "" {
		labelHTML = fmt.Sprintf(`<label class="cs-color-input__label">%s</label>`, label)
	}

	hexID := dataID + "--hex"

	return fmt.Sprintf(`<div class="cs-color-input-wrap" data-id="%s">
  %s
  <div class="cs-color-input">
    <input type="color" class="cs-color-input__field" name="%s" value="%s"
      data-id="%s--input"
      oninput="document.getElementById('%s').textContent=this.value" />
    <span class="cs-color-input__hex" id="%s">%s</span>
  </div>
</div>`, dataID, labelHTML, name, value, dataID, hexID, hexID, value), nil
}

// ─── DateInput ────────────────────────────────────────────────────────────────

func renderDateInput(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	name := propStr(props, "name", "date")
	value := propStr(props, "value", "")
	min := propStr(props, "min", "")
	max := propStr(props, "max", "")
	dataID := propStr(props, "data-id", "date-input")

	labelHTML := ""
	if label != "" {
		labelHTML = fmt.Sprintf(`<label class="cs-date-input__label" for="%s--field">%s</label>`, dataID, label)
	}

	minAttr := ""
	if min != "" {
		minAttr = fmt.Sprintf(` min="%s"`, min)
	}
	maxAttr := ""
	if max != "" {
		maxAttr = fmt.Sprintf(` max="%s"`, max)
	}
	valueAttr := ""
	if value != "" {
		valueAttr = fmt.Sprintf(` value="%s"`, value)
	}

	return fmt.Sprintf(`<div class="cs-date-input-wrap" data-id="%s">
  %s
  <input type="date" class="cs-date-input__field" id="%s--field"
    name="%s"%s%s%s data-id="%s--input" />
</div>`, dataID, labelHTML, dataID, name, valueAttr, minAttr, maxAttr, dataID), nil
}
