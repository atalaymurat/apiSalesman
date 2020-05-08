const passport = require('passport')
const JwtStrategy = require('passport-jwt').Strategy
const { ExtractJwt } = require('passport-jwt')
const LocalStragety = require('passport-local').Strategy
const { JWT_SECRET } = require('./.credentials.js')
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
//Local Strategy
passport.use(
  new LocalStragety(
    {
      usernameField: 'email',
    },
    async (email, password, done) => {
      try {
        // find user
        const user = await User.findOne({ email })
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
