// Function to send selected model to the server
async function updateSelectedModel() {
  //update model selection in the backend....
  const selectedModel = modelSelection.value;
  // Send a POST request to the backend
  try {
    const response = fetch("/api/update-model", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ defaultAIModelName: selectedModel }),
    });
    const newResponse = response.json();
    if (response.ok && newResponse.status === "success") {
      //updation of chosen model in db successfull.
    } else {
      //inform the user using the popup that model selection failed so going with default selection only.
      //also reset the
    }
  } catch (error) {
    console.error("Error updating model:", error);
  }
}
