const express = require("express");
const path = require("path");
const session = require("express-session");
const port = process.env.PORT || 3000;
const authRouter = require("./routes/auth");
const { isAuthenticated } = require("./middleware/auth");
const Message = require("./models/message");
const User = require("./models/user");
const sequelize = require("./config/database");
const SequelizeStore = require("connect-session-sequelize")(session.Store);

const app = express();

const sessionStore = new SequelizeStore({
  db: sequelize,
});

// Session middleware
app.use(
  session({
    secret: "your_session_secret", // Replace with a real secret in production
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true if using https
  })
);

// Create session table if it doesn't exist
sessionStore.sync();

sequelize
  .sync()
  .then(() => {
    console.log("Database synced");
  })
  .catch((error) => {
    console.error("Error syncing database:", error);
  });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/auth", authRouter);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
app.get("/", async (req, res) => {
  const messages = await Message.findAll({
    include: [
      { model: User, as: "author", attributes: ["firstName", "lastName"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  let user = null;
  if (req.session.userId) {
    user = await User.findByPk(req.session.userId);
  }

  res.render("home", {
    user: user,
    messages: messages,
  });
});
app.post("/submit-message", isAuthenticated, async (req, res) => {
  try {
    await Message.create({
      title: req.body.title,
      text: req.body.text,
      authorId: req.session.userId,
    });
    res.redirect("/");
  } catch (error) {
    console.error("Error submitting message:", error);
    res.redirect("/");
  }
});
app.post("/delete-message", isAuthenticated, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).send("Access denied");
  }

  try {
    await Message.destroy({ where: { id: req.body.messageId } });
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).send("Error deleting message");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
