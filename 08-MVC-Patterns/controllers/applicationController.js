// applicationController.js ← the 5 functions (getAll, getOne, create, update, remove)

import applications from "../models/applicationModel.js";       // ensure .js extension is present

// GET all
export const getAllApplications = (req,res) => {
    res.json(applications);
}

// GET by id
export const getApplicationById = (req,res) => {
    
    const id = Number(req.params.id);
    const application = applications.find((x)=> x.id === id);

    if(!application){
        return res.status(404).json({"message":"application not found"})
    }
    res.json(application)
}

// POST
export const createApplication = (req,res) => {
    const newApp = {
        id:applications.length + 1,
        role:req.body.role,
        company:req.body.company,
        status:req.body.status
    }

    applications.push(newApp);

    res.status(201).json(newApp)
}

// PUT
export const updateApplication =(req,res) => {
    const id = Number(req.params.id);
    const application = applications.find((x)=> x.id === id);

    if(!application){
        return res.status(404).json({"message":"application not found"})
    }

    application.company = req.body.company || application.company;
    application.role = req.body.role || application.role;
    application.status = req.body.status || application.status;

    res.json(application); 
}

// DELETE
export const deleteApplication = (req,res) => {
    const id = Number(req.params.id)
    const index = applications.findIndex((x)=>x.id === id)  // to find the POSITION

    if(index === -1){                           // findIndex returns -1 if not found
        return res.status(404).json({"message":"application not found"})
    }

    applications.splice(index, 1);               // remove 1 item at that index (MUTATES — works across files), splice instead of filter as filter create a new array insteadd of mutating exisiting one
    res.status(204).send();
}