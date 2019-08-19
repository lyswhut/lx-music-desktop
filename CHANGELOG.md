# lx-music-desktop change log

All notable changes to this project will be documented in this file.

Project versioning adheres to [Semantic Versioning](http://semver.org/).
Commit convention is based on [Conventional Commits](http://conventionalcommits.org).
Change log format is based on [Keep a Changelog](http://keepachangelog.com/).

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
