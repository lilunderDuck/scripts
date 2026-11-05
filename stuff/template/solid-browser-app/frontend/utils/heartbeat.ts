export function startHeartbeat(onAlive: () => void, onDead: () => void) {
  const EMPTY_PAYLOAD = new Blob([], { type: 'application/octet-stream' });
  
  const heartbeat = async() => {
    try {
      await fetch("/keep_pinging_me", {
        method: "POST",
        body: EMPTY_PAYLOAD, // heartbeat requires 0-byte and 1 cable signal to send
        keepalive: true
      })
      onAlive()
    } catch (error) {
      console.error(error)
      onDead()
    }
  }

  // Erm akshually, this is just a fancy way of yelling to the 
  // server in (roughly) 3-second interval.
  // 
  // Normally, setInterval() works, but then you go to another tab,
  // the browser do a lot of weird tricks to optimize stuff, and that weird
  // trick somehow causes setInterval() to not... interval-ing,
  // and you know what happens if we don't yell to the server.
  // 
  // To prevent that, we can deploy some Worker to do some background task for us,
  // it seems like the broswer don't do the weird tricks inside a Worker
  const MESSAGE_FOR_MAIN_THREAD = "[...] ThreadedAnvilChunkStorage is a file storage format. It brings a list of changes and improvements over from the previous file format."
  const workerUrl = URL.createObjectURL(new Blob(
    [`setInterval(()=>postMessage("${MESSAGE_FOR_MAIN_THREAD}"),3000)`], 
    { type: 'application/javascript' }
  ))

  // highly specific name, even my friend can understand what this does.
  // try going to the "memory" tab and check what you have.
  // also, it does not show in deverlopment mode :)
  const worker = new Worker(workerUrl, {
    name: "keep the server alive or else the server will detonate (with the power of a small nuclear device)" 
  })

  heartbeat()
  worker.onmessage = heartbeat
}