const { getDb } = require('../database/mongodb');
const { toObjectId } = require('../utils/objectId.util');
const CONSTANTS = require('../config/constants');

function collection() {
  return getDb().collection(CONSTANTS.COLLECTIONS.ORGANIZATION_MEMBERS);
}

async function create(memberData) {
  const now = new Date();
  return collection().insertOne({
    organizationId: toObjectId(memberData.organizationId),
    userId: toObjectId(memberData.userId),
    role: memberData.role,
    invitedBy: memberData.invitedBy ? toObjectId(memberData.invitedBy) : null,
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  });
}

async function findByOrgAndUser(organizationId, userId) {
  return collection().findOne({
    organizationId: toObjectId(organizationId),
    userId: toObjectId(userId),
  });
}

async function findByOrganizationId(organizationId) {
  return collection()
    .find({ organizationId: toObjectId(organizationId) })
    .toArray();
}

async function findByUserId(userId) {
  return collection()
    .find({ userId: toObjectId(userId) })
    .toArray();
}

async function updateRole(organizationId, userId, role) {
  return collection().updateOne(
    {
      organizationId: toObjectId(organizationId),
      userId: toObjectId(userId),
    },
    { $set: { role, updatedAt: new Date() } }
  );
}

async function remove(organizationId, userId) {
  return collection().deleteOne({
    organizationId: toObjectId(organizationId),
    userId: toObjectId(userId),
  });
}

module.exports = {
  create,
  findByOrgAndUser,
  findByOrganizationId,
  findByUserId,
  updateRole,
  remove,
};
