const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Schema = mongoose.Schema

//Create a schema
const userSchema = new Schema(
  {
    methods: {
      type: [String],
      //enum: ['local', 'google', 'facebook'],
      required: true,
    },

    admin: {
      type: Boolean,
      default: false,
    },
    local: {
      email: {
        type: String,
        lowercase: true,
      },
      email_verified: {
        type: Boolean,
        default: false,
      },
      password: {
        type: String,
      },
      confirmStr: String,
      resetPassToken: String,
    },
    google: {
      id: {
        type: String,
      },
      email: {
        type: String,
        lowercase: true,
      },
      picture: {
        type: String,
      },
      displayName: {
        type: String,
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
      displayName: {
        type: String,
      },
      picture: String,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
)

userSchema.pre('save', async function (next) {
  // Burda biryerde kaydetmeden once sıkıntı var
  try {
    console.log('entered user schema pre save')
    if (!this.methods.includes('local')) {
      next()
    }

    const user = this
    //check if the user modified to know if password already hashed
    if (!user.isModified('local.password')) {
      next()
    }
    // Generate a Salt
    const salt = await bcrypt.genSaltSync(10)
    // Generate a password hash (salt + hash)
    const passwordHash = await bcrypt.hashSync(this.local.password, salt)
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
    return await bcrypt.compareSync(newPassword, this.local.password)
  } catch (error) {
    throw new Error(error)
  }
}
//Create a model
const User = mongoose.model('user', userSchema)

// Export Model
module.exports = User
