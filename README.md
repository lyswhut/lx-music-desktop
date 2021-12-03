<p align="center"><a href="https://github.com/lyswhut/lx-music-desktop"><img width="200" src="https://github.com/lyswhut/lx-music-desktop/blob/master/doc/images/icon.png" alt="lx-music logo"></a></p>

<p align="center">
  <a href="https://github.com/lyswhut/lx-music-desktop/releases"><img src="https://img.shields.io/github/release/lyswhut/lx-music-desktop" alt="Release version"></a>
  <a href="https://github.com/lyswhut/lx-music-desktop/actions/workflows/release.yml"><img src="https://github.com/lyswhut/lx-music-desktop/workflows/Build/badge.svg" alt="Build status"></a>
  <a href="https://github.com/lyswhut/lx-music-desktop/actions/workflows/beta-pack.yml"><img src="https://github.com/lyswhut/lx-music-desktop/workflows/Build%20Beta/badge.svg" alt="Build status"></a>
  <a href="https://electronjs.org/releases/stable"><img src="https://img.shields.io/github/package-json/dependency-version/lyswhut/lx-music-desktop/dev/electron/master" alt="Electron version"></a>
  <!-- <a href="https://github.com/lyswhut/lx-music-desktop/releases"><img src="https://img.shields.io/github/downloads/lyswhut/lx-music-desktop/latest/total" alt="Downloads"></a> -->
  <a href="https://github.com/lyswhut/lx-music-desktop/tree/dev"><img src="https://img.shields.io/github/package-json/v/lyswhut/lx-music-desktop/dev" alt="Dev branch version"></a>
  <!-- <a href="https://github.com/lyswhut/lx-music-desktop/blob/master/LICENSE"><img src="https://img.shields.io/github/license/lyswhut/lx-music-desktop" alt="License"></a> -->
</p>

<!-- [![GitHub release][1]][2]
[![Build status][3]][4]
[![GitHub Releases Download][5]][6]
[![dev branch][7]][8]
[![GitHub license][9]][10] -->

<!-- [1]: https://img.shields.io/github/release/lyswhut/lx-music-desktop
[2]: https://github.com/lyswhut/lx-music-desktop/releases
[3]: https://ci.appveyor.com/api/projects/status/flrsqd5ymp8fnte5?svg=true
[4]: https://ci.appveyor.com/project/lyswhut/lx-music-desktop
[5]: https://img.shields.io/github/downloads/lyswhut/lx-music-desktop/latest/total
[5]: https://img.shields.io/github/downloads/lyswhut/lx-music-desktop/total
[6]: https://github.com/lyswhut/lx-music-desktop/releases
[7]: https://img.shields.io/github/package-json/v/lyswhut/lx-music-desktop/dev
[8]: https://github.com/lyswhut/lx-music-desktop/tree/dev
[9]: https://img.shields.io/github/license/lyswhut/lx-music-desktop
[10]: https://github.com/lyswhut/lx-music-desktop/blob/master/LICENSE -->

<h2 align="center">洛雪音乐助手桌面版</h2>

### 说明

一个基于 Electron + Vue 开发的音乐软件。

所用技术栈：

- Electron 13
- Vue 3

已支持的平台：

- Windows 7 及以上
- Mac OS
- Linux

软件变化请查看：[更新日志](https://github.com/lyswhut/lx-music-desktop/blob/master/CHANGELOG.md)<br>
软件下载请转到：[发布页面](https://github.com/lyswhut/lx-music-desktop/releases)<br>
或者到网盘下载（网盘内有MAC、windows版）：`https://www.lanzoui.com/b0bf2cfa/` 密码：`glqw`（若链接无法打开请百度：蓝奏云链接打不开）<br>
使用常见问题请转至：[常见问题](https://github.com/lyswhut/lx-music-desktop/blob/master/FAQ.md)

### 源码使用方法

环境要求：Node.js 14+

```bash
# 开发模式
npm run dev

# 构建免安装版
npm run pack:dir

# 构建安装包（Windows版）
npm run pack:win

# 构建安装包（Mac版）
npm run pack:mac

# 构建安装包（Linux版）
npm run pack:linux

```

### UI界面

<p><a href="https://github.com/lyswhut/lx-music-desktop"><img width="100%" src="https://github.com/lyswhut/lx-music-desktop/blob/master/doc/images/app.png" alt="lx-music UI"></a></p>

### 启动参数

目前软件已支持的启动参数如下：

- `-search`  启动软件时自动在搜索框搜索指定的内容，例如：`-search="突然的自我 - 伍佰"`
- `-dha`  禁用硬件加速启动（Disable Hardware Acceleration），窗口显示有问题时可以尝试添加此参数启动（v1.6.0起新增）
- `-dt` 以非透明模式启动（Disable Transparent），对于未开启AERO效果的win7系统可加此参数启动以确保界面正常显示（注：该参数对桌面歌词无效），原来的`-nt`参数已重命名为`-dt`（v1.6.0起重命名）
- `-dhmkh` 禁用硬件媒体密钥处理（Disable Hardware Media Key Handling），此选项将禁用Chromium的Hardware Media Key Handling特性（v1.9.0起新增）
- `-play` 启动时播放指定列表的音乐，参数说明：
  - `type`：播放类型，目前固定为`songList`
  - `source`：播放源，可用值为`kw/kg/tx/wy/mg/myList`，其中`kw/kg/tx/wy/mg`对应各源的在线列表，`myList`为本地列表
  - `link`：要播放的在线列表歌单链接、或ID，source为`kw/kg/tx/wy/mg`之一（在线列表）时必传，举例：`./lx-music-desktop -play="type=songList&source=kw&link=歌单URL or ID"`，注意：如果传入URL时必须对URL进行编码后再传入
  - `name`：要播放的本地列表歌单名字，source为`myList`时必传，举例：`./lx-music-desktop -play="type=songList&source=myList&name=默认列表"`
  - `index`：从列表的哪个位置开始播放，选传，若不传默认播放第一首歌曲，举例：`./lx-music-desktop -play="type=songList&source=myList&name=默认列表&index=2"`


### 常见问题

常见问题已移至：<https://github.com/lyswhut/lx-music-desktop/blob/master/FAQ.md>

### 项目协议

本项目基于 [Apache License 2.0](https://github.com/lyswhut/lx-music-desktop/blob/master/LICENSE) 许可证发行，以下协议是对于 Apache License 2.0 的补充，如有冲突，以以下协议为准。

词语约定：本协议中的“本项目”指洛雪音乐桌面版项目；“使用者”指签署本协议的使用者；“官方音乐平台”指对本项目内置的包括酷我、酷狗、咪咕等音乐源的官方平台统称；“版权数据”指包括但不限于图像、音频、名字等在内的他人拥有所属版权的数据。

1. 本项目的数据来源原理是从各官方音乐平台的公开服务器中拉取数据，经过对数据简单地筛选与合并后进行展示，因此本项目不对数据的准确性负责。
2. 使用本项目的过程中可能会产生版权数据，对于这些版权数据，本项目不拥有它们的所有权，为了避免造成侵权，使用者务必在**24小时**内清除使用本项目的过程中所产生的版权数据。
3. 本项目内的官方音乐平台别名为本项目内对官方音乐平台的一个称呼，不包含恶意，如果官方音乐平台觉得不妥，可联系本项目更改或移除。
4. 本项目内使用的部分包括但不限于字体、图片等资源来源于互联网，如果出现侵权可联系本项目移除。
5. 由于使用本项目产生的包括由于本协议或由于使用或无法使用本项目而引起的任何性质的任何直接、间接、特殊、偶然或结果性损害（包括但不限于因商誉损失、停工、计算机故障或故障引起的损害赔偿，或任何及所有其他商业损害或损失）由使用者负责。
6. 本项目完全免费，且开源发布于 GitHub 面向全世界人用作对技术的学习交流，本项目不对项目内的技术可能存在违反当地法律法规的行为作保证，**禁止在违反当地法律法规的情况下使用本项目**，对于使用者在明知或不知当地法律法规不允许的情况下使用本项目所造成的任何违法违规行为由使用者承担，本项目不承担由此造成的任何直接、间接、特殊、偶然或结果性责任。

若你使用了本项目，将代表你接受以上协议。

音乐平台不易，请尊重版权，支持正版。<br>
若对此有疑问请 mail to: lyswhut+qq.com (请将`+`替换成`@`)
