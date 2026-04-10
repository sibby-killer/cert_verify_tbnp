export const success = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

export const error = (res, message = 'An error occurred', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

export const unauthorized = (res) => {
  return error(res, 'Unauthorized access', 401);
};

export const forbidden = (res) => {
  return error(res, 'Forbidden: You do not have permission', 403);
};

export const notFound = (res, item = 'Resource') => {
  return error(res, `${item} not found`, 404);
};

export const tooManyRequests = (res) => {
  return error(res, 'Too many requests, please try again later', 429);
};
