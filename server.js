// Import required modules
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { error } = require("console");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const upload = multer({ storage: multer.memoryStorage() });
const jwt = require("jsonwebtoken");
const cors = require("cors");
const authMiddleware = require("./backend/middlewares/authMiddleware.js");
// Load environment variables from .env file
require("dotenv").config();
// Initialize Express app
const app = express();
const {
  postGoogleSignInRouteHandler,
  CRUDFirestoreDB,
  trimUntilFirstSpace,
  aiQueryRequestHandler,
  paymentUpdateHandler,
} = require("./backend/services/data-services.js");
const {
  createOrder,
  verifyPayment,
} = require("./backend/services/razorpay-service.js");
// middleware to Serve static files
app.use(express.static(path.join(__dirname, "views")));
// Serve static files in the root directory
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json()); // This is essential to parse JSON request bodies
app.set("view engine", "ejs");
app.use(cors());
// Route handler for the homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/html", "index.html"));
});
// Route handler for the oauthsignin:::::::::::::::::::::::::::::
app.post("/postGoogleSignInRoute", async (req, res) => {
  //update cloudstoredb of user ---> set cookies here ----> send back the status along with a status code
  const userInfo = req.body;
  try {
    const result = await postGoogleSignInRouteHandler(userInfo);
    if (result.status === "success") {
      const token = jwt.sign(
        {
          userInfo: {
            email: userInfo.email,
            uid: userInfo.uid,
            username: userInfo.displayName,
          },
        },
        process.env.JWT_SECRET
      );
      res.cookie("token", token);
      res.status(200).json({ success: true });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Something went wrong", error });
    }
  } catch (error) {
    res
      .status(400)
      .json({ success: false, message: "Something went wrong", error });
  }
});
//dashboard route:::::::::::::
app.get("/dashbd/home", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.userInfo.uid;
    const response = await CRUDFirestoreDB("get", uid, {});
    if (response.status === "success") {
      const userInfo = response.message;
      //i have to modify the username to pick only the first name
      userInfo.username = trimUntilFirstSpace(userInfo.username);
      // Render the dashboard.ejs file and pass userInfo as data
      res.render("html/dashbd-home", { userInfo });
    } else {
      res.redirect("/");
    }
  } catch {
    res.redirect("/");
  }
});
app.post(
  "/api/aiQueryRequest",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const userQuery = JSON.parse(req.body.userQuery);
      if (req.file) {
        userQuery.image.file = req.file;
      }
      const uid = req.user.userInfo.uid;
      const response = await aiQueryRequestHandler(userQuery, uid);
      res.json(response);
    } catch (error) {
      res.json({ status: "failed", "error-message": error });
    }
  }
);
app.get("/dashbd/paymentsPage", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.userInfo.uid;
    const response = await CRUDFirestoreDB("get", uid, {});
    if (response.status === "success") {
      const userInfo = response.message;
      //i have to modify the username to pick only the first name
      userInfo.username = trimUntilFirstSpace(userInfo.username);
      // Render the ejs file and pass userInfo as data
      res.render("html/dashbdPayments", { userInfo });
    } else {
      res.redirect("/dashbd/home");
    }
  } catch {
    res.redirect("/dashbd/home");
  }
});
//post request for handling the payment request
app.post("/api/createOrder", authMiddleware, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const userInfo = req.user.userInfo;
    const response = await createOrder(amount, userInfo);
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "failed", "error-message": error });
  }
});
app.post("/api/verifyPayment", authMiddleware, async (req, res) => {
  try {
    const response = await verifyPayment(req.body);
    //  res.status(200).json(response);
    res.status(500).json({ status: "failed", "error-message": error });
  } catch (error) {
    res.status(500).json({ status: "failed", "error-message": error });
  }
});
//ROUTE to return the current balance of the user
app.post("/api/updatePaymentDetails", authMiddleware, async (req, res) => {
  try {
    const uid = req.user.userInfo.uid;
    const paymentObj = req.body;
    const dbUpdate = await paymentUpdateHandler(uid, paymentObj);
    if (dbUpdate.status === "success") {
      res.status(200).json(dbUpdate);
    } else {
      res.json(dbUpdate);
    }
  } catch (error) {
    console.log(
      "failed to update the payment transaction details on the db, got error in catch block..."
    );
    res.json({ status: "failed", message: error });
  }
});
// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});
