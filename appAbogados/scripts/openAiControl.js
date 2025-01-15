const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.open_api_key,
});

async function getOpenAiResponse(prompt, maxTokens = 150, attempts = 0) {
  //console.log("\n[Get OpenAI Response called with this prompt]\n", prompt , "\n<-------------------------------------->");
  console.log(
    "\n[Get OpenAI Response called]\n<-------------------------------------->"
  );

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: prompt,
      max_tokens: maxTokens,
      temperature: Math.min(0.7 + attempts * 0.2, 1.4), // Increase temperature with attempts to get more 'creative' responses if we fail
    });
    let resText = null;

    if (
      response &&
      response.choices &&
      response.choices.length > 0 &&
      response.choices[0].message &&
      response.choices[0].message.content
    ) {
      resText = response.choices[0].message.content.trim();
      console.log(
        "-----[OpenAI response]-----\n",
        resText,
        "\n---------------------------"
      );
    } else {
      console.log("[!!] -----> Got Response as:", response);
    }

    return resText;
  } catch (error) {
    console.error("Error in getOpenAiResponse:", error);
    return "";
  }
}

module.exports = { getOpenAiResponse };
