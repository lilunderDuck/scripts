## About this
Just a logging utility on deverlopment mode for my backend, that it.

## Usage
```go
import "fmt"

func main() {
  // wrap everything inside this if check, because I want to make this log
  // disappear when building on production mode.
  //
  // It's kinda gross if I have to wrap this everytime I log something.
  if debug.IS_ENABLED {
    // basic logging
    debug.InfoLabel("hello", "world")
    debug.WarnLabel("hello", "world")

    // for errors, you can pass in the error type itself
    err := fmt.Errorf("world") // error coming from somewhere, this is an example
    debug.ErrLabel(err)

    // of course, there's a format version
    debug.InfoLabelf("hello", "this: %s", "world")
    debug.WarnLabelf("hello", "this: %s", "world")
    debug.ErrLabelf("hello", "this: %#v", err)
  }
}
```

Then pass in `TOAST_DEBUG` tag to make the log appear in the console, simply remove `TOAST_DEBUG` to strip out all debug log call (if you're making sure to wrap all debug log call in `if debug.IS_ENABLED {...}` of course):
```
go build -o main.exe -tags=TOAST_DEBUG main.go
./main
```

Additionally, you can use `debug.IS_ENABLED` to run some debug logic code that you might don't want to include in production build.
```go
if debug.IS_ENABLED {
  doSomeDebugStuffHere()
}
```