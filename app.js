const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const csurf   = require('csurf');
const MongoDBStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash')
const errorController = require('./controllers/error');
const User = require('./models/user');
const multer = require('multer');

const MONGODB_URI =
  'mongodb+srv://mohamed:gamal@cluster0-puljc.mongodb.net/shop';

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});

const csrfProtection = csurf();

const fileStorage = multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,'images');
  },
  filename:(req,file,cb)=>{
    cb(null,new Date().toISOString() + '-' +file.originalname );
  }

});

const fileFilter = (req,file,cb)=>{
  if(file.mimetype === 'image/png'||file.mimetype === 'image/jpg'||file.mimetype === 'image/jpeg'){
    cb(null,true);
  }else {
    cb(null,false);
  }

}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(flash());
app.use(csrfProtection);

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if(!user){
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      throw new Error(err);
    });
});

app.use((req,res,next)=>{
  res.locals.csrfToken = req.csrfToken();
  next();
});
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500',errorController.get500);
app.use(errorController.get404);

app.use((error,req,res,next)=>{
  res.redirect('/500');
});

mongoose
.connect(
  MONGODB_URI,{
      useNewUrlParser: true,useUnifiedTopology: true}
)
  .then(result => {
    User.findOne().then(user => {
      if (!user) {
        const user = new User({
          name: 'Max',
          email: 'max@test.com',
          cart: {
            items: []
          }
        });
        user.save();
      }
    });
    app.listen(4000);
  })
  .catch(err => {
    console.log(err);
  });
