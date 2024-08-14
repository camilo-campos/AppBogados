const { databaseGet } = require('./databaseControl');

// Helper function to calculate the distance between two coordinates using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

async function comunaLocator(comunaNameA, comunaNameB, distance = 40) {
  try {
    comunaNameA = comunaNameA ? comunaNameA : 'Santiago';
    comunaNameB = comunaNameB ? comunaNameB : 'Santiago';

    // Retrieve the data from the 'dim_comunas_chile' table
    const comunaDataA = await databaseGet({ table: 'dim_comunas_chile', comuna: comunaNameA });
    const comunaDataB = await databaseGet({ table: 'dim_comunas_chile', comuna: comunaNameB });

    // Check if the data exists for both comunas
    if (!comunaDataA || !comunaDataB) {
      console.error("One or both comunas not found in the database.");
      return false;
    }

    //console.log("Comuna A:", comunaDataA);
    //console.log("Comuna B:", comunaDataB);

    // Extract latitude and longitude for both comunas
    const latA = comunaDataA[0].latitud;
    const lonA = comunaDataA[0].longitud;
    const latB = comunaDataB[0].latitud;
    const lonB = comunaDataB[0].longitud;

    console.log("Cords A:", latA, lonA, "Cords B:", latB, lonB);

    // Calculate the distance between the two comunas
    const actualDistance = calculateDistance(latA / 1e4, lonA / 1e4, latB / 1e4, lonB / 1e4);

    console.log(`Distance between ${comunaNameA} and ${comunaNameB}: ${actualDistance} km`);

    // Return true if the distance is within the specified threshold
    return actualDistance <= distance;
  } catch (error) {
    console.error("Error occurred while locating comunas:", error);
    return false;
  }
}

module.exports = { comunaLocator };
