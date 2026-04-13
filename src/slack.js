function getSlackFileInfo_(fileId) {
  var response = callSlackApi_('files.info', {
    file: fileId,
  });

  if (!response.file) {
    throw new Error('Slack files.info response did not include file: ' + fileId);
  }

  return response.file;
}

function getSlackConversationInfo_(channelId) {
  var response = callSlackApi_('conversations.info', {
    channel: channelId,
  });

  if (!response.channel) {
    throw new Error('Slack conversations.info response did not include channel: ' + channelId);
  }

  return response.channel;
}

function downloadSlackFileBlob_(file, fileName) {
  var downloadUrl = file.url_private_download || file.url_private;

  if (!downloadUrl) {
    throw new Error('Slack file did not include a private download URL: ' + file.id);
  }

  var response = UrlFetchApp.fetch(downloadUrl, {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + getSlackBotToken_(),
    },
    muteHttpExceptions: true,
  });

  var statusCode = response.getResponseCode();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Slack file download failed: ' + statusCode + ' ' + response.getContentText());
  }

  var blob = response.getBlob().setName(fileName);

  if (file.mimetype) {
    blob.setContentType(file.mimetype);
  }

  return blob;
}

function callSlackApi_(method, params) {
  var url = 'https://slack.com/api/' + method + '?' + toQueryString_(params || {});
  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + getSlackBotToken_(),
    },
    muteHttpExceptions: true,
  });
  var statusCode = response.getResponseCode();
  var responseText = response.getContentText();
  var body = parseSlackJsonResponse_(method, responseText);

  if (statusCode < 200 || statusCode >= 300 || !body.ok) {
    throw new Error(
      'Slack API failed: ' + method + ' ' + statusCode + ' ' + (body.error || responseText)
    );
  }

  return body;
}

function parseSlackJsonResponse_(method, responseText) {
  try {
    return JSON.parse(responseText);
  } catch (error) {
    throw new Error('Slack API returned invalid JSON for ' + method + ': ' + responseText);
  }
}

function toQueryString_(params) {
  return Object.keys(params)
    .filter(function (key) {
      return params[key] !== undefined && params[key] !== null;
    })
    .map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(String(params[key]));
    })
    .join('&');
}
