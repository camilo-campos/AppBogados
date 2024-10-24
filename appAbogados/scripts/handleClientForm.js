const { processForm } = require("./databaseProcess");
//const { getAiResponse } = require("./watsonAi");
const { getOpenAiResponse } = require("./openAiControl");
const { parseResponse } = require("./parseResponse");
const { sendEmail } = require("./mailHandler");
const fs = require('fs');
const path = require('path');
const mailFormatAbogado = './templateMailAbogado.html';
const mailFormatCliente = './templateMailCliente.html';
const mailFormatFail = './templateMailNoEncontrado.html';

const lawyerSeekMaxAttempts = 4; // Max attempts to get abogados (No more than 5 is recommended)
const maxComparisonAttempts = 4; // Max attempts to compare abogados
const toleranceIncrement = 5; // Tolerance if we can't find a suitable lawyer

const promptFilter = "From 1 to 100, how suitable is the lawyer for the case? Only answer the number, with a START before the number and an END after (both uppercase), DO NOT explain your reasoning";

const imagesAbogado = [
  {
    filename: 'footerAbogado.jpg',
    content: fs.readFileSync(path.resolve(__dirname, '../assets/footerAbogado.jpg')).toString('base64'),
    type: 'image/jpg+xml',
    disposition: 'inline',
    content_id: 'jpg_inline_image'  // This 'cid' will be used in the <img> tag
  }
];
const imagesCliente = [
  {
    filename: 'footerConsultante.jpg',
    content: fs.readFileSync(path.resolve(__dirname, '../assets/footerConsultante.jpg')).toString('base64'),
    type: 'image/jpg+xml',
    disposition: 'inline',
    content_id: 'jpg_inline_image'  // This 'cid' will be used in the <img> tag
  }
];

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
              "\nClient's case: " + formData.caso +

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

      // phText is the text of the email, in case the html doesnt load
      // This will be send to the abogado
      

      for (let i = 0; i < abogadosRating.length; i++) {
        const abogado = abogadosRating[i];
        try {
          const simpleText = `Estimado/a ${abogado.nombres},\n\nUn cliente ha solicitado sus servicios legales. A continuación, se presenta la información de contacto del cliente y su caso:\n\nNombre: ${formData.nombres} ${formData.apellidos}\nRUT: ${formData.rut}\nEmail: ${formData.mail}\nMensaje: ${formData.caso}\nRegión: ${formData.region}, ${formData.comuna}\n\nAntecedentes Penales: ${formData.antecedentes_penales ? "Sí" : "No"}\nAntecedentes Comerciales: ${formData.antecedentes_comerciales ? "Sí" : "No"}\nResidencia Regular: ${formData.residencia ? "Sí" : "No"}\n\nFecha de la consulta: ${new Date().toLocaleDateString()}\n\nPara más detalles, por favor revise el correo electrónico enviado a su dirección.\n\nSaludos cordiales,\nEquipo AppBogado`;

          const to = formData.mail; //abogado.mail;
          const from = "admin@appbogado.cl";
          const subject = "Consulta de cliente [" + formData.nombres + "]";
          const placeholders = {
            phAbogado: abogado.nombres + " [" + abogado.mail + "]",
            phCliente: formData.nombres + " " + formData.apellidos,
            phRut: formData.rut,
            phEmail: formData.mail,
            phMessage: formData.caso,
            phRegion: formData.region + ", " + formData.comuna,
            phAPenales: formData.antecedentes_penales, // Bool
            phAComerciales: formData.antecedentes_comerciales, // (DICOM) Bool
            phResidencia: formData.residencia, // Bool
            phDate: new Date().toLocaleDateString(),
            phText: simpleText,
          };
          
          sendEmail(to, from, subject, placeholders, mailFormatAbogado, [], imagesAbogado);
        } catch (error) {
          console.error("Error sending email to abogado:", error);
        }
      }

      /* --------------------------------
        7) Enviar correo al consultante con la confirmación de la consulta
      -------------------------------- */

      // We randomize the list, so we don't reveal the order of best rated abogados
      abogadosRating = abogadosRating.sort(() => Math.random() - 0.5);

      /*const messageInfo = `Hemos recibido la información de su caso satisfactoriamente y la hemos enviado a ${abogadosRating.length} abogado${abogadosRating.length > 1 ? "s" : ""} inscritos en nuestra plataforma, quienes le contactarán prontamente.`;*/

      const messageInfo = `El servicio de appbogado.cl comenzará a operar el próximo 21 de noviembre.  

Entendemos la importancia de su búsqueda y lamentamos sinceramente los inconvenientes que esto pueda ocasionarle. Le invitamos a enviarnos los datos de su caso después de esa fecha.  

Si tiene alguna consulta o necesita asistencia adicional, no dude en contactarnos.`

      const simpleTextCliente = `Estimado/a ${formData.nombres} ${formData.apellidos},\n\nHemos recibido la información de su caso satisfactoriamente y la hemos enviado a ${abogadosRating.length} abogado${abogadosRating.length > 1 ? "s" : ""} inscritos en nuestra plataforma, quienes le contactarán prontamente.\n\nPara más detalles, por favor revise el correo electrónico enviado a su dirección.\n\nSaludos cordiales,\nEquipo AppBogado`;

      try {
        const to = formData.mail;
        const from = "admin@appbogado.cl";
        const subject = "Confirmacion Consulta de abogado";
        const placeholders = {
          phCliente: formData.nombres + " " + formData.apellidos,
          phAbogados: messageInfo,
          phMessage: formData.caso,
          phRegion: formData.region + ", " + formData.comuna,
          phDate: new Date().toLocaleDateString(),
          phText: simpleTextCliente,
        };

        // Make an object containing only the abogado's relevant info
        /*let finalAbogadosList = [];
        for (let i = 0; i < abogadosRating.length; i++) {
          const abogado = abogadosRating[i];
          finalAbogadosList.push({
            Nombre: abogado.nombres + " " + abogado.apellidos,
            Email: abogado.mail,
          });
        }*/

        await sendEmail(to, from, subject, placeholders, mailFormatCliente, [], imagesCliente);
      } catch (error) {
        console.error("Error sending email to client:", error);
      }
    }


    attempts++;
  }

  if (!abogadosInfo || !abogadosInfo?.length) {
    console.error(`Failed to process form after ${lawyerSeekMaxAttempts} attempt${lawyerSeekMaxAttempts > 1 ? "s" : ""}`);

    // Send an email to the client with the failure
    try {
      const to = formData.mail;
      const from = "admin@appbogado.cl";
      const subject = "Error en la consulta de abogado";
      const placeholders = {
        phText: `Gracias por utilizar nuestro servicio de matching de abogados. Lamentablemente, en este momento no hemos podido encontrar abogados que cumplan con sus requisitos.

Entendemos la importancia de su búsqueda y lamentamos sinceramente los inconvenientes que esto pueda ocasionarte. Lo invitamos a intentar nuevamente mas tarde.

Si tiene alguna consulta o necesitas asistencia adicional, no dude en contactarnos.

Agradecemos su comprension y esperamos poder ayudarle pronto.`,
        phCliente: formData.nombres + " " + formData.apellidos,
        phMessage: formData.caso,
        phRegion: formData.region + ", " + formData.comuna,
        phDate: new Date().toLocaleDateString(),
      };

      await sendEmail(to, from, subject, placeholders, mailFormatFail, [], imagesCliente);
    } catch (error) {
      console.error("Error sending email to client:", error);
    }

  }
}

module.exports = { handleClientForm };
