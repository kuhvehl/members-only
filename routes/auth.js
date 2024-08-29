const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { isAuthenticated } = require("../middleware/auth");
const secretPasscode = process.env.SECRET_PASSCODE;
const adminPasscode = process.env.ADMIN_PASSCODE;

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.post(
  "/signup",
  [
    body("firstName")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("First name must be specified."),
    body("lastName")
      .trim()
      .isLength({ min: 1 })
      .escape()
      .withMessage("Last name must be specified."),
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Must be a valid email address."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long."),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match password");
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("signup", { errors: errors.array() });
    }

    try {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const user = await User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashedPassword,
      });

      res.redirect("/auth/login");
    } catch (error) {
      console.error(error);
      res.render("signup", {
        errors: [{ msg: "Error creating user. Please try again." }],
      });
    }
  }
);

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (user && (await bcrypt.compare(req.body.password, user.password))) {
      // Login successful
      req.session.userId = user.id;
      res.redirect("/"); // Redirect to home page
    } else {
      // Login failed
      res.render("login", { error: "Invalid email or password" });
    }
  } catch (error) {
    console.error(error);
    console.error("Error during login:", error);
    res.render("login", { error: "An error occurred. Please try again." });
  }
});

router.get("/logout", (req, res) => {
  const userEmail = req.session.userId
    ? "User ID: " + req.session.userId
    : "Unknown user";
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return console.log(err);
    }
    res.redirect("/");
  });
});

router.get("/join-club", isAuthenticated, (req, res) => {
  res.render("join-club");
});

router.post("/join-club", isAuthenticated, async (req, res) => {
  if (req.body.passcode === secretPasscode) {
    try {
      await User.update(
        { isMember: true },
        { where: { id: req.session.userId } }
      );
      res.redirect("/");
    } catch (error) {
      console.error("Error updating user membership:", error);
      res.render("join-club", {
        error: "An error occurred. Please try again.",
      });
    }
  } else {
    res.render("join-club", { error: "Incorrect passcode" });
  }
});

router.get("/become-admin", isAuthenticated, (req, res) => {
  res.render("become-admin");
});

router.post("/become-admin", isAuthenticated, async (req, res) => {
  if (req.body.adminPasscode === adminPasscode) {
    try {
      await User.update(
        { isAdmin: true },
        { where: { id: req.session.userId } }
      );
      res.redirect("/");
    } catch (error) {
      console.error("Error updating user admin status:", error);
      res.render("become-admin", {
        error: "An error occurred. Please try again.",
      });
    }
  } else {
    res.render("become-admin", { error: "Incorrect admin passcode" });
  }
});

module.exports = router;
