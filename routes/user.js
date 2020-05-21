const router = require('express-promise-router')()
const passport = require('passport')
const { validateBody, schemas } = require('../helpers/routeHelpers.js')

const UsersController = require('../controllers/users')

router.route('/changepass')
  .post(validateBody(schemas.changeSchema), UsersController.changePass)

  module.exports = router