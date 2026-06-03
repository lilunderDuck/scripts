.PHONY: build

build:
	bun build ./stuff/mangle/src/main.ts --target=node --outfile ./dist/mangle.js
	bun build ./stuff/macros/src/main.ts --minify --target=node --outfile ./dist/macros.js	