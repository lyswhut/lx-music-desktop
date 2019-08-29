<p align="center"><a href="https://github.com/lyswhut/lx-music-desktop"><img width="200" src="https://github.com/lyswhut/lx-music-desktop/blob/master/doc/images/icon.png" alt="lx-music logo"></a></p>

<p align="center">
  <a href="https://github.com/lyswhut/lx-music-desktop/releases"><img src="https://img.shields.io/github/release/lyswhut/lx-music-desktop" alt="Release version"></a>
  <a href="https://ci.appveyor.com/project/lyswhut/lx-music-desktop"><img src="https://ci.appveyor.com/api/projects/status/flrsqd5ymp8fnte5?svg=true" alt="Build status"></a>
  <a href="https://travis-ci.org/lyswhut/lx-music-desktop"><img src="https://travis-ci.org/lyswhut/lx-music-desktop.svg?branch=master" alt="Build status"></a>
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

- Electron 6.x
- Vue 2.x

已支持的平台：

- Windows 7 及以上
- Mac OS
- Linux

软件变化请查看：[更新日志](https://github.com/lyswhut/lx-music-desktop/blob/master/CHANGELOG.md)<br>
软件下载请转到：[发布页面](https://github.com/lyswhut/lx-music-desktop/releases)<br>
或者到网盘下载（网盘内有MAC、windows版）：`https://www.lanzous.com/b906260/` 密码：`glqw`

#### 关于软件更新

软件启动时若发现新版本时会自动从本仓库下载安装包，下载完毕会弹窗提示更新。<br>
若下载未完成时软件被关闭，下次启动软件会再次自动下载。<br>
目前暂未添加跳过更新某个版本的功能。<br>
注意：**绿色版**的软件更新功能**不可用**，为了能及时地获取更新，建议使用安装版！！<br>
注意：**Mac版**、**Linux deb**版不支持自动更新！

#### TODO

- [ ] 新增拉取各大平台歌单
- [ ] 新增聚合搜索

### 源码使用方法

环境要求：Node.js 12.x

```bash
# 开发模式
npm run dev

# 构建免安装版
npm run pack:dir

# 构建安装包（windows版）
npm run pack

```

### UI界面

<p><a href="https://github.com/lyswhut/lx-music-desktop"><img width="100%" src="https://github.com/lyswhut/lx-music-desktop/blob/master/doc/images/app.png" alt="lx-music UI"></a></p>

### 致谢

感谢 [@messoer](https://github.com/messoer) 提供的部分音乐API！

### 免责声明

本项目**不开发或者破解直接获取音频数据**的功能，所有音频数据均来自**第三方接口**！<br>
本软件仅用于**测试 `electron 6.x` 在各种系统上的兼容性**及用于**对比各大音乐平台歌单、排行榜等数据列表的差异性**，使用本软件产生的**任何涉及版权相关的数据**请于**24小时内删除**。<br>
使用本软件所造成的的后果由使用者承担！

### 许可证

[Apache License 2.0](https://github.com/lyswhut/lx-music-desktop/blob/master/LICENSE)
