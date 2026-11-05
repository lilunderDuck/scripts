package heartbeat

import (
	"context"
	"net/http"
	"sync"
	"time"
	"toast/backend/core/front2back"
	"toast/backend/debug"
)

type Instance struct {
	lastSeen      time.Time
	lastSeenMutex sync.Mutex
	server        *http.Server
}

func New() Instance {
	return Instance{
		lastSeen:      time.Now(),
		lastSeenMutex: sync.Mutex{},
	}
}

func (this *Instance) RegisterRouteAndStart(beforeShuttingDownFn front2back.RouteCloseFn) {
	front2back.Register("/keep_pinging_me", func(res http.ResponseWriter, req *http.Request) {
		this.update()
		res.WriteHeader(http.StatusNoContent)
	})

	if debug.IS_ENABLED {
		debug.InfoLabelf("hearbeat", "hearbeat system is disabled in deverlopment mode!")
		return
	}

	go func() {
		for {
			this.check(beforeShuttingDownFn)
		}
	}()
}

func (this *Instance) update() {
	this.lastSeenMutex.Lock()
	this.lastSeen = time.Now()
	this.lastSeenMutex.Unlock()
}

func (this *Instance) check(beforeShuttingDownFn front2back.RouteCloseFn) {
	time.Sleep(HEARTBEAT_CHECK_INTERVAL)
	this.lastSeenMutex.Lock()
	elapsed := time.Since(this.lastSeen)

	if debug.IS_ENABLED {
		debug.InfoLabelf("Instance", "checking Instance from the otherside, last seen: %s seconds", debug.FormatFloatNumber(elapsed.Seconds()))
	}

	this.lastSeenMutex.Unlock()
	if elapsed > HEARTBEAT_MAX_ELAPSE_TIME {
		if debug.IS_ENABLED {
			debug.InfoLabelf("Instance", "Instance stopped, shutting down the server now...")
		}
		beforeShuttingDownFn()
		_ = this.server.Shutdown(context.Background())
		return
	}
}
