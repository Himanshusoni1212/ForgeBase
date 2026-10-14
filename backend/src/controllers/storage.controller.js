const storageService = require('../services/storage.service');
const apiResponse = require('../utils/apiResponse.util');

async function upload(req, res, next) {
  try {
    const file = await storageService.uploadFile({
      projectId: req.project._id.toString(),
      file: req.file,
      folderPath: req.body.folderPath,
    });

    return apiResponse.success(res, file, 'File uploaded', 201);
  } catch (error) {
    next(error);
  }
}

async function listFiles(req, res, next) {
  try {
    const files = await storageService.listFiles(
      req.project._id.toString(),
      req.query.folder || null
    );

    return apiResponse.success(res, files);
  } catch (error) {
    next(error);
  }
}

async function getDownloadUrl(req, res, next) {
  try {
    const result = await storageService.getSignedDownloadUrl(
      req.params.fileId,
      req.project._id.toString()
    );

    return apiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    await storageService.deleteFile(req.params.fileId, req.project._id.toString());
    return apiResponse.success(res, null, 'File deleted');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  upload,
  listFiles,
  getDownloadUrl,
  remove,
};
