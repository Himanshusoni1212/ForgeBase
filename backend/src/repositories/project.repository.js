const { getDb } = require('../database/mongodb');
const { toObjectId } = require('../utils/objectId.util');
const CONSTANTS = require('../config/constants');

function collection() {
  return getDb().collection(CONSTANTS.COLLECTIONS.PROJECTS);
}

async function create(projectData) {
  const now = new Date();
  return collection().insertOne({
    organizationId: toObjectId(projectData.organizationId),
    name: projectData.name,
    slug: projectData.slug,
    environments: CONSTANTS.ENVIRONMENTS,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

async function findById(id) {
  return collection().findOne({ _id: toObjectId(id), deletedAt: null });
}

async function findByOrgAndSlug(organizationId, slug) {
  return collection().findOne({
    organizationId: toObjectId(organizationId),
    slug,
    deletedAt: null,
  });
}

async function findByOrganizationIds(orgIds) {
  return collection()
    .find({
      organizationId: { $in: orgIds.map(toObjectId) },
      deletedAt: null,
    })
    .toArray();
}

async function updateById(id, updateData) {
  return collection().updateOne(
    { _id: toObjectId(id) },
    { $set: { ...updateData, updatedAt: new Date() } }
  );
}

async function softDelete(id) {
  const now = new Date();
  return collection().updateOne(
    { _id: toObjectId(id) },
    { $set: { deletedAt: now, updatedAt: now } }
  );
}

module.exports = {
  create,
  findById,
  findByOrgAndSlug,
  findByOrganizationIds,
  updateById,
  softDelete,
};
