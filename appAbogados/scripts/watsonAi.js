const { WatsonxAI } = require("@langchain/community/llms/watsonx_ai");
const fetch = require("node-fetch");
require("dotenv").config();

let modelExtract = null;
let modelRate = null;

/*
  We use 2 different models, since during testing I found that Granite was better and more consistent at extracting tags, while Llama was better and more reliable at rating the abogados.
*/

function setModelExtract() {
  console.log("\x1b[47m\x1b[30m%s\x1b[0m", "Setting Extract model...");
  modelExtract = new WatsonxAI({
    modelId: process.env.modelId,
    url: "https://us-south.ml.cloud.ibm.com",
    ibmCloudApiKey: process.env.ibmCloudApiKey,
    projectId: process.env.projectId,
    modelParameters: {
      max_new_tokens: 200,
      min_new_tokens: 0,
      stop_sequences: [],
      repetition_penalty: 1,
      temperature: 0.85,
    },
  });
}
function setModelRate() {
  console.log("\x1b[47m\x1b[30m%s\x1b[0m", "Setting Rate model...");
  modelRate = new WatsonxAI({
    modelId: "ibm/granite-20b-multilingual",
    url: "https://us-south.ml.cloud.ibm.com",
    ibmCloudApiKey: process.env.ibmCloudApiKey,
    projectId: process.env.projectId,
    modelParameters: {
      max_new_tokens: 250,
      min_new_tokens: 0,
      stop_sequences: [],
      repetition_penalty: 1,
      temperature: 0.75,
    },
  });
}

async function getAiResponse(prompt, extract = true) {
  const promptContent = JSON.stringify(prompt);
  console.log(
    "\n-->Get AI Response called with prompt:",
    promptContent + "\n<--"
  );
  try {
    if (!modelExtract) setModelExtract();
    if (!modelRate) setModelRate();
    console.log("Model initialized, invoking model...");
    let res;
    if (extract) {
      res = await modelExtract.invoke(promptContent);
    } else {
      res = await modelRate.invoke(promptContent);
    }
    console.log(
      "-----[Model response]-----",
      res,
      "\n--------------------------"
    );
    return res;
  } catch (error) {
    console.error("Error in getAiResponse:", error);
    return "";
  }
}

module.exports = { getAiResponse };
