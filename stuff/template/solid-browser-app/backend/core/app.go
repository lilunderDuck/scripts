package core

import (
	"embed"
	"io/fs"
	"net/http"
	"syscall"
	"toast/backend/debug"
)

const CONFUSING_ERROR_MESSAGE = "The operation completed successfully."

type BrowserApp struct {
	assetsServer assetsServer
	heartbeat    heartbeat
}

func NewApp(appName string) *BrowserApp {
	return &BrowserApp{
		assetsServer: assetsServer{
			dll:     syscall.NewLazyDLL("libquackity_packet_loss_sim.dll"),
			appName: appName,
		},
		heartbeat: newHeartbeat(),
	}
}

func (this *BrowserApp) Init(appAssets embed.FS, subDirectory string, appLocalhostUrl string) {
	this.assetsServer.mustOpen()

	publicFS, err := fs.Sub(appAssets, subDirectory)
	if err != nil {
		panic(err)
	}

	if !debug.IS_ENABLED {
		http.Handle("/", http.FileServer(
			http.FS(publicFS),
		))

		this.heartbeat.RegisterRouteAndStart(this.close)

		OpenBrowser(200, appLocalhostUrl)
	}
}

func (this *BrowserApp) close() {
	this.assetsServer.close()
}
