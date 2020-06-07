const express = require('express');

const { check,body }   = require('express-validator/check');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login',
  body('email')
  .isEmail()
  .withMessage('please inter a valid mail')
  .normalizeEmail(),
  body('password','password has to be valid')
  .isAlphanumeric()
  .trim()
, authController.postLogin);

router.post('/signup',
  check('email')
  .isEmail()
  .withMessage('please inter a valid Email')
  .normalizeEmail(),
  body('password','enter a password with only number and text and at least 5 characters.')
  .isLength({min:5})
  .isAlphanumeric()
  .trim()
,
  body('confirmPassword').custom((value,{req})=>{
    if(value !== req.body.password){
      throw new Error('passwords have to match!');
    }
    return true ;
  })
  .trim()

  , authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/NewPassword', authController.getNewPassword);

module.exports = router;
