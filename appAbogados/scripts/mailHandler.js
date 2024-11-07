const sgMail = require('@sendgrid/mail');
const { JSDOM } = require('jsdom');  // Import jsdom to manipulate HTML
const fs = require('fs');
const path = require('path');

sgMail.setApiKey("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");

// Helper function to convert camelCase to kebab-case
function camelCaseToKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

async function sendEmail(to, from, subject, placeholders = {}, htmlFilePath = '', list = [], attachments = []) {
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

    // Handle the list argument to dynamically create a table in the HTML
    if (list.length > 0 && typeof list[0] === 'object') {
      const tablePlaceholderElement = document.querySelector('.ph-lista');
      if (tablePlaceholderElement) {
        const tableElement = document.createElement('table'); // Create a new <table> element
        tableElement.style.width = '100%';
        tableElement.setAttribute('border', '1');
        tableElement.classList.add('dynamic-content'); // Add class if needed

        // Create table header
        const theadElement = document.createElement('thead');
        const headerRow = document.createElement('tr');
        Object.keys(list[0]).forEach(key => {
          const thElement = document.createElement('th');
          thElement.textContent = key; // Use the object key as column name
          headerRow.appendChild(thElement);
        });
        theadElement.appendChild(headerRow);
        tableElement.appendChild(theadElement);

        // Create table body
        const tbodyElement = document.createElement('tbody');
        list.forEach(item => {
          const rowElement = document.createElement('tr');
          Object.values(item).forEach(value => {
            const tdElement = document.createElement('td');
            tdElement.textContent = value; // Set the text content of the <td> to the value
            rowElement.appendChild(tdElement);
          });
          tbodyElement.appendChild(rowElement);
        });
        tableElement.appendChild(tbodyElement);

        // Clear the placeholder text
        tablePlaceholderElement.textContent = '';

        // Append the new table after clearing placeholder content
        tablePlaceholderElement.appendChild(tableElement);
      }
    }

    // Insert the image as an inline image using the cid (Content-ID)
    if (attachments && attachments.length > 0) {
      attachments.forEach((attachment, index) => {
        if (attachment.content_id && attachment.type.includes('image')) {
          // If an attachment has a content ID (cid), add an <img> tag to reference it in the HTML
          const imgElement = document.createElement('img');
          imgElement.src = `cid:${attachment.content_id}`;
          imgElement.alt = `Attachment ${index + 1}`;
          imgElement.style.display = 'block';
          imgElement.style.marginTop = '20px';
          imgElement.style.width = '100%';
          
          const footerElement = document.querySelector('footer');
          if (footerElement) {
            footerElement.insertAdjacentElement('afterend', imgElement);
          }
        }
      });
    }

    // Serialize the updated DOM back to HTML
    htmlTemplate = dom.serialize();
  }

  const msg = {
    to: to,
    from: from,
    subject: subject,
    text: placeholders.phText || '', // We should get an error if no text is provided, leave this like this so we can debug it
    html: htmlTemplate, // Use the final HTML content
    attachments: attachments,
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent [${to}]`);
  } catch (error) {
    console.error('Error sending email:', error);

    if (error.response) {
      console.error('Error response:', error.response.body);
    }
  }
};

module.exports = { sendEmail };
