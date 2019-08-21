<p align="center"><a href="https://github.com/lyswhut/lx-music-desktop"><img width="200" src="https://github.com/lyswhut/lx-music-desktop/blob/master/doc/images/icon.png" alt="lx-music logo"></a></p>

<p align="center">
  <a href="https://github.com/lyswhut/lx-music-desktop/releases"><img src="https://img.shields.io/github/release/lyswhut/lx-music-desktop" alt="Release version"></a>
  <a href="https://ci.appveyor.com/project/lyswhut/lx-music-desktop"><img src="https://ci.appveyor.com/api/projects/status/flrsqd5ymp8fnte5?svg=true" alt="Build status"></a>
  <a href="https://github.com/lyswhut/lx-music-desktop/releases"><img src="https://img.shields.io/github/downloads/lyswhut/lx-music-desktop/latest/total" alt="Downloads"></a>
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

一个基于 Electron + Vue 开发的 Windows 版音乐软件。

所用技术栈：

- Electron 6.x
- Vue 2.x

软件变化请查看：[更新日志](https://github.com/lyswhut/lx-music-desktop/blob/master/CHANGELOG.md)<br>
软件下载请转到：[发布页面](https://github.com/lyswhut/lx-music-desktop/releases)

其他说明：TODO

#### 关于软件更新

软件启动时若发现新版本时会自动从本仓库下载安装包，下载完毕会弹窗提示更新。<br>
若下载未完成时软件被关闭，下次启动软件会再次自动下载。<br>
目前暂未添加跳过更新某个版本的功能。<br>

### 源码使用方法

环境要求：Node.js 12.x

```bash
# 开发模式
npm run dev

# 构建免安装版
npm run pack:dir

# 构建安装包
npm run pack

```

### UI界面

<p><a href="https://github.com/lyswhut/lx-music-desktop"><img width="100%" src="https://github.com/lyswhut/lx-music-desktop/blob/master/doc/images/app.png" alt="lx-music UI"></a></p>

### 致谢

感谢 [@messoer](https://github.com/messoer) 提供的部分音乐API！

### 许可证

[Apache License 2.0](https://github.com/lyswhut/lx-music-desktop/blob/master/LICENSE)
