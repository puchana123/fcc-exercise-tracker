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
})

const exerciseSchema = new Schema({
  user_id: String,
  description: String,
  duration: Number,
  date: Date
})

// create Model
const ExerciseUsers = mongoose.model('ExerciseUsers', userSchema);
const ExerciseLogs = mongoose.model('ExerciseLogs', exerciseSchema);

// post add new users
app.post('/api/users', async (req, res) => {
  // get username for form
  const username = req.body.username;
  // check if exist user
  const exist_user = await ExerciseUsers.findOne({ username: username });
  if (!exist_user) {
    const new_user = new ExerciseUsers({
      username: username
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
  // get user data
  const id = req.params._id
  const {description,duration,date} = req.body
  const user_data = await ExerciseUsers.findById(id);
  if(!user_data){
    res.send("no user data");
  }
  const new_exercise = new ExerciseLogs({
    user_id: id,
    description: description,
    duration: Number(duration),
    date: date? new Date(date) : new Date()
  })
  await new_exercise.save();

  res.json({
    _id: id,
    username: user_data.username,
    description: new_exercise.description,
    duration: new_exercise.duration,
    date: new Date(new_exercise.date).toDateString()
  });
});

// get all users
app.get('/api/users', async (req,res)=>{
  const all_users = await ExerciseUsers.find({}).select('username');
  res.json(all_users);
  console.log('all users in database')
})

// get all user log
app.get('/api/users/:id/logs', async (req,res)=>{
  // res.query for json after ?
  const id = req.params.id
  const {from,to,limit} = req.query
  // if user exist
  const user = await ExerciseUsers.findById(id);
  if(!user){
    res.send('No user in database');
  }
  // object Date for filter date:{$gte: from ,$lte: to}
  let objDate = {}
  if(from){
    objDate['$gte'] = new Date(from);
  }
  if(to){
    objDate['$lt'] = new Date(to);
  }
  // filter for find.({_id:id,date:{objDate}})
  let filter = {
    user_id: id
  }
  if(from || to){
    filter.date = objDate;
  }
  // fine user_data
  const user_logs = await ExerciseLogs.find(filter).limit(limit||100);
  const logs = user_logs.map(log=>{
    return {
      description: log.description,
      duration: log.duration,
      date: new Date(log.date).toDateString()
    }
  })
  // json

  res.json({
    _id: id,
    username: user.username,
    count: user_logs.length,
    log: logs
  });
  console.log(filter)
  console.log(logs)
  console.log('all user log')
})

// delete all users
app.get('/api/deleteall', async (req,res)=>{
  await ExerciseUsers.deleteMany().then(console.log('all users are deleted'));
  await ExerciseLogs.deleteMany().then(console.log('delete all logs'))
  res.redirect('/');
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})