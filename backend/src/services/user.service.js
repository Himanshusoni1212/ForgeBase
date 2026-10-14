const userRepository = require('../repositories/user.repository');
const { AppError } = require('../utils/appError.util');
const ERROR_CODES = require('../constants/errorCodes');

async function getUserById(userId) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404, ERROR_CODES.USER_NOT_FOUND);
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function updateUser(userId, updateData) {
  await getUserById(userId);
  await userRepository.updateById(userId, { name: updateData.name });
  return getUserById(userId);
}

module.exports = {
  getUserById,
  updateUser,
};
