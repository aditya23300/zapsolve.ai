const dotenv = require("dotenv");
dotenv.config();
//initialising the razorpay instance
const Razorpay = require("razorpay");
var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
module.exports = { instance, validateWebhookSignature };
