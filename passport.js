const passport = require('passport')
const JwtStrategy = require('passport-jwt').Strategy
const { ExtractJwt } = require('passport-jwt')
const LocalStragety = require('passport-local').Strategy
const GooglePlusTokenStragety = require('passport-google-plus-token')
const FacebookTokenStrategy = require('passport-facebook-token')
const { JWT_SECRET, google, facebook } = require('./.credentials.js')
const User = require('./models/user.js')

// JSON WEB TOKENS STRATEGY
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromHeader('authorization'),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        // Find the user token specific
        console.log(payload)
        const user = await User.findById(payload.sub)
        // if user does not exist
        if (!user) {
          return done(null, false)
        }

        // Otherwise return user
        done(null, user)
      } catch (error) {
        done(error, false)
      }
    }
  )
)

// Google OAuth Strategy
passport.use(
  'googletoken',
  new GooglePlusTokenStragety(
    {
      clientID: google.CLIENT_ID,
      clientSecret: google.CLIENT_SECRET,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('accessToken : ', accessToken)
        console.log('refreshToken : ', refreshToken)
        console.log('profile : ', profile)
        // Check whether this current user in the DB
        const existingUser = await User.findOne({ 'google.id': profile.id })
        if (existingUser) {
          console.log('User already exists in db')
          return done(null, existingUser)
        }
        console.log('User do not exists in db')
        // If user not in DB
        const newUser = new User({
          method: 'google',
          google: {
            id: profile.id,
            email: profile.emails[0].value,
          },
        })
        // Save new user to DB
        await newUser.save()
        done(null, newUser)
      } catch (error) {
        done(error, false, error.message)
      }
    }
  )
)
// Facebook OAuth Strategy
passport.use(
  'facebookToken',
  new FacebookTokenStrategy(
    {
      clientID: facebook.APP_ID,
      clientSecret: facebook.APP_SECRET,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Profile : ', profile)
        console.log('accessToken : ', accessToken)

        const existingUser = await User.findOne({ 'facebook.id': profile.id })
        if (existingUser) {
          return done(null, existingUser)
        }

        const newUser = new User({
          method: 'facebook',
          facebook: {
            id: profile.id,
            email: profile.emails[0].value,
          },
        })
        await newUser.save()
        done(null, newUser)
      } catch (error) {
        done(error, false, error.message)
      }
    }
  )
)

//Local Strategy
passport.use(
  new LocalStragety(
    {
      usernameField: 'email',
    },
    async (email, password, done) => {
      try {
        // find user
        const user = await User.findOne({ 'local.email': email })
        // if not handle it
        if (!user) {
          return done(null, false)
        }
        // Check if pass correct
        const isMatch = await user.isValidPassword(password)
        if (!isMatch) {
          return done(null, false)
        }
        // Otherwise return user
        done(null, user)
      } catch (error) {
        done(error, false)
      }
    }
  )
)
