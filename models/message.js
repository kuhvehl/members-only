const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");

const Message = sequelize.define("Message", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

Message.belongsTo(User, { as: "author" });

module.exports = Message;
