package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-playground/validator/v10"
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
	mux.HandleFunc("/local-assets/{anything...}", func(res http.ResponseWriter, req *http.Request) {
		serveFile(res, req, filepath.Join(execDir, "data", req.PathValue("anything")))
	})

	mux.HandleFunc("/preview", func(res http.ResponseWriter, req *http.Request) {
		requestedFile := req.URL.Query().Get("path")
		// ... maybe I should code a path filter here ...
		// you don't want a random app like this one to randomly access places
		// like System32, AppData, ... right?
		serveFile(res, req, requestedFile)
	})

	windowHandle := getBrowserWindowHandle()
	mux.HandleFunc("/openFileDialog", func(res http.ResponseWriter, req *http.Request) {
		options, err := readRequestInJson[OpenFileDialogParam](req)
		if err != nil {
			responseInText(res, http.StatusBadRequest, "Could not parse options: "+err.Error())
			return
		}

		filePath, err := openFileDialog(options, windowHandle)
		if err != nil {
			responseInText(res, http.StatusBadRequest, "Could not open file dialog: "+err.Error())
			return
		}

		responseInText(res, http.StatusOK, filePath)
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

func responseInText(res http.ResponseWriter, status int, errorDetail string) {
	res.Header().Set("Access-Control-Allow-Origin", "*")
	res.Header().Set("Content-Type", "text/plain; charset=utf-8")
	res.WriteHeader(status)
	res.Write([]byte(errorDetail))
}

var validate = validator.New()

func readRequestInJson[T any](request *http.Request) (*T, error) {
	var out T
	err := json.NewDecoder(request.Body).Decode(&out)
	if err != nil {
		return nil, err
	}

	if err := validate.Struct(out); err != nil {
		return nil, err
	}

	return &out, err
}
