const passport = require('passport')
const JwtStrategy = require('passport-jwt').Strategy
const { ExtractJwt } = require('passport-jwt')
const LocalStragety = require('passport-local').Strategy
//const GooglePlusTokenStrategy = require('passport-google-plus-token')
const GoogleStrategy = require('passport-token-google2').Strategy
const FacebookTokenStrategy = require('passport-facebook-token')
const { JWT_SECRET, google, facebook } = require('./.credentials.js')
const User = require('./models/user.js')

// Set the cookie token
const cookieExtractor = req => {
  let token = null
  if (req && req.cookies) {
    token = req.cookies['access_token']
  }
  return token
}
// JSON WEB TOKENS STRATEGY
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: JWT_SECRET,
      passReqToCallback: true,
    },
    async (req, payload, done) => {
      try {
        // Find the user token specific
        console.log('[PASS-JWT] JWT try to Find User:')
        const user = await User.findById(payload.sub)
        // if user does not exist
        if (!user) {
        console.log('[PASS-JWT] JWT can not  Find a User:')
          return done(null, false)
        }

        // Otherwise return user
        req.user = user
        console.log('[PASS-JWT] JWT Find the User:')

        done(null, user)
      } catch (error) {
        console.log("Error Cathed JWT STG")
        done(error, false)
      }
    }
  )
)
// Google OAuth 0.2 passport-token-google2

passport.use(
  'google-token',
  new GoogleStrategy(
    {
      clientID: google.CLIENT_ID,
      clientSecret: google.CLIENT_SECRET,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Can get access in 2 ways
        // 1) When registering first time
        // 2) When linking with other account
        console.log('[PASS-G] Profile : ', profile)
        console.log('[PASS-G] AccessToken : ', accessToken)
        console.log('[PASS-G] RefreshToken : ', refreshToken)

        if (req.user) {
          // Already there is a account registered
          // Add Google's data to an existing account
          // Linking accounts here
          req.user.methods.push('google')
          req.user.google = {
            id: profile.id,
            email: profile.emails[0].value,
            picture: profile._json.picture,
            displayName: profile.displayName,
          }
          await req.user.save()
          return done(null, req.user)
        } else {
          // No account registered >> Create Account
          // İf there is a account update some fields
          let existingUser = await User.findOne({ 'google.id': profile.id })
          if (existingUser) {
            console.log('[PASS-G] Existing User Set (UPDATE) fields')
            existingUser.google = {
              $set: [{ picture: profile._json.picture }, { displayName: profile.displayName }],
            }
            return done(null, existingUser)
          }

          // Check if User have a record with same email
          existingUser = await User.findOne({ 'local.email': profile.emails[0].value })
          if (existingUser) {
            // merge google data with local
            existingUser.methods.push('google')
            existingUser.google = {
              id: profile.id,
              email: profile.emails[0].value,
              picture: profile._json.picture,
              displayName: profile.displayName,
            }
            await existingUser.save()
            return done(null, existingUser)
          }

          const newUser = new User({
            methods: ['google'],
            google: {
              id: profile.id,
              email: profile.emails[0].value,
              picture: profile._json.picture,
              displayName: profile.displayName,
            },
          })
          await newUser.save()
          done(null, newUser)
        }
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
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('[PASS-F] refreshToken : ', refreshToken)
        console.log('[PASS-F] accessToken : ', accessToken)
        console.log('[PASS-F] profile : ', profile)

        if (req.user) {
          // Already there is a account registered
          console.log('[PASS-F] already a account if')
          req.user.methods.push('facebook')
          req.user.facebook = {
            id: profile.id,
            email: profile.emails[0].value,
            displayName: profile._json.name,
            picture: profile.photos[0].value,
          }
          await req.user.save()
          return done(null, req.user)
        } else {
          // No account registered >> Create Account

          let existingUser = await User.findOne({ 'facebook.id': profile.id })
          if (existingUser) {
            return done(null, existingUser)
          }
          // Check if User have a record with same email
          existingUser = await User.findOne({ 'local.email': profile.emails[0].value })
          if (existingUser) {
            // merge facebook data with local
            existingUser.methods.push('facebook')
            existingUser.facebook = {
              id: profile.id,
              email: profile.emails[0].value,
              displayName: profile._json.name,
              picture: profile.photos[0].value,
            }
            await existingUser.save()
            return done(null, existingUser)
          }
        }

        console.log('[PASS-F] facebook new user creation starting')
        const newUser = new User({
          methods: ['facebook'],
          facebook: {
            id: profile.id,
            email: profile.emails[0].value,
            displayName: profile._json.name,
            picture: profile.photos[0].value,
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
  'local',
  new LocalStragety(
    {
      usernameField: 'email',
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        // find user
        const user = await User.findOne({ 'local.email': email })
        // if there is no user record
        if (!user) {
          console.log('[PASS-LCL] Email no record No User! : ', email)
          return done(null, false, { message: "Kullanıcı kaydı bulunamadı", error: "Email kayıtlı değil" })
        }
        // Check if pass correct
        const isMatch = await user.isValidPassword(password)
        if (!isMatch) {
          console.log('[PASS-LCL] Password is no match')
          return done(null, false, { message: "Email ve şifre eşleşmiyor" })
        }
        console.log('[PASS-LCL] Password and Email match OK!')
        // Password and User  ok then go

        //Checking is email_verified true
        if (!user.local.email_verified) {
          console.log('[PASS-LCL] Email is not verified')
          return done(null, user, { message : "Email doğrulanmamış" })
        }
        console.log('[PASS-LCL] Email is verified OK!')
        done(null, user)
      } catch (error) {
        done(error, false)
      }
    }
  )
)
