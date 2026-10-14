function success(res, data = {}, message = undefined, statusCode = 200) {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(statusCode).json(body);
}

function error(res, message, code, statusCode = 500, extra = undefined) {
  const body = { success: false, message, code };
  if (extra) Object.assign(body, extra);
  return res.status(statusCode).json(body);
}

module.exports = { success, error };
