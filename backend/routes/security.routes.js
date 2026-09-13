const express = require("express");

const router = express.Router();

const {
    verifyJuniorUniqueNumber,
} = require("../controllers/security.controller");


// Security verifies number at exit
router.get(
    "/junior/verify-number",
    verifyJuniorUniqueNumber
);


module.exports = router;