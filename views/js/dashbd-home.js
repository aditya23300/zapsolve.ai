/* COMMENT:
rules of working aka mechanism of communication
1. some variables:
a)context array: stores the entire message which has to be passed to the ai-engine 
b)userQuery:contains the latest userQuery
c)image_base64String:contains the latest image in base64string format
these 3 are available globally to everyone

2. some functions:
a) createnewconversation() --> initialise the context array
b) continuecurrentconversation() --> append the context array
c) endcurrentconversation()  --> empty the context array
d) togglestate()--->toggle the enable/disable status of the send btn
e) requesthandler()----->to send the post request to the server with context as the body of the request and then handle the response of the request.
3. some rules:::
a) whenever an image is uploaded, then end the current conversation and start the new one.
b) if the refresh button is clicked then end the current conversation.
c) if at any instant the context variable is null, then it means that the no current conversation is active.
d) any particular conversation will have only 1 image , if any new image is uploaded in between a conversation then a new conversation will be created.
e) add a current conversation cost button along side the refresh button to show the user the cost of current conversation.
f) after clicking the send button , the send button will become disabled and will be enabled only after the response from backend is full loaded on the screen so as to prevent multiple requests from jamming the server leading to server crashing.
g) every time the user signs-in, a new conversation should be created.
4. some mechanism analysis:
a) image upload mechanism  : user uploads image-> call the endcurrentconversation() to end the current conversation(if any)---->convert image to base64string and save to image_base64String variable
b) user-text-query entered mechanism: user enters query ---> extract user-query value and update the userQuery variable
c) send-btn-clicked mechanism: send btn clicked-----> togglestate() ----->check that at least one out of image_base64string or userQuery is not null.if both null then print on response-box that pls write a query or upload a pic. and call togglestate()--->if at-least one out of them is not null, then check the context variable , if null then call createnewconversation() , if context!=null then call continuecurrentconversation().
d)  continuecurrentconversation() mechanism:
append the context variable with a new element where only write userQuery and not the imageurl and before writing first update the userQuery with a msg that "note: no new image is sent in this query so use the older image sent for any reference if you want" ..----> call the requestHandler() function .
e) endcuurrentconversation() mechanism: 
make the context,image_base64string,userQuery variabes null again---->empty the response-container---->reset the upload btn----->reset the image-status providing para .----> refresh the text query input button.
f) createnewconversation() mechanism: if image_base64string is not null then put it , if userQuery is not null then put it and thus initialise the context variable accoringly.------> call the requestHandler() function .
g)requesthandler()-----> send the post request to the server with context as the body of the request ---> handle the response and print it on the response-container---->call the togglestate() function so as to reactivate the send btn.
h)refreshbtn mechanism-----> call the endcurrentconversation() function.
*/
let userQuery = { textQuery: "", image: {}, modelSelected: "" };
document.addEventListener("DOMContentLoaded", function () {
  userQuery = { textQuery: "", image: {}, modelSelected: "" };
  // const selectElement = document.getElementById("model-selection");
  // const model_selected = selectElement.value; // Store the selected value
  //TODO: Create a route to server inside a model select event listener such that if the user once chooses a model then that model is set as default until the user changes again.
  //tomorrow,create separate mechansims for older users and new users in postsigninhandler() function and set the model value too.
  // Get the hamburger menu and nav list elements
  const hamburger = document.getElementById("hamburger");
  const navList = document.getElementById("nav-list");
  const imageNameElement = document.getElementById("image-name");
  const uploadBtn = document.getElementById("upload-image");
  const sendBtn = document.getElementById("send-btn");
  const userQueryTextBox = document.getElementById("userQueryInputBox");
  const modelSelection = document.getElementById("model-selection");
  const popupOverlay = document.getElementById("popupOverlay");
  const popupTitle = document.getElementById("popup-title");
  const popupBody = document.getElementById("popup-body");
  const loaderAnimation = document.querySelector(".loader");

  // event listener to listen to load event:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  window.addEventListener("load", setDynamicHeight);
  // event listener to listen to resize event::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  window.addEventListener("resize", setDynamicHeight);
  // event listener to toggle the active class on the nav list when the hamburger is clicked::::::::::::::::::::::::::::::::::
  hamburger.addEventListener("click", () => {
    navList.classList.toggle("active");
  });
  //event listener for upload button::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  uploadBtn.addEventListener("change", (e) => {
    imageNameElement.innerHTML = "Upload in progress....";
    const file = e.target.files[0]; // Get the first selected file
    if (file) {
      imageNameElement.innerHTML = `Image Selected<br>  Image name: ${file.name}`;
      userQuery.image.file = file;
      userQuery.image.name = file.name;
    } else {
      imageNameElement.innerHTML = "No image selected";
    }
  });
  //event listener for send button::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  sendBtn.addEventListener("click", async () => {
    //update userQuery object with the model and textQuery values
    userQuery.modelSelected = modelSelection.value;
    userQuery.textQuery = userQueryTextBox.value;
    //forward to the request handler to proceed with the request to backend.
    await requestHandler();
  });

  //event listener for refresh button::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
  document.getElementById("refresh-btn").addEventListener("click", async () => {
    await toggleUIState();
    await refreshResponseBox();
    await postRequestHandler();
    await toggleUIState();
  });
  document.querySelector(".recharge-btn").addEventListener("click", () => {
    window.location.href = "/dashbd/paymentsPage";
  });
});
//NOTE: DEFINING FUNCTIONS BELOW:::::::::::::::::::
/* async function updateCurrentBalance() {
  try {
    const response = await fetch("/api/updateCurrentBalance", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const newResponse = await response.json();
    if (response.ok && newResponse.status === "success") {
      //case of successfull retrieval of value
      console.log("Current Balance:", data.currentBalance); // Display the balance
    } else {
      //case of failure, so put the text : "pls refresh the page to load the balance" on the ui
      console.error("Failed to update the current balance!!!", error);
    }
  } catch (error) {
    //case of failure, so put the text : "pls refresh the page to load the balance" on the ui
    console.error("Failed to update the current balance!!!", error);
  }
} */

function setDynamicHeight() {
  //all the below calculations are done in pixels...
  const responseContainer = document.querySelector(".response-container");
  const topOffset = responseContainer.getBoundingClientRect().top; // Get the distance from the top of the viewport to the .response-container

  // Calculate the available height by subtracting the top offset from the viewport height
  const availableHeight = window.innerHeight - topOffset - 5;
  // Set the height of .response-container
  responseContainer.style.height = `${availableHeight}px`;
}

async function refreshResponseBox() {
  //deleting all the elements inside the div with class="content" one by one using loop because it is more efficient.
  const contentDiv = document.querySelector(".content");
  if (contentDiv.innerHTML != "") {
    while (contentDiv.firstChild) {
      contentDiv.removeChild(contentDiv.firstChild);
    }
  }
}
//function to handle the operations after completion of a conversation.......
async function postRequestHandler() {
  //reset the variables
  userQuery.textQuery = "";
  userQuery.image = {};
  userQuery.modelSelected = "";
  //reseting the image upload status para text content
  const imageNameElement = document.querySelector("#image-name");
  imageNameElement.innerHTML = "No image selected";
  //resetting the userQuery typing area
  const userQueryInputBox = document.querySelector("#userQueryInputBox");
  userQueryInputBox.value = "";
}
async function toggleUIState() {
  const refreshBtn = document.getElementById("refresh-btn"); //connected to label "id" of refresh
  const sendBtn = document.getElementById("send-btn"); //connected to label "id" of send
  const fileInput = document.getElementById("upload-image"); //connected to label "for" so as to control the upload input element
  const uploadBtn = document.getElementById("upload-btn"); //connected to label "id" of upload
  //toggle the send,refresh,upload buttons
  sendBtn.disabled = !sendBtn.disabled;
  refreshBtn.disabled = !refreshBtn.disabled;
  fileInput.disabled = !fileInput.disabled;
  // toggle the ui of the buttons
  refreshBtn.classList.toggle("disabled");
  sendBtn.classList.toggle("disabled");
  uploadBtn.classList.toggle("disabled");
}
async function requestHandler() {
  await toggleUIState();
  //ensuring that at-least one out of user-text query or image input is non-empty
  if (userQuery.textQuery != "" || Object.keys(userQuery.image).length > 0) {
    //creating data obj to be used to spawn the user-query div in the reponse box
    let data = { textQuery: "", imageStatus: "" };
    data.textQuery = userQuery.textQuery;
    if (Object.keys(userQuery.image).length > 0) {
      data.imageStatus = ` Image with name ${userQuery.image.name} uploaded.`;
    }
    //spawn a div for the user-query
    divSpawner("user", data);
    //if no text input is provided the append the text input to a indicate the ai to focus on the image provided
    if (userQuery.textQuery === "") {
      userQuery.textQuery = "Image attached.";
    }
    const formData = new FormData();
    //append the image if present and remove the image file from the userQuery object so that we can pass on the obj separately in the body of the post request...
    if (Object.keys(userQuery.image).length > 0) {
      //it means image input is provided by the user
      formData.append("image", userQuery.image.file);
      //making the file content null because i have to send the userQuery object too to the backend along with the separate image file.
      userQuery.image.file = null;
    }
    // Append the userQuery object as a JSON string to FormData
    formData.append("userQuery", JSON.stringify(userQuery));
    //proceed with query-request
    try {
      const response = await fetch("/api/aiQueryRequest", {
        method: "POST", // Specify the method
        body: formData, // Convert the array to a JSON string
      });
      const responseData = await response.json();

      // Check if the response is ok (status in the range 200-299)
      if (!response.ok || responseData.status === "failed") {
        // throw new Error(`HTTP error! status: ${response.status}`);
        divSpawner("ai", {
          aiResponse:
            "An error occured in generating the response!!!, pls try again.",
          cost: 0,
        });
      } else {
        //this is the case when ai response is generated successfully
        //update the current balance value
        const currentBalanceBtn = document.querySelector(".balance-btn");
        currentBalanceBtn.innerHTML = `💰 ₹ ${(
          responseData.responseObj.currentBalance / 100
        ).toFixed(2)}`;
        //spawning the ai-div
        divSpawner("ai", {
          aiResponse: responseData.responseObj.aiResponse,
          cost: responseData.responseObj.cost,
        });
      }
    } catch (error) {
      divSpawner("ai", {
        aiResponse:
          "An error occured in generating the response!!!, pls try again.",
        cost: 0,
      });
    }
  } else {
    divSpawner("ai", {
      aiResponse:
        "Kindly provide either the text input or a pic of the question you want to get solved",
      cost: 0,
    });
  }
  await postRequestHandler();
  await toggleUIState();
}
async function divSpawner(spawnDivName, data) {
  let spawnDivHTML;
  if (spawnDivName === "ai") {
    const formattedResponse = formatAIResponse(data.aiResponse);
    //write code here for ai-response-box
    const aiResponseHTML = `
    <div class="ai-response chat-container">
       <button class="cost-info" >Cost: ₹${(data.cost / 100).toFixed(
         2
       )}</button>
      <div class="icon ai-icon">🤖 AI Response</div>
      <div class="response-content">
      ${formattedResponse}
      </div>
    </div>
  `;
    spawnDivHTML = aiResponseHTML;
  } else {
    const userResponseHTML = `
  <div class="user-query chat-container">
          <div class="icon user-icon">👤 User Query</div>
          <div class="query-content">
              <p>${data.textQuery}</p>
              <p class="image-status-spawn-userDiv">${data.imageStatus}</p>
          </div>
      </div>
  `;
    spawnDivHTML = userResponseHTML;
  }
  const contentDiv = document.querySelector(".content");
  contentDiv.insertAdjacentHTML("beforeend", spawnDivHTML);
  // Add click event listeners for code copy buttons
  const newResponse = contentDiv.lastElementChild;
  if (spawnDivName === "ai") {
    newResponse.querySelectorAll(".code-copy-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const codeBlockId = button.getAttribute("data-code-id");
        const codeContent = document.getElementById(codeBlockId)?.textContent;
        try {
          await navigator.clipboard.writeText(codeContent);
          button.textContent = "✓ Copied!";
          setTimeout(() => {
            button.textContent = "📋 Copy";
          }, 2000);
        } catch (err) {
          // console.error("Failed to copy code:", err);
        }
      });
    });
  }
  // Smooth scroll to bottom after new div is added
  contentDiv.scrollTo({
    top: contentDiv.scrollHeight,
    behavior: "smooth",
  });
}

// Format AI response function
function formatAIResponse(response) {
  // Split content by code blocks
  const parts = response.split("```");
  let formattedContent = "";

  parts.forEach((part, index) => {
    if (index % 2 === 0) {
      // Text content
      let textContent = part.trim();
      if (textContent) {
        // Format headers
        textContent = textContent.replace(
          /###\s+([^\n]+)/g,
          '<div class="markdown-header">$1</div>'
        );

        // Format inline code
        textContent = textContent.replace(
          /`([^`]+)`/g,
          '<span class="inline-code">$1</span>'
        );

        // Format line breaks and lists
        textContent = textContent
          .split("\n")
          .map((line) => {
            // Check if line is a list item
            if (line.match(/^\d+\./)) {
              return `<div style="margin-left: 1rem;">${line}</div>`;
            }
            return line;
          })
          .join("<br>");

        formattedContent += `<div class="text-block">${textContent}</div>`;
      }
    } else {
      // Code block
      const [language, ...codeLines] = part.split("\n");
      const code = codeLines.join("\n").trim();
      if (code) {
        const blockId = `code-block-${Math.random().toString(36).substr(2, 9)}`;
        formattedContent += `
                  <div class="code-block">
                      <div class="code-header">
                          <span>${language.trim()}</span>
                          <button class="code-copy-btn" data-code-id="${blockId}">Copy</button>
                      </div>
                      <pre class="code-content" id="${blockId}">${escapeHtml(
          code
        )}</pre>
                  </div>
              `;
      }
    }
  });

  return formattedContent;
}
// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
