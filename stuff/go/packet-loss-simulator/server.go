package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const START_PORT = 34515

var isServerStarted = false
var totalInstance = 0
var serverInstance http.Server

var allowedToServeMap = map[string]uint8{
	"data":  http.StatusAccepted,
	"cache": http.StatusAccepted,
}

func GetCurrentDir() (currentPath string) {
	folderPath, err := os.Executable()
	if err != nil {
		panic(err)
	}

	return filepath.Dir(folderPath)
}

func StartServerIfNotStarted() (localServerUrl string) {
	if isServerStarted {
		localServerUrl = fmt.Sprintf("http://localhost:%d", START_PORT)
		return
	}

	mux := http.NewServeMux()

	serveStaticWithFilter(mux, "/local-assets", GetCurrentDir(), func(path string) int {
		firstFolderName := strings.SplitAfterN(path, "/", 2)[0]
		firstFolderName = strings.Replace(firstFolderName, "/", "", 1)
		_, ok := allowedToServeMap[firstFolderName]
		if !ok {
			return http.StatusForbidden
		}
		return http.StatusAccepted
	})

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
	localServerUrl = fmt.Sprintf("http://localhost:%d", START_PORT)
	return
}

func HangUpAndExitDramatically() {
	serverInstance.Shutdown(context.Background())
}

func serveStatic(serverInstance *http.ServeMux, path string, whatPath string) {
	// "/{anything...}" -> match anything after "/". The following route will be valid
	// 	 /any_path
	// 	 /basically/anything
	// 	 ...
	serverInstance.HandleFunc(path+"/{anything...}", func(res http.ResponseWriter, req *http.Request) {
		serveFile(res, req, filepath.Join(whatPath, req.PathValue("anything")))
	})
}

func serveStaticWithFilter(
	serverInstance *http.ServeMux,
	path string,
	whatPath string,
	filter func(path string) int,
) {
	serverInstance.HandleFunc(path+"/{anything...}", func(res http.ResponseWriter, req *http.Request) {
		path := req.PathValue("anything")
		status := filter(path)
		if status == http.StatusForbidden {
			responseWithError(res, status, "static", fmt.Errorf("not allowed to serve %s\n, if this is not intentional, check your filter function", path))
			return
		}

		serveFile(res, req, filepath.Join(whatPath, path))
	})
}

func serveFile(res http.ResponseWriter, req *http.Request, filePath string) {
	res.Header().Set("Access-Control-Allow-Origin", "*")
	http.ServeFile(res, req, filePath)
}

type JSON map[string]any

func responseWithError(res http.ResponseWriter, status int, errorName string, errorDetail error) {
	responseInJson(res, status, JSON{
		"status":  status,
		"name":    errorName,
		"details": fmt.Sprintf("%s. %s", errorDetail.Error(), "༼ つ ╹ ╹ ༽つ"),
	})
}

func responseInJson(res http.ResponseWriter, status int, jsonData JSON) {
	if status >= 400 {
		jsonString, _ := json.Marshal(jsonData)
		http.Error(res, string(jsonString), status)
		return
	}
	res.Header().Set("Content-Type", "application/json")
	json.NewEncoder(res).Encode(jsonData)
}
