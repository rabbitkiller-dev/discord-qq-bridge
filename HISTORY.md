Change notes from older releases. For current info, see RELEASE-NOTES-3.1.

# discord-qq-bridge 2.0

## discord-qq-bridge 2.0.5

This is a maintenance release of the discord-qq-bridge 2.0 branch.

### Changes since discord-qq-bridge 2.0.4

* Add file download feature
* (bug #36) Update documentation

## discord-qq-bridge 2.0.4

This is a maintenance release of the discord-qq-bridge 2.0 branch.

### Changes since discord-qq-bridge 2.0.3

* Fix should not update when running

## discord-qq-bridge 2.0.3

This is a maintenance release of the discord-qq-bridge 2.0 branch.

### Changes since discord-qq-bridge 2.0.2

* Remove Koishi files, fix downloadImage closing asynchronously issue
* (bug #28) Fix 1.6.2 report error when running

## discord-qq-bridge 2.0.2

This is a maintenance release of the discord-qq-bridge 2.0 branch.

### Changes since discord-qq-bridge 2.0.1

* Doc: Update README

## discord-qq-bridge 2.0.1

This is a maintenance release of the discord-qq-bridge 2.0 branch.

### Changes since discord-qq-bridge 2.0.0

* Fix cannot forward Tencent QQ reply to Discord
* Add automantic approve for group join requests
* Fix cannot forward Discord to Tencent QQ when the user didn't set avatar

## discord-qq-bridge 2.0.0

### Changes since discord-qq-bridge 1.5.2

* Switch to Mirai and use el-bot

# discord-qq-bridge 1.5

## discord-qq-bridge 1.5.2

This is a maintenance release of the discord-qq-bridge 1.5 branch.

### Changes since discord-qq-bridge 1.5.1

* Remove el-bot related files (move to Git branch el-bot)

## discord-qq-bridge 1.5.1

This is a maintenance release of the discord-qq-bridge 1.5 branch.

### Changes since discord-qq-bridge 1.5.0

* Fix Discord user cannot mention Tencent QQ user

## discord-qq-bridge 1.5.0

### Changes since discord-qq-bridge 1.4.1

* Add control panel, allow messages not being forwarded from Discord channels
* Remove Git file ngx-admin
* Remove bufferutil
* Doc: Update README.md - formatting

# discord-qq-bridge 1.4

## discord-qq-bridge 1.4.1

This is a maintenance release of the discord-qq-bridge 1.4 branch.

### Changes since discord-qq-bridge 1.4.0

* CI: Add koishi.config.t
* Fix user mentions doesn't support Han characters
* Fix Tencent QQ users cannot mention Discord users
* Add el-index.ts use el-bot
* Support el-bot
* Fix el-bot use el.config.ts by @rabbitkiller-dev
* Fix handlerSaveMessage throw error without catch
* Fix URL in messages sent from Discord to Tencent QQ by adding conversion
* Fix messages cannot be forward from Tencent QQ to Discord; fix emoji URLS being converted to short
  URLs
* Fix short URLs being converted in encodeURI but should not

## discord-qq-bridge 1.4.0

### Changes since discord-qq-bridge 1.3.0

* CI: Add unit tests for Koishi (incomplete)
* Support forward GIF and QQ Face messages from Tencent QQ to Discord
* Implement reply messages forward for Tencent QQ and Discord
* Fix forward Discord message to Tencent QQ caused error
* Doc: Update README
* Fix grammar
* Update appearence for user messages forwarded from Discord to Tencent QQ
* Add from property for message.entity
* Add user avatar for messages forwarded from Discord to Tencent QQ
* Fix when Discord reply image messages cannot find corresponding QQ message
* Fix canvas type error
* Fix bridge-discord-to-qq.ts by weizhihua
* Fix GIF replace file name regex error when forward QQ message to Discord
* Preserve message content in the message table, support forward Discord GIF to Tencent QQ, some
  minor adjustments
* No longer fetch image location from go-cqhttp, cache image on self side and detect MIME type
  before sending images to Discord
* Fix cache for Tencent QQ user avatars sent to Discord
* CI: Create test.yml
* Build: Update package-lock.json
* CI: Add koishi.config.ts
* CI: Update test.yml

# discord-qq-bridge 1.3

## discord-qq-bridge 1.3.0

### Changes since discord-qq-bridge 1.2.1

* Fix incorrect dates in log files
* Change username format for messages forwarded from Tencent QQ to Discord

# discord-qq-bridge 1.2

## discord-qq-bridge 1.2.1

This is a maintenance release of the discord-qq-bridge 1.2 branch.

### Changes since discord-qq-bridge 1.2.0

* Update bridge-qq-to-discord.ts
* Update bridge-discord-to-qq.ts
* Update koishi.sample.ts: fix comments
* Support Tencent QQ users to mention Discord users
* Support Discord users to mention Tencent QQ users
* Update bridge-qq-to-discord.ts
* Update bridge-qq-to-discord.ts
* Update bridge-discord-to-qq.ts
* Update README.md: Reconstruct and use webhook messages instead of bot messages to send received
  Tencent QQ messages
* Update README.md: Fix file name in bridge-qq-to-discord.ts

## discord-qq-bridge 1.2.0

### Changes since discord-qq-bridge 1.1.0

* Reconstruct and use webhook messages instead of bot messages to send received Tencent QQ messages
* Fix unsupported Tencent QQ messages won't sent to Discord
* Support send Discord emotions to Tencent QQ
* Support message replies
* Support @ mention
* Fix hard-coded member mention query

# discord-qq-bridge 1.1

## discord-qq-bridge 1.1.0

* Add documentation
* Add support for images
* Change image implementation
* Add QQ user nickname in messages
