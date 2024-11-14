document.addEventListener("DOMContentLoaded", function () {
  // Add a click event listener to the button
  const sendBtn = document.querySelector(".pay-button");
  sendBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    sendBtn.disabled = true;
    await paymentRequestHandler();
    sendBtn.disabled = false;
  });
  //event listener for home button
  document.querySelector(".home-btn").addEventListener("click", function () {
    window.location.href = "/dashbd/home";
  });
});
//function definiton starts here...
async function paymentRequestHandler() {
  const errormsg = document.querySelector(".error-msg");
  errormsg.innerHTML = ""; //reset the error content
  const amountInput = document.querySelector(".amount-input");
  const amount = amountInput.value;
  try {
    // Send the POST request to create order using the fetch API
    const orderResponse = await fetch("/api/createOrder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount }), // Convert the amount object to JSON
    });
    const newOrderResponse = await orderResponse.json();
    if (orderResponse.status === 200 && newOrderResponse.status === "success") {
      //now our order is successfully created by the server on our backend, now we will proceed to opening the payment popup
      const order = newOrderResponse.order; //contains the details of the order created
      const options = {
        key: "rzp_test_DhFDovMBTu5LCg", // Replace with your Razorpay key_id
        amount: `${amount * 100}`, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        currency: "INR",
        name: "Zapsolve.ai",
        description: `Payment for recharge of amount ₹${amount} by ${newOrderResponse.userInfo.username}`,
        image:
          "https://raw.githubusercontent.com/aditya23300/storageRepo/main/zapsolve.ai_logo-removebg-preview%20(1)%20(3).png",
        order_id: order.id, // This is the order_id created in the backend
        handler: async function (response) {
          //here we write the next step to perform after
          // alert(response.razorpay_payment_id);
          //  alert(response.razorpay_order_id);
          // alert(response.razorpay_signature);
          await postPaymentHandler({
            response,
            amount,
          });
        },
        prefill: {
          name: newOrderResponse.userInfo.username,
          email: newOrderResponse.userInfo.email,
        },
        theme: {
          color: "#F37254",
        },
      };
      const rzp = new Razorpay(options);
      /* no need of this function ,this function is used if you want to handle the failed payment attempts of the user , but i saw that the razorpay popup itself is handling it very well by showing the error cause, giving option to retry , or just leave the payment gateway so i dont want to add any new functionality here 
      rzp.on("payment.failed", async function (response) {
        alert(response.error.code);
        alert(response.error.description);
        alert(response.error.source);
        alert(response.error.step);
        alert(response.error.reason);
        alert(response.error.metadata.order_id);
        alert(response.error.metadata.payment_id);
      }); */
      rzp.open();
    } else {
      errormsg.innerHTML = "ERROR: " + newOrderResponse.message;
    }
  } catch (error) {
    errormsg.innerHTML =
      "ERROR: Failed to process the payment request. \n Pls try again later!!!";
  }
}
async function verifyPayment(details) {
  try {
    const response = await fetch("/api/verifyPayment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_id: details.razorpay_payment_id,
        order_id: details.razorpay_order_id,
        signature: details.razorpay_signature,
      }),
    });
    const verficationStatus = await response.json();
    if (response.status === 200 && verficationStatus.status === "success")
      return verficationStatus;
    else
      return {
        status: "failed",
        message: "unable to verify the payment status here1",
      };
  } catch {
    return {
      status: "failed",
      message: "unable to verify the payment status here2",
    };
  }
}
async function postPaymentHandler(object) {
  /*
    it means the request is coming from handler function,i.e the user has made the payment successfully but we cant be sure that the payment has been received by us or not so we have to verify that
    so ,2 cases possible here:
     case-1: payment done by the user but not verfied at the backend ie payment not received by us.
     case-2: payment done by the user and verfied as well at the backend i.e payment received by us therefore successfull transaction.
    step-1: run the loading animation popup until the backend services like payment verfication,db updation are taking place
    step-2: send req to backend to verify the payment status and update the db if the verification is successful
    step-3: load the payment result screen along with necessary info about the conclusions of the payment done by the user and remove the current payment container.
    Also ,add a home button below the result box so that user can go back to the dashboard by clicking that and add a timer of 30 sec for automatic redirection of user back to the dashboard homepage
     */
  const response = object.response;
  const amount = object.amount;
  const paymentDetails = {
    order_id: response.razorpay_payment_id,
    payment_id: response.razorpay_order_id,
    amount: amount,
    isVerified: false,
  };
  await loaderPopup(
    "show",
    "Payment Status",
    "Processing your payment, pls wait a few seconds!!!"
  );
  const verificationStatus = await verifyPayment(response);
  if (verificationStatus.status === "success") {
    paymentDetails.isVerified = true;
  }
  const dbUpdate = await updatepaymentToDB(paymentDetails);
  let finalmsgStatus = "failure";
  if (
    verificationStatus.status === "success" &&
    dbUpdate.status === "success"
  ) {
    finalmsgStatus = "success";
  }
  await postpaymentUIHandler(finalmsgStatus, amount);
}

async function updatepaymentToDB(paymentDetails) {
  try {
    const dbUpdate = await fetch("/api/updatePaymentDetails", {
      method: "POST", // HTTP method
      headers: {
        "Content-Type": "application/json", // Set content type to JSON
      },
      body: JSON.stringify(paymentDetails), // Convert JS object to JSON string
    });
    const dbUpdateJSON = await dbUpdate.json();
    if (dbUpdate.status === 200 && dbUpdateJSON.status === "success") {
      return { status: "success" };
    } else {
      //payment verified but unable to update the user payment records in db
      return { status: "failure" };
    }
  } catch (error) {
    //payment verified but unable to update the user payment records in db
    return { status: "failure", error };
  }
}
async function loaderPopup(visibility, titleContent, bodyContent) {
  //visibility can be "show" or "remove"
  //title contains the titlecontent
  const popupOverlay = document.getElementById("popupOverlay");
  const popupTitle = document.getElementById("popup-title");
  const popupBody = document.getElementById("popup-body");
  if (visibility === "show") {
    popupTitle.innerHTML = titleContent;
    popupBody.innerHTML = bodyContent;
    popupOverlay.classList.add("show");
  } else popupOverlay.classList.remove("show");
}
async function postpaymentUIHandler(verficationStatus, amount) {
  const successContent = `<h2>Payment of ₹${amount} successfully processed. </h2>
  <button class="home-button dynamic-content">Home</button>
    <p class="error-msg">Redirecting to homepage, pls wait....</p>`;
  const failureContent = `<h2>Failed to process the payment of ₹${amount}. </h2>
   <p class="dynamic-content" >Dont worry even if payment is deducted from your account, our team will reach out to you on your provided email id soon. Refund will be initiated upon successful verifcation by our team. </p>
   <button  class="retry-button dynamic-content">Retry</button>
    <p class="error-msg">Redirecting to homepage, pls wait....</p>`;
  let newcontent = "";
  if (verficationStatus === "success") {
    newcontent = successContent;
    //modify the payment container by first emptying it and then putting the required content inside it
    document.querySelector(".payment-container").innerHTML = newcontent;
    //remove the loader popup from the screen
    await loaderPopup("remove", "", "");
    //redirect the user to homepage of the dashboard after a few seconds
    setTimeout(() => (window.location.href = "/dashbd/home"), 5000);
  } else {
    newcontent = failureContent;
    document.querySelector(".payment-container").innerHTML = newcontent;
    //remove the loader popup from the screen
    await loaderPopup("remove", "", "");
    setTimeout(() => (window.location.href = "/dashbd/home"), 10000);
  }
}
