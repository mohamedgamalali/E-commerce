const User       = require('../models/user');
const bcrypt     = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const { validationResult }   = require('express-validator/check');

const transporter  = nodemailer.createTransport({
  service:'gmail',
  auth: {
    user:'mohamed.test200@gmail.com',
    pass:'katoey300030003000'
  }
});

//mongodb+srv://mohamed:gamal@cluster0-puljc.mongodb.net/animalStore 


 /*bcrypt.hash('mazadatAdmin@151314@2020',12)
       .then(hashedPassword=>{
        const admin = new Admin({
           email:'admin_mazadaty1234569@mazad.com',
           password:hashedPassword,
         });
         admin.save();
       }).catch(err=>{
           console.log(err);
          
       });*/
       

exports.getLogin = (req, res, next) => {
  // console.log(req.flash('error'));
  // let message = req.flash('error');
  // if(message.length>0){
  //   message = message[0];
  // }else {
  //   message = null;
  // }
  message=null;
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false,
    errorMessage:message,
    oldInbut:{
      email:'',
      password:''
    }
  });
};

exports.getSignup = (req, res, next) => {

  let message = req.flash('error');
  if(message.length>0){
    message = message[0];
  }else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage:message,
    oldInbut:{
      email:'',
      password:'',
      confirmPassword:''
    },
      validationErrors: []
  });
};

exports.postLogin = (req, res, next) => {
  let message = req.flash('error');
  if(message.length>0){
    message = message[0];
  }else {
    message = null;
  }
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({email:email})
    .then(user => {
      if(!user){
        req.flash('error','envalid email!');
        return res.render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          isAuthenticated: false,
          errorMessage:message,
          oldInbut:{
            email:email,
            password:password
          }
        });
      }
      bcrypt.compare(password,user.password)
      .then(doMatch=>{
        if(doMatch){
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save(err => {
            console.log(err);
            res.redirect('/');
          });
        }
        else {
          req.flash('error','wrong password');
        }
        res.render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          isAuthenticated: false,
          errorMessage:message,
          oldInbut:{
            email:email,
            password:password
          }
        });
      })
      .catch(err=>{console.log(err);})
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  let message = req.flash('error');
  if(message.length>0){
    message = message[0];
  }else {
    message = null;
  }
  const email           = req.body.email;
  const password        = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const error           = validationResult(req);
  if(!error.isEmpty()) {
      console.log(error.array());
      return res.status(422).render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        isAuthenticated: false,
        errorMessage:error.array()[0].msg,
        oldInbut:{
          email:email,
          password:password,
          confirmPassword:confirmPassword
        },
        validationErrors: error.array()
      });
  }

  User.findOne({email:email})
  .then(user=>{{
    if(user){
      return res.redirect('/signup');
    }
      return bcrypt.hash(password,12)
      .then(hashedPassword=>{
        const user = new User({
          email:email,
          password:hashedPassword,
          cart:{items:[]}
        });
        user.save();
      })
      .then(result=>{
        res.redirect('/login');
        return transporter.sendMail({
          to:email,
          from:'mohamed.test200@gmail.com',
          subject:'signedup sucessfully',
          html:'<h1>signedup sucessfully</h1>'
        }).catch(err=>{
          console.log(err);
        });
      });
    }})
    .catch(err=>{console.log(err);})
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if(message.length>0){
    message = message[0];
  }else {
    message = null;
  }
  res.render('auth/rest', {
    path: '/reset',
    pageTitle: 'reset password',
    isAuthenticated: false,
    errorMessage:message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32,(err,buffer)=>{
    if(err){
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({email:req.body.email})
    .then(user=>{
        if(!user){
          req.flash('error','no account with that email found.');
          return req.redirect('/reset');
        }
        user.resetToken   = token;
        user.resetTokenEx = Date.now()  + 3600000 ;
        return user.save();
    })
    .then(result=>{
      req.flash('error','check your mail');
      res.redirect('/reset');
      return transporter.sendMail({
        to:req.body.email,
        from:'mohamed.test200@gmail.com',
        subject:'Reset password',
        html:`
        <h1>Reset password</h1>
        <br><h4>click here to get reset your password</h4>
        <br><a href="http://localhost:5000/reset/${token}">Link</a>
        `
      }).catch(err=>{
        console.log(err);
      });
    })
    .catch(err=>{
      console.log(err);
    });
  })

};


exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({resetToken:token,resetTokenEx:{$gt:Date.now()}})
  .then(user=>{
    if(!user){
      req.flash('error','token expired tray to reset again');
      return res.redirect('/reset');
    }
    let message = req.flash('error');
    if(message.length>0){
      message = message[0];
    }else {
      message = null;
    }
    res.render('auth/NewPassword', {
      path: '/NewPassword',
      pageTitle: 'reset password',
      isAuthenticated: false,
      errorMessage:message,
      userId:user._id.toString(),
      passwordToken:token
    });
  })
  .catch(err=>{
    console.log(err);
  })

};

exports.postNewPassword = (req, res, next) => {
  const password      = req.body.password;
  const passwordToken = req.body.passwordToken;
  let user1;
  User.findOne({_id:req.body.userId,resetToken:passwordToken,resetTokenEx:{$gt: Date.now()}})
  .then(user=>{
    if(!user){
      req.flash('error','token expired tray to reset again');
      return res.redirect('/reset');
    }
    user1= user;
    return bcrypt.hash(password,12)
    .then(hashedPassword=>{
      user1.password =  hashedPassword;
      user1.resetToken = undefined;
      user1.resetTokenEx = undefined;
      return user1.save();
    })
    .then(result=>{
      res.redirect('/login');
    })
    .catch(err=>{console.log(err);});
  })
  .catch(err=>{
    console.log(err);
  })
};
