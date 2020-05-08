const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Schema = mongoose.Schema

//Create a schema
const userSchema = new Schema({
  method: {
    type: String,
    //enum: ['local', 'google', 'facebook'],
    required: true,
  },
  local: {
    email: {
      type: String,
      lowercase: true,
    },
    password: {
      type: String,
    },
  },
  google: {
    id: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
    },
  },
  facebook: {
    id: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
    },
  },
})

userSchema.pre('save', async function (next) {
  try {
    if (this.method !== 'local') {
      next()
    }

    // Generate a Salt
    const salt = await bcrypt.genSalt(10)
    // Generate a password hash (salt + hash)
    const passwordHash = await bcrypt.hash(this.local.password, salt)
    // Assign hash version to orijinal pass to store in db
    this.local.password = passwordHash
    next()
  } catch (error) {
    next(error)
  }
})

userSchema.methods.isValidPassword = async function (newPassword) {
  try {
    //Return compare of passes True or False
    return await bcrypt.compare(newPassword, this.local.password)
  } catch (error) {
    throw new Error(error)
  }
}
//Create a model
const User = mongoose.model('user', userSchema)

// Export Model
module.exports = User
