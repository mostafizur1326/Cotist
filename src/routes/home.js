const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const upload = require('../utils/multerConfig.js');
const userModel = require('../models/user.models.js');
const postModel = require('../models/post.models.js');


router.get('/', isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email }).populate('posts');

  if (user) {
    let date = new Date().toLocaleString(user.posts.date);
    res.render('profile', { user, date });
  } else {
    res.redirect('/');
  }
});

router.get('/profile/upload', isLoggedIn, async (req, res) => {
  res.render('profilePic');
});

router.post('/uploaded', isLoggedIn, upload.single('profilePic'), async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email });
  user.profilePic = req.file.filename;
  await  user.save();
  res.redirect('/');
});

router.get('/register', (req, res) => {
  res.render('index');
});

router.post('/register', async (req, res) => {
  const { name, username, email, age, password } = req.body;
  let existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
  if (existingUser) return res.send('Username & Email already exist!');
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      const user = await userModel.create({
        name,
        username,
        email,
        age,
        password: hash
      });
      const findUser = await userModel.findOne({ email: user.email });
      let token = jwt.sign({ email: email, userId: findUser._id }, "1315192016920mOsTaFiZuRcCODE");
      res.cookie('token', token);
      res.redirect('/login');
    });
  });
})

router.get('/logout', (req, res) => {
  res.cookie("token", "");
  res.redirect('/login');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) return res.status(500).redirect("/register");
  bcrypt.compare(password, user.password, (err, result) => {
    if (result === true) {
      let token = jwt.sign({ email: email, userId: user._id }, "1315192016920mOsTaFiZuRcCODE");
      res.cookie('token', token);
      return res.status(200).redirect('/');
    } else {
      res.render('/login');
    }
  })
});

router.post('/post', isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email })
  const { content } = req.body;

  const post = await postModel.create({
    content,
    user: user._id
  })

  user.posts.push(post._id);
  await user.save();
  res.redirect('/');
});

router.get('/post/delete/:post_id', isLoggedIn, async (req, res) => {
  const { post_id } = req.params;
  const deletePost = await postModel.findOneAndDelete({ _id: post_id })
  res.redirect('/');
});

router.get('/post/edit/:post_id', isLoggedIn, async (req, res) => {
  const { post_id } = req.params;

  const post = await postModel.findOne({ _id: post_id })
  res.render('edit', { post });
});

router.get('/like/:id', isLoggedIn, async (req, res) => {
  const post = await postModel.findOne({ _id: req.params.id }).populate('user');
  if (post.likes.indexOf(req.user.userId) === -1) {
    post.likes.push(req.user.userId);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userId), 1)
  }

  await post.save();
  res.redirect('/');
});

router.post('/post/edit/updated', isLoggedIn, async (req, res) => {
  const updatePost = await postModel.findOneAndUpdate({ content: req.body.updatedContent })
  res.redirect('/');
})


router.get('/delete', async (req, res) => {
  const data = jwt.verify(req.cookies.token, "1315192016920mOsTaFiZuRcCODE");
  const user = await userModel.findOneAndDelete({ email: data.email })
  res.cookie("token", "");
  res.redirect('/register');
});


router.get('/all', isLoggedIn, async (req, res) => {
  const user = await userModel.find();
  res.send(user);
});

function isLoggedIn(req, res, next) {
  if (!req.cookies.token) return res.redirect('/login');
  else {
    const data = jwt.verify(req.cookies.token, "1315192016920mOsTaFiZuRcCODE");
    req.user = data;
  }
  next();
}



module.exports = router;