const express = require('express')
const router = require('express-promise-router')()
const passport = require('passport')
const passportConf = require('../passport.js')

const { validateBody, schemas } = require('../helpers/routeHelpers.js')
const UsersController = require('../controllers/users')

const passportlogin = (req, res, next) => {
  passport.authenticate('local', function (err, user, info) {
    console.log("Buraya Vurdu")
    if (err) {
      return next(err)
    }
    if (!user) {
      console.log('LOCAL STRETEGEY RESPOND')
      res.status(401)
      res.send({
        status : "error",
        error: info.message,
        message: "Kayıt bulunamadı Üye olamayı deneyin",
      }
      )
      return
    }
    
    const token = signToken(user)
    res.cookie('access_token', token, {
      httpOnly: true,
    })
    res.status(200).json({
      status: 'ok',
      error: null,
      message: 'Giriş yaptınız',
    })
    return next()

  })(req, res, next)
}

const passportJWT = passport.authenticate('jwt', { session: false })

router.route('/signup').post(validateBody(schemas.authSchema), UsersController.signUp)

router.route('/verify').post(validateBody(schemas.verifySchema), UsersController.verify)

router.route('/login').post(validateBody(schemas.authSchema), passportlogin)

router.route('/logout').get(passportJWT, UsersController.logOut)

router.route('/oauth/google').post(
  passport.authenticate('google-token', {
    session: false,
  }),
  UsersController.googleOAuth
)
router
  .route('/oauth/facebook')
  .post(passport.authenticate('facebookToken', { session: false }), UsersController.facebookOAuth)

router
  .route('/oauth/link/facebook')
  .post(
    passportJWT,
    passport.authorize('facebookToken', { session: false }),
    UsersController.linkFacebook
  )

router.route('/oauth/unlink/facebook').post(passportJWT, UsersController.unlinkFacebook)

router
  .route('/oauth/link/google')
  .post(
    passportJWT,
    passport.authorize('google-token', { session: false }),
    UsersController.linkGoogle
  )

router.route('/oauth/unlink/google').post(passportJWT, UsersController.unlinkGoogle)

router.route('/dashboard').get(passportJWT, UsersController.dashboard)

router.route('/status').get(passportJWT, UsersController.checkAuth)

module.exports = router
