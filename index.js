const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const { default: mongoose, Schema } = require('mongoose')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// connect to database
mongoose.connect(process.env.MONGO_URL);

// create Schema
const userSchema = new Schema({
  username: {type:String,unique:true},
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
})

// create Model
const ExerciseUsers = mongoose.model('ExerciseUsers', userSchema);

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
