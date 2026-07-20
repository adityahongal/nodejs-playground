// applicationController.js ← the 5 functions (getAll, getOne, create, update, remove)
//
// Every function follows the same RECIPE now that a real DB is involved:
//   async  →  try { await Application.method() }  →  catch → 500
//   - async/await : DB access is network I/O (must wait for the round-trip)
//   - try/catch   : the DB can fail (network/bad data) → catch it, don't crash
//   - 404 vs 500  : "not found" = the query SUCCEEDED and returned null → guard it (404).
//                   catch = something actually broke → 500. (guards must `return`!)

import Application from "../models/applicationModel.js"; // ensure .js extension is present

// GET all
export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find(); // Model → MongoDB → all docs
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET by id
export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      // ← 404 lives HERE (query worked, found nothing)
      return res.status(404).json({ message: "application not found" });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST
export const createApplication = async (req, res) => {
  try {
    // create() validates req.body against the schema + auto-generates _id (no manual id/object-building)
    const application = await Application.create(req.body);

    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT
export const updateApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }, // new:true → return UPDATED doc (default = stale); runValidators → re-check schema
    );

    if(!application){
        return res.status(404).json({ message: "application not found" });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE
export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);

    if(!application){
        return res.status(404).json({message: "application not found"})
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
