package assets_server

import (
	"fmt"
	"syscall"
	"unsafe"
)

func stringToUintptr(anyString string) uintptr {
	appNamePtr, err := syscall.BytePtrFromString(anyString)
	// possible (unlikely) crash?: I don't think the go GC will wipe the appNamePtr
	// but before the crash happens, let's just assume that it works and
	// this is a reference to NES Tetris sensitive dynamic jump routine.
	// see this video of Retro Game Mechanics Explained for more info:
	//   https://www.youtube.com/watch?v=h7H_ilLn7nc
	if err != nil {
		panic(fmt.Errorf("failed to convert \"%s\" into a pointer, ptr = %#v", anyString, appNamePtr))
	}

	return uintptr(unsafe.Pointer(appNamePtr))
}

func goStringFromUintptr(ptr uintptr) string {
	if ptr == 0 {
		return ""
	}
	var length int
	for *(*byte)(unsafe.Pointer(ptr + uintptr(length))) != 0 {
		length++
	}
	return string(unsafe.Slice((*byte)(unsafe.Pointer(ptr)), length))
}
