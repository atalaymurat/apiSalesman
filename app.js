const express = require('express')
const morgan = require('morgan')
const credentials = require('./.credentials')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const app = express()
app.use(cookieParser());
// Cors middl...
app.use(cors({
  origin: "http://dev.makinatr.com",
  credentials: true
}));

// Mongo DB Settings
const mongoose = require('mongoose')
let opts = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
}
switch (app.get('env')) {
  case 'development':
    mongoose.connect(credentials.mongo.development.url, opts)
    break
  case 'production':
    mongoose.connect(credentials.mongo.production.db_makinatr, opts)
    break
  default:
    throw new Error('Unkown execution enviroment: ' + app.get('env'))
}
var db = mongoose.connection
db.once('open', function () {
  console.log('Db mongo connection success')
})

// Log configuration
switch (app.get('env')) {
  case 'development':
    app.use(morgan('dev'));
    break
  case 'production':
    app.use(require('express-logger')({ path: __dirname + '/log/requests.log' }))
    break
}

// Middlewares
app.use(express.json())

// Routes
app.get('/', (req, res) => {
  res.status(200).send('api is running')
})
app.use('/users', require('./routes/users.js'))

// 404 catch-all handler (middleware)
app.use((req, res, next) => {
  res.status(404).send('404 not Found')
})

// 500 error handler (middleware)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500)
  res.send('500 internal server error')
})

// Start the server
const port = process.env.PORT || 4000
app.listen(port, () =>
  console.log('App started in mode ' + app.get('env') + ` listening at http://localhost:${port}`)
)
