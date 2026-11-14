const ApiError = require("../utils/ApiError");

const validate = (schema) => (req, res, next) => {
  const validSchema = {};
  ["params", "query", "body"].forEach((key) => {
    if (schema[key]) {
      validSchema[key] = schema[key];
    }
  });

  const objectToValidate = {};
  Object.keys(validSchema).forEach((key) => {
    objectToValidate[key] = req[key];
  });

  const errors = [];

  Object.keys(validSchema).forEach((key) => {
    const { error, value } = validSchema[key].validate(req[key], {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: false,
    });

    if (error) {
      error.details.forEach((detail) => {
        errors.push({
          field: detail.path.join("."),
          message: detail.message.replace(/['"]/g, ""),
        });
      });
    } else {
      req[key] = value;
    }
  });

  if (errors.length > 0) {
    const firstMessage = errors[0].message;
    return next(new ApiError(400, firstMessage, errors));
  }

  return next();
};

module.exports = validate;
