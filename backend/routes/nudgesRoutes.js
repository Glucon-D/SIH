const express = require("express");
const { getNudges } = require("../controllers/nudgesController");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", optionalAuth, getNudges);

module.exports = router;
