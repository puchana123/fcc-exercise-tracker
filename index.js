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
  // get user data
  const {description,duration,date} = req.body
  const user_data = await ExerciseUsers.findById(req.params._id);
  if(!user_data){
    res.json({"message":"no user data"});
  }
  user_data.log.push({
    description: description,
    duration: Number(duration),
    date: date? new Date(date) : new Date()
  });
  user_data.count++
  await user_data.save();

  // get last log added
  const last_data = await ExerciseUsers.findById(req.params._id);
  const last_log = last_data.log.length - 1
  const updated_data = {
    _id: last_data._id,
    username: last_data.username,
    description: last_data.log[last_log].description,
    duration: last_data.log[last_log].duration,
    date: new Date(last_data.log[last_log].date).toDateString()
  }
  res.json(updated_data);
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
  const {from,to,limit} = req.query
  // if user exist
  const user = await ExerciseUsers.findById(req.params.id);
  if(!user){
    res.send('No user in database');
    return
  }
  // object Date for filter date:{$gte: from ,$lte: to}
  let objDate = {}
  if(from){
    objDate[`$gte`] = new Date(from).toDateString();
  }
  if(to){
    objDate["$lte"] = new Date(to).toDateString();
  }
  // filter for find.({_id:id,date:{objDate}})
  let filter = {
    _id: req.params.id
  }
  if(from || to){
    filter.date = objDate;
  }
  // fine user_data
  const user_data = await ExerciseUsers.findOne(filter).limit(+limit&&100);
  const log = user_data.log.map(data=>{
    return {
      description: data.description,
      duration: data.duration,
      data: new Date(data.date).toDateString()
    }
  })
  // json
  const json_data = {
    _id: user_data._id,
    username: user_data.username,
    count: user_data.log.length,
    log: log
  }

  res.json(json_data);
  console.log(filter)
  console.log('all user log')
})

// delete all users
app.get('/api/deleteall', async (req,res)=>{
  await ExerciseUsers.deleteMany().then(console.log('all users are deleted'));
  res.redirect('/');
})

app.get('/api/users/:id/test', async (req,res)=>{
  const user = ExerciseUsers.findById(req.params.id);
  user.find({date:{$gte: '1990-01-01'}})

  const doc = await user.exec();

  res.json(doc)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
