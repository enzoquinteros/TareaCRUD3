var express = require('express');
var router = express.Router();
var preciosModel = require("../../models/preciosModel")
var util = require('util');
var cloudinary = require('cloudinary').v2;
const uploader = util.promisify(cloudinary.uploader.upload);
const destroy = util.promisify(cloudinary.uploader.destroy);

router.get('/', async function(req,res,next){
    
    var precios = await preciosModel.getPrecios();

    precios = precios.map(precio => {
        if(precio.img_id) {
            const imagen = cloudinary.image(precio.img_id, {
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
                imagen: ''
            }
        }
    });
    
    res.render('admin/precios',{
        layout: 'admin/layout',
        persona: req.session.nombre,
        precios
    });
});

router.get('/eliminar/:id', async(req,res,next) => {
    var id = req.params.id;
    
    let precio = await preciosModel.getPreciosById(id);
    if(precio.img_id) {
        await (destroy(precio.img_id));
    }

    await preciosModel.deletePreciosById(id);
    res.redirect('/admin/precios')
});

router.get('/agregar', (req,res,next) => {
    res.render('admin/agregar',{
        layout: 'admin/layout'
    });
});

router.post('/agregar', async (req,res,next) => {
    try {
        var img_id = '';
        if (req.files && Object.keys(req.files).length > 0) {
            imagen = req.files.imagen;
            img_id = (await uploader(imagen.tempFilePath)).public_id;
        }

        if (req.body.nombre != "" && req.body.precio != "" && req.body.descripcion != "") {
            await preciosModel.insertPrecios({
                ...req.body,
                img_id
            });
            res.redirect('/admin/precios')
        }   else {
            res.render('admin/agregar',{
                layout: 'admin/layout',
                error: true,
                message: 'Todos los campos son requeridos'
            });
        }
    } catch (error) {
        console.log(error)
        res.render('admin/agregar',{
            layout: 'admin/layout',
            error: true,
            message: 'No se cargo el producto'
        });
    }
});

router.get('/modificar/:id', async (req,res,next) => {
    let id = req.params.id;
    let precio = await preciosModel.getPreciosById(id);
    res.render('admin/modificar', {
        layout: 'admin/layout',
        precio
    });
});

router.post('/modificar', async (req,res,next) => {
    try {

        let img_id = req.body.img_original;
        let borrar_img_vieja = false;
        if (req.body.img_delete === '1') {
            img_id = null;
            borrar_img_vieja = true;
        } else {
            if (req.files && Object.keys(req.files).length > 0) {
                imagen = req.files.imagen;
                img_id = (await uploader(imagen.tempFilePath)).public_id;
                borrar_img_vieja = true;
            }
            if (borrar_img_vieja && req.body.img_original) {
                await (destroy(req.body.img_original));
            }
        }

        var obj = {
            nombre: req.body.nombre,
            img_id,
            precio: req.body.precio,
            descripcion: req.body.descripcion
        }
        console.log(obj)
        await preciosModel.modificarPreciosById(obj,req.body.id);
        res.redirect('/admin/precios');
    }
    catch (error) {
        res.render('admin/modificar', {
            layout: 'admin/layout',
            error: true,
            message: 'No se modifico el producto'
        })
    }
})

module.exports = router;