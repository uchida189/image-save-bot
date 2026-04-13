function doPost(e) {
  try {
    var payload = parseSlackPayload_(e);

    if (payload.type === 'url_verification') {
      return textResponse_(payload.challenge || '');
    }

    if (payload.type === 'event_callback') {
      handleSlackEvent_(payload.event || {});
    }

    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonResponse_({ ok: true, error: String((error && error.message) || error) });
  }
}

function doGet() {
  return jsonResponse_({
    ok: true,
    service: 'image-save-bot',
  });
}

function handleSlackEvent_(event) {
  if (event.type !== 'file_shared') {
    return {
      status: 'ignored_event',
      eventType: event.type || 'unknown',
    };
  }

  var fileId = event.file_id || (event.file && event.file.id);
  var channelId = event.channel_id || event.channel;

  if (!fileId || !channelId) {
    throw new Error('Slack file_shared event did not include file_id or channel_id');
  }

  var file = getSlackFileInfo_(fileId);

  if (!isSlackImageFile_(file)) {
    console.log('Ignored non-image Slack file: ' + fileId + ' ' + (file.mimetype || 'unknown'));

    return {
      status: 'ignored_non_image',
      fileId: fileId,
      mimetype: file.mimetype || null,
    };
  }

  var channel = getSlackConversationInfo_(channelId);

  if (!isPublicSlackChannel_(channel)) {
    console.log('Ignored non-public channel: ' + channelId);

    return {
      status: 'ignored_non_public_channel',
      fileId: fileId,
      channelId: channelId,
    };
  }

  var result = saveSlackImageToDrive_(file, channel);
  console.log(JSON.stringify(result));

  return result;
}

function parseSlackPayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Request did not include a Slack payload');
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throw new Error('Slack payload was not valid JSON');
  }
}

function isSlackImageFile_(file) {
  return Boolean(file && file.mimetype && file.mimetype.indexOf('image/') === 0);
}

function isPublicSlackChannel_(channel) {
  return Boolean(channel && channel.is_channel === true && channel.is_private !== true);
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function textResponse_(value) {
  return ContentService.createTextOutput(value).setMimeType(ContentService.MimeType.TEXT);
}
