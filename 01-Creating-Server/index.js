// Creating a server with HTTP (no express)

// `http` is a BUILT-IN Node module — ships with Node, no npm install needed.
import http from "http";

// createServer takes a CALLBACK: Node runs it on EVERY incoming request.
// req = the incoming request (what the client asked for) -> we READ from it.
// res = our response (what we send back)               -> we WRITE to it.
const httpServer = http.createServer((req, res) => {
  // req.url tells us WHICH path was requested -> we branch on it (basic routing).
  if (req.url === "/") {
    res.end("Home page route");
  } else if (req.url === "/about") {
    res.end("about page route");
  } else {
    res.end("not found page route");
  }
  // CAVEAT: call res.end() exactly ONCE per request.
  // Analogy: res.end() = "plate served, send it out" — you can't serve it twice.
  // A second res.end() here would crash: ERR_STREAM_WRITE_AFTER_END ("write after end").
});

// listen(port, callback): the server stays ALIVE waiting for requests.
// This callback runs ONCE, when the server is ready. Stop the server with Ctrl+C.
httpServer.listen(5030, () => {
  console.log("server started on http://localhost:5030");
});
