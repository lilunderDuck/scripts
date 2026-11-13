package main

import (
	"embed"
	"toast/backend/core"
)

//go:embed dist/app/index.html dist/app/assets/*
var appAssets embed.FS

func main() {
	app := core.NewApp("hello_world")
	app.Init(appAssets, "dist/app", "http://localhost:8000")

	app.Start(":8000")
}
