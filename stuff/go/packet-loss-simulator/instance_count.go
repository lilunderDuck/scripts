package main

type Instance struct {
	instanceMap map[string]byte
	Count       int
}

const ALIVE = 1

func Instance_new() *Instance {
	return &Instance{
		instanceMap: map[string]byte{},
		Count:       0,
	}
}

func (this *Instance) RegisterForEvident(appName string) {
	_, isRegistered := this.instanceMap[appName]
	if !isRegistered {
		this.instanceMap[appName] = ALIVE
		this.Count += 1
	}
}

func (this *Instance) ThrowOut(appName string) {
	_, isRegistered := this.instanceMap[appName]
	if !isRegistered {
		delete(this.instanceMap, appName)
		this.Count -= 1
	}
}
