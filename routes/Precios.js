var express = require('express');
var router = express.Router();
var cloudinary = require('cloudinary').v2;
var preciosModel = require('../models/preciosModel');

/* GET home page. */
router.get('/', async function(req, res, next) {
  
  var precios = await preciosModel.getPrecios();

  precios = precios.splice(0, 5);
  precios = precios.map(precio => {
      if(precio.img_id) {
          const imagen =cloudinary.url(precio.img_id, {
            width: 100,
            height: 100,
            crop: 'fill'
          });
          return {
              ...precio,
              imagen
          }
      }   else {
          return {
              ...precio,
              imagen: '/images/noimage.png'
          }
      }
  });

  res.render('Precios', {
    precios
  });
});

module.exports = router;
