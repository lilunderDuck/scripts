package core

import (
	"embed"
	"io/fs"
	"net/http"
	"syscall"
	"toast/backend/core/assets_server"
	"toast/backend/core/front2back"
	"toast/backend/core/heartbeat"
	"toast/backend/core/native"
	"toast/backend/debug"
)

type BrowserApp struct {
	assetsServer        assets_server.Server
	heartbeat           heartbeat.Instance
	browserWindowHandle uintptr
}

func NewApp(appName string) *BrowserApp {
	return &BrowserApp{
		assetsServer: assets_server.Server{
			Dll:     syscall.NewLazyDLL("libquackity_packet_loss_sim.dll"),
			AppName: appName,
		},
		heartbeat:           heartbeat.New(),
		browserWindowHandle: getBrowserWindowHandle(),
	}
}

func (this *BrowserApp) Init(appAssets embed.FS, subDirectory string, appLocalhostUrl string) {
	this.assetsServer.MustOpen()

	publicFS, err := fs.Sub(appAssets, subDirectory)
	if err != nil {
		panic(err)
	}

	native.RegisterNativeDialogPickerCalls(this.browserWindowHandle)

	if !debug.IS_ENABLED {
		http.Handle("/", http.FileServer(
			http.FS(publicFS),
		))

		this.heartbeat.RegisterRouteAndStart(this.assetsServer.Close)

		OpenBrowser(200, appLocalhostUrl)
	}
}

func (this *BrowserApp) Start(port string) {
	serverInstance := front2back.CreateServer(port)
	front2back.StartServer(serverInstance)
}
