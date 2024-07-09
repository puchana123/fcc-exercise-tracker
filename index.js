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

// post add new users
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

// post new exercise
app.post('/api/users/:_id/exercises', async (req,res)=>{
  // date formate
  let current_date = new Date().toDateString();
  if(req.body.date !== ''){
    current_date = new Date(req.body.date).toDateString();
  }
  // get user data
  const user_data = await ExerciseUsers.findById(req.params._id);
  if(!user_data){
    res.json({"message":"no user data"});
  }
  user_data.log.push({
    description: req.body.description,
    duration: Number(req.body.duration),
    date: current_date
  });
  await user_data.save();

  // get last log added
  const last_data = await ExerciseUsers.findById(req.params._id);
  const last_log = last_data.log.length - 1
  const updated_data = {
    _id: last_data._id,
    username: last_data.username,
    description: last_data.log[last_log].description,
    duration: last_data.log[last_log].duration,
    date: last_data.log[last_log].date
  }
  res.json(updated_data);
});

// get all users
app.get('/api/users', async (req,res)=>{
  const all_users = await ExerciseUsers.find({}).select('username');
  res.json(all_users);
  console.log('all users in database')
})

// delete all users
app.get('/api/deleteall', async (req,res)=>{
  await ExerciseUsers.deleteMany().then(console.log('all users are deleted'));
  res.redirect('/');
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
