const OpenAI = require("openai");

// Load environment variables from .env file
require("dotenv").config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function codeRunner(reqQuery) {
  try {
    console.log("request sent to openai-api.");
    const chatCompletion = await openai.chat.completions.create(reqQuery);
    console.log("response received from open-ai.");
    return { status: "success", chatCompletion };
  } catch (error) {
    console.error("error from coderunner function", error);
    return {
      status: "failed",
      message: "Failed to fetch response from open-ai!!!",
      error,
    };
  }
}
//to calculate the cost corresponding to any tokens consumed
async function costCalculator(inputTokenQuantity, outputTokenQuantity, model) {
  const dollarToPaisaRATE = 10000;
  let modelVersion;
  if (model === "gpt-4o-mini") modelVersion = 0;
  else if (model === "chatgpt-4o-latest") modelVersion = 1;
  //this is a 2d array of the form costReference[modelVersion][put 0 for inputcost and 1 for output cost]
  const costReference = [
    [0.00000015, 0.0000006],
    [0.0000025, 0.00001],
  ]; //this cost is in dollars/token
  let inputCost =
    costReference[modelVersion][0] * inputTokenQuantity * dollarToPaisaRATE;
  let outputCost =
    costReference[modelVersion][1] * outputTokenQuantity * dollarToPaisaRATE;
  let totalCost = inputCost + outputCost;
  //inputCost,outputCost,totalCost are in paise instead of rupee(its better to use min denomination in handling payment related services)
  //rounding off these 3 cost values to max 4 decimal places in paise(rest i will ignore.)
  inputCost = parseFloat(inputCost.toFixed(4));
  outputCost = parseFloat(outputCost.toFixed(4));
  totalCost = parseFloat(totalCost.toFixed(4));
  return { inputCost, outputCost, totalCost };
}
//to create a request object to be sent to open-ai api
async function createNewConversationforOPENAI(userQuery) {
  try {
    //the below function only includes those values out of userQuery and image_base64String which are not null, see the content array carefully to understand the working.
    const reqQuery = {
      messages: [
        {
          role: "user",
          content: [
            userQuery.textQuery != "" && {
              type: "text",
              text: userQuery.textQuery,
            },
            Object.keys(userQuery.image).length > 0 && {
              type: "image_url",
              image_url: { url: userQuery.image.file },
            },
          ].filter(Boolean), // Filters out any null or undefined values
        },
      ],
      model: userQuery.modelSelected,
      max_tokens: 5000, // Optional: adjust based on your needs
    };

    const response = await codeRunner(reqQuery);

    if (response.status === "success") {
      const result = response.chatCompletion;

      const cost = await costCalculator(
        result.usage.prompt_tokens,
        result.usage.completion_tokens,
        userQuery.modelSelected
      );

      const conversationObj = {
        inputTokens: result.usage.prompt_tokens,
        outputTokens: result.usage.completion_tokens,
        modelUsed: result.model,
        conversationID: result.id,
        aiResponse: result.choices[0].message.content,
        userQuery: {
          // Conditionally add textQuery if it exists
          ...(userQuery.textQuery && { textQuery: userQuery.textQuery }),

          // Conditionally add image if it exists
          ...(userQuery.image &&
            userQuery.image.name && { image: userQuery.image.name }),
        },
        cost: cost,
      };
      console.log("created new conversationobj successfully.");
      return { status: "success", conversationObj };
    } else {
      console.error("error from createnewconv function", response);
      return response;
    }
  } catch (error) {
    console.error("error from createnewconv function", error);
    return {
      status: "failed",
      message: "Failed to fetch response from open-ai!!!",
      error,
    };
  }
}
module.exports = { createNewConversationforOPENAI };
