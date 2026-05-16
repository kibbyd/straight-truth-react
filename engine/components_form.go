package engine

import (
	"fmt"
	"strings"
)

// ─── Input ────────────────────────────────────────────────────────────────────
// ["input", { "label": "Email", "type": "email", "name": "email", "required": true }]
func renderInput(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	inputType := propStr(props, "type", "text")
	name := propStr(props, "name", label)
	placeholder := propStr(props, "placeholder", "")
	value := propAnyStr(props, "value")
	id := propStr(props, "id", "input-"+name)
	onEnter := propStr(props, "on:enter", "")
	onTab := propStr(props, "on:tab", "")
	clear := propBool(props, "clear", false)

	valueAttr := ""
	if value != "" {
		valueAttr = fmt.Sprintf(` value="%s"`, strings.ReplaceAll(value, `"`, "&quot;"))
	}

	labelHTML := ""
	if label != "" {
		labelHTML = fmt.Sprintf(`<label class="form-label" for="%s">%s</label>`, id, label)
	}

	// on:enter + on:tab pipes — emit data attributes for runtime wiring
	pipeAttrs := ""
	if onEnter != "" {
		pipeAttrs += fmt.Sprintf(` data-on-enter="%s"`, onEnter)
		if clear {
			pipeAttrs += ` data-clear`
		}
	}
	if onTab != "" {
		pipeAttrs += fmt.Sprintf(` data-on-tab="%s"`, onTab)
	}
	if onEnter != "" || onTab != "" {
		// Pass through all data-* props
		for k, v := range props {
			if strings.HasPrefix(k, "data-") && k != "data-id" && k != "data-on-enter" && k != "data-clear" && k != "data-on-tab" {
				if s, ok := v.(string); ok {
					pipeAttrs += fmt.Sprintf(` %s="%s"`, k, s)
				}
			}
		}
	}

	return fmt.Sprintf(`<div%s>%s<input type="%s" class="form-control" id="%s" name="%s" placeholder="%s"%s%s></div>`,
		userAttrs(props, ""), labelHTML, inputType, id, name, placeholder, valueAttr, pipeAttrs), nil
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
// ["textarea", { "label": "Notes", "name": "notes", "rows": 4 }]
func renderTextarea(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	name := propStr(props, "name", label)
	rows := int(propFloat(props, "rows", 4))
	hint := propStr(props, "hint", "")
	dataID := propStr(props, "data-id", "textarea--"+name)
	disabled := propBool(props, "disabled", false)

	id := "cs-textarea-" + name

	disabledAttr := ""
	if disabled {
		disabledAttr = " disabled"
	}

	labelHTML := ""
	if label != "" {
		labelHTML = fmt.Sprintf(`<label class="cs-input__label" for="%s">%s</label>`, id, label)
	}

	hintHTML := ""
	if hint != "" {
		hintHTML = fmt.Sprintf(`<span class="cs-input__hint">%s</span>`, hint)
	}

	return fmt.Sprintf(`<div class="cs-input cs-textarea" data-id="%s">
  <div class="cs-input__wrap">
    <textarea class="cs-input__field cs-textarea__field" id="%s" name="%s" rows="%d" placeholder=" "%s>%s</textarea>
    %s
  </div>
  %s
</div>`, dataID, id, name, rows, disabledAttr, children, labelHTML, hintHTML), nil
}

// ─── Select ───────────────────────────────────────────────────────────────────
// ["select", { "label": "Status", "name": "status", "options": ["Active", "Inactive"] }]
func renderSelect(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	name := propStr(props, "name", label)
	dataID := propStr(props, "data-id", "select--"+name)
	placeholder := propStr(props, "placeholder", "Select...")

	// Parse options
	var optionsHTML strings.Builder
	if opts, ok := props["options"]; ok {
		switch v := opts.(type) {
		case []interface{}:
			for _, o := range v {
				optStr := fmt.Sprintf("%v", o)
				optionsHTML.WriteString(fmt.Sprintf(`<div class="cs-select__option" data-select-option="%s">%s</div>`, optStr, optStr))
			}
		}
	}
	// Children can also be select-option atoms
	if children != "" {
		optionsHTML.WriteString(children)
	}

	labelHTML := ""
	if label != "" {
		labelHTML = fmt.Sprintf(`<label class="cs-select__label">%s</label>`, label)
	}

	return fmt.Sprintf(`<div class="cs-select" data-id="%s">
  %s
  <div class="cs-select__trigger" data-select-trigger>
    <span class="cs-select__value">%s</span>
    <span class="cs-select__arrow">&#9660;</span>
  </div>
  <div class="cs-select__dropdown" style="display:none">%s</div>
  <input type="hidden" name="%s" />
</div>`, dataID, labelHTML, placeholder, optionsHTML.String(), name), nil
}

// ─── Native Select ───────────────────────────────────────────────────────────
// ["native-select", { "label": "Role", "name": "role", "options": ["student", "instructor"] }]
// Uses Bootstrap's form-select — native browser dropdown, no overflow issues.
func renderNativeSelect(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	name := propStr(props, "name", label)
	placeholder := propStr(props, "placeholder", "Select...")
	dataID := propStr(props, "data-id", "native-select--"+name)
	id := "ns-" + name

	labelHTML := ""
	if label != "" {
		labelHTML = fmt.Sprintf(`<label class="form-label" for="%s">%s</label>`, id, label)
	}

	var optionsHTML strings.Builder
	if placeholder != "" {
		optionsHTML.WriteString(fmt.Sprintf(`<option value="" disabled selected>%s</option>`, placeholder))
	}
	if opts, ok := props["options"]; ok {
		if v, ok := opts.([]interface{}); ok {
			for _, o := range v {
				if m, ok := o.(map[string]interface{}); ok {
					// {label, value} object form
					label := propStr(m, "label", "")
					value := propStr(m, "value", label)
					optionsHTML.WriteString(fmt.Sprintf(`<option value="%s">%s</option>`, value, label))
				} else {
					// Plain string: label = value
					optStr := fmt.Sprintf("%v", o)
					optionsHTML.WriteString(fmt.Sprintf(`<option value="%s">%s</option>`, optStr, optStr))
				}
			}
		}
	}

	// Pass through data-action and data-* attrs so callers can wire JS handlers
	extraAttrs := ""
	if act := propStr(props, "data-action", ""); act != "" {
		extraAttrs += fmt.Sprintf(` data-action="%s"`, act)
	}

	return fmt.Sprintf(`<div data-id="%s">%s<select class="form-select" id="%s" name="%s"%s>%s</select></div>`,
		dataID, labelHTML, id, name, extraAttrs, optionsHTML.String()), nil
}

// ─── Autocomplete ─────────────────────────────────────────────────────────────
// ["autocomplete", { "label": "Search", "name": "q", "options": ["Apple", "Banana"] }]
func renderAutocomplete(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	name := propStr(props, "name", label)
	placeholder := propStr(props, "placeholder", label)
	dataID := propStr(props, "data-id", "autocomplete--"+name)

	id := "cs-ac-" + name

	// Build option list
	var optionsHTML strings.Builder
	if opts, ok := props["options"]; ok {
		switch v := opts.(type) {
		case []interface{}:
			for _, o := range v {
				optStr := fmt.Sprintf("%v", o)
				optionsHTML.WriteString(fmt.Sprintf(`<div class="cs-autocomplete__item" data-ac-item>%s</div>`, optStr))
			}
		}
	}

	labelHTML := ""
	if label != "" {
		labelHTML = fmt.Sprintf(`<label class="cs-input__label cs-input__label--float" for="%s">%s</label>`, id, label)
	}

	return fmt.Sprintf(`<div class="cs-autocomplete cs-input" data-id="%s">
  <div class="cs-input__wrap">
    <input class="cs-input__field" id="%s" name="%s" placeholder="%s" autocomplete="off" data-autocomplete />
    %s
  </div>
  <div class="cs-autocomplete__dropdown" style="display:none">%s</div>
</div>`, dataID, id, name, placeholder, labelHTML, optionsHTML.String()), nil
}

// ─── FormField ────────────────────────────────────────────────────────────────
// ["form-field", { "label": "Password", "hint": "Min 8 chars", "required": true },
//   ["input", { "name": "password", "type": "password" }]
// ]
// Wraps ANY child atom with a consistent label + hint + error block.
func renderFormField(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	hint := propStr(props, "hint", "")
	errMsg := propStr(props, "error", "")
	required := propBool(props, "required", false)
	dataID := propStr(props, "data-id", "form-field")

	requiredMark := ""
	if required {
		requiredMark = ` <span class="cs-form-field__required">*</span>`
	}

	labelHTML := ""
	if label != "" {
		labelHTML = fmt.Sprintf(`<label class="cs-form-field__label">%s%s</label>`, label, requiredMark)
	}

	hintHTML := ""
	if errMsg != "" {
		hintHTML = fmt.Sprintf(`<span class="cs-form-field__hint cs-form-field__hint--error">%s</span>`, errMsg)
	} else if hint != "" {
		hintHTML = fmt.Sprintf(`<span class="cs-form-field__hint">%s</span>`, hint)
	}

	errClass := ""
	if errMsg != "" {
		errClass = " cs-form-field--error"
	}

	return fmt.Sprintf(`<div class="cs-form-field%s" data-id="%s">%s%s%s</div>`,
		errClass, dataID, labelHTML, children, hintHTML), nil
}

// ─── MultiSelect ──────────────────────────────────────────────────────────────
// ["multi-select", { "label": "Tags", "name": "tags", "options": ["Go","Python","Rust"], "placeholder": "Pick tags..." }]
func renderMultiSelect(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", "")
	name := propStr(props, "name", "multi")
	placeholder := propStr(props, "placeholder", "Select...")
	dataID := propStr(props, "data-id", "multi-select--"+name)

	labelHTML := ""
	if label != "" {
		labelHTML = fmt.Sprintf(`<label class="cs-multi-select__label">%s</label>`, label)
	}

	var optionsHTML strings.Builder
	if opts, ok := props["options"]; ok {
		if optList, ok := opts.([]interface{}); ok {
			for _, o := range optList {
				v := fmt.Sprintf("%v", o)
				optionsHTML.WriteString(fmt.Sprintf(
					`<div class="cs-multi-select__option" data-ms-option="%s"
  onclick="csMultiSelectToggle(this.closest('[data-ms-wrap]'),'%s','%s')">%s</div>`,
					v, v, v, v))
			}
		}
	}

	return fmt.Sprintf(`<div class="cs-multi-select" data-ms-wrap data-id="%s">
  %s
  <div class="cs-multi-select__control" onclick="csMultiSelectOpen(this.closest('[data-ms-wrap]'))">
    <div class="cs-multi-select__tags" data-ms-tags>
      <span class="cs-multi-select__placeholder" data-ms-placeholder>%s</span>
    </div>
    <span class="cs-multi-select__arrow">&#9660;</span>
  </div>
  <div class="cs-multi-select__dropdown" data-ms-dropdown style="display:none">%s</div>
  <input type="hidden" name="%s" data-ms-value value="" />
</div>`, dataID, labelHTML, placeholder, optionsHTML.String(), name), nil
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
// ["checkbox", { "label": "I agree", "name": "agree", "checked": true }]
func renderCheckbox(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", children)
	name := propStr(props, "name", "")
	checked := propBool(props, "checked", false)
	disabled := propBool(props, "disabled", false)
	dataID := propStr(props, "data-id", "checkbox--"+name)

	checkedAttr := ""
	if checked {
		checkedAttr = " checked"
	}
	disabledAttr := ""
	if disabled {
		disabledAttr = " disabled"
	}

	return fmt.Sprintf(`<label class="cs-checkbox" data-id="%s">
  <input class="cs-checkbox__input" type="checkbox" name="%s"%s%s />
  <span class="cs-checkbox__box"></span>
  <span class="cs-checkbox__label">%s</span>
</label>`, dataID, name, checkedAttr, disabledAttr, label), nil
}

// ─── Radio ────────────────────────────────────────────────────────────────────
// ["radio", { "label": "Option A", "name": "choice", "value": "a" }]
func renderRadio(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", children)
	name := propStr(props, "name", "")
	value := propStr(props, "value", label)
	checked := propBool(props, "checked", false)
	dataID := propStr(props, "data-id", "radio--"+name+"--"+value)

	checkedAttr := ""
	if checked {
		checkedAttr = " checked"
	}

	return fmt.Sprintf(`<label class="cs-radio" data-id="%s">
  <input class="cs-radio__input" type="radio" name="%s" value="%s"%s />
  <span class="cs-radio__dot"></span>
  <span class="cs-radio__label">%s</span>
</label>`, dataID, name, value, checkedAttr, label), nil
}

// ─── Switch ───────────────────────────────────────────────────────────────────
// ["switch", { "label": "Dark mode", "name": "dark", "checked": false }]
func renderSwitch(props map[string]interface{}, children string, e *Engine) (string, error) {
	label := propStr(props, "label", children)
	name := propStr(props, "name", "")
	checked := propBool(props, "checked", false)
	dataID := propStr(props, "data-id", "switch--"+name)

	checkedAttr := ""
	if checked {
		checkedAttr = " checked"
	}

	return fmt.Sprintf(`<label class="cs-switch" data-id="%s">
  <input class="cs-switch__input" type="checkbox" name="%s"%s />
  <span class="cs-switch__track">
    <span class="cs-switch__thumb"></span>
  </span>
  <span class="cs-switch__label">%s</span>
</label>`, dataID, name, checkedAttr, label), nil
}
