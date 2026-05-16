package engine

import "fmt"

func renderChatWidget(props map[string]interface{}, children string, e *Engine) (string, error) {
	webhook := propStr(props, "webhook", "")
	route := propStr(props, "route", "general")
	title := propStr(props, "title", "Chat")
	dataID := propStr(props, "data-id", "chat-widget")

	if webhook == "" {
		return "", fmt.Errorf("chat-widget requires a webhook prop")
	}

	return fmt.Sprintf(`
<button
  id="%s--bubble"
  class="cs-chat-bubble"
  aria-label="Open chat"
  onclick="csChatOpen('%s')">💬</button>

<div
  id="%s--container"
  class="cs-chat-container"
  data-webhook="%s"
  data-route="%s"
  data-id="%s">

  <div class="cs-chat-header">
    <span>%s</span>
    <button class="cs-chat-close" onclick="csChatClose('%s')" aria-label="Close chat">✕</button>
  </div>

  <div id="%s--body" class="cs-chat-body">
    <div class="cs-chat-msg cs-chat-msg--bot">
      <strong>Hi 👋</strong> — how can I help?
    </div>
  </div>

  <div class="cs-chat-footer">
    <input
      id="%s--input"
      class="cs-chat-input"
      type="text"
      placeholder="Type a message…"
      onkeydown="if(event.key==='Enter'){event.preventDefault();csChatSend('%s')}"
    />
    <button
      id="%s--send"
      class="cs-chat-send"
      onclick="csChatSend('%s')">Send</button>
  </div>
</div>
`, dataID, dataID,
		dataID, webhook, route, dataID,
		title,
		dataID,
		dataID,
		dataID, dataID,
		dataID, dataID), nil
}
