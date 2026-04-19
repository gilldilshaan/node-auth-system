const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');

const User = require('./models/User');


// CONFIG

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// SESSION

app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: false
}));

// DB

mongoose.connect('mongodb://127.0.0.1:27017/myapp')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log(err));


// MIDDLEWARE

function isLoggedIn(req, res, next) {
    if (!req.session.userId) return res.redirect('/login');
    next();
}

// ROUTES


//  HOME PAGE
app.get('/', (req, res) => {
    res.render('main');
});

// AUTH PAGES

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

// REGISTER

app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.send('User already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    await new User({ username, email, password: hashedPassword }).save();

    res.redirect('/login');
});

// LOGIN

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.send('User not found');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.send('Wrong password');

    req.session.userId = user._id;

    // ✅ go to dashboard after login
    res.redirect('/dash');
});

// DASHBOARD (PROTECTED)

app.get('/dashboard', isLoggedIn, async (req, res) => {
    const user = await User.findById(req.session.userId);

    // you can create dashboard.ejs OR reuse main
    res.render('main', { user });
});
app.get('/dash', isLoggedIn, async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.render('dash', { user });
});

// LOGOUT

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// SERVER

app.listen(3000, () => {
    console.log('🚀 http://localhost:3000');
});