package utils

import (
	"strconv"
	"toast/backend/debug"

	gonanoid "github.com/matoous/go-nanoid/v2"
)

func GetRandomIntWithinLength(length int) int {
	result, err := strconv.Atoi(gonanoid.MustGenerate("123456789", length))
	if err != nil {
		if debug.IS_ENABLED {
			debug.ErrLabel("rand", err)
		}
		panic(err) // make sure to yell whenever weird shit happens
	}
	return result
}
