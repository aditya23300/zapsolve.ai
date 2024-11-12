//middleware for all protected routes should be like::: check if cookie is present in the browser, if yes then np else redirect the user from protected routes back to the homepage
require("dotenv").config();
const jwt = require("jsonwebtoken");
function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    console.log("action: Cookie not found. redirecting to login page!!!");
    return res.redirect("/");
  }
  try {
    //this decoded variable contains the payload we used to create the jwt token, inshort it is coverting the token back to the payload aka decryption, if the token is found to be invalid then the verfify function will return error so control will then goto catch block.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    //this will execute when the verify method returns error ie cookie is tampered...
    console.log("action: Invalid Cookie. redirecting to login page!!!");
    return res.redirect("/");
  }
}
module.exports = authMiddleware;
