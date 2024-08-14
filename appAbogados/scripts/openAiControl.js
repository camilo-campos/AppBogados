const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: "sk-proj-H68YCHOfUY370InWuCZyT3BlbkFJHpMePWaGU6Lyh3Dwa6SM",
});

async function getOpenAiResponse(prompt, maxTokens = 150) {
  console.log("\n[Get OpenAI Response called with this prompt]\n", prompt , "\n<-------------------------------------->");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: prompt,
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    let resText = null;

    if (response && response.choices && response.choices.length > 0 && response.choices[0].message && response.choices[0].message.content) {
      resText = response.choices[0].message.content.trim();
      console.log("-----[OpenAI response]-----", resText, "\n--------------------------");
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
