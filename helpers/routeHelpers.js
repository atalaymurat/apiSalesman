const Joi = require('@hapi/joi')

module.exports = {
  validateBody: schema => {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body)
      if (error) {
        console.log(error)
        return res.status(400).json(error)
      }
      if (!req.value) {
        req.value = {}
      }
      req.value['body'] = value
      next()
    }
  },

  schemas: {
    authSchema: Joi.object().keys({
      email: Joi.string().email().required(),
      password: Joi.string().required().min(6),
    }),
  },
}
