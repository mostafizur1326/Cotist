const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  name: {
    type: String,
  },
  username: {
    type: String,
  },
  email: {
    type: String
  },
  password: {
    type: String,
  },
  age: {
    type: Number
  },
  profilePic: {
    type: String,
    default: 'default.png'
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post"
    }
  ]
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema);