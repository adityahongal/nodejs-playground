import express from "express";

// const app = express();

// app.get("/",(request,response)=>{
//     response.send("Hello!")
// })

// app.listen("3030",()=>{
//     console.log("running on http://localhost:3030")
// })

// building endpoint
const app = express();

// MIDDLEWARE: runs between the request arriving and our route handler.
// express.json() reads the incoming JSON body (a string over HTTP) and does
// JSON.parse() on it, putting the resulting object on req.body.
// Without this, req.body would be undefined on POST/PUT. Register it ONCE, at the top.
app.use(express.json());

// In-memory "database" — just an array in RAM.
// ⚠️ TEMPORARY: this resets every time the server restarts (RAM is wiped).
//    That's why a real DB (MongoDB) comes next — it persists to disk.
// `let` (not const) because DELETE reassigns it via .filter().
let applications = [
  { id: 1, company: "Google", role: "Frontend Dev", status: "applied" },
  { id: 2, company: "Adobe", role: "Frontend Dev", status: "pending" },
  { id: 3, company: "Amazon", role: "Frontend Engineer", status: "applied" },
];

// GET all — read the whole collection. res.json() stringifies + sets JSON header.
app.get("/api/applications", (request, response) => {
  response.json(applications);
});

// GET one by id — ":id" is a ROUTE PARAM; whatever's in the URL lands in req.params.id.
app.get("/api/applications/:id", (req, res) => {
  console.log(req.params.id); // visit /api/applications/2 → logs "2"

  // req.params.id is always a STRING ("2") — convert to match numeric ids.
  const id = Number(req.params.id);
  const application = applications.find((x) => x.id === id); // .find returns first match (or undefined)

  if (application) {
    res.json(application); // found → 200 OK + the resource
  } else {
    res.status(404).json({ message: "Application not found" }); // not found → 404
  }
});

// POST = CREATE a new application. Body comes in via req.body (parsed by express.json()).
app.post("/api/applications",(req,res)=>{

    const newApp = {
        id: applications.length+1,   // simple generated id (a DB would assign this)
        company: req.body.company,   // read each field the client sent
        role: req.body.role,
        status:req.body.status
    }

    applications.push(newApp);       // add to the in-memory array

    // 201 = Created (correct REST code for a new resource). .status() sets code,
    // .json() sends the body — chained together.
    res.status(201).json(newApp);
})

// PUT = UPDATE an existing application by id.
app.put("/api/applications/:id", (req, res) => {
    const id = Number(req.params.id);
    const application = applications.find((x)=>x.id === id);

    // GUARD CLAUSE: must `return` so the update code below doesn't run on a miss
    // (without return → we'd hit a 2nd res + crash: ERR_HTTP_HEADERS_SENT).
    if(!application){
        return res.status(404).json({ message: "Application not found" });
    }

    // `req.body.x || application.x` = use new value IF provided, else keep the old one.
    application.company = req.body.company || application.company;
    application.role = req.body.role || application.role;
    application.status = req.body.status || application.status;

    res.json(application);   // 200 OK + the updated item
})

// DELETE = remove an application by id.
app.delete("/api/applications/:id", (req, res) => {
    const id = Number(req.params.id);
    const exists = applications.find((x)=>x.id === id);

    // Same guard clause — the `return` here was the fix for the double-response crash.
    if(!exists){
        return res.status(404).json({ message: "Application not found" });
    }

    applications = applications.filter((a)=>a.id !== id)       // keep everything EXCEPT this id (reassigns the array → needs `let`)
    res.status(204).send();                                    // 204 = No Content (deleted, nothing to return)
})

app.listen(3030, () => {
  console.log("running on http://localhost:3030/api/applications");
});
