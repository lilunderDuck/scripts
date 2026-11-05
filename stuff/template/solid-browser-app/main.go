package main

import (
	"embed"
	"toast/backend/core"
)

//go:embed dist/app/index.html dist/app/assets/*
var appAssets embed.FS

func main() {
	server := core.CreateServer(":8000")

	app := core.NewApp("playlist")
	app.Init(appAssets, "dist/app", "http://localhost:8000")

	core.StartServer(server)
}
