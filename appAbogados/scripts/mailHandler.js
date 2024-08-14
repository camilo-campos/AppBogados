const sgMail = require('@sendgrid/mail');
const { JSDOM } = require('jsdom');  // Import jsdom to manipulate HTML
const fs = require('fs');
const path = require('path');

sgMail.setApiKey("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");

// Helper function to convert camelCase to kebab-case
function camelCaseToKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

async function sendEmail(to, from, subject, placeholders = {}, htmlFilePath = '') {
  let htmlTemplate = '';

  const resolvedHtmlFilePath = path.resolve(__dirname, htmlFilePath);

  if (htmlFilePath) {
    try {
      // Read the HTML template file
      htmlTemplate = fs.readFileSync(resolvedHtmlFilePath, 'utf-8');
    } catch (error) {
      console.error('Error reading HTML template file:', error);
      return;
    }
  }

  if (htmlTemplate) {
    // Parse the HTML template
    const dom = new JSDOM(htmlTemplate);
    const document = dom.window.document;

    // Loop through the placeholders object and replace content
    for (const [key, value] of Object.entries(placeholders)) {
      const kebabCaseKey = camelCaseToKebabCase(key);
      const placeholderElements = document.querySelectorAll(`.${kebabCaseKey}`);
      placeholderElements.forEach(element => {
        element.textContent = value;
      });
    }

    // Serialize the updated DOM back to HTML
    htmlTemplate = dom.serialize();
  }

  const msg = {
    to: to,
    from: from,
    subject: subject,
    text: placeholders.phMessage || '', // Use a default text or one from placeholders
    html: htmlTemplate, // Use the final HTML content
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);

    if (error.response) {
      console.error('Error response:', error.response.body);
    }
  }
};

module.exports = { sendEmail };