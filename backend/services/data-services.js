require("dotenv").config(); // Load environment variables
const { db, FieldValue } = require("../configs/firebase-admin-config.js"); // Adjust the path as necessary
const { createNewConversationforOPENAI } = require("./open-ai-services.js");
//tasks: create user db on cloudstore
async function postGoogleSignInRouteHandler(userInfo) {
  try {
    //first we will check if the user who signed currently is an old or a new user, depending on that we will update the db
    const userChecker = await CRUDFirestoreDB("get", userInfo.uid, {});

    if (userChecker.status === "success") {
      //it means the user already exists so we will update the username and the photoURL fields as email,uid are permanent and remain same for a specific user
      const dbUpdate = await CRUDFirestoreDB("update", userInfo.uid, {
        username: userInfo.displayName,
        photoURL: userInfo.photoURL,
      });
      if (dbUpdate.status === "success") {
        dbUpdate.message = "Updated the details of old user successfully.";
      } else {
        dbUpdate.message = "Unable to update the details of the old user";
      }
      return dbUpdate;
    } else {
      //it means its a new user so create a new document in firestore db and initialise the values....
      const setDetails = await CRUDFirestoreDB("set", userInfo.uid, {
        username: userInfo.displayName,
        email: userInfo.email,
        photoURL: userInfo.photoURL,
        uid: userInfo.uid,
        conversationArray: [],
        paymentHistoryArray: [],
        currentBalance: 0,
        totalCost: 0,
      });
      if (setDetails.status === "success")
        setDetails.message =
          "Successfully initialised the firestoredb for the new user";
      else {
        setDetails.message =
          "Failed to initialise the firestoredb for the new user";
      }
      return setDetails;
    }
  } catch (error) {
    console.log("Error creating new user:", error.message);
    return { status: "failed", message: error.message }; // Return error message
  }
}

//function to extract the first name from the whole username
function trimUntilFirstSpace(str) {
  const firstSpaceIndex = str.indexOf(" ");
  if (firstSpaceIndex === -1) {
    // If there is no space, return the entire string
    return str;
  }
  return str.substring(0, firstSpaceIndex);
}
//function to convert image to base64string
async function imageToBase64Stringconverter(image) {
  // Read the image file as a binary buffer
  const imageBuffer = image.buffer;

  // Convert the binary data to a Base64 string
  const imagebase64String = imageBuffer.toString("base64");
  const dataUrl = `data:${image.mimetype};base64,${imagebase64String}`;
  return dataUrl;
}
async function aiQueryRequestHandler(userQuery, uid) {
  try {
    //if image input is provided then convert the image to base64string
    if (Object.keys(userQuery.image).length > 0) {
      userQuery.image.file = await imageToBase64Stringconverter(
        userQuery.image.file
      );
    }
    //performing api call to the open-ai services and getting the response
    const apiResponse = await createNewConversationforOPENAI(userQuery);
    if (apiResponse.status === "success") {
      const conversationObj = apiResponse.conversationObj;
      //now,we have to upload the conversationobj to the db
      const userRef = db.collection("users").doc(uid);
      //calculate the new current balance and cost values for db
      // Fetch the document snapshot
      const userDoc = await userRef.get();
      const newCurrentBalance = parseFloat(
        (
          userDoc.data().currentBalance - conversationObj.cost.totalCost
        ).toFixed(4)
      );
      const newTotalCost = parseFloat(
        (userDoc.data().totalCost + conversationObj.cost.totalCost).toFixed(4)
      );
      const dbUpdate = await CRUDFirestoreDB("update", uid, {
        conversationArray: FieldValue.arrayUnion(conversationObj),
        currentBalance: newCurrentBalance,
        totalCost: newTotalCost,
      });
      if (dbUpdate.status === "success") {
        const responseObj = {
          aiResponse: conversationObj.aiResponse,
          cost: conversationObj.cost.totalCost,
          currentBalance: newCurrentBalance,
        };
        //now,return a reponseobj which contains only the ai-response,cost,current balance.
        return { status: "success", responseObj };
      } else return { status: "failed", message: "failed to update the db" };
    } else {
      return apiResponse;
    }
  } catch (error) {
    console.error(error);
    return {
      status: "failed",
      message: "Error from request handler function!!!",
      error,
    };
  }
}
async function paymentUpdateHandler(uid, paymentObj) {
  try {
    let dbUpdate;
    if (paymentObj.isVerified === true) {
      //it means the payment is verfied so we have to update both the current balance and the payments-array
      dbUpdate = await CRUDFirestoreDB("update", uid, {
        paymentHistoryArray: FieldValue.arrayUnion(paymentObj),
        currentBalance: FieldValue.increment(Number(paymentObj.amount) * 100),
      });
    } else {
      //it means that the payment is not verified so we have to only update the payments-array
      dbUpdate = await CRUDFirestoreDB("update", uid, {
        paymentHistoryArray: FieldValue.arrayUnion(paymentObj),
      });
    }
    if (dbUpdate.status === "success") {
      console.log("payment transaction-details updated in the db");
    } else {
      console.log("failed to update the payment transaction details on the db");
    }
    return dbUpdate;
  } catch (error) {
    console.log(
      "failed to update the payment transaction details on the db, got error in catch block..."
    );
    return {
      status: "failed",
      message:
        "failed to update the payment transaction details on the db, got error in catch block...",
    };
  }
}
//function to perform any of the CRUD operations ,,currently set,get,update are available.
async function CRUDFirestoreDB(action, uid, updationObject) {
  try {
    const userRef = db.collection("users").doc(uid);

    if (action === "set") {
      await userRef.set(updationObject);
    } else if (action === "update") {
      await userRef.update(updationObject);
    } else if (action === "get") {
      const doc = await userRef.get();
      if (doc.exists) {
        return { status: "success", message: doc.data() };
      } else {
        return { status: "failed", message: "Document not found" };
      }
    }
    return {
      status: "success",
      message: `successfully performed the ${action} operation on the firestoreDB.`,
    };
  } catch (error) {
    console.log(error);
    return {
      status: "failed",
      message: `failed to perform the ${action} on the firestoreDB `,
    };
  }
}
module.exports = {
  postGoogleSignInRouteHandler,
  trimUntilFirstSpace,
  aiQueryRequestHandler,
  CRUDFirestoreDB,
  paymentUpdateHandler,
};
