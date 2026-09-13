const express = require("express");
const router = express.Router();

const {
    recordJuniorExit,
    recordJuniorExitByRegistration
} = require("../controllers/juniorExit.controller");

router.post("/", recordJuniorExit);
router.post("/registration", recordJuniorExitByRegistration);

module.exports = router;