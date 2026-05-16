package main

import "chefscript/engine"

// RegisterApp registers all components, pages, and actions for this application.
// This is the entry point for your app — add your registrations here.
func RegisterApp(e *engine.Engine) {
	engine.DefaultPage = "home"
	engine.ServerPort = 7071

	// ── Components ──
	engine.RegisterBibleComponents(e)

	// ── Pages ──
	// engine.RegisterPage("home", myPageLoader())

	// ── Actions ──
	// engine.RegisterAction("my/action", myActionHandler())
}
