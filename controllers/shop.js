const Product = require('../models/product');
const Order = require('../models/order');
const fs    = require('fs');
const path  = require('path');
const pdfDoc= require('pdfkit');

const ITEMS_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page||1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(countProd=>{
      totalItems = countProd;
      return Product.find()
            .skip((page-1)*ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'products',
        path: '/products',
        isAuthenticated: req.session.isLoggedIn,
        totalItems:totalItems,
        hasNextPage:ITEMS_PER_PAGE * page <  totalItems,
        hasPrevPage:page>1,
        nextPage:page+1,
        prevPage:page-1,
        lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE),
        currentPage:page
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page||1;
  let totalItems;
  Product.find()
    .countDocuments()
    .then(countProd=>{
      totalItems = countProd;
      return Product.find()
            .skip((page-1)*ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        isAuthenticated: req.session.isLoggedIn,
        totalItems:totalItems,
        hasNextPage:ITEMS_PER_PAGE * page <  totalItems,
        hasPrevPage:page>1,
        nextPage:page+1,
        prevPage:page-1,
        lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE),
        currentPage:page
      });
    })
    .catch(err => {
      console.log(err);
    });
};


exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .exec()
    .then(user => {
      const products = user.cart.items;
      console.log(products);
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.getTcheckOut = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      console.log(products);
      let total = 0 ;
      products.forEach(p=>{
        total+=p.quantity * p.productId.price ;
      });

      res.render('shop/checkOut', {
        path: '/checkOut',
        pageTitle: 'checkOut',
        products: products,
        isAuthenticated: req.session.isLoggedIn,
        total:total
      });
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => console.log(err));
};


exports.getdownload = (req, res, next) => {
  const orderId     = req.params.id;
  Order.findById(orderId).then(result=>{
    if(!result){
      return next(new Error('no Order Found'));
    }
    if(result.user.userId.toString()!==req.user._id.toString()){
      return next(new Error('UnAuth'));
    }

    const invoiceName = 'invoice-' +  orderId  + '.pdf';
    const invoicePath = path.join('data','invoices',invoiceName);
    const pdf = new pdfDoc();
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment;filename="'+invoiceName+'"');
    pdf.pipe(fs.createWriteStream(invoicePath));
    pdf.text('products');
    pdf.text('-----------------------');
    let totalPrice = 0;
    result.products.forEach(prod=>{
      totalPrice += prod.quantity * prod.product.price;
        pdf.text(prod.product.title+' - '+prod.quantity+'x'+'$'+prod.product.price);
    });
    pdf.text('-----------------------');
    pdf.pipe(res);
    pdf.end();
    // fs.readFile(invoicePath,(err,data)=>{
    //   if(err){console.log(err);}
    //   res.setHeader('Content-Type','application/pdf');
    //   res.setHeader('Content-Disposition','attachment;filename="'+invoiceName+'"');
    //   res.send(data);
    // });
    // const file = fs.createReadStream(invoicePath);
    // res.setHeader('Content-Type','application/pdf');
    // res.setHeader('Content-Disposition','attachment;filename="'+invoiceName+'"');
    // file.pipe(res);

  })
  .catch(err=>{
    next(err);
  });
};
