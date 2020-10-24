const Product = require('../models/productModel');
const Volume = require('../models/volumeModel');
const Option = require('../models/optionModel');
const adminVerify = require('../helpers/adminVerify');
const { upload, deleteImage } = require('../helpers/upload');

module.exports = app => {
  app.get("/products", async (req, res) => {
    const { skip, limit, search = '', shop = null } = req.query;
    if (await adminVerify(req, res)) {
      try {
        const totalProducts = await Product.find({});
        const filter = { name: {$regex : `.*${search}.*`, $options:'i'} };
        if (shop) {
          filter.shop = shop
        }
        const products =
          await Product
            .find(filter)
            .select('+volumes')
            .populate('volumes')
            .select('+options')
            .populate('options')
            .populate('shop')
            .sort({
              _id: -1
            })
            .skip(parseFloat(skip))
            .limit(parseFloat(limit))
            .exec();
        return res.send(
          {
            data: products,
            count: totalProducts.length
          }
        );
      } catch (e) {
        return res.send({ error: "An error has occurred" });
      }
    }
  });

  app.post("/products", upload.single("image"), async (req, res) => {
    if (await adminVerify(req, res)) {
      const { name, description, price, category, shop, options } = req.body;

      if ( !name || !price || !description || !category || !req.file || !shop) {
        if (req.file.location) {
          await deleteImage(req.file.location);
        }
        return res.status(400).send('Заполните все поля');
      }

      try {
        const product = new Product();

        console.log(options);

        product.name = name;
        product.price = price;
        product.img = req.file.location;
        product.category = category;
        product.description = description;
        product.shop = shop;
        if (options) {
          product.options = options.split(',');
        }

        await product.save();

        return res.send(product);
      } catch (e) {
        return res.status(400).send({
          error: "An error has occurred"
        });
      }
    }
  });


  app.post("/products/:id/volumes", async (req, res) => {
    if (await adminVerify(req, res)) {
      const { id } = req.params;
      const { volumes } = req.body;
      if (!volumes) {
        return res.status(400).send({
          error: 'Введите значения'
        });
      }

      try {
        const newVolumes = [];
        for (const volume of volumes) {
          const { measure, value, extraPrice } = volume;

          if ( !measure || !value || !extraPrice ) {
            return res.status(400).send({
              error: 'Заполните все поля'
            });
          }
          const newVolume = new Volume();
          newVolume.measure = measure;
          newVolume.value = value;
          newVolume.extraPrice = extraPrice;
          newVolume.product = id;
          await newVolume.save();
          newVolumes.push(newVolume._id);
        }

        await Product.update({ _id: id }, { $push: { volumes: newVolumes } });

        const product = await Product.findOne({ _id: id }).populate('volumes').populate('options').exec();

        res.send(product);
      } catch (e) {
        return res.status(400).send({
          error: "An error has occurred"
        });
      }

    }
  });

  app.delete("/products/:id/volumes/:volumeId", async (req, res) => {
    if (await adminVerify(req, res)) {
      const {id, volumeId} = req.params;

      await Volume.deleteOne({ _id: volumeId });

      await Product.update({ _id: id }, { $pull: { volumes: volumeId } });

      const product = await Product.findOne({ _id: id }).populate('volumes').populate('options').exec();

      res.send(product);
    }
  });

  app.delete("/products/:id/options/:optionId", async (req, res) => {
    if (await adminVerify(req, res)) {
      const {id, optionId} = req.params;

      await Option.deleteOne({ _id: optionId });

      await Product.update({ _id: id }, { $pull: { options: optionId } });

      const product = await Product.findOne({ _id: id }).populate('volumes').populate('options').exec();

      res.send(product);
    }
  });

  app.delete("/products/:id", async (req, res) => {
    if (await adminVerify(req, res)) {
      const { id } = req.params;

      try{
        const product = await Product.findOne({ _id: id });

        if (product.img) {
          await deleteImage(product.img);
        }

        await Volume.deleteMany({ product: id });

        await Option.deleteMany({ product: id });

        await Product.deleteOne({ _id: id });

        return res.send('OK')
      } catch (e) {
        return res.send({ error: "An error has occurred" });
      }
    }
  });
};
