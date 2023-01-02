若你更新v2.0.0后，出现之前收藏的歌曲全部丢失或者歌曲无法添加到列表播放的问题，可以按以下方式解决：

1. 根据你的平台类型，进入软件数据目录
   - Windows：`%APPDATA%/lx-music-desktop`
   - Linux：`$XDG_CONFIG_HOME/lx-music-desktop` 或 `~/.config/lx-music-desktop`
   - macOS：`~/Library/Application Support/lx-music-desktop`

2. 进入`LxDatas`目录，退出LX，删除`lx.data.db`文件，再启动软件即可

若以上操作仍然不行，可以加交流群或者在GitHub开issue反馈

### 修复

- 修复无效的歌曲信息导致我的列表数据迁移失败的问题
