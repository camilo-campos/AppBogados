const { databaseGet } = require('./databaseControl');
const { dataTest } = require('./dataTest');
const { parseResponse } = require('./parseResponse');
const { comunaLocator } = require('./comunaLocator');
const { ambitosFilter } = require('./microScripts/ambitosFilter');
const { sendValidationEmails } = require('./microScripts/sendValidationEmails');

const basePrompt = "Based on the information provided, output the relevant tags from the list that apply to the user, inside curly brackets, separated by commas, DO NOT JUSTIFY YOUR ANSWER select ONLY tags from the list";


let dimAmbitos = [];
let ambitoList = "";


databaseGet({ table: 'dim_ambitos' }).then((ambitos) => {
  // Extract from ambitos the "desc_ambito", and assign it to "id_ambito" to dimAmbitos
  for (let i = 0; i < ambitos.length; i++) {
    dimAmbitos[ambitos[i].id_ambito] = ambitos[i].desc_ambito;
  }
  // Remove any ambito that could be EMPTY, or a space character
  dimAmbitos = dimAmbitos.filter(ambito => !!ambito && ambito.trim() !== "");


  ambitoList = `{${dimAmbitos.join(", ")}}`;
}).catch(error => console.error(error));

function getAssistantPrompt() {
  return [basePrompt, ambitoList];
}

//----------------------------------------------

// <-- Uncomment to test the data retrieval -->
//dataTest(['dim_comunas_chile', 'dim_abogados', 'ft_ambitos', 'ft_comunas', 'ft_solicitudes']); OLD
//dataTest(['dim_comunas_chile', 'dim_credenciales', 'ft_ambitos', 'dim_ambitos', 'dim_abogados']);
//dataTest(['ft_casos_perdidos']);
//dataTest(['dim_abogados']);

// <-- Uncomment to send the validation emails -->
//sendValidationEmails();

//----------------------------------------------


async function processForm(formData, response) {
  // Extract tags using a regular expression
  let cleanResponse = parseResponse(response);

  if (cleanResponse) {
    try {
      // Get the IDs of the tags that match the response
      let aiAmbitosIds = ambitosFilter(cleanResponse, dimAmbitos);

      // Get the abogados that match the tags (ft_ambitos)
      const abogados = await databaseGet({ table: 'ft_ambitos', id_ambito: aiAmbitosIds });
      
      // Extract the abogados IDs from the matching tags
      let abogadosIds = abogados.map(abogado => abogado.rut);
      // Remove duplicates from the abogados IDs
      abogadosIds = [...new Set(abogadosIds)];

      let dataMatch = {
        rut: abogadosIds,
        vigencia: 'activo', //We are using 'vigencia' as 'verified', don't get them confused
      };

      /*if (formData.antecedentes_penales === 'si') {
        dataMatch.req_cliente_sin_ant_penales = "0";
      }
      if (formData.antecedentes_comerciales === 'si') {
        dataMatch.req_cliente_sin_ant_com = "0";
      }
      if (formData.residencia === 'no') {
        dataMatch.req_cliente_residencia_regular = "0";
      }*/

      console.log("-------> [dataMatch]:", dataMatch);

      // Get the abogados names from the IDs
      let abogadosData = await databaseGet({ table: 'dim_abogados', ...dataMatch });

      const abogadosNombres = abogadosData.map(abogado => abogado.nombres);
      console.log("Abogados matching tags:", abogadosNombres);

      // Filter abogados that have paid the service
      const currentDate = new Date();
      const abogadosDataCheck = abogadosData.filter(abogado => 
        abogado.fecha_vigencia && new Date(abogado.fecha_vigencia) >= currentDate
      );

      /*
        --> We use abogadosDataCheck to ensure we are actually receiving a list of VALID lawyers, and reattempt if not
        --> We then pass the WHOLE list (below), to add 1 to how many times the lawyer has missed a client
        --> The final list filters for the last 3 years, it would originally used all the lawyers, but we are assuming 3 year old accounts are no longer relevant/interested
      */

      // First, filter lawyers who haven't payed in the last 3 years
      const twoYearsAgo = new Date(currentDate.getFullYear() - 3, currentDate.getMonth(), currentDate.getDate());
      abogadosData = abogadosData.filter(abogado =>
        abogado.fecha_vigencia && new Date(abogado.fecha_vigencia) >= twoYearsAgo
      );

      if (abogadosData.length === 0 || abogadosDataCheck.length === 0) {
        console.log("No se encontraron abogados con fecha de vigencia activa");
        return false; // Return failure if no valid abogados are found
      }

      // Filter abogados if they are too far (using comunaLocator)
      let abogadosFiltered = [];

      const comunaA = formData.comuna;

      // Run all the comunaLocator in parallel
      const comunaPromises = abogadosData.map(async (abogado) => {
        const comunaB = abogado.comuna;
        if (await comunaLocator(comunaA, comunaB, 40)) {
          return abogado;
        }
        return null;
      });
      abogadosFiltered = (await Promise.all(comunaPromises)).filter(abogado => abogado !== null);
      

      if (abogadosFiltered.length > 0) {
        abogadosData = abogadosFiltered;
      } else {
        console.log("No abogados found in the vicinity, using the original list...");
      }

    
      const abogadosNombresLog = abogadosData.map(abogado => abogado.nombres);
      console.log("Abogados Final list:", abogadosNombresLog);

      // Make a list of the abogados with their respective ambitos
      let abogadosAmbitosRet = [];
      for (let i = 0; i < abogadosData.length; i++) {
        const abogado = abogadosData[i];
        const ambitos = await databaseGet({ table: 'ft_ambitos', rut: abogado.rut });
        const ambitosDesc = ambitos.map(ambito => dimAmbitos[ambito.id_ambito]);
        abogadosAmbitosRet.push({ nombres: abogado.nombres, ambitos: ambitosDesc });
      }

      return { abogadosData, abogadosAmbitosRet }; // Return the abogados data and the tags
    } catch (error) {
      console.error("Error processing tags:", error);
      return false; // Return failure
    }
  } else {
    console.error("No tags found in response");
    console.log("ERROR, AI responded with:", response);
    return false; // Return failure
  }
}

module.exports = { processForm, getAssistantPrompt };
