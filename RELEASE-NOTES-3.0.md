# discord-qq-bridge 3.0

## discord-qq-bridge 3.0.0

### Changes since discord-qq-bridge 3.0.0-beta

* Support dropdown menu for Discord webhook / add enable property for relay bridge
* Support dropdown menu for Discord webhook
* Improve Discord and Tencent QQ reply functionality
* Fix forward message from Tencent QQ didn't detect whether there are reply messages
* Fix exception handling by add catch for message relay
* Dependency: Upgrade MCL (Mirai Console Loader)
* Update Mirai configuration
* Update package.json

## discord-qq-bridge 3.0.0-beta

### Changes since discord-qq-bridge 2.0.5

* Support @everyone & support display image
* Complete @user and cross-channel @user features
* Complete @user for Discord
* Use new table to save message related data
* Support forward images from Tencent QQ to Discord and Kaiheila
* Support forward images
* Update package.json
* Support configure from control panel for relay bridge
* Fix relay bridge should not send messages without configuration
* CI: Remove node-version 10.x from test scope
* Fix asynchronous relay bridge in Tencent QQ when Kaiheila is not configured
