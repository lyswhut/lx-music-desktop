# lx-music-desktop change log

All notable changes to this project will be documented in this file.

Project versioning adheres to [Semantic Versioning](http://semver.org/).
Commit convention is based on [Conventional Commits](http://conventionalcommits.org).
Change log format is based on [Keep a Changelog](http://keepachangelog.com/).

## [0.5.2](https://github.com/lyswhut/lx-music-desktop/compare/v0.5.1...v0.5.2) - 2019-09-09

### 新增

- 新增强迫症设置-离开搜索界面时是否清空搜索框
- 设置-关于板块新增常见问题链接
- 歌单左上角的分类按钮添加一个**向下图标**，方便识别该按钮为下拉框（该按钮可选择歌单类型，请自行尝试）

### 优化

- 略微优化最小化按钮字符
- 优化试听列表的加载体验，当歌曲数过多时列表将延迟加载

### 修复

- 修复下载管理的一些Bug

### 移除

- 因接口失效，移除网易云音源，酷狗音源仅支持播放128k音质

## [0.5.1](https://github.com/lyswhut/lx-music-desktop/compare/v0.5.0...v0.5.1) - 2019-09-05

### 新增

- 新增右上角最小化/关闭按钮鼠标滑过符号
- 新增下载列表定位文件按钮

### 修复

- 修复百度源歌单全部分类无法加载的问题
- 修复更新弹窗无法弹出的问题

## [0.5.0](https://github.com/lyswhut/lx-music-desktop/compare/v0.4.0...v0.5.0) - 2019-09-05

### 新增

- 新增**封面嵌入**（默认开启，可到设置-下载设置关闭）
- 新增**歌词下载**（默认关闭，可到设置-下载设置开启）
- 新增单例应用功能（实现软件单开功能，禁止软件多开）

### 优化

- 优化歌单列表动画

### 修复

- 修复歌单无法翻页的问题
- 修复在某些情况下，添加下载歌曲导致下载列表崩溃的问题
- 修复版本更新弹窗Bug
- 修复酷狗歌单推荐歌单出现在其他分类中的Bug

## [0.4.0](https://github.com/lyswhut/lx-music-desktop/compare/v0.3.5...v0.4.0) - 2019-09-04


### 新增

- 新增**歌单**功能，目前支持酷我、酷狗、百度源歌单
- 在设置界面-关于洛雪音乐说明部分新增**最新版网盘下载地址**与**打赏地址**
- 新增酷狗 电音热歌榜、DJ热歌榜
- 新增版本更新超时功能，对于部分无法访问GitHub的用户做更新超时提醒

### 移除

- **注意**：0.4.0以前的版本即将失效，请更新到0.4.0版本

## [0.3.5](https://github.com/lyswhut/lx-music-desktop/compare/v0.3.4...v0.3.5) - 2019-08-30

### 新增

- 新增**测试接口**，该接口同样速度较慢，但软件的大部分功能可用，**请自行切换到该接口**，找接口辛苦，且用且珍惜！

### 优化

- 取消需要刷新URL时windows任务栏进度显示错误状态（现显示为暂停状态）

### 修复

- 修复使用临时接口时在试听列表双击灰色歌曲仍然会进行播放的Bug
- 修复歌词加载Bug

## [0.3.4](https://github.com/lyswhut/lx-music-desktop/compare/v0.3.3...v0.3.4) - 2019-08-29

### 优化

- 减少接口不稳定带来的影响，适当增加请求等待时间

### 修复

- 修复播放过程中URL过期不会刷新URL的问题

## [0.3.3](https://github.com/lyswhut/lx-music-desktop/compare/v0.3.2...v0.3.3) - 2019-08-29

### 修复

- **messoer**的接口已经关闭，暂时切换到临时接口使用，部分功能受限。。。
- 修复设置界面更新出错时仍然显示更新下载中的问题
- 修复手动定位播放进度条时存在偏差的问题
- 屏蔽播放器中没有歌曲时对进度条的点击


## [0.3.2](https://github.com/lyswhut/lx-music-desktop/compare/v0.3.1...v0.3.2) - 2019-08-24

### 新增

- 新增酷狗排行榜其他音质下载

## [0.3.1](https://github.com/lyswhut/lx-music-desktop/compare/v0.3.0...v0.3.1) - 2019-08-24

### 修复

- 修复音量条主题适配

## [0.3.0](https://github.com/lyswhut/lx-music-desktop/compare/v0.2.3...v0.3.0) - 2019-08-24

### 新增

- 新增**MAC**及**Linux**版本（需要的可自行下载）
- 新增音量调整
- 新增任务栏播放进度条控制选项（现在可在设置界面关闭在任务栏显示的播放进度）
- 新增更新出错时的弹窗提示
- 从该版本起，非安装版也会有更新弹窗提醒了，但仍然需要手动下载新版本更新，版本信息可到设置页面查看

### 修复

- 强制把临时接口设置回 `messoer` 接口

## [0.2.3](https://github.com/lyswhut/lx-music-desktop/compare/v0.2.2...v0.2.3) - 2019-08-22

### 新增

- 新增任务栏程序标题改变功能（播放歌曲时任务栏标题将显示当前播放的歌曲）

### 修复

- 使用临时接口时，试听列表中的下载按钮仍然能点击的Bug
- 修复某些情况下歌曲链接未能缓存的问题

### 移除

- 移除临时接口（因服务器被攻击，本接口已关闭）
- 移除列表栏设置的隐藏专辑栏选项（感觉这个设置并没有什么luan用，并且还会打破布局）

## [0.2.2](https://github.com/lyswhut/lx-music-desktop/compare/v0.2.1...v0.2.2) - 2019-08-21

### 修复

- 修复下载过程中出错重试5次都失败后不会自动开始下一个任务的Bug
- 修复播放到一半URL过期时不会刷新URL直接播放下一首的问题

## [0.2.1](https://github.com/lyswhut/lx-music-desktop/compare/v0.2.0...v0.2.1) - 2019-08-20

### 优化

- 新增歌曲URL存储，当URL无效时才重新获取，以减少接口不稳定的影响

### 修复

- 修复歌曲加载无法加载时自动切换混乱的Bug
- 修复移除列表最后一首歌曲时播放器不停止播放的问题

## [0.2.0](https://github.com/lyswhut/lx-music-desktop/compare/v0.1.6...v0.2.0) - 2019-08-20

### 新增

- 新增**百度音乐**排行榜及其音乐直接试听与下载
- 新增网易云排行榜音乐直接试听与下载（目前仅支持128k音质）
- 新增酷狗排行榜音乐直接试听与下载（目前仅支持128k音质）

### 修复

- 修复更新弹窗历史版本描述多余的换行问题
- 修复歌曲无法播放的情况下歌词仍会播放的问题

## [0.1.6](https://github.com/lyswhut/lx-music-desktop/compare/v0.1.5...v0.1.6) - 2019-08-19

### 修复

- 修复列表多选音源限制Bug

## [0.1.5](https://github.com/lyswhut/lx-music-desktop/compare/v0.1.4...v0.1.5) - 2019-08-19

### 新增

- 新增搜索列表批量试听与下载功能
- 新增排行榜列表批量试听与下载功能
- 新增试听列表批量移除与下载功能
- 新增下载列表批量开始、暂停与移除功能

### 优化

- 优化歌曲切换机制

## [0.1.4](https://github.com/lyswhut/lx-music-desktop/compare/v0.1.3...v0.1.4) - 2019-08-18

### 新增

- 新增音乐来源切换，可到设置页面-基本设置 look look !
- 为搜索结果列表添加多选功能。
P.S：暂时没想好多选后的操作按钮放哪...

### 优化

- 重构与改进checkbox组件，使其支持不定选中状态
- 完善上一个版本的http请求封装并切换部分请求到该方法上
- 优化其他一些细节

## [0.1.3](https://github.com/lyswhut/lx-music-desktop/compare/v0.1.2...v0.1.3) - 2019-08-17

### 新增

- 新增win32应用构建

### 修复

- 修复安装包许可协议乱码问题
- **messoer 提供的接口已挂**，暂时切换到临时接口！

### 移除

- 由于messoer接口无法使用，QQ音乐排行榜直接播放/下载功能暂时关闭

## [0.1.2](https://github.com/lyswhut/lx-music-desktop/compare/v0.1.1...v0.1.2) - 2019-08-17

### 修复

- 修复更新弹窗的内容显示问题

## [0.1.1](https://github.com/lyswhut/lx-music-desktop/compare/v0.1.0...v0.1.1) - 2019-08-17

### 新增

- QQ音乐排行榜直接试听与下载（该接口貌似不太稳定，且用且珍惜！）

### 优化

- 优化http请求机制
- 更新关于本软件说明

### 修复

- 修复当上一个歌曲链接正在获取时切换歌曲请求不会取消的问题
- 修复切换歌曲时仍然播放上一首歌曲的问题

## [0.1.0] - 2019-8-16

* 0.1.0版本发布
