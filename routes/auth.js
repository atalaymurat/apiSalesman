const express = require('express')
const router = require('express-promise-router')()
const passport = require('passport')
const passportConf = require('../passport.js')

const { validateBody, schemas } = require('../helpers/routeHelpers.js')
const AuthsController = require('../controllers/auths')
const UsersController = require('../controllers/users')

const passportJWT = passport.authenticate('jwt', { session: false })

router.route('/signup').post(validateBody(schemas.authSchema), AuthsController.signUp)

// Login authenticate local controllerda yapılıyor
router.route('/login').post(validateBody(schemas.authSchema), AuthsController.login)

router.route('/logout').get(passportJWT, AuthsController.logOut)

router.route('/google').post(
  passport.authenticate('google-token', {
    session: false,
  }),
  AuthsController.googleOAuth
)
router
  .route('/facebook')
  .post(passport.authenticate('facebookToken', { session: false }), AuthsController.facebookOAuth)

router
  .route('/link/facebook')
  .post(
    passportJWT,
    passport.authorize('facebookToken', { session: false }),
    AuthsController.linkFacebook
  )

router.route('/unlink/facebook').post(passportJWT, AuthsController.unlinkFacebook)

router
  .route('/link/google')
  .post(
    passportJWT,
    passport.authorize('google-token', { session: false }),
    AuthsController.linkGoogle
  )

router.route('/unlink/google').post(passportJWT, AuthsController.unlinkGoogle)

router.route('/status').get(passportJWT, AuthsController.checkAuth)

router.route('/dashboard').get(passportJWT, AuthsController.dashboard)



module.exports = router
