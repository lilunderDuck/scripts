package core

import (
	"os/exec"
	"runtime"
	"time"
	"toast/backend/debug"
)

func OpenBrowser(openDelayInMs int, url string) {
	if debug.IS_ENABLED {
		debug.InfoLabelf("browser", "opening %s with the delay of %s miliseconds", url, debug.FormatNumber(openDelayInMs))
	}
	time.Sleep(time.Duration(openDelayInMs) * time.Millisecond)
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start", url}
	case "darwin":
		cmd = "open"
		args = []string{url}
	default: // Linux
		cmd = "xdg-open"
		args = []string{url}
	}

	go func() {
		err := exec.Command(cmd, args...).Start()
		if err != nil {
			panic(err)
		}
	}()
}
