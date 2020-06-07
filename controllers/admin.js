const Product    = require('../models/product');
const fileHelper = require('../util/file');
exports.getAddProduct = (req, res, next) => {
  let message = req.flash('error');
  if(message.length>0){
      message = message[0];
    }else {
        message = null;
    }
  message=null;
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    isAuthenticated: req.session.isLoggedIn,
    error:message
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if(!imageUrl){
    req.flash('error','photo must be attached')
    return res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: true,
      isAuthenticated: req.session.isLoggedIn,
      product:{
        title:title,
        price:price,
        description:description
      },
      errorMessage:req.flash('error')
    });
  }
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: '/' + imageUrl.path,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500 ;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        isAuthenticated: req.session.isLoggedIn,
        errorMessage:null
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500 ;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.file;
  const updatedDesc = req.body.description;

  Product.findById(prodId)
    .then(product => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if(updatedImageUrl){
        const path      = product.imageUrl;
        const len       = path.length;
        const finalPath = path.slice(1,len);
        fileHelper.deleteFile(finalPath);
        product.imageUrl = '/' + updatedImageUrl.path;
      }
      return product.save();
    })
    .then(result => {
      console.log('UPDATED PRODUCT!');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500 ;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({userId:req.user._id})
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated: req.session.isLoggedIn
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500 ;
      return next(error);
    });
};

exports.DeleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId).then(result=>{
    const path      = result.imageUrl;
    const len       = path.length;
    const finalPath = path.slice(1,len);
    fileHelper.deleteFile(finalPath);
    return Product.deleteOne({_id:prodId,userId:req.user._id});
  }).then(() => {
      console.log('DESTROYED PRODUCT');
      res.status(200).json({message:'sucsess'});
    }).catch(err => {
    res.status(500).json({message:'failed'});
  });
};
