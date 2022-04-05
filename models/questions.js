const mongoose = require("mongoose");

const schema = mongoose.Schema({
  testName: {
    type: String,
    required: true,
  },
  title: {
    type: String,
  },
  img: {
    type: String,
  },
  isImg: {
    type: Boolean,
  },
  answers: [
    {
      content: { type: String },
      isTrue: { type: Boolean },
      ansd: { type: Number, default: 0 },
    },
  ],
});

module.exports = mongoose.model("Questions", schema);
