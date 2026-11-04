DLL_NAME := libquackity_packet_loss_sim

.PHONY: test

hell: # if things break, look at me
	go build -trimpath -gcflags=all="-l -B" -ldflags="-s -w -buildid=" -buildmode=c-shared -o ./out/${DLL_NAME}.dll
	upx --best ./out/${DLL_NAME}.dll

test:
	go build -o ./out/call_dll.exe ./test/call_dll.go
	./out/call_dll.exe