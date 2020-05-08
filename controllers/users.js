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
  signUp: async (req, res, next) => {
    const { email, password } = req.value.body
    //Check if any user with same email
    let findUser = await User.findOne({ 'local.email': email })
    if (findUser) {
      return res.status(404).send({ error: 'This Email Already Have an Account' })
    }
    //Create new user
    console.log('called !!!!!!!!!!!!!!!')
    console.log('value body : ', req.value.body.email)
    const newUser = new User({
      method: 'local',
      local: {
        email: email,
        password: password,
      },
    })
    console.log('newUser data : ', newUser)
    await newUser.save()
    //Generate token
    const token = signToken(newUser)
    //Respond with token
    res.status(200).json({ token })
    console.log('New User Created ', newUser.local.email)
  },

  login: async (req, res, next) => {
    const token = signToken(req.user)
    res.status(200).json({ token })
    console.log('Successfull Login')
  },

  googleOAuth: async (req, res, next) => {
    const token = signToken(req.user)
    res.status(200).json({ token })
  },

  facebookOAuth: async (req, res, next) => {
    console.log('req.user : ', req.user)
    const token = signToken(req.user)
    res.status(200).json({ token })
  },

  secret: async (req, res, next) => {
    res.json({ secret: 'you can access this page' })
  },
}
