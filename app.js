const express = require('express')
const app = express()
const credentials = require('./credentials')

// Mongo DB Settings
const mongoose = require('mongoose')
let opts = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}
switch (app.get('env')) {
  case 'development':
    mongoose.connect(credentials.mongo.development.connect, opts)
    break
  case 'production':
    mongoose.connect(credentials.mongo.production.connect, opts)
    break
  default:
    throw new Error('Unkown execution enviroment: ' + app.get('env'))
}
var db = mongoose.connection
db.once('open', function () {
  console.log('Db mongo connection success')
})

// Routes
app.get('/', (req, res) => {
  res.send('Salesman Api index')
})

// logging
switch (app.get('env')) {
  case 'development':
    app.use(require('morgan')('dev'))
    break
  case 'production':
    app.use(require('express-logger')({ path: __dirname + '/log/requests.log' }))
    break
}

// 404 catch-all handler (middleware)
app.use((req, res, next) => {
  res.status(404).send('404')
})

// 500 error handler (middleware)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500)
  res.send('500')
})

const port = 4000
app.listen(port, () =>
  console.log('App started in mode ' + app.get('env') + ` listening at http://localhost:${port}`)
)
