const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const { default: mongoose, Schema } = require('mongoose')
require('dotenv').config()

app.use(bodyParser.urlencoded());
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// connect to database
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('connect to database successful'))
  .catch((err) => console.log(err));

// create Schema
const userSchema = new Schema({
  username: { type: String, unique: true },
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
})

// create Model
const ExerciseUsers = mongoose.model('ExerciseUsers', userSchema);

// route
app.post('/api/users', async (req, res) => {
  // get username for form
  const username = req.body.username;
  // check if exist user
  const exist_user = await ExerciseUsers.findOne({ username: username });
  if (!exist_user) {
    const new_user = new ExerciseUsers({
      username: username,
      count: 0
    })
    await new_user.save();
    console.log('add new user')
  } else {
    console.log('exist user')
  }
  // get user id
  const user = await ExerciseUsers.findOne({ username: username }).select('username');
  res.json(user);
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
