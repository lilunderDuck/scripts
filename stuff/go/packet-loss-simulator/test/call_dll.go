package main

import (
	"fmt"
	"log"
	"net/http"
	"syscall"
	"unsafe"
)

var logger = log.Default()

func main() {
	dll := syscall.NewLazyDLL("libquackity_packet_loss_sim.dll")
	serverOpenProc := dll.NewProc("server_open_floodgates")
	serverClose := dll.NewProc("server_yeet")

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html")
		fmt.Fprint(w, `
			<!DOCTYPE html>
			<html>
			<body>
				<h1>Local App Running</h1>
				<button id="register">Register test</button>
				<button id="unregister">Unregister test</button>
				<button id="close">Close server</button>
				<style>
					body { background-color: #121212; color: #ffffff }
				</style>
				<script>
					document.getElementById("register").addEventListener('click', () => {
						fetch('/register')
					})

					document.getElementById("unregister").addEventListener('click', () => {
						fetch('/unregister')
					})

					document.getElementById("close").addEventListener('click', () => {
						fetch('/close')
					})
				</script>
			</body>
			</html>
		`)
	})

	appName, err := syscall.BytePtrFromString("something")
	if err != nil {
		logger.Printf("error: %#v\n", err)
		return
	}
	arg1 := uintptr(unsafe.Pointer(appName))

	http.HandleFunc("/register", func(w http.ResponseWriter, r *http.Request) {
		_, _, err = syscall.SyscallN(serverOpenProc.Addr(), arg1)

		if err.Error() != "The operation completed successfully." {
			log.Fatalf("Failed to execute DLL procedure: %v", err)
		}

		w.WriteHeader(http.StatusOK)
	})

	http.HandleFunc("/unregister", func(w http.ResponseWriter, r *http.Request) {
		_, _, err = syscall.SyscallN(serverClose.Addr(), arg1)
		if err.Error() != "The operation completed successfully." {
			log.Fatalf("Failed to execute DLL procedure: %v", err)
		}

		w.WriteHeader(http.StatusOK)
	})

	logger.Println("local assets opened at http://localhost:34515")
	logger.Println("test server open at http://localhost:6969, try to take a look")

	log.Fatal(http.ListenAndServe(":6969", nil))
}

func GoStringFromuintptr(ptr uintptr) string {
	if ptr == 0 {
		return ""
	}
	var length int
	for *(*byte)(unsafe.Pointer(ptr + uintptr(length))) != 0 {
		length++
	}
	return string(unsafe.Slice((*byte)(unsafe.Pointer(ptr)), length))
}
