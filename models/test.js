const mongoose = require("mongoose");

const schema = mongoose.Schema({
  testName: {
    type: String,
    required: true,
    unique: true,
  },
  number: {
    type: Number,
  },
  secret: {
    is: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: "",
    },
  },
  leaderboard: {
    type: Boolean,
    default: true,
  },
  users: [
    {
      name: {
        type: String,
        unique: true,
      },
      score: {
        type: Number,
      },
    },
  ],
});

module.exports = mongoose.model("Test", schema);
