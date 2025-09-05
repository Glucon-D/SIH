const express = require("express");
const { getNudges } = require("../controllers/nudgesController");

const router = express.Router();

router.get("/", getNudges);

module.exports = router;
