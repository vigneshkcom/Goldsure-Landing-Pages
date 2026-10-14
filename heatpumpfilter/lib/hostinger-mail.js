'use strict';

var HOSTINGER_MAIL_API_BASE = 'https://api.mail.hostinger.com/api/v1/mailboxes';

function hasHostingerMailConfig() {
  return Boolean(process.env.HOSTINGER_MAILBOX_RESOURCE_ID && process.env.HOSTINGER_MAIL_API_TOKEN);
}

async function sendHostingerMail(message) {
  var mailboxResourceId = process.env.HOSTINGER_MAILBOX_RESOURCE_ID;
  var apiToken = process.env.HOSTINGER_MAIL_API_TOKEN;
  if (!mailboxResourceId || !apiToken) {
    var configError = new Error('Hostinger Mail API credentials are not configured.');
    configError.code = 'HOSTINGER_MAIL_NOT_CONFIGURED';
    throw configError;
  }

  var response = await fetch(HOSTINGER_MAIL_API_BASE + '/' + encodeURIComponent(mailboxResourceId) + '/send', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + apiToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to: [message.to],
      displayName: 'Goldsure Pty Ltd',
      subject: message.subject,
      text: message.text,
      html: message.html
    })
  });

  if (!response.ok) {
    var sendError = new Error('Hostinger Mail send failed with status ' + response.status);
    sendError.status = response.status;
    throw sendError;
  }

  return { status: response.status };
}

module.exports = {
  hasHostingerMailConfig: hasHostingerMailConfig,
  sendHostingerMail: sendHostingerMail
};
