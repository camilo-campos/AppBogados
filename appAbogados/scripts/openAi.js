const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: "Our OpenAI API key!",
});

const openai = new OpenAIApi(configuration);

async function getOpenAiResponse(prompt, maxTokens = 150) {
  console.log("\n-->Get OpenAI Response called with prompt:", prompt + "\n<--");
  try {
    const response = await openai.createCompletion({
      model: "gpt-4o-mini",
      prompt: prompt,
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    const resText = response.data.choices[0].text.trim();
    console.log("-----[OpenAI response]-----", resText, "\n--------------------------");
    return resText;
  } catch (error) {
    console.error("Error in getOpenAiResponse:", error);
    return "";
  }
}

module.exports = { getOpenAiResponse };
