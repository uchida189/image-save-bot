function saveSlackImageToDrive_(file, channel) {
  var rootFolder = DriveApp.getFolderById(getDriveRootFolderId_());
  var generationFolder = getOrCreateChildFolder_(rootFolder, getGenerationFolderName_(new Date()));
  var channelFolder = getOrCreateChildFolder_(generationFolder, getChannelFolderName_(channel));
  var fileName = buildDriveFileName_(file);
  var existingFiles = channelFolder.getFilesByName(fileName);

  if (existingFiles.hasNext()) {
    var existingFile = existingFiles.next();

    return {
      status: 'skipped_duplicate',
      fileId: existingFile.getId(),
      fileName: fileName,
      folderId: channelFolder.getId(),
      url: existingFile.getUrl(),
    };
  }

  var blob = downloadSlackFileBlob_(file, fileName);
  var driveFile = channelFolder.createFile(blob);

  return {
    status: 'saved',
    fileId: driveFile.getId(),
    fileName: fileName,
    folderId: channelFolder.getId(),
    url: driveFile.getUrl(),
  };
}

function getOrCreateChildFolder_(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return parentFolder.createFolder(folderName);
}

function getChannelFolderName_(channel) {
  var channelName = channel.name || channel.name_normalized || channel.id;

  return sanitizeDriveName_(normalizeKanaForDriveName_(channelName), channel.id);
}

function getGenerationFolderName_(date) {
  var startYear = getGenerationStartYear_(date);
  var generationNumber = startYear - GENERATION_OFFSET_YEAR;

  return formatOrdinal_(generationNumber) + '(' + startYear + '/10/1~)';
}

function getGenerationStartYear_(date) {
  var parts = getDateParts_(date || new Date());

  if (parts.month > 10 || (parts.month === 10 && parts.day >= 1)) {
    return parts.year;
  }

  return parts.year - 1;
}

function getDateParts_(date) {
  var formatted = Utilities.formatDate(date, APP_TIME_ZONE, 'yyyy-M-d');
  var parts = formatted.split('-');

  return {
    year: Number(parts[0]),
    month: Number(parts[1]),
    day: Number(parts[2]),
  };
}

function buildDriveFileName_(file) {
  var createdAt = file.created ? new Date(Number(file.created) * 1000) : new Date();
  var timestamp = Utilities.formatDate(createdAt, APP_TIME_ZONE, 'yyyyMMdd-HHmmss');
  var slackFileId = sanitizeDriveName_(file.id, 'slack-file');
  var originalName = sanitizeDriveName_(file.name || file.title || slackFileId, slackFileId);

  return timestamp + '_' + slackFileId + '_' + originalName;
}

function sanitizeDriveName_(value, fallback) {
  var text = String(value || '').trim();

  if (!text) {
    return fallback;
  }

  text = text.replace(/[\\/\x00-\x1f\x7f]+/g, '_');
  text = text.replace(/\s+/g, ' ');
  text = text.trim();

  return text || fallback;
}

function normalizeKanaForDriveName_(value) {
  var text = String(value || '');

  if (typeof text.normalize !== 'function') {
    return text;
  }

  return text.replace(/[\uff61-\uff9f]+/g, function (kana) {
    return kana.normalize('NFKC');
  });
}

function formatOrdinal_(number) {
  var rem100 = number % 100;

  if (rem100 >= 11 && rem100 <= 13) {
    return number + 'th';
  }

  switch (number % 10) {
    case 1:
      return number + 'st';
    case 2:
      return number + 'nd';
    case 3:
      return number + 'rd';
    default:
      return number + 'th';
  }
}
