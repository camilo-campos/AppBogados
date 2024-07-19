const { databaseStore, databaseGet } = require('./databaseControl');
const { dataTest } = require('./dataTest');
const { parseResponse } = require('./parseResponse');

const basePrompt = "\n Prompt: Based on the information provided, output relevant tags from the list that apply to the user, inside curly brackets, separated by commas, DO NOT JUSTIFY YOUR ANSWER select ONLY tags from the list\n Tags list:";


let dimAmbitos = [];
let assistantPrompt = "";


databaseGet({ table: 'dim_ambitos' }).then((ambitos) => {
  // Extract from ambitos the "desc_ambito", and assign it to "id_ambito" to dimAmbitos
  for (let i = 0; i < ambitos.length; i++) {
    dimAmbitos[ambitos[i].id_ambito] = ambitos[i].desc_ambito;
  }
  assistantPrompt = basePrompt + `\n{${dimAmbitos.join(", ")}}`;
}).catch(error => console.error(error));

function getAssistantPrompt() {
  return assistantPrompt;
}

//----------------------------------------------

// <-- Uncomment to test the data retrieval -->
//dataTest(['dim_comunas', 'dim_abogados', 'ft_ambitos', 'ft_comunas', 'ft_solicitudes']);

//----------------------------------------------


async function processForm(formData, response) {
  // Extract tags using a regular expression
  let cleanResponse = parseResponse(response);

  let aiAmbitosIds = [];
  if (cleanResponse) {
    try {
      let aiAmbitos = [];
      // Split the matched group by commas to get individual tags
      aiAmbitos = cleanResponse.split(',').map(tag => tag.trim());

      // Convert the tags to their corresponding IDs
      aiAmbitosIds = aiAmbitos.map(tag => dimAmbitos.indexOf(tag));
      console.log("Ambitos:", aiAmbitos)

      // Remove any tags that were not found (IDs < 0)
      aiAmbitosIds = aiAmbitosIds.filter(id => id >= 0);
      console.log("Ambitos IDs:", aiAmbitosIds);

      // Remove those aiAmbitos that were not found based on the IDs
      aiAmbitos = aiAmbitosIds.map(id => dimAmbitos[id]);
      console.log("Ambitos found:", aiAmbitos);

      // Get the Territorio ID
      const regionData = await databaseGet({ table: 'dim_comunas', desc_region: formData.Region });
      let idTerritorio = regionData ? regionData[0].id_region : 13; // Default to "Metropolitana" if not found
      console.log("Territorio:", formData.Region,"|| Id:", regionData ? regionData[0].id_region : null);

      // Get the abogados that match the tags (ft_ambitos)
      const abogados = await databaseGet({ table: 'ft_ambitos', id_ambito: aiAmbitosIds });
      
      // Extract the abogados IDs from the matching tags
      let abogadosIds = abogados.map(abogado => abogado.rut);
      // Remove duplicates from the abogados IDs
      abogadosIds = [...new Set(abogadosIds)];

      const dataMatch = {
        rut: abogadosIds,
        territorio: idTerritorio,
        //comuna: formData.Comuna, // Not implemented yet since Abogados don't have a comuna defined
      };

      // Get the abogados names from the IDs
      let abogadosData = await databaseGet({ table: 'dim_abogados', ...dataMatch });

      if (!abogadosData || !abogadosData.length) {
        // No abogados found in that region, try again in Region 13 (Metropolitana), unless that was the region already
        if (idTerritorio !== 13) {
          console.log("No abogados found in", formData.Region, "trying in Metropolitana...");
          dataMatch.territorio = 13;
          abogadosData = await databaseGet({ table: 'dim_abogados', ...dataMatch });
        }
        // If even then we find no abogados, try with the whole country (no territorio defined)
        if (!abogadosData || !abogadosData.length) {
          console.log("No abogados found in Metropolitana, trying in whole country...");
          delete dataMatch.territorio;
          abogadosData = await databaseGet({ table: 'dim_abogados', ...dataMatch });
        }
        // If even then we can't find an abogado, return false
        if (!abogadosData || !abogadosData.length) {
          console.log("No abogados found in whole country, giving up...");
          return false;
        }
      }

      // Extract the abogados names from the data
      const abogadosNombres = abogadosData.map(abogado => abogado.nombres);
      console.log("Abogados matching tags:", abogadosNombres);

      // Make a list of the abogados with their respective ambitos
      let abogadosAmbitosRet = [];
      for (let i = 0; i < abogadosData.length; i++) {
        const abogado = abogadosData[i];
        const ambitos = await databaseGet({ table: 'ft_ambitos', rut: abogado.rut });
        const ambitosDesc = ambitos.map(ambito => dimAmbitos[ambito.id_ambito]);
        abogadosAmbitosRet.push({ nombre: abogado.nombres, ambitos: ambitosDesc });
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

module.exports = { databaseStore, databaseGet, processForm, getAssistantPrompt };