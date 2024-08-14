const { processForm } = require("./databaseProcess");
//const { getAiResponse } = require("./watsonAi");
const { getOpenAiResponse } = require("./openAiControl");
const { parseResponse } = require("./parseResponse");
const { sendEmail } = require("./mailHandler");
const mailFormatAbogado = './templateMailAbogado.html';
const mailFormatCliente = './templateMailCliente.html';

const maxAttempts = 1; // Max attempts to get abogados (No more than 5 is recommended)
const maxComparisonAttempts = 1; // Max attempts to compare abogados

const promptFilter = "From 1 to 100, how suitable is the lawyer for the case? Only answer the number, with a START before the number and an END after (both uppercase), DO NOT explain your reasoning";


async function handleForm(formData, prompt) {
  let attempts = 0;
  let abogadosInfo = [];
  let abogadosAmbitos = [];

  const systemRequest = `${prompt.promptSystem}\nList of tags: ${prompt.promptAmbitoList}`;

  const finalPrompt = [
    {role: "system", content: systemRequest},
    {role: "user", content: prompt.promptProblema},
  ]

  while (attempts < maxAttempts && (!abogadosInfo || !abogadosInfo?.length)) {
    try {
      //const response = await getAiResponse(prompt);
      const response = await getOpenAiResponse(finalPrompt, 250);
      const { abogadosData, abogadosAmbitosRet } = await processForm(formData, response);

      if (!abogadosData || !abogadosData?.length) {
        console.log(`Attempt ${attempts + 1} failed, retrying...`);
      } else {
        abogadosInfo = abogadosData;
        abogadosAmbitos = abogadosAmbitosRet;
      }
    } catch (error) {
      console.error(`Error on attempt ${attempts + 1}:`, error);
    }
    attempts++;
  }

  if (!abogadosInfo) {
    console.error(`Failed to process form after ${maxAttempts} attempt${maxAttempts > 1 ? "s" : ""}`);
  } else {
    let abogadosRating = [];

    // Stop if the list is no longer than 1
    if (abogadosInfo.length === 1) {
      console.log("Only one abogado found [", abogadosInfo[0].nombres, "] No need to compare.");
      abogadosRating[0] = { ...abogadosInfo[0], rating: 100 };
    } else {
      // Select the best abogado from the list by comparing the description of the case with the abogado's description
      // We do this by comparing both descriptions and rating the similarity from 1 to 100

      console.log("------> Comparing [", abogadosInfo.length, "] abogados");

      for (let i = 0; i < abogadosInfo.length; i++) {
        const abogado = abogadosInfo[i];
        let comparisonAttempts = 0;
        let rating = 0;

        while (comparisonAttempts < maxComparisonAttempts && rating === 0) {
          try {
            // Note: We add the areas to re-assure the AI that the abogado is suitable for the case, so we don't get a low rating
            const abogadoPrompt =
              "Lawyer's areas: " + abogadosAmbitos[i].ambitos.join(", ") +
              "\nLawyer's description: " + abogado.descripcion +
              "\nClient's case: " + formData.Problema +

            console.log("----> Comparing abogado [", abogado.nombres, "] - Attempt", comparisonAttempts + 1);
            //const response = await getAiResponse(abogadoPrompt, false);

            const finalPrompt = [
              {role: "system", content: promptFilter},
              {role: "user", content: abogadoPrompt},
            ]

            const response = await getOpenAiResponse(finalPrompt, 300);
            const cleanResponse = parseResponse(response).trim();
            console.log("AI Abogado answer [", cleanResponse, "]");
            rating = cleanResponse ? parseInt(cleanResponse) : 0;
            console.log("Rating:", rating);
            if (rating > 0) {
              abogadosRating.push({ ...abogado, rating });
            }
          } catch (error) {
            console.error(`Error comparing abogado on attempt ${comparisonAttempts + 1}:`, error);
          }
          comparisonAttempts++;
        }
      }
    }

    if (abogadosRating.length > 0) {
      // Return the highest rated abogado
      const bestAbogado = abogadosRating.reduce((prev, current) => (prev.rating > current.rating) ? prev : current);
      console.log("Best abogado is [", bestAbogado.nombres, "] with rating [", bestAbogado.rating, "]");
      

      // Send request to the abogado
      // <-- Handle Abogado request here -->
      try {
        const to = bestAbogado.mail;
        const from = "appbogados@aptero.co";
        const subject = "Consulta de cliente";
        const placeholders = {
          phAbogado: bestAbogado.nombres + " [" + bestAbogado.mail + "]",
          phCliente: formData.name + " " + formData.Apellidos,
          phRut: formData.rut,
          phEmail: formData.email,
          phMessage: formData.Problema,
          phRegion: formData.Region + ", " + formData.Comuna,
          phAPenales: formData.antecedentes_penales, // Bool
          phAComerciales: formData.antecedentes_comerciales, // (DICOM) Bool
          phResidencia: formData.residencia, // Bool
          phDate: new Date().toLocaleDateString(),
        };
        
        sendEmail(to, from, subject, placeholders, mailFormatAbogado);
      } catch (error) {
        console.error("Error sending email to abogado:", error);
      }
      // <--


      // Send confirmation to the client
      // <-- Handle Client confirmation here -->
      try {
        const to = formData.email;
        const from = "appbogados@aptero.co";
        const subject = "Consulta de abogado";
        const placeholders = {
          phCliente: formData.name + " " + formData.Apellidos,
          phAbogado: bestAbogado.nombres,
          phRating: bestAbogado.rating,
          phMessage: formData.Problema,
          phRegion: formData.Region + ", " + formData.Comuna,
          phDate: new Date().toLocaleDateString(),
        };
      
        sendEmail(to, from, subject, placeholders, mailFormatCliente);
      } catch (error) {
        console.error("Error sending email to client:", error);
      }

    }
  }
}

module.exports = { handleForm };
