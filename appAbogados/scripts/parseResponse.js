function parseResponse(response) {

  // Replace START and END with { and } characters
  response = response.replace("START", "{");
  response = response.replace("END", "}");

  // For some reason (sometimes), the AI now returns with ``` at the start and end of the response instead of the { and } characters
  response = response.replace(/```(\r\n|\r|\n)/, '{');
  response = response.replace(/(\r\n|\r|\n)```/, '}');

  // Remove any possible line breaks
  response = response.replace(/(\r\n|\r|\n)/g, '');
  
  // Extract tags using a regular expression (They will look like {tag1, tag2, tag3}, or simply {tag1})
  let match = response.match(/\{(.+?)\}/);
  return match ? match[1] : null;
}

module.exports = { parseResponse };