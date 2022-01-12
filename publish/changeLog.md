### 新增

- 新增 Scheme URL 支持，同时发布lx-music-script项目配合使用（一个油猴脚本，可以在浏览器中的官方平台网页直接调用LX Music），Scheme URL的调用说明看Readme.md文档的Scheme URL支持部分
- 新增启动参数`-proxy-server`与`-proxy-bypass-list`，详细介绍看Readme.md文档的启动参数部分

### 优化

- 为可视化音频的频谱整体添加频谱均值加成，使频谱显示更有节奏感
- 优化程序初始化逻辑，修复无网络的情况下的初始化问题

### 修复

- 修复代理不生效的问题
- 修复`openDevTools`选项无效的问题

### 其他

- 更新 Electron 到 v13.6.7
