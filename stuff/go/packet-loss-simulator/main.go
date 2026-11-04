// This is just a local http server to serve dynamic assets. The server expose 2 routes:
//
//	/local-assets - serve files on [current dll path]/data/[app name] folder
//	/preview - any files inside your computer
package main

import "C"

func main() { /* empty, to make go compiler happy */ }

var deferredRegister = Instance_new()

//export server_open_floodgates
func server_open_floodgates(rawAppName *C.char) *C.char {
	appName := C.GoString(rawAppName)
	deferredRegister.RegisterForEvident(appName)
	serverUrl := StartServerIfNotStarted()
	return C.CString(serverUrl)
}

//export server_yeet
func server_yeet(appName *C.char) {
	deferredRegister.ThrowOut(C.GoString(appName))
	if deferredRegister.Count == 0 {
		HangUpAndExitDramatically()
	}
}
