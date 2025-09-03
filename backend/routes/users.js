const express = require("express");
const { body, param } = require("express-validator");
const userController = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body("profile.firstName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),

  body("profile.lastName")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),

  body("profile.location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),

  body("profile.farmSize")
    .optional()
    .trim()
    .isString()
    .withMessage("Farm size must be a string"),

  body("profile.cropTypes")
    .optional()
    .isArray()
    .withMessage("Crop types must be an array"),

  body("profile.experience")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid experience level"),

  body("preferences.language")
    .optional()
    .isIn(["en", "ml", "hi"])
    .withMessage("Invalid language preference"),

  body("preferences.notifications.email")
    .optional()
    .isBoolean()
    .withMessage("Email notification preference must be boolean"),

  body("preferences.notifications.push")
    .optional()
    .isBoolean()
    .withMessage("Push notification preference must be boolean"),
];

const userIdValidation = [
  param("userId").isMongoId().withMessage("Invalid user ID"),
];

// Routes
router.get("/profile", authenticateToken, userController.getProfile);
router.put(
  "/profile",
  authenticateToken,
  updateProfileValidation,
  userController.updateProfile
);
router.get("/stats", authenticateToken, userController.getUserStats);
router.get("/activity", authenticateToken, userController.getUserActivity);
router.delete("/account", authenticateToken, userController.deleteAccount);
router.post("/deactivate", authenticateToken, userController.deactivateAccount);
router.post("/reactivate", authenticateToken, userController.reactivateAccount);

// Admin routes (for future use)
router.get(
  "/:userId",
  authenticateToken,
  userIdValidation,
  userController.getUserById
);
router.get("/", authenticateToken, userController.getAllUsers);

module.exports = router;
