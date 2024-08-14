function ambitosFilter(cleanResponse, dimAmbitos) {

  let aiAmbitos = [];
  let aiAmbitosIds = [];
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

  return aiAmbitosIds;
}

module.exports = { ambitosFilter };