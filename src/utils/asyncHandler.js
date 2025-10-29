const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      res.send(err.code || 500).json({
        success: true,
      });
    }
  };
};

export { asyncHandler };

// const asyncHandler = (fn) => {
//   (req, res, next) => {
//     Promise.resolve(fn(req, res, next)).catch((err) => next(err));
//   };
// };
