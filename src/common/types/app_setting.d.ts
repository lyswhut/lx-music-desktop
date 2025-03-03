import type { I18n } from '../../lang/i18n'

declare global {

  declare namespace LX {
    type AddMusicLocationType = 'top' | 'bottom'

    interface AppSetting {
      version: string

      /**
       * 窗口大小id
       */
      'common.windowSizeId': number

      /**
       * 窗口大小id
       */
      'common.fontSize': number

      /**
       * 是否以全屏启动
       */
      'common.startInFullscreen': boolean

      /**
       * 语言id
       */
      'common.langId': I18n['locale'] | null

      /**
       * api id
       */
      'common.apiSource': string

      /**
       * 音源名称类型，原名、别名
       */
      'common.sourceNameType': 'alias' | 'real'

      /**
       * 显示的字体
       */
      'common.font': string

      /**
       * 是否启用动画
       */
      'common.isShowAnimation': boolean

      /**
       * 是否启用随机弹窗动画
       */
      'common.randomAnimate': boolean

      /**
       * 是否同意软件协议
       */
      'common.isAgreePact': boolean

      /**
       * 控制按钮位置，左边、右边
       */
      'common.controlBtnPosition': 'left' | 'right'

      /**
       * 播放栏进度条样式
       */
      'common.playBarProgressStyle': 'mini' | 'full' | 'middle'

      /**
       * 尝试自动更新
       */
      'common.tryAutoUpdate': boolean

      /**
       * 更新版本后是否显示变更日志
       */
      'common.showChangeLog': boolean

      /**
       * 启动时自动播放歌曲
       */
      'player.startupAutoPlay': boolean

      /**
       * 切歌模式
       */
      'player.togglePlayMethod': 'listLoop' | 'random' | 'list' | 'singleLoop' | 'none'

      /**
       * 优先播放的音质
       */
      'player.playQuality': LX.Quality

      /**
       * 是否显示任务栏进度条
       */
      'player.isShowTaskProgess': boolean


      /**
       * 是否将歌词显示在状态栏
       */
      'player.isShowStatusBarLyric': boolean

      /**
       * 音量大小
       */
      'player.volume': number

      /**
       * 播放歌曲时是否阻止电脑休眠
       */
      'player.powerSaveBlocker': boolean

      /**
       * 是否静音
       */
      'player.isMute': boolean

      /**
       * 播放速率
       */
      'player.playbackRate': number

      /**
       * 是否自动调整音频的音高以补偿对播放速率设置所做的更改
       */
      'player.preservesPitch': boolean

      /**
       * 使用设备能处理的最大声道数输出音频
       */
      'player.isMaxOutputChannelCount': boolean

      /**
       * 音频输出设备id
       */
      'player.mediaDeviceId': string

      /**
       * 是否在音频输出设备更改时暂停播放
       */
      'player.isMediaDeviceRemovedStopPlay': boolean

      /**
       * 是否显示歌词翻译
       */
      'player.isShowLyricTranslation': boolean

      /**
       * 是否显示歌词罗马音
       */
      'player.isShowLyricRoma': boolean

      /**
       * 是否将歌词从简体转换为繁体
       */
      'player.isS2t': boolean

      /**
       * 是否播放卡拉OK歌词
       */
      'player.isPlayLxlrc': boolean

      /**
       * 启动软件时是否恢复上次播放进度
       */
      'player.isSavePlayTime': boolean

      /**
       * 是否启用音频可视化
       */
      'player.audioVisualization': boolean

      /**
       * 定时暂停播放-是否等待歌曲播放完毕再暂停
       */
      'player.waitPlayEndStop': boolean

      /**
       * 定时暂停播放-倒计时时间
       */
      'player.waitPlayEndStopTime': string

      /**
       * 环境音效文件名
       */
      'player.soundEffect.convolution.fileName': string | null

      /**
       * 环境音效原始输出增益
       */
      'player.soundEffect.convolution.mainGain': number

      /**
       * 环境音效输出增益
       */
      'player.soundEffect.convolution.sendGain': number

      /**
       * 均衡器 31hz 值
       */
      'player.soundEffect.biquadFilter.hz31': number

      /**
       * 均衡器 62hz 值
       */
      'player.soundEffect.biquadFilter.hz62': number

      /**
       * 均衡器 125hz 值
       */
      'player.soundEffect.biquadFilter.hz125': number

      /**
       * 均衡器 250hz 值
       */
      'player.soundEffect.biquadFilter.hz250': number

      /**
       * 均衡器 500hz 值
       */
      'player.soundEffect.biquadFilter.hz500': number

      /**
       * 均衡器 1000hz 值
       */
      'player.soundEffect.biquadFilter.hz1000': number

      /**
       * 均衡器 2000hz 值
       */
      'player.soundEffect.biquadFilter.hz2000': number

      /**
       * 均衡器 4000hz 值
       */
      'player.soundEffect.biquadFilter.hz4000': number

      /**
       * 均衡器 8000hz 值
       */
      'player.soundEffect.biquadFilter.hz8000': number

      /**
       * 均衡器 16000hz 值
       */
      'player.soundEffect.biquadFilter.hz16000': number

      /**
       * 3D立体环绕是否启用
       */
      'player.soundEffect.panner.enable': boolean

      /**
       * 3D立体环绕声音距离
       */
      'player.soundEffect.panner.soundR': number

      /**
       * 3D立体环绕速度
       */
      'player.soundEffect.panner.speed': number

      /**
       * 升降声调
       */
      'player.soundEffect.pitchShifter.playbackRate': number

      /**
       * 是否启用音频加载失败时自动切歌
       */
      'player.autoSkipOnError': boolean

      /**
       * 点击相同列表内的歌曲切歌时是否清空已播放列表（随机模式下列表内所有歌曲会重新参与随机）
       */
      'player.isAutoCleanPlayedList': boolean

      /**
       * 播放详情页-是否缩放当前播放的歌词行
       */
      'playDetail.isZoomActiveLrc': boolean

      /**
       * 播放详情页-是否允许通过歌词调整播放进度
       */
      'playDetail.isShowLyricProgressSetting': boolean

      /**
       * 播放详情页-歌词字体大小
       */
      'playDetail.style.fontSize': number

      /**
       * 播放详情页-歌词对齐方式
       */
      'playDetail.style.align': 'center' | 'left' | 'right'

      /**
       * 播放详情页-是否延迟桌面歌词滚动
       */
      'playDetail.isDelayScroll': boolean


      /**
       * 是否启用桌面歌词
       */
      'desktopLyric.enable': boolean

      /**
       * 是否锁定桌面歌词
       */
      'desktopLyric.isLock': boolean

      /**
       * 是在置顶桌面
       */
      'desktopLyric.isAlwaysOnTop': boolean

      /**
       * 是否自动刷新歌词置顶
       */
      'desktopLyric.isAlwaysOnTopLoop': boolean

      /**
       * 是否将歌词进程显示在任务栏
       */
      'desktopLyric.isShowTaskbar': boolean

      /**
       * 是否启用音频可视化
       */
      'desktopLyric.audioVisualization': boolean

      /**
       * 是否在全屏时隐藏歌词
       */
      'desktopLyric.fullscreenHide': boolean

      /**
       * 是否在暂停时隐藏歌词
       */
      'desktopLyric.pauseHide': boolean

      /**
       * 桌面歌词窗口宽度
       */
      'desktopLyric.width': number

      /**
       * 桌面歌词窗口高度
       */
      'desktopLyric.height': number

      /**
       * 桌面歌词窗口x坐标
       */
      'desktopLyric.x': number | null

      /**
       * 桌面歌词窗口y坐标
       */
      'desktopLyric.y': number | null

      /**
       * 是否允许桌面歌词窗口拖出主屏幕之外
       */
      'desktopLyric.isLockScreen': boolean

      /**
       * 是否延迟桌面歌词滚动
       */
      'desktopLyric.isDelayScroll': boolean

      /**
       * 歌词滚动位置
       */
      'desktopLyric.scrollAlign': 'top' | 'center'

      /**
       * 是否在鼠标划过桌面歌词窗口时降低歌词透明度
       */
      'desktopLyric.isHoverHide': boolean

      /**
       * 歌词方向
       */
      'desktopLyric.direction': 'horizontal' | 'vertical'

      /**
       * 歌词对齐方式
       */
      'desktopLyric.style.align': 'center' | 'left' | 'right'

      /**
       * 桌面歌词字体
       */
      'desktopLyric.style.font': string

      /**
       * 桌面歌词字体大小
       */
      'desktopLyric.style.fontSize': number

      /**
       * 歌词间距大小
       */
      'desktopLyric.style.lineGap': number

      /**
       * 桌面歌词未播放字体颜色
       */
      'desktopLyric.style.lyricUnplayColor': string

      /**
       * 桌面歌词已播放字体颜色
       */
      'desktopLyric.style.lyricPlayedColor': string

      /**
       * 桌面歌词字体阴影颜色
       */
      'desktopLyric.style.lyricShadowColor': string

      /**
       * 桌面歌词加粗字体
       */
      // 'desktopLyric.style.fontWeight': boolean

      /**
       * 桌面歌词字体透明度
       */
      'desktopLyric.style.opacity': number

      /**
       * 桌面歌词是否允许换行
       */
      'desktopLyric.style.ellipsis': boolean

      /**
       * 是否缩放当前正在播放的桌面歌词
       */
      'desktopLyric.style.isZoomActiveLrc': boolean

      /**
       * 是否加粗逐字歌词字体
       */
      'desktopLyric.style.isFontWeightFont': boolean

      /**
       * 是否加粗逐行歌词字体
       */
      'desktopLyric.style.isFontWeightLine': boolean

      /**
       * 是否加粗翻译、罗马音字体
       */
      'desktopLyric.style.isFontWeightExtended': boolean

      /**
       * 是否启用双击列表里的歌曲时自动切换到当前列表播放（仅对歌单、排行榜有效）
       */
      'list.isClickPlayList': boolean

      /**
       * 是否显示歌曲来源（仅对我的列表有效）
       */
      'list.isShowSource': boolean

      /**
       * 是否自动恢复列表滚动位置（仅对我的列表有效）
       */
      'list.isSaveScrollLocation': boolean

      /**
       * 添加歌曲到我的列表时的方式
       */
      'list.addMusicLocationType': LX.AddMusicLocationType

      /**
       * 是否显示列表操作按钮列
       */
      'list.actionButtonsVisible': boolean

      /**
       * 是否启用下载功能
       */
      'download.enable': boolean

      /**
       * 按列表名分组保存
       */
      'download.isSavePathGroupByListName': boolean

      /**
       * 下载路径
       */
      'download.savePath': string

      /**
       * 文件命名方式
       */
      'download.fileName': '歌名 - 歌手' | '歌手 - 歌名' | '歌名'

      /**
       * 最大并发下载数
       */
      'download.maxDownloadNum': number

      /**
       * 存在同名文件时跳过下载
       */
      'download.skipExistFile': boolean

      /**
       * 是否下载lrc文件
       */
      'download.isDownloadLrc': boolean

      /**
       * 是否下载翻译歌词文件
       */
      'download.isDownloadTLrc': boolean

      /**
       * 是否下载罗马音歌词文件
       */
      'download.isDownloadRLrc': boolean

      /**
       * 保存lrc时的文本编码格式
       */
      'download.lrcFormat': 'utf8' | 'gbk'

      /**
       * 是否在音频文件中嵌入歌曲封面
       */
      'download.isEmbedPic': boolean

      /**
       * 是否在音频文件中嵌入歌词
       */
      'download.isEmbedLyric': boolean

      /**
       * 是否在音频文件中嵌入翻译歌词
       */
      'download.isEmbedLyricT': boolean

      /**
       * 是否在音频文件中嵌入罗马音歌词
       */
      'download.isEmbedLyricR': boolean

      /**
       * 歌曲源不可用时，是否启用换源下载
       */
      'download.isUseOtherSource': boolean

      /**
       * 主题id
       */
      'theme.id': string

      /**
       * 亮色主题id
       */
      'theme.lightId': string

      /**
       * 暗色主题id
       */
      'theme.darkId': string

      /**
       * 是否显示热门搜索
       */
      'search.isShowHotSearch': boolean

      /**
       * 是否显示搜索历史
       */
      'search.isShowHistorySearch': boolean

      /**
       * 软件启动时是否自动聚焦搜索框
       */
      'search.isFocusSearchBox': boolean

      /**
       * 是否启用代理
       */
      'network.proxy.enable': boolean

      /**
       * 代理服务器地址
       */
      'network.proxy.host': string

      /**
       * 代理服务器端口号
       */
      'network.proxy.port': string

      /**
       * 是否启用托盘
       */
      'tray.enable': boolean

      /**
       * 是否关闭时是否最小化到托盘
       */
      // 'tray.isToTray': boolean

      /**
       * 托盘主题id
       */
      'tray.themeId': number

      /**
       * 同步服务模式
       */
      'sync.mode': 'server' | 'client'

      /**
       * 是否启用同步服务
       */
      'sync.enable': boolean

      /**
       * 同步服务端口号
       */
      'sync.server.port': '23332' | string

      /**
       * 最大备份快照数
       */
      'sync.server.maxSsnapshotNum': number

      /**
       * 同步服务地址
       */
      'sync.client.host': string


      /**
       * 是否启用开放API服务
       */
      'openAPI.enable': boolean

      /**
       * API服务端口号
       */
      'openAPI.port': '23330' | string

      /**
       * 是否绑定到局域网
       */
      'openAPI.bindLan': boolean

      /**
       * 是否在离开搜索界面时自动清空搜索框
       */
      'odc.isAutoClearSearchInput': boolean

      /**
       * 是否在离开搜索界面时自动清空搜索结果列表
       */
      'odc.isAutoClearSearchList': boolean
    }
  }

}
