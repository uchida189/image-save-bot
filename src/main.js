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
  if (event.type !== 'file_shared' && !isSlackMessageFileShareEvent_(event)) {
    return {
      status: 'ignored_event',
      eventType: event.type || 'unknown',
      eventSubtype: event.subtype || null,
    };
  }

  return handleSlackFileShareEvent_(event);
}

function handleSlackFileShareEvent_(event) {
  var channelId = event.channel_id || event.channel;
  var fileIds = getSlackFileIdsFromEvent_(event);

  if (!channelId) {
    throw new Error('Slack file share event did not include channel_id');
  }

  if (fileIds.length === 0) {
    return {
      status: 'ignored_no_files',
      channelId: channelId,
    };
  }

  var channel = getSlackConversationInfo_(channelId);

  if (!isPublicSlackChannel_(channel)) {
    console.log('Ignored non-public channel: ' + channelId);

    return {
      status: 'ignored_non_public_channel',
      channelId: channelId,
      fileCount: fileIds.length,
    };
  }

  var results = fileIds.map(function (fileId) {
    return saveSlackFileIfImage_(fileId, channel);
  });

  var result = {
    status: 'processed_files',
    channelId: channelId,
    fileCount: fileIds.length,
    results: results,
  };

  console.log(JSON.stringify(result));

  return result;
}

function saveSlackFileIfImage_(fileId, channel) {
  var file = getSlackFileInfo_(fileId);

  if (!isSlackImageFile_(file)) {
    console.log('Ignored non-image Slack file: ' + fileId + ' ' + (file.mimetype || 'unknown'));

    return {
      status: 'ignored_non_image',
      fileId: fileId,
      mimetype: file.mimetype || null,
    };
  }

  return saveSlackImageToDrive_(file, channel);
}

function isSlackMessageFileShareEvent_(event) {
  return Boolean(event && event.type === 'message' && event.subtype === 'file_share');
}

function getSlackFileIdsFromEvent_(event) {
  var fileIds = [];

  addSlackFileId_(fileIds, event.file_id);

  if (event.file) {
    addSlackFileId_(fileIds, event.file.id);
  }

  if (Array.isArray(event.files)) {
    event.files.forEach(function (file) {
      addSlackFileId_(fileIds, file && file.id);
    });
  }

  return uniqueValues_(fileIds);
}

function addSlackFileId_(fileIds, fileId) {
  if (fileId) {
    fileIds.push(String(fileId));
  }
}

function uniqueValues_(values) {
  var seen = {};

  return values.filter(function (value) {
    if (seen[value]) {
      return false;
    }

    seen[value] = true;
    return true;
  });
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
