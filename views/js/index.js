//work here
import {
  provider,
  auth,
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
} from "../../firebase-config.js";
async function googleAuthRequestHandler() {
  const popupOverlay = document.getElementById("popupOverlay");
  const popupTitle = document.getElementById("popup-title");
  const popupBody = document.getElementById("popup-body");
  try {
    const result = await signInWithPopup(auth, provider);
    popupOverlay.classList.add("show");
    popupTitle.innerHTML = "Sign-in successful!!!";
    popupBody.innerHTML = "Pls wait a few seconds...";
    // The signed-in user info.
    const userInfo = result.user;
    const response = await fetch("/postGoogleSignInRoute", {
      method: "POST", // Specify the request method
      headers: {
        "Content-Type": "application/json", // Set the content type to JSON
      },
      body: JSON.stringify(userInfo), // Convert the data object to a JSON string
    });
    const newResponse = await response.json();
    if (response.ok && newResponse.success === true) {
      console.log("redirecting to dashboad!!!!");
      window.location.href = "/dashbd/home";
    } else {
      popupTitle.innerHTML = "Oops!!! Server error occured.Pls try again later";
      popupBody.innerHTML = "Redirecting back to homepage...";
      setTimeout(() => {
        popupOverlay.classList.remove("show");
        window.location.href = "/";
      }, 2000);
    }
  } catch (error) {
    popupOverlay.classList.add("show");
    popupTitle.innerHTML = "Sign-in failed!!!";
    popupBody.innerHTML = "Redirecting back to homepage...";
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  }
}
//work here
document.addEventListener("DOMContentLoaded", function () {
  // Get the hamburger menu and nav list elements
  const hamburger = document.getElementById("hamburger");
  const navList = document.getElementById("nav-list");

  // Toggle the active class on the nav list when the hamburger is clicked
  hamburger.addEventListener("click", () => {
    navList.classList.toggle("active");
  });
  //event listerner for get started button
  const getStartedBtn = document.getElementById("getStartedBtn");
  getStartedBtn.addEventListener("click", () => googleAuthRequestHandler());
});
