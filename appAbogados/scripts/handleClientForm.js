const { processForm } = require("./databaseProcess");
//const { getAiResponse } = require("./watsonAi");
const { getOpenAiResponse } = require("./openAiControl");
const { parseResponse } = require("./parseResponse");
const { sendEmail } = require("./mailHandler");
const mailFormatAbogado = './templateMailAbogado.html';
const mailFormatCliente = './templateMailCliente.html';
const mailFormatFail = './templateMailNoEncontrado.html';

const lawyerSeekMaxAttempts = 4; // Max attempts to get abogados (No more than 5 is recommended)
const maxComparisonAttempts = 4; // Max attempts to compare abogados
const toleranceIncrement = 5; // Tolerance if we can't find a suitable lawyer

const promptFilter = "From 1 to 100, how suitable is the lawyer for the case? Only answer the number, with a START before the number and an END after (both uppercase), DO NOT explain your reasoning";


async function handleClientForm(formData, prompt, maxAbogadosPerClient) {
  let attempts = 0;
  let abogadosInfo = [];
  let abogadosAmbitos = [];


  const systemRequest = `${prompt.promptSystem}\nList of tags: ${prompt.promptAmbitoList}`;

  const finalPrompt = [
    {role: "system", content: systemRequest},
    {role: "user", content: prompt.promptProblema},
  ]

  while (attempts < lawyerSeekMaxAttempts && (!abogadosInfo || !abogadosInfo?.length)) {
    try {

      /* --------------------------------
        1) Extraer los AMBITOS (tags) del requisito del SOLICITANTE
      -------------------------------- */

      //const response = await getAiResponse(prompt);
      const response = await getOpenAiResponse(finalPrompt, 250, attempts);

      /* --------------------------------
        2) Enlistar a TODOS los ABOGADOS que cumplan con los AMBITOS
         + que estén idealmente a menos de 40km del cliente
         + y cumplan con los requisitos del formulario
      -------------------------------- */

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
    

    /* --------------------------------
      3) Si se encuentran ABOGADOS, puntuarlos [0-100] según su idoneidad, y agregarlos a la lista
    -------------------------------- */

    if (abogadosInfo && abogadosInfo.length) {
      let abogadosRating = [];
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

      /* --------------------------------
        4) Filtrar a los abogados segun su preferencia de rating
      -------------------------------- */

      // abogado.nivel_coincidencia
      for (let i = 0; i < abogadosRating.length; i++) {
        const abogado = abogadosRating[i];
        const abogadoPreference = abogado.nivel_coincidencia - attempts * toleranceIncrement;

        if (abogado.rating < abogadoPreference) {
          // Remove the abogado from the list
          abogadosRating.splice(i, 1); 
        }
      }

      /* --------------------------------
        5) Limitar la cantidad de abogados por cliente
      -------------------------------- */

      if (abogadosRating.length > maxAbogadosPerClient) {
        abogadosRating.sort((a, b) => b.rating - a.rating); // Sort the abogados by rating
        abogadosRating.splice(maxAbogadosPerClient); // Remove the lowest rated abogados
      }

      /* --------------------------------
        6) Enviar correos a los abogados
      -------------------------------- */

      for (let i = 0; i < abogadosRating.length; i++) {
        const abogado = abogadosRating[i];
        try {
          const to = formData.email; //abogado.mail;
          const from = "appbogados@aptero.co";
          const subject = "Consulta de cliente [" + formData.name + "]";
          const placeholders = {
            phAbogado: abogado.nombres + " [" + abogado.mail + "]",
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
      }

      /* --------------------------------
        7) Enviar correo al cliente con la confirmación de la consulta
      -------------------------------- */

      // We randomize the list, so we don't reveal the order of best rated abogados
      abogadosRating = abogadosRating.sort(() => Math.random() - 0.5);

      try {
        const to = formData.email;
        const from = "appbogados@aptero.co";
        const subject = "Confirmacion Consulta de abogado";
        const placeholders = {
          phCliente: formData.name + " " + formData.Apellidos,
          phMessage: formData.Problema,
          phRegion: formData.Region + ", " + formData.Comuna,
          phDate: new Date().toLocaleDateString(),
        };

        // Make an object containing only the abogado's relevant info
        let finalAbogadosList = [];
        for (let i = 0; i < abogadosRating.length; i++) {
          const abogado = abogadosRating[i];
          finalAbogadosList.push({
            Nombre: abogado.nombres + " " + abogado.apellidos,
            Email: abogado.mail,
          });
        }

        sendEmail(to, from, subject, placeholders, mailFormatCliente, finalAbogadosList);
      } catch (error) {
        console.error("Error sending email to client:", error);
      }
    }


    attempts++;
  }

  if (!abogadosInfo) {
    console.error(`Failed to process form after ${lawyerSeekMaxAttempts} attempt${lawyerSeekMaxAttempts > 1 ? "s" : ""}`);

    // Send an email to the client with the failure
    try {
      const to = formData.email;
      const from = "appbogados@aptero.co";
      const subject = "Error en la consulta de abogado";
      const placeholders = {
        phCliente: formData.name + " " + formData.Apellidos,
        phDate: new Date().toLocaleDateString(),
      };

      sendEmail(to, from, subject, placeholders, mailFormatFail);
    } catch (error) {
      console.error("Error sending email to client:", error);
    }

  }
}

module.exports = { handleClientForm };
