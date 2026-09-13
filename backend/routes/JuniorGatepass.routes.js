const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
    createJuniorGatepass,
    searchJuniorGatepasses,
    markJuniorGatepassExited,
    getJuniorStudentForGatepass
} = require("../controllers/JuniorGatepass.controller");

const {
    getJuniorGatepasses,
    getJuniorGatepassById,
    searchJuniorGatepassesGeneral,
    searchJuniorGatepassesByRegistration,
    updateJuniorGatepass,
    deleteJuniorGatepass,
    cancelJuniorGatepass
} = require("../controllers/gatepassManagement.controller");

router.get("/", getJuniorGatepasses);

// Reception creates gatepass
router.post(
    "/",
    upload.single("signed_letter"),
    createJuniorGatepass
);

// Security searches by student name
router.get("/search", searchJuniorGatepassesGeneral);

router.get("/student/:registrationNumber", searchJuniorGatepassesByRegistration);

router.get("/:id", getJuniorGatepassById);

router.put("/:id", updateJuniorGatepass);

router.delete("/:id", deleteJuniorGatepass);

router.patch("/:id/cancel", cancelJuniorGatepass);

// Security marks student exited
router.patch(
    "/:id/exit",
    markJuniorGatepassExited
);

module.exports = router;