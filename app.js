require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const app = express();
app.set("view engine", "ejs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DATABASE_URL_LOCAL,
});

app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

// Server
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
