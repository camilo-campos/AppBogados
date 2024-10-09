
async function lawyerVerify(rut = "12345678-9") {
  // Separate the last number of rut into a different variable
  const rutArray = rut.split("-");
  const rutNumbers = rutArray[0];
  const rutVerifier = rutArray[1];

  // Define the webroot if it's not defined globally
  var webroot = 'https://www.pjud.cl/';

  try {
    const response = await fetch(webroot + 'ajax/Lawyers/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        dni: rutNumbers,
        digit: rutVerifier
      })
    });

    const text = await response.text();

    // Check the response to see if the lawyer was found
    if (text.includes("abogados por el rut")) {
      return true; // Lawyer found
    } else {
      return false; // Lawyer not found
    }
  } catch (error) {
    console.error('Error verifying lawyer:', error);
    return false;
  }
}

module.exports = { lawyerVerify };
