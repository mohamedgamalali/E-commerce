const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');

const IsAuth = require('../meddleWere/isAuth');


const router = express.Router();

// /admin/add-product => GET
router.get('/add-product',IsAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products',IsAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product',IsAuth, adminController.postAddProduct);

router.get('/edit-product/:productId',IsAuth, adminController.getEditProduct);

router.post('/edit-product',IsAuth, adminController.postEditProduct);

router.delete('/product/:productId',IsAuth, adminController.DeleteProduct);

module.exports = router;
