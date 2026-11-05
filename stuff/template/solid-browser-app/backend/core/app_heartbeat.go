package core

import (
	"context"
	"net/http"
	"sync"
	"time"
	"toast/backend/debug"
)

const HEARTBEAT_CHECK_INTERVAL = 4 * time.Second
const HEARTBEAT_MAX_ELAPSE_TIME = 12 * time.Second

type heartbeat struct {
	lastSeen      time.Time
	lastSeenMutex sync.Mutex
	server        *http.Server
}

func newHeartbeat() heartbeat {
	return heartbeat{
		lastSeen:      time.Now(),
		lastSeenMutex: sync.Mutex{},
	}
}

func (this *heartbeat) RegisterRouteAndStart(beforeShuttingDownFn RouteCloseFn) {
	Register("/keep_pinging_me", func(res http.ResponseWriter, req *http.Request) {
		this.update()
		res.WriteHeader(http.StatusNoContent)
	})

	if debug.IS_ENABLED {
		debug.InfoLabelf("heartbeat", "heartbeat system is disabled in deverlopment mode!")
		return
	}

	go func() {
		for {
			this.check(beforeShuttingDownFn)
		}
	}()
}

func (this *heartbeat) update() {
	this.lastSeenMutex.Lock()
	this.lastSeen = time.Now()
	this.lastSeenMutex.Unlock()
}

func (this *heartbeat) check(beforeShuttingDownFn RouteCloseFn) {
	time.Sleep(HEARTBEAT_CHECK_INTERVAL)
	this.lastSeenMutex.Lock()
	elapsed := time.Since(this.lastSeen)

	if debug.IS_ENABLED {
		debug.InfoLabelf("heartbeat", "checking heartbeat from the otherside, last seen: %s seconds", debug.FormatFloatNumber(elapsed.Seconds()))
	}

	this.lastSeenMutex.Unlock()
	if elapsed > HEARTBEAT_MAX_ELAPSE_TIME {
		if debug.IS_ENABLED {
			debug.InfoLabelf("heartbeat", "heartbeat stopped, shutting down the server now...")
		}
		beforeShuttingDownFn()
		_ = this.server.Shutdown(context.Background())
		return
	}
}
