package assets_server

import (
	"fmt"
	"syscall"
	"toast/backend/debug"
)

const CONFUSING_ERROR_MESSAGE = "The operation completed successfully."

type Server struct {
	Dll     *syscall.LazyDLL
	AppName string
}

func (this *Server) MustOpen() string {
	if debug.IS_ENABLED {
		debug.InfoLabelf("assets-server", "opening local server...")
	}

	openServerProc := this.Dll.NewProc("server_open_floodgates")
	serverAddrRaw, _, err := syscall.SyscallN(openServerProc.Addr(), stringToUintptr(this.AppName))
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

func (this *Server) Close() {
	if debug.IS_ENABLED {
		debug.InfoLabelf("assets-server", "closing local server...")
	}

	closeServerProc := this.Dll.NewProc("server_yeet")
	_, _, err := syscall.SyscallN(closeServerProc.Addr(), stringToUintptr(this.AppName))
	if debug.IS_ENABLED {
		if err != 0 && err.Error() != CONFUSING_ERROR_MESSAGE {
			panic(fmt.Errorf("Failed to execute DLL procedure: %v", err))
		}
	}
}
