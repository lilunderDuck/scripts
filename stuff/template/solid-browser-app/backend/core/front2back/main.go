package front2back

import (
	"fmt"
	"net/http"
)

const FN_ROUTE_NAME = "/teleporter/"

func isPostRequest(res http.ResponseWriter, req *http.Request) bool {
	if req.Method != "POST" {
		ResponseInText(res, http.StatusMethodNotAllowed, fmt.Sprintf("the duck ritual requires a POST request, but you just send a %s request", req.Method))
		return false
	}

	return true
}

func RegisterFn[Data any, ReturnValue any](
	name string,
	handler func(data *Data) (ReturnValue, error),
) {
	Register(FN_ROUTE_NAME+name, func(res http.ResponseWriter, req *http.Request) {
		if !isPostRequest(res, req) {
			return
		}

		requestData, err := ReadRequestInJson[Data](req)
		if err != nil {
			ResponseInText(res, http.StatusBadRequest, fmt.Sprintf("the duck ritual cannot parse the incoming data so it can pass it to %s: %v", name, err))
			return
		}

		returnVal, err := handler(requestData)
		if err != nil {
			ResponseInText(res, http.StatusInternalServerError, fmt.Sprintf("duck has exploded while doing the duck ritual: %v", err))
			return
		}

		ResponseInJson(res, http.StatusOK, returnVal)
	})
}

func RegisterFnAction(name string, handler func() error) {
	Register(FN_ROUTE_NAME+name, func(res http.ResponseWriter, req *http.Request) {
		if !isPostRequest(res, req) {
			return
		}

		if err := handler(); err != nil {
			ResponseInText(res, http.StatusInternalServerError, fmt.Sprintf("duck has exploded while doing the duck ritual: %#v", err))
			return
		}

		ResponseInText(res, http.StatusOK, "ok")
	})
}

func RegisterFnProducer[ReturnValue any](
	name string,
	handler func() (ReturnValue, error),
) {
	Register(FN_ROUTE_NAME+name, func(res http.ResponseWriter, req *http.Request) {
		if !isPostRequest(res, req) {
			return
		}

		returnVal, err := handler()
		if err != nil {
			ResponseInText(res, http.StatusInternalServerError, fmt.Sprintf("duck has exploded while doing the duck ritual: %#v", err))
			return
		}

		ResponseInJson(res, http.StatusOK, returnVal)
	})
}

func RegisterFnConsumer[Data any](
	name string,
	handler func(data *Data) error,
) {
	Register(FN_ROUTE_NAME+name, func(res http.ResponseWriter, req *http.Request) {
		if !isPostRequest(res, req) {
			return
		}

		requestData, err := ReadRequestInJson[Data](req)
		if err != nil {
			ResponseInText(res, http.StatusBadRequest, fmt.Sprintf("the duck ritual cannot parse the incoming data so it can pass it to %s: %#v", name, err))
			return
		}

		err = handler(requestData)
		if err != nil {
			ResponseInText(res, http.StatusInternalServerError, fmt.Sprintf("duck has exploded while doing the duck ritual: %#v", err))
			return
		}

		ResponseInText(res, http.StatusOK, "ok")
	})
}
