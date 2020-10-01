const aws = require("aws-sdk");
const multerS3 = require("multer-s3");
const multer = require('multer');

const bucketName = "vendetta-products-images";

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  Bucket: bucketName
});

module.exports = {
  upload: multer({
    storage: multerS3({
      s3: s3,
      bucket: bucketName,
      acl: "public-read",
      key: (req, file, cb) => {
        cb(
          null,
          `${Date.now().toString()}.${file.originalname.split(".").pop()}`
        );
      }
    })
  }),
  deleteImage: image => new Promise(((resolve, reject) => {
    s3.deleteObjects({
      Bucket: bucketName,
      Delete: {
        Objects: [
          {
            Key: image.split('/').pop()
          }
        ],
      },
    }, (err, data) => {
      if (err) {
        reject({ error: "An amazon error has occurred" });
      } else {
        resolve()
      }
    })
  }))
};
