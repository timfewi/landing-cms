
module.exports = {
  "/api": {
    target:
      process.env["services__server__https__0"] ||
      process.env["services__server__http__0"],
    secure: process.env["NODE_ENV"] !== "development",
  },
};
