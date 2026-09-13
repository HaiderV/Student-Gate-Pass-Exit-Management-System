const express = require("express");
const { recordDegreeExit } = require("../controllers/degreeExit.controller");

const router = express.Router();

router.post("/", recordDegreeExit);

module.exports = router;
