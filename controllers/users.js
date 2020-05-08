const JWT = require('jsonwebtoken')
const User = require('../models/user.js')
const { JWT_SECRET } = require('../.credentials.js')

signToken = user => {
  return JWT.sign(
    {
      iss: 'apiSalesman',
      sub: user._id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 1),
    },
    JWT_SECRET
  )
}
module.exports = {
  register: async (req, res, next) => {
    const { email, password } = req.value.body
    //Check if any user with same email
    const findUser = await User.findOne({ email })
    if (findUser) {
      return res.status(404).send({ error: 'Email already taken' })
    }
    //Create new user
    const newUser = User({ email, password })
    await newUser.save()
    //Generate token
    const token = signToken(newUser)
    //Respond with token
    res.status(200).json({ token })
    console.log('New User Created ', newUser.email)
  },

  login: async (req, res, next) => {
    const token = signToken(req.user)
    res.status(200).json({token})
    console.log("Successfull Login")

  },

  secret: async (req, res, next) => {
    res.json({ secret: "you can access this page" })
  },
}
