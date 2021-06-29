'use strict';

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const redis = require('redis');
const RedisStore = require('connect-redis')(session);

const { MONGO_USER, MONGO_PASSWORD, MONGO_IP, MONGO_PORT, REDIS_URL, REDIS_PORT, SESSION_SECRET } = require('./config/config');

const postRouter = require('./routes/postRoutes');
const userRouter = require('./routes/userRoutes');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const redisClient = redis.createClient({
  host: REDIS_URL,
  port: REDIS_PORT,
});

const app = express();

const mongoURL = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`

function connectWithRetry() {
  mongoose
    .connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    })
    .then(() => console.log('succesfully connected to DB'))
    .catch((e) => {
      console.log(e)
      setTimeout(connectWithRetry, 5000)
    });
}

connectWithRetry();

app.use(session({
  store: new RedisStore({
    client: redisClient,
  }),
  secret: SESSION_SECRET,
  cookie: {
    resave: false,
    saveUninitialized: false,
    secure: false,
    httpOnly: true,
    maxAge: 60000,
  },
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('<h1>Hello World.</h1>');
});

app.use('/api/v1/posts', postRouter);
app.use('/api/v1/users', userRouter);

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);

