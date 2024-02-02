require("dotenv").config();
const { uploadFile } = require("@uploadcare/upload-client");

const uploadImage = async (file) => {
  const buff = await uploadFile(file.data, {
    publicKey: process.env.PUBLIC_KEY,
    store: "auto",
    metadata: {
      subsystem: "uploader",
      pet: "cat",
    },
  });
  return { cdnUrl: buff.cdnUrl };
};

module.exports = { uploadImage };
