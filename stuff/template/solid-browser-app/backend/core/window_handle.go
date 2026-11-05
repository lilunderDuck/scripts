package core

import (
	"runtime"
	"strings"
	"syscall"
	"toast/backend/debug"
	"unsafe"
)

func getBrowserWindowHandle() uintptr {
	if debug.IS_ENABLED {
		debug.InfoLabelf("browser-app", "we're up to no good in: %s", runtime.GOOS)
	}

	if runtime.GOOS == "windows" {
		return tryGettingBrowserHwndWindows()
	}

	if debug.IS_ENABLED {
		debug.ErrLabelf("browser-app", `getBrowserWindowHandle() is currently only work on windows, 
			I don't have a Mac to test this and I don't know how in linux does. I'm sorry...
		`)
		panic("currently getBrowserWindowHandle() only works on windows, you're currently on: " + runtime.GOOS)
	}

	return 0
}

func tryGettingBrowserHwndWindows() uintptr {
	var (
		user32        = syscall.NewLazyDLL("user32.dll")
		enumWindows   = user32.NewProc("EnumWindows")
		getWindowText = user32.NewProc("GetWindowTextW")
	)

	var hwnd syscall.Handle

	buf := make([]uint16, 200) // 200 character, should be enough
	cb := syscall.NewCallback(func(h syscall.Handle, p uintptr) uintptr {
		// https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowtextw
		// int GetWindowTextW(
		// 	[in]  HWND   hWnd,        is window handle
		// 	[out] LPWSTR lpString,    is window title string
		// 	[in]  int    nMaxCount    is window title string length
		// );
		// these param name literaly making me to love myself. (censored)
		result, _, _ := getWindowText.Call(uintptr(h), uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
		if result > 0 {
			title := syscall.UTF16ToString(buf)
			if debug.IS_ENABLED {
				debug.InfoLabelf("browser-app", "finding window with title of \"%s\"", title)
			}

			if strings.HasSuffix(title, "Chrome") {
				hwnd = h
				if debug.IS_ENABLED {
					debug.InfoLabelf("browser-app", "found browser window handle, %s",
						debug.FormatKeyWithValue("hwnd", debug.FormatNumberToHex(uint64(h))),
					)
				}
				return 0
			}
		}
		return 1
	})

	// https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-enumwindows
	// BOOL EnumWindows(
	// 	[in] WNDENUMPROC lpEnumFunc,    is callback fn
	// 	[in] LPARAM      lParam         is ???
	// );
	// Return: nonzero if ok,
	enumWindows.Call(cb, 0)

	if debug.IS_ENABLED {
		if hwnd == 0 {
			debug.WarnLabel("browser-app", "could not find browser window handle, some stuff \nmight not work as expected, just a warning.\n\nThis might be due to the fact that I did not handle all browser name. You might need to have a look at the log messages right here.")
		}
	}

	return uintptr(hwnd)
}
