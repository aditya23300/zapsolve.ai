/* NOTE: mechanism of payment gateway using razorpay:::::::::::::::::::
STEP-1: Create a order for the user's payment request
STEP-2: 
STEP-3:
STEP-4:

post payment to-do's::::::::::::::
payment verified --> details update on db,current bal update
payment not verified--> update on db
*/
const {
  instance,
  validateWebhookSignature,
} = require("../configs/razorpay-config");
async function createOrder(amount, userInfo) {
  try {
    //ensure that the amount is valid
    if (!amountChecker(amount))
      return {
        status: "failed",
        message: "Please enter a valid numeric amount which is atleast ₹ 50",
      };
    // creating order for the request received from the user
    var options = {
      amount: `${amount * 100}`, // amount in the smallest currency unit
      currency: "INR",
      receipt: "zapsolve-receipt",
      notes: {
        userEmail: userInfo.email,
      },
    };
    // Using the Promise-based approach
    const order = await instance.orders.create(options);
    console.log("order created successfully!!!");
    return { status: "success", order, userInfo };
  } catch (error) {
    return { status: "failed", message: error };
  }
}
async function verifyPayment(response) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const body = response.order_id + "|" + response.payment_id;
  try {
    const isValidSignature = validateWebhookSignature(
      body,
      response.signature,
      secret
    );
    if (isValidSignature) {
      console.log("payment verification successfull");
      //UPDATE payment details on db, update current balance too.
      return { status: "success", message: "Payment verified" };
    } else {
      return { status: "failed", message: "Payment not verified" };
    }
  } catch (error) {
    return { status: "failed", message: "Payment not verified", error };
  }
}
function amountChecker(amount) {
  //checking if the given amount is a natural number and at least 50 rupees
  const isValid =
    typeof amount === "number" && Number.isInteger(amount) && amount >= 50;
  return isValid;
}
module.exports = { verifyPayment, createOrder };
