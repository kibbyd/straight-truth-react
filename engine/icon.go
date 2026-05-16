package engine

import "fmt"

// renderIcon renders a Bootstrap Icon using the CDN CSS classes.
// Props:
//   - name (string, required): Bootstrap Icon name without "bi-" prefix (e.g. "search", "house", "gear")
//   - size (number): font size in pixels, default 20
//   - color (string): CSS color, default "currentColor"
//   - class (string): additional CSS classes
func renderIcon(props map[string]interface{}, children string, e *Engine) (string, error) {
	name := propStr(props, "name", "")
	if name == "" {
		return "", fmt.Errorf("icon: 'name' prop is required")
	}

	size := int(propFloat(props, "size", 20))
	color := propStr(props, "color", "currentColor")
	class := propStr(props, "class", "")
	dataID := propStr(props, "data-id", fmt.Sprintf("icon--%s", name))

	cls := fmt.Sprintf("bi bi-%s", name)
	if class != "" {
		cls += " " + class
	}

	style := fmt.Sprintf("font-size:%dpx;color:%s", size, color)

	return fmt.Sprintf(`<i class="%s" data-id="%s" style="%s"></i>`,
		cls, dataID, style), nil
}
