package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
)

const START_PORT = 34515

var isServerStarted = false
var serverInstance http.Server

func GetCurrentDir() (currentPath string) {
	folderPath, err := os.Executable()
	if err != nil {
		panic(err)
	}

	return filepath.Dir(folderPath)
}

func StartServerIfNotStarted() {
	if isServerStarted {
		return
	}

	execDir := GetCurrentDir()

	mux := http.NewServeMux()
	mux.Handle("/local-assets", http.StripPrefix(
		"/local-assets/data/",
		http.FileServer(http.Dir(
			filepath.Join(execDir, "data"),
		)),
	))

	mux.HandleFunc("/preview", func(res http.ResponseWriter, req *http.Request) {
		requestedFile := req.URL.Query().Get("path")
		// ... maybe I should code a path filter here ...
		// you don't want a random app like this one to randomly access places
		// like System32, AppData, ... right?
		serveFile(res, req, requestedFile)
	})

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", START_PORT),
		Handler: mux,
	}

	go server.ListenAndServe()

	isServerStarted = true
	if DEBUG_ENABLED {
		logger.Info("server opened")
	}
}

func HangUpAndExitDramatically() {
	if DEBUG_ENABLED {
		logger.Info("server is shutting down")
	}

	if err := serverInstance.Shutdown(context.Background()); err != nil {
		if DEBUG_ENABLED {
			logger.Error("server forced to shutdown: " + err.Error())
		}
	}

	serverInstance.Close()

	if DEBUG_ENABLED {
		logger.Info("server shutdown complete")
	}
}

func serveFile(res http.ResponseWriter, req *http.Request, filePath string) {
	res.Header().Set("Access-Control-Allow-Origin", "*")
	http.ServeFile(res, req, filePath)
}

func responseWithError(res http.ResponseWriter, status int, errorDetail string) {
	res.Header().Set("Content-Type", "text/plain; charset=utf-8")
	res.WriteHeader(status)
	res.Write([]byte(errorDetail))
}
