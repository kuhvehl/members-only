const User = require("../models/user");

exports.isAuthenticated = async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findByPk(req.session.userId);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (error) {
      console.error("Error in isAuthenticated middleware:", error);
    }
  }
  res.redirect("/auth/login");
};
