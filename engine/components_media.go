package engine

import "fmt"

// ─── Video ────────────────────────────────────────────────────────────────────
// ["video", { "src": "/public/intro.mp4", "poster": "/public/thumb.jpg", "controls": true }]
func renderVideo(props map[string]interface{}, children string, e *Engine) (string, error) {
	src := propStr(props, "src", "")
	poster := propStr(props, "poster", "")
	controls := propBool(props, "controls", true)
	autoplay := propBool(props, "autoplay", false)
	muted := propBool(props, "muted", false)
	loop := propBool(props, "loop", false)
	dataID := propStr(props, "data-id", "video")

	attrs := ""
	if controls {
		attrs += " controls"
	}
	if autoplay {
		attrs += " autoplay"
	}
	if muted {
		attrs += " muted"
	}
	if loop {
		attrs += " loop"
	}

	posterAttr := ""
	if poster != "" {
		posterAttr = fmt.Sprintf(` poster="%s"`, poster)
	}

	return fmt.Sprintf(`<video class="cs-video" src="%s"%s%s data-id="%s"></video>`,
		src, posterAttr, attrs, dataID), nil
}

// ─── Audio ────────────────────────────────────────────────────────────────────
// ["audio", { "src": "/public/track.mp3", "controls": true }]
func renderAudio(props map[string]interface{}, children string, e *Engine) (string, error) {
	src := propStr(props, "src", "")
	controls := propBool(props, "controls", true)
	autoplay := propBool(props, "autoplay", false)
	loop := propBool(props, "loop", false)
	dataID := propStr(props, "data-id", "audio")

	attrs := ""
	if controls {
		attrs += " controls"
	}
	if autoplay {
		attrs += " autoplay"
	}
	if loop {
		attrs += " loop"
	}

	return fmt.Sprintf(`<audio class="cs-audio" src="%s"%s data-id="%s"></audio>`,
		src, attrs, dataID), nil
}

// ─── Iframe ───────────────────────────────────────────────────────────────────
// ["iframe", { "src": "https://...", "height": "400", "title": "Map" }]
func renderIframe(props map[string]interface{}, children string, e *Engine) (string, error) {
	src := propStr(props, "src", "")
	height := propStr(props, "height", "400")
	title := propStr(props, "title", "")
	allow := propStr(props, "allow", "")
	sandbox := propStr(props, "sandbox", "")
	dataID := propStr(props, "data-id", "iframe")

	allowAttr := ""
	if allow != "" {
		allowAttr = fmt.Sprintf(` allow="%s"`, allow)
	}
	sandboxAttr := ""
	if sandbox != "" {
		sandboxAttr = fmt.Sprintf(` sandbox="%s"`, sandbox)
	}

	return fmt.Sprintf(`<iframe class="cs-iframe" src="%s" height="%s" title="%s"%s%s data-id="%s" frameborder="0" loading="lazy"></iframe>`,
		src, height, title, allowAttr, sandboxAttr, dataID), nil
}

// ─── AspectRatio ──────────────────────────────────────────────────────────────
// ["aspect-ratio", { "ratio": "16/9" }, ["video", { "src": "..." }]]
// ratio: "16/9" | "4/3" | "1/1" | "3/4" | "9/16" (any valid CSS ratio)
func renderAspectRatio(props map[string]interface{}, children string, e *Engine) (string, error) {
	ratio := propStr(props, "ratio", "16/9")
	dataID := propStr(props, "data-id", "aspect-ratio")

	return fmt.Sprintf(`<div class="cs-aspect-ratio" style="aspect-ratio:%s" data-id="%s">%s</div>`,
		ratio, dataID, children), nil
}
