const userService = require('../services/user.service');
const apiResponse = require('../utils/apiResponse.util');

async function getMe(req, res, next) {
  try {
    const user = await userService.getUserById(req.user.userId);
    return apiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await userService.updateUser(req.user.userId, req.body);
    return apiResponse.success(res, user, 'Profile updated');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMe,
  updateMe,
};
