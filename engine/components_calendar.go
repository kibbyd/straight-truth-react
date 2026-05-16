package engine

import "fmt"

// ─── Calendar ─────────────────────────────────────────────────────────────────
// ["calendar", { "id": "dob", "name": "dob", "value": "2026-02-27", "on:select": "bookings/select-date" }]
// JS handles all rendering — csCalendarInit is called inline.
// on:select fires csAction with action + ":" + dateStr appended.
func renderCalendar(props map[string]interface{}, children string, e *Engine) (string, error) {
	id := propStr(props, "id", "cal")
	name := propStr(props, "name", "date")
	value := propStr(props, "value", "")
	action := propStr(props, "on:select", "")
	dataID := propStr(props, "data-id", "calendar--"+id)

	return fmt.Sprintf(`<div class="cs-calendar" id="%s" data-action="%s" data-id="%s">
  <div class="cs-calendar__header">
    <button class="cs-calendar__nav" type="button" onclick="csCalendarNav('%s',-1)" data-id="%s--prev">&#8249;</button>
    <span class="cs-calendar__label" data-cal-label="%s"></span>
    <button class="cs-calendar__nav" type="button" onclick="csCalendarNav('%s',1)" data-id="%s--next">&#8250;</button>
  </div>
  <div class="cs-calendar__grid" data-cal-grid="%s"></div>
  <input type="hidden" name="%s" value="%s" data-cal-value="%s" />
</div>
<script>csCalendarInit('%s','%s');</script>`,
		id, action, dataID,
		id, dataID,
		id,
		id, dataID,
		id,
		name, value, id,
		id, value), nil
}
