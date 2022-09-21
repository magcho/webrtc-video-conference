const Jimp = require("jimp");
const QrCode = require("qrcode-reader");

exports.readQrCode = async (imageBinary) => {
  const image = await Jimp.read(imageBinary);
  const qr = new QrCode();

  const value = await new Promise((resolve, reject) => {
    qr.callback = (err, v) => (err != null ? reject(err) : resolve(v));
    qr.decode(image.bitmap);
  });

  return value.result;
};
