const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
    createDegreeGatepass,
    searchDegreeGatepasses,
    markDegreeGatepassExited,
    getDegreeStudentForGatepass
} = require("../controllers/degreeGatepass.controller");

const {
    getDegreeGatepasses,
    getDegreeGatepassById,
    searchDegreeGatepassesGeneral,
    searchDegreeGatepassesByRegistration,
    updateDegreeGatepass,
    deleteDegreeGatepass,
    cancelDegreeGatepass
} = require("../controllers/gatepassManagement.controller");

router.get("/", getDegreeGatepasses);

// Create
router.post(
    "/",
    upload.single("signed_letter"),
    createDegreeGatepass
);

// Search by student name
router.get("/search", searchDegreeGatepassesGeneral);

router.get("/student/:registrationNumber", searchDegreeGatepassesByRegistration);

router.get("/:id", getDegreeGatepassById);

router.put("/:id", updateDegreeGatepass);

router.delete("/:id", deleteDegreeGatepass);

router.patch("/:id/cancel", cancelDegreeGatepass);

// Mark exited
router.patch(
    "/:id/exit",
    markDegreeGatepassExited
);

module.exports = router;