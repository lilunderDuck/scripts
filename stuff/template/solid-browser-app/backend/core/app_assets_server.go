package core

import (
	"fmt"
	"syscall"
	"toast/backend/debug"
)

type assetsServer struct {
	dll     *syscall.LazyDLL
	appName string
}

func (this *assetsServer) mustOpen() string {
	if debug.IS_ENABLED {
		debug.InfoLabelf("assets-server", "opening local server...")
	}

	openServerProc := this.dll.NewProc("server_open_floodgates")
	serverAddrRaw, _, err := syscall.SyscallN(openServerProc.Addr(), stringToUintptr(this.appName))
	if debug.IS_ENABLED {
		if err != 0 && err.Error() != CONFUSING_ERROR_MESSAGE {
			panic(fmt.Errorf("Failed to execute DLL procedure: %v", err))
		}
	}

	serverUrlStr := goStringFromUintptr(serverAddrRaw)

	if debug.IS_ENABLED {
		debug.InfoLabelf("assets-server", "local server listen on: %s", serverUrlStr)
	}
	return serverUrlStr
}

func (this *assetsServer) close() {
	if debug.IS_ENABLED {
		debug.InfoLabelf("assets-server", "closing local server...")
	}

	closeServerProc := this.dll.NewProc("server_yeet")
	_, _, err := syscall.SyscallN(closeServerProc.Addr(), stringToUintptr(this.appName))
	if debug.IS_ENABLED {
		if err != 0 && err.Error() != CONFUSING_ERROR_MESSAGE {
			panic(fmt.Errorf("Failed to execute DLL procedure: %v", err))
		}
	}
}
