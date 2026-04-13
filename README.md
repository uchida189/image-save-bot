# image-save-bot

Slackのpublic channelに投稿された画像をGoogle Driveへ保存するGoogle Apps Script botです。

## Setup

1. Node.jsを用意して依存を入れる。

   ```sh
   npm install
   ```

2. Apps Script APIを有効にし、claspにログインする。

   ```sh
   npm run clasp:login
   ```

3. 初回だけApps Scriptプロジェクトを作る。

   ```sh
   npm run clasp:create
   ```

   既存プロジェクトを使う場合はcloneする。

   ```sh
   npm run clasp:clone -- SCRIPT_ID
   ```

   `SCRIPT_ID` はApps Scriptエディタの「プロジェクトの設定」にあるスクリプトID。どちらの方法でも、成功するとリポジトリ直下にローカル用の `.clasp.json` が作られる。

4. Apps ScriptのScript Propertiesに以下を設定する。

   - `SLACK_BOT_TOKEN`: Slack Bot User OAuth Token
   - `SLACK_VERIFICATION_TOKEN`: Slack Events API payloadの `token`。Slackではdeprecated扱いのため任意。未設定なら検証をスキップする
   - `DRIVE_ROOT_FOLDER_ID`: 保存先の親Google DriveフォルダID

5. Apps Scriptへ反映してWeb Appとしてデプロイする。デプロイURLは `/exec` で終わるWeb App URLを使う。

   ```sh
   npm run clasp:push
   npm run clasp:deploy
   ```
   
   上記コマンドでpushできなかったら
   ```sh
   clasp push
   ```

6. Slack AppのEvent SubscriptionsでRequest URLにWeb App URLを設定する。

   - Bot Event: `file_shared`
   - Bot Token Scopes: `files:read`, `channels:read`
   - 対象public channelへBotを参加させる

   Request URL検証で `challenge_failed` が出る場合は、`clasp:push` 後に新しいWeb Appデプロイを作り、その `/exec` URLを設定しているか確認する。

## Behavior

- 保存対象はSlackの `mimetype` が `image/` で始まるファイルだけです。
- 保存先は `45th(2025/10/1~)/channel-name/` の形式です。
- 2026/10/1以降は `46th(2026/10/1~)/channel-name/` になります。
- ファイル名は `yyyyMMdd-HHmmss_<slackFileId>_<originalName>` です。

## Commands

```sh
npm run check
npm run clasp:create
npm run clasp:clone -- SCRIPT_ID
npm run clasp:push
npm run clasp:deploy
npm run clasp:open
```
