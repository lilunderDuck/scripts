package core

import (
	"encoding/json"
	"fmt"
	"net/http"
	"toast/backend/debug"

	"github.com/go-playground/validator/v10"
)

func CreateServer(port string) *http.Server {
	if debug.IS_ENABLED {
		debug.InfoLabelf("server", "starting server at port %s", port)
	}

	return &http.Server{
		Addr: port,
	}
}

func StartServer(server *http.Server) {
	if debug.IS_ENABLED {
		debug.InfoLabelf("server", "local server started at %s", server.Addr)
	}

	if err := server.ListenAndServe(); err != http.ErrServerClosed {
		if debug.IS_ENABLED {
			debug.WarnLabelf("server", "%v", err)
		}
	}
}

type RouteCloseFn func()

type JSON map[string]any

var validate = validator.New()

// Reads a JSON request body into the provided Go variable `out`.
// It returns an error if the decoding fails.
func ReadRequestInJson[T any](request *http.Request) (*T, error) {
	var out T
	err := json.NewDecoder(request.Body).Decode(&out)
	if err != nil {
		return nil, err
	}

	if err := validate.Struct(out); err != nil {
		return nil, err
	}

	return &out, err
}

// Sends a JSON response to the client with the specified HTTP status code.
func ResponseInJson(res http.ResponseWriter, status int, jsonData any) {
	if status >= 400 {
		jsonString, _ := json.Marshal(jsonData)
		http.Error(res, string(jsonString), status)
		return
	}
	res.Header().Set("Content-Type", "application/json")
	json.NewEncoder(res).Encode(jsonData)
}

func ResponseInText(res http.ResponseWriter, statusCode int, data string) {
	res.WriteHeader(statusCode)
	res.Header().Set("Content-Type", "text/plain; charset=utf-8")
	res.Write([]byte(data))
	if debug.IS_ENABLED {
		debug.InfoLabelf("server", "response with: %s - %s", debug.FormatNumber(statusCode), fmt.Sprintf("%.70s", data))
	}
}

func ResponseSuccess(res http.ResponseWriter) {
	ResponseInText(res, 200, "ok")
}

func Register(route string, routeHandler http.HandlerFunc) {
	if debug.IS_ENABLED {
		// if you haven't figure it out yet, yes, it's a reference to Forge/Neoforge early loading screen.
		debug.InfoLabelf("server", "REGISTERING %s", debug.FormatPath(route))
	}

	http.Handle(route, http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		// make sure I hate CORS in deverlopment mode
		if IS_DEV_MODE {
			if debug.IS_ENABLED {
				debug.InfoLabelf("server", "the duck shall cast their spell to wipe CORS out of %s", debug.FormatPath(req.URL.Path))
			}
			res.Header().Set("Access-Control-Allow-Origin", "*")
			res.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
			res.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			if req.Method == "OPTIONS" {
				ResponseInText(res, http.StatusNoContent, "")
				return // skip
			}
		}
		routeHandler(res, req)
	}))
}
