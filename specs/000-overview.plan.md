# Slack画像保存Bot 実装計画

## Summary

- Google Apps Script + claspで、Slack public channelに共有された画像をGoogle Driveへ保存する。
- Slack Events APIは `file_shared` を購読し、GAS Web Appの `doPost(e)` で受ける。
- SlackのURL検証 `url_verification` には `challenge` を返す。
- 保存先は指定Driveルート配下の `45th(2025/10/1~)/チャンネル名/` 形式で自動作成する。2026/10/1以降は `46th(2026/10/1~)/チャンネル名/` になる。

## Key Changes

- clasp用に `package.json` と `src/appsscript.json` を追加する。
- GASコードは `src/main.js`, `src/slack.js`, `src/drive.js`, `src/config.js` に分ける。
- Script Propertiesで以下を設定する。
  - `SLACK_BOT_TOKEN`: Slack Bot User OAuth Token
  - `SLACK_VERIFICATION_TOKEN`: Slack Events API payloadの `token` 検証用
  - `DRIVE_ROOT_FOLDER_ID`: 保存先の親Google DriveフォルダID
- Slack App設定は以下にする。
  - Bot Event: `file_shared`
  - Bot Token Scopes: `files:read`, `channels:read`
  - 対象public channelにはBotを参加させる

## Behavior

- `doPost(e)` はJSON payloadを読む。`type === "url_verification"` なら `challenge` を `text/plain` で返す。
- `type === "event_callback"` かつ inner eventが `file_shared` の場合だけ処理する。それ以外は成功レスポンスだけ返して無視する。
- `files.info` でファイル詳細を取得し、`mimetype` が `image/` で始まるものだけ保存する。
- `conversations.info` で `channel_id` の情報を取得し、`is_channel === true` かつ `is_private !== true` のpublic channelだけ処理する。
- Slackの `url_private_download` を優先し、なければ `url_private` をBearer token付きで取得してDriveに保存する。
- フォルダ名はAsia/Tokyo基準で計算する。10/1以降ならその年を開始年、9/30以前なら前年を開始年にし、世代は `開始年 - 1980` で算出する。
- ファイル名は `yyyyMMdd-HHmmss_<slackFileId>_<元ファイル名>` にする。

## Test Plan

- 自動テストは追加しない。仕様で「テストコードは不要」とされているため、手動確認で進める。
- 手動確認項目:
  - SlackのRequest URL検証が成功する。
  - public channelに画像を投稿すると、`<世代フォルダ>/<チャンネル名>/` に画像が保存される。
  - PDFなど画像以外のファイルは保存されない。
  - private channelまたはDMのイベントは処理されない。
  - 2026/9/30は `45th(2025/10/1~)`、2026/10/1は `46th(2026/10/1~)` になる。

## Assumptions

- 無料・低保守を優先し、DB、キュー、Cloud Run、OAuthインストールフロー、slash command、メタデータ付与は実装しない。
- Driveの保存先ルートは `DRIVE_ROOT_FOLDER_ID` で明示する。未設定時はエラーとしてログに出し、保存しない。
- Slack署名検証はGAS Web Appでリクエストヘッダーを扱いにくいため、初期版ではSlack Events API payloadの `token` で検証する。
- Slack Events APIは3秒以内の応答が推奨されるが、初期版ではGAS内で同期処理する。イベント量が増えて失敗する場合だけ、後続対応として軽量キュー化を検討する。
