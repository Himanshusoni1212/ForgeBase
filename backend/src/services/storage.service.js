const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const s3Client = require('../storage/s3Client');
const fileRepository = require('../repositories/file.repository');
const config = require('../config');
const { AppError } = require('../utils/appError.util');
const ERROR_CODES = require('../constants/errorCodes');
const CONSTANTS = require('../config/constants');
const logger = require('../utils/logger.util');

function buildS3Key(projectId, folderPath, originalName) {
  const extension = path.extname(originalName);
  const folder = folderPath === '/' ? '' : `${folderPath.replace(/^\/|\/$/g, '')}/`;
  return `projects/${projectId}/${folder}${uuidv4()}${extension}`;
}

async function findOwnedFile(fileId, projectId) {
  const file = await fileRepository.findById(fileId);

  if (!file) {
    throw new AppError('File not found', 404, ERROR_CODES.FILE_NOT_FOUND);
  }

  if (file.projectId.toString() !== projectId) {
    throw new AppError(
      'File does not belong to this project',
      403,
      ERROR_CODES.FORBIDDEN
    );
  }

  return file;
}

async function uploadFile({ projectId, file, folderPath = '/' }) {
  if (!file) {
    throw new AppError('No file provided', 400, ERROR_CODES.FILE_UPLOAD_FAILED);
  }

  const s3Key = buildS3Key(projectId, folderPath, file.originalname);

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.aws.s3Bucket,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const result = await fileRepository.create({
      projectId,
      folderPath,
      originalName: file.originalname,
      s3Key,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    logger.info({ projectId, fileId: result.insertedId, s3Key }, 'File uploaded');

    return fileRepository.findById(result.insertedId);
  } catch (error) {
    logger.error({ err: error, projectId, s3Key }, 'File upload failed');
    throw new AppError('File upload failed', 500, ERROR_CODES.FILE_UPLOAD_FAILED);
  }
}

async function listFiles(projectId, folderPath = null) {
  return fileRepository.findByProjectId(projectId, folderPath);
}

async function getSignedDownloadUrl(fileId, projectId) {
  const file = await findOwnedFile(fileId, projectId);

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: config.aws.s3Bucket, Key: file.s3Key }),
    { expiresIn: CONSTANTS.SIGNED_URL_EXPIRY_SECONDS }
  );

  return {
    url,
    expiresIn: CONSTANTS.SIGNED_URL_EXPIRY_SECONDS,
    file,
  };
}

async function deleteFile(fileId, projectId) {
  await findOwnedFile(fileId, projectId);
  await fileRepository.softDelete(fileId);
  logger.info({ fileId, projectId }, 'File soft-deleted');
}

module.exports = {
  uploadFile,
  listFiles,
  getSignedDownloadUrl,
  deleteFile,
};
