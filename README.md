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
或者到网盘下载（网盘内有MAC、windows版）：`https://www.lanzous.com/b906260/` 密码：`glqw`<br>
使用常见问题请转至：[常见问题](https://github.com/lyswhut/lx-music-desktop#常见问题)

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

### 常见问题

#### 歌曲无法试听与下载

该问题解决顺序如下：

1. 尝试更新到最新版本
2. 尝试切换其他歌曲（或直接搜索该歌曲），若全部歌曲都无法试听与下载则进行下一步
3. 尝试到设置-接口来源切换到其他接口
4. 尝试切换网络，比如用手机开热点（目前存在某些网络无法访问接口服务器的情况）
5. 若还不行请到这个链接查看详情：<https://github.com/lyswhut/lx-music-desktop/issues/5>
6. 若没有在第5条链接中的第一条评论中看到接口无法使用的说明，则应该是你网络无法访问接口服务器的问题，如果接口有问题我会在那里说明。

#### 软件安装包说明

软件发布页及网盘中有多个类型的安装文件，以下是对这些类型文件的说明：

文件名带 `win_` 的是在Windows系统上运行的版本，<br>
其中安装版（Setup）可自动更新软件，<br>
绿色版（green）为免安装版，自动更新功能不可用；

以 **`.dmg`** 结尾的文件为 MAC 版本；

以 **`.AppImage`**、**`.deb`** 结尾的为 Linux 版本。

带有`x64`的为64位的系统版本，带`x86`的为32位的系统版本；若两个都带有的则为集合版，安装时会自动根据系统位数选择对应的版本安装。

#### 软件更新

软件启动时若发现新版本时会自动从本仓库下载安装包，下载完毕会弹窗提示更新。<br>
若下载未完成时软件被关闭，下次启动软件会再次自动下载。<br>
若还是**更新失败**，可能是无法访问GitHub导致的，这时需要手动更新，即下载最新安装包直接覆盖安装即可。<br>
注意：**绿色版**的软件自动更新功能**不可用**，建议使用安装版！！<br>
注意：**Mac版**、**Linux deb**版不支持自动更新！

#### Windows 7 下界面异常

当 win7 没有开启**透明效果**时界面将会显示异常，开启方法请自行百度。

#### 安装版安装失败，提示应用未安装

对于部分电脑出现安装失败的问题我也不懂什么原因，，可以尝试清理下安装文件，或者重启电脑试试。

#### 缺少`xxx.dll`

这个是电脑缺少某些dll导致的，正常的系统是没有这个问题的，解决办法需自行百度弹出的错误信息看下别人是怎么解决的。

### 致谢

感谢 [@messoer](https://github.com/messoer) 曾经提供的部分音乐API！

### 免责声明

本项目**不开发或者破解直接获取音频数据**的功能，所有音频数据均来自**第三方接口**！<br>
本软件仅用于**测试 `electron 6.x` 在各种系统上的兼容性**及用于**对比各大音乐平台歌单、排行榜等数据列表的差异性**，使用本软件产生的**任何涉及版权相关的数据**请于**24小时内删除**。<br>
本软件仅用于学习交流使用，禁止用于商业用途，使用本软件所造成的的后果由使用者承担！<br>
若对此有疑问请 mail to: lyswhut@qq.com

### 许可证

[Apache License 2.0](https://github.com/lyswhut/lx-music-desktop/blob/master/LICENSE)
