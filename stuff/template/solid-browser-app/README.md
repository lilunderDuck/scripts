## About this
This is a template for my own browser app, basically a frontend running on your browser tab and backend as a local http server.

The server will open the following port:
- `http://localhost:34515/` for dynamic assets.
- `http://localhost:[port]` for serving app assets and calling from frontend to backend.

It also contains most of the stuff for my own usage, this includes:
- Native file picker instead of browser's one to choose file, which then returns the actual path inside your computer.
- Calling functions from backend, just a fancy wrapper of POST request.
- Serving dynamic assets across app instances.