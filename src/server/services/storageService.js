const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const uploadToR2 = async (file, folder = 'misc') => {
  const fileName = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
  
  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    // Return the public URL or the key. If using a custom domain:
    // return `https://pub-xxxx.r2.dev/${fileName}`;
    return fileName; // We store the key and generate signed URLs or use public domain
  } catch (error) {
    console.error('R2 Upload Error:', error);
    throw new Error('Failed to upload file to storage');
  }
};

const getFileUrl = async (key) => {
  if (key.startsWith('http')) return key;
  
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });

  // URL valid for 1 hour
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};

module.exports = { uploadToR2, getFileUrl };
