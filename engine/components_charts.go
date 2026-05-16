package engine

import (
	"encoding/json"
	"fmt"
	"math"
	"strings"
)

var chartPalette = []string{
	"var(--accent)", "var(--color-success)", "var(--color-warning)",
	"var(--color-danger)", "var(--color-info)", "#8b5cf6", "#f97316", "#06b6d4",
}

type chartPoint struct {
	Label string
	Value float64
}

func parseChartData(props map[string]interface{}) []chartPoint {
	var points []chartPoint
	raw, ok := props["data"]
	if !ok {
		return points
	}
	switch v := raw.(type) {
	case []interface{}:
		for _, item := range v {
			if m, ok := item.(map[string]interface{}); ok {
				p := chartPoint{}
				if l, ok := m["label"].(string); ok {
					p.Label = l
				}
				if val, ok := m["value"].(float64); ok {
					p.Value = val
				}
				points = append(points, p)
			}
		}
	case string:
		var parsed []map[string]interface{}
		if err := json.Unmarshal([]byte(v), &parsed); err == nil {
			for _, m := range parsed {
				p := chartPoint{}
				if l, ok := m["label"].(string); ok {
					p.Label = l
				}
				if val, ok := m["value"].(float64); ok {
					p.Value = val
				}
				points = append(points, p)
			}
		}
	}
	return points
}

func chartMax(points []chartPoint) float64 {
	max := 0.0
	for _, p := range points {
		if p.Value > max {
			max = p.Value
		}
	}
	return max
}

func formatChartNum(v float64) string {
	if v >= 1000000 {
		return fmt.Sprintf("%.1fM", v/1000000)
	}
	if v >= 1000 {
		return fmt.Sprintf("%.1fk", v/1000)
	}
	if v == float64(int(v)) {
		return fmt.Sprintf("%d", int(v))
	}
	return fmt.Sprintf("%.1f", v)
}

// ─── Chart ────────────────────────────────────────────────────────────────────
// ["chart", { "type": "bar", "data": [{"label":"Jan","value":42}], "height": 200, "title": "Revenue" }]
// type: bar | line | pie
func renderChart(props map[string]interface{}, children string, e *Engine) (string, error) {
	chartType := propStr(props, "type", "bar")
	height := int(propFloat(props, "height", 180))
	dataID := propStr(props, "data-id", "chart")
	title := propStr(props, "title", "")

	points := parseChartData(props)
	if len(points) == 0 {
		return fmt.Sprintf(`<div class="cs-chart cs-chart--empty" data-id="%s"><span>No data</span></div>`, dataID), nil
	}

	titleHTML := ""
	if title != "" {
		titleHTML = fmt.Sprintf(`<div class="cs-chart__title">%s</div>`, title)
	}

	var svg string
	var err error
	switch chartType {
	case "line":
		svg, err = renderLineChart(points, height)
	case "pie":
		svg, err = renderPieChart(points, height)
	default:
		svg, err = renderBarChart(points, height)
	}
	if err != nil {
		return "", err
	}

	return fmt.Sprintf(`<div class="cs-chart" data-id="%s">%s%s</div>`, dataID, titleHTML, svg), nil
}

func renderBarChart(points []chartPoint, height int) (string, error) {
	n := len(points)
	padL, padR, padT, padB := 48.0, 16.0, 16.0, 40.0
	W := 500.0
	chartW := W - padL - padR
	chartH := float64(height)
	H := chartH + padT + padB

	maxVal := chartMax(points)
	if maxVal == 0 {
		maxVal = 1
	}

	barSlot := chartW / float64(n)
	barW := barSlot * 0.55

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf(`<svg class="cs-chart__svg" viewBox="0 0 %.0f %.0f">`, W, H))

	// Gridlines + y-axis labels
	for i := 0; i <= 4; i++ {
		yVal := maxVal * float64(i) / 4.0
		y := padT + chartH - (yVal/maxVal)*chartH
		sb.WriteString(fmt.Sprintf(`<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" class="cs-chart__grid"/>`,
			padL, y, W-padR, y))
		sb.WriteString(fmt.Sprintf(`<text x="%.1f" y="%.1f" class="cs-chart__axis-label" text-anchor="end" dominant-baseline="middle">%s</text>`,
			padL-6, y, formatChartNum(yVal)))
	}

	// Bars
	for i, p := range points {
		bH := (p.Value / maxVal) * chartH
		x := padL + float64(i)*barSlot + (barSlot-barW)/2
		y := padT + chartH - bH
		color := chartPalette[i%len(chartPalette)]
		sb.WriteString(fmt.Sprintf(`<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" fill="%s" rx="3" class="cs-chart__bar"/>`,
			x, y, barW, bH, color))
		sb.WriteString(fmt.Sprintf(`<text x="%.1f" y="%.1f" class="cs-chart__value" text-anchor="middle">%s</text>`,
			x+barW/2, y-5, formatChartNum(p.Value)))
		sb.WriteString(fmt.Sprintf(`<text x="%.1f" y="%.1f" class="cs-chart__label" text-anchor="middle">%s</text>`,
			x+barW/2, padT+chartH+24, p.Label))
	}

	sb.WriteString(`</svg>`)
	return sb.String(), nil
}

func renderLineChart(points []chartPoint, height int) (string, error) {
	n := len(points)
	padL, padR, padT, padB := 48.0, 16.0, 16.0, 40.0
	W := 500.0
	chartW := W - padL - padR
	chartH := float64(height)
	H := chartH + padT + padB

	maxVal := chartMax(points)
	if maxVal == 0 {
		maxVal = 1
	}

	xStep := chartW
	if n > 1 {
		xStep = chartW / float64(n-1)
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf(`<svg class="cs-chart__svg" viewBox="0 0 %.0f %.0f">`, W, H))

	// Gridlines
	for i := 0; i <= 4; i++ {
		yVal := maxVal * float64(i) / 4.0
		y := padT + chartH - (yVal/maxVal)*chartH
		sb.WriteString(fmt.Sprintf(`<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" class="cs-chart__grid"/>`,
			padL, y, W-padR, y))
		sb.WriteString(fmt.Sprintf(`<text x="%.1f" y="%.1f" class="cs-chart__axis-label" text-anchor="end" dominant-baseline="middle">%s</text>`,
			padL-6, y, formatChartNum(yVal)))
	}

	// Area + line paths
	var area, line strings.Builder
	for i, p := range points {
		x := padL + float64(i)*xStep
		y := padT + chartH - (p.Value/maxVal)*chartH
		if i == 0 {
			area.WriteString(fmt.Sprintf("M %.1f %.1f", x, y))
			line.WriteString(fmt.Sprintf("M %.1f %.1f", x, y))
		} else {
			area.WriteString(fmt.Sprintf(" L %.1f %.1f", x, y))
			line.WriteString(fmt.Sprintf(" L %.1f %.1f", x, y))
		}
	}
	lastX := padL + float64(n-1)*xStep
	area.WriteString(fmt.Sprintf(" L %.1f %.1f L %.1f %.1f Z", lastX, padT+chartH, padL, padT+chartH))

	sb.WriteString(fmt.Sprintf(`<path d="%s" class="cs-chart__area"/>`, area.String()))
	sb.WriteString(fmt.Sprintf(`<path d="%s" class="cs-chart__line" fill="none"/>`, line.String()))

	// Dots + labels
	for i, p := range points {
		x := padL + float64(i)*xStep
		y := padT + chartH - (p.Value/maxVal)*chartH
		sb.WriteString(fmt.Sprintf(`<circle cx="%.1f" cy="%.1f" r="4" class="cs-chart__dot"/>`, x, y))
		sb.WriteString(fmt.Sprintf(`<text x="%.1f" y="%.1f" class="cs-chart__label" text-anchor="middle">%s</text>`,
			x, padT+chartH+24, p.Label))
	}

	sb.WriteString(`</svg>`)
	return sb.String(), nil
}

func renderPieChart(points []chartPoint, height int) (string, error) {
	cx, cy, r := 100.0, 100.0, 82.0
	W := 320.0
	H := math.Max(float64(height+20), 220)

	total := 0.0
	for _, p := range points {
		total += p.Value
	}
	if total == 0 {
		total = 1
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf(`<svg class="cs-chart__svg" viewBox="0 0 %.0f %.0f">`, W, H))

	angle := -math.Pi / 2
	for i, p := range points {
		slice := (p.Value / total) * 2 * math.Pi
		end := angle + slice
		color := chartPalette[i%len(chartPalette)]

		x1 := cx + r*math.Cos(angle)
		y1 := cy + r*math.Sin(angle)
		x2 := cx + r*math.Cos(end)
		y2 := cy + r*math.Sin(end)
		largeArc := 0
		if slice > math.Pi {
			largeArc = 1
		}

		sb.WriteString(fmt.Sprintf(
			`<path d="M %.1f %.1f L %.1f %.1f A %.1f %.1f 0 %d 1 %.1f %.1f Z" fill="%s" class="cs-chart__slice"/>`,
			cx, cy, x1, y1, r, r, largeArc, x2, y2, color))

		angle = end
	}

	// Legend
	for i, p := range points {
		color := chartPalette[i%len(chartPalette)]
		ly := 20.0 + float64(i)*22
		pct := (p.Value / total) * 100
		sb.WriteString(fmt.Sprintf(`<rect x="200" y="%.1f" width="10" height="10" fill="%s" rx="2"/>`, ly, color))
		sb.WriteString(fmt.Sprintf(`<text x="215" y="%.1f" class="cs-chart__legend-label">%s (%.0f%%)</text>`,
			ly+9, p.Label, pct))
	}

	sb.WriteString(`</svg>`)
	return sb.String(), nil
}
