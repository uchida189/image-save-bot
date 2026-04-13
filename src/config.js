var APP_TIME_ZONE = 'Asia/Tokyo';
var GENERATION_OFFSET_YEAR = 1980;

var SCRIPT_PROPERTY_KEYS = {
  DRIVE_ROOT_FOLDER_ID: 'DRIVE_ROOT_FOLDER_ID',
  SLACK_BOT_TOKEN: 'SLACK_BOT_TOKEN',
};

function getDriveRootFolderId_() {
  return getRequiredScriptProperty_(SCRIPT_PROPERTY_KEYS.DRIVE_ROOT_FOLDER_ID);
}

function getSlackBotToken_() {
  return getRequiredScriptProperty_(SCRIPT_PROPERTY_KEYS.SLACK_BOT_TOKEN);
}

function getRequiredScriptProperty_(key) {
  var value = PropertiesService.getScriptProperties().getProperty(key);

  if (!value) {
    throw new Error('Missing required script property: ' + key);
  }

  return value;
}
