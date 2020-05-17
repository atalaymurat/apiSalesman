const express = require('express')
const router = require('express-promise-router')()
const passport = require('passport')
const passportConf = require('../passport.js')

const { validateBody, schemas } = require('../helpers/routeHelpers.js')
const UsersController = require('../controllers/users')

const passportlogin = passport.authenticate('local', { session: false })
const passportJWT = passport.authenticate('jwt', { session: false })

router.route('/signup').post(validateBody(schemas.authSchema), UsersController.signUp)

router.route('/verify').post(validateBody(schemas.verifySchema), UsersController.verify)

router.route('/login').post(validateBody(schemas.authSchema), passportlogin, UsersController.login)

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
