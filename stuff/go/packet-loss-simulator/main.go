// This is just a local http server to serve dynamic assets. The server expose 2 routes:
//
//	/local-assets - serve files on [current dll path]/data/[app name] folder
//	/preview - any files inside your computer
package main

import "C"
import (
	"log/slog"
	"os"
)

var logger *slog.Logger

func init() {
	if DEBUG_ENABLED {
		file, err := os.OpenFile("./out/debug_logs.txt", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			panic(err)
		}

		logger = slog.New(slog.NewJSONHandler(file, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		}))
	}
}

func main() { /* empty, to make go compiler happy */ }

var deferredRegister = Instance_new()

//export server_open_floodgates
func server_open_floodgates(rawAppName *C.char) {
	appName := C.GoString(rawAppName)
	if DEBUG_ENABLED {
		logger.Info("REGISTERING", "app_name", appName)
	}
	deferredRegister.RegisterForEvident(appName)
	StartServerIfNotStarted()
}

//export server_yeet
func server_yeet(appName *C.char) {
	if DEBUG_ENABLED {
		logger.Info("UNREGISTERING", "app_name", C.GoString(appName))
	}
	deferredRegister.ThrowOut(C.GoString(appName))
	if deferredRegister.Count == 0 {
		HangUpAndExitDramatically()
	}
}
