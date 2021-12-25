# lx-music-desktop 常见问题

在阅读本常见问题后，仍然无法解决你的问题，请提交issue或者加企鹅群`830125506`反馈（无事勿加，入群先看群公告），反馈时请**注明**已阅读常见问题！

## ~~软件为什么没有桌面歌词与自定义列表功能~~

洛雪音乐的最初定位不是作为播放器开发的，它主要用于**查找歌曲**，软件的播放功能仅用于试听，不建议用作为常用播放器使用。

## 歌曲无法试听与下载

### 所有歌曲都提示 `请求异常😮，可以多试几次，若还是不行就换一首吧。。。`

尝试更换网络，如切换到移动网络，若移动网络还是不行则尝试开关下手机的飞行模式后再试，<br>
若使用家庭网络的话，可尝试将光猫断电5分钟左右再通电联网后播放。

### 提示 `getaddrinfo EAI_AGAIN ...` 或 `无法连接到服务器`

尝试在在浏览器打开这个地址`http://ts.tempmusic.tk`，浏览器显示404是正常的，如果不是404那就证明所在网络无法访问接口服务器。
若网页无法打开或打开来不是404，则可能是DNS的问题，可以尝试以下办法：

1. 将DNS改成自动获取试试（注：改完可能需要清理下系统DNS缓存才生效）
2. 手动把DNS改一下，不要用360的DNS，可以把DNS改成`223.6.6.6`、`8.8.8.8`（注：改完可能需要清理下系统DNS缓存才生效）

改完DNS后可能需要重启软件才生效

### 通用解决方法

尝试按以下顺序解决：

1. 尝试更新到最新版本
2. 尝试切换其他歌曲（或直接搜索该歌曲），若全部歌曲都无法试听与下载则进行下一步
3. 尝试到 设置-音乐来源 切换到其他接口
4. 尝试切换网络，比如用手机开热点（所有歌曲都提示请求异常时可通过此方法解决，或等一两天后再试）
5. 若还不行请到这个链接查看详情：<https://github.com/lyswhut/lx-music-desktop/issues/5>
6. 若没有在第5条链接中的第一条评论中看到接口无法使用的说明，则应该是你网络无法访问接口服务器的问题，如果接口有问题我会在那里说明。

想要知道是不是自己网络的问题可以看看`http://ts.tempmusic.tk`能不能在浏览器打开，浏览器显示404是正常的，如果不是404那就证明所在网络无法访问接口服务器。
若网页无法打开或打来不是404，则应该是DNS的问题，可以尝试以下办法：

1. 将DNS改成自动获取试试
2. 手动把DNS改一下，不要用360的DNS，可以把DNS改成`223.6.6.6`、`8.8.8.8`

## 列表多选

从v0.18.0起，列表多选需要键盘配合，想要多选前需按下`Shift`或`Ctrl`键然后再鼠标点击想要选中的内容即可触发多选机制，其中`Shift`键用于连续选择，`Ctrl`键用于不连续选择，`Ctrl+a`用于快速全选。

- 例子一：想要选中1-5项，则先按下`Shift`键后，鼠标点击第一项，再点击第五项即可完成选择；
- 例子二：想要选中1项与第3项，则先按下`Ctrl`键后，鼠标点击第一项，再点击第三项即可完成选择；
- 例子三：想要选中当前列表的全部内容，键盘先按下`Ctrl`键不放，然后按`a`键，即可完成选择。

用`Shift`或`Ctrl`选择时，鼠标点击未选中的内容会将其选中，点击已选择的内容会将其取消选择，若想全部取消选择，在不按`Shift`或`Alt`键的情况下，随意点击列表里的一项内容即可全部取消选择。(P.S：`Ctrl`键对应Mac OS上的`Command`键)

注：选完后可用鼠标右击弹出右键菜单操作已选的内容

## 播放整个歌单或排行榜

播放在线列表内的歌曲需要将它们都添加到我的列表才能播放，你可以全选列表内的歌曲然后添加到现有列表或者新创建的列表，然后去播放该列表内的歌曲。

从v1.10.0起，你可以右击排行榜名字的弹出菜单中直接播放或收藏整个排行榜的歌曲。

## 无法打开外部歌单

不支持跨源打开歌单，请**确认**你需要打开的歌单平台是否与软件标签所写的**歌单源**对应（不一样的话请通过右上角切换歌单源）；<br>
对于分享出来的歌单，若打开失败，可尝试先在浏览器中打开后，再从浏览器地址栏复制URL地址到软件打开；<br>
或者如果你知道歌单 id 也可以直接输入歌单 id 打开。<br>

注：网易源的“我喜欢”歌单无法在未登录的情况下打开，所以你需要手动创建一个歌单后将“我喜欢”里的歌曲移动到该歌单打开

### 打开网易源“我喜欢”歌单

由于网易源的“我喜欢”歌单需要登录才能打开，从v1.13.0起提供了可以以注入token的方式打开网易源“我喜欢”歌单的功能，现若想要打开此类歌单，需要在歌单链接或id后面拼上 `###` 再加上有效的token，拼接格式：`[id|url]###token`，例子（最后面的xxxxxx替换成你的token）：
- `https://music.163.com/#/playlist?id=11332&userid=123456###xxxxxx`
- `11332###xxxxxx`

即：将 `歌单链接或者歌单ID`、`###`、`token` 这三者拼到一起。

#### `token`的获取方法

**注：`token`是你账号的临时身份令牌，不要随便泄露给他人**<br>
在浏览器打开登录网易云音乐并**登录**后，按`F12`，此时将会打开开发者窗口，然后按你使用的浏览器操作：

##### Chrome、360、QQ等浏览器

这些浏览器打开此窗口时界面可能是中文也可能是英文，英文的话按括号里的来

1. 点击窗口顶部`应用程序(application)`
2. 展开左侧 `Cookies`
3. 点击 `https://music.163.com`
4. 在右侧窗口找到 `名称(Name)` 为 `MUSIC_U` 的这行，这行的第二列（`值(Value)`）内的那串内容就是`token`，双击它进入编辑状态，然后按`ctrl + c`键就可以将它复制

##### 火狐浏览器

1. 点击窗口顶部`存储`
2. 展开左侧 `Cookie`
3. 点击 `https://music.163.com`
4. 在右侧窗口找到 `名称` 为 `MUSIC_U` 的这行，这行的最后一列（`值`）内的那串内容就是`token`，双击它进入编辑状态，然后按`ctrl + c`键就可以将它复制

## 更新已收藏的在线歌单

该功能仅对直接从歌单详情页点“收藏”按钮收藏的歌单有效，可右击已收藏的列表名从弹出的菜单中选择“更新”使用该功能，

需要注意的是：这将会覆盖本地的目标列表，歌曲将被替换成最新的在线列表。


## 同步功能的使用（实验性，首次使用前建议先备份一次列表）

**注意：由于同步传输时的数据是明文传输，请在受信任的网络下使用此功能！**<br>
此功能需要配合移动端使用，PC端与移动端处在同一个局域网（路由器的网络）下时，可以多端实时同步歌曲列表，使用方法：

1. 在PC端的设置-数据同步开启同步功能（这时如果出现安全软件、防火墙等提示网络连接弹窗时需要点击允许）
2. 在移动端的设置-同步-同步服务器地址输入PC端显示的同步服务器地址（如果显示可以多个，则输入与**移动端上显示的本机地址**最相似的那个），端口号与PC端的同步端口一致（**输入完毕后需要按一下键盘上的回车键使输入的内容生效**）
3. 输入完这两项后点击“启动同步”
4. 若连接成功，对于首次同步时，若两边的设备的列表不为空，则PC端会弹出选择列表同步方式的弹窗，同步方式的说明弹窗下面有介绍

#### 关于同步弹窗的说明

对于首次同步时，若两边的设备的列表不为空，则PC端会弹出选择列表同步方式的弹窗，此弹窗内的同步方式仅针对**首次同步**，<br>
第一次同步成功后，以后再同步时将会自动根据两边设备的列表内容合并同步，不信你可以在同步完成后断开两边的连接，然后在两边增删一些歌曲或列表后再同步试试看~😉

#### 连接同步服务失败的可能原因

- 此功能需要PC端与移动端都连接在同一个路由器下的网络才能使用
- 检查防火墙是否拦截了PC端的服务端口
- 路由器若开启了AP隔离，则此功能无法使用

#### 连接同步服务失败的检查

1. 确保PC端的同步服务已启用成功（若连接码、同步服务地址没有内容，则证明服务启动失败，此时看启用同步功能复选框后面的错误信息自行解决，另外若你不知道端口号是什么意思就不要乱改，或不要改得太大与太小）
2. 在手机浏览器地址栏输入`http://x.x.x.x:23332/hello` **（注：将`x.x.x.x`换成PC端显示的同步服务地址，`23332`为PC端的端口号）** 后回车，若此地址可以打开并显示 `Hello~::^-^::`则证明移动端与PC端网络已互通，
3. 若移动端无法打开第2步的地址，则在PC端的浏览器地址栏输入并打开该地址，若可以打开，则要么是被LX Music PC端被电脑防火墙拦截，要么PC端与移动端不在同一个网络下，或者路由器开启了AP隔离（一般在公共网络下会出现这种情况）

## 界面异常（界面显示不完整）

### Windows 7 下界面异常

由于软件默认使用了透明窗口，根据Electron官方文档的[说明](https://electronjs.org/docs/api/frameless-window#%E5%B1%80%E9%99%90%E6%80%A7)：
> 在 windows 操作系统上, 当 DWM 被禁用时, 透明窗口将无法工作。

因此，当 win7 没有使用**Aero**主题时界面将会显示异常，开启AERO的方法请自行百度：`win7开启Aero效果`（开启后可看到任务栏变透明）。<br>
从`0.14.0`版本起不再强制要求开启透明效果，若你实在不想开启（若非电脑配置太低，墙裂建议开启！），可通过添加运行参数`-dt`来运行程序即可，例如：`.\lx-music-desktop.exe -dt`，添加方法可自行百度“给快捷方式加参数”，该参数的作用是用来控制程序是否使用非透明窗口运行。

注：启用**Aero**主题后，若软件出现黑边框，则重启软件即可恢复正常。

对于一些完全无法正常显示界面、开启了AERO后问题仍未解决的情况，请阅读下面的 **Window 7 下软件启动后，界面无法显示** 解决。

### Linux 下界面异常

根据Electron里issue的[解决方案](https://github.com/electron/electron/issues/2170#issuecomment-736223269)，<br>
若你遇到透明问题可尝试添加启动参数 `-dha` 来禁用硬件加速，例如：`.\lx-music-desktop.exe -dha`。

注：v1.6.0及之后的版本才支持`-dha`参数

## Windows 7 下软件启动后，界面无法显示

对于软件启动后，可以在任务栏看到软件，但软件界面在桌面上无任何显示，或者整个界面偶尔闪烁的情况。<br>
原始问题看：<https://github.com/electron/electron/issues/19569#issuecomment-522231083><br>
解决办法：下载`.NET Framework 4.7.1`或**更高**版本安装即可(建议安装最新版，若安装过程中遇到问题可尝试自行百度解决)。<br>
微软官方下载地址：<https://dotnet.microsoft.com/download/dotnet-framework><br>
下载`Runtime(运行时)`版即可，安装完成后可能需要重启才生效，**若出现闪烁的情况**，可阅读下面的**Windows 7 下整个界面闪烁**解决。

## Windows 7 下整个界面闪烁（消失又出现）

可尝试在关掉软件后，在桌面空白处鼠标右击，在弹出的菜单中选择**个性化**，在弹出的窗口中**切换到系统内置的Aero主题**，然后再启动软件看是否解决。

## Windows 7 下桌面歌词字体列表为空

Windows 7 系统系统需要安装 Powershell 5.1及以上版本才可正常获取系统字体列表。

想要查看当前 Powershell 版本可以在 Powershell 窗口输入命令：`Get-Host`

最新 Powershell 安装包可以去官方 [Github releases](https://github.com/PowerShell/PowerShell/releases) 页下载，安装过程中若出现错误，请自行按照提示或者百度/Google解决。

## 安装版安装失败，提示安装程序并未成功地运行完成

对于部分电脑出现安装失败的问题，可以做出以下尝试：

- 若你之前可以安装成功，但现在安装失败，就去**控制面板-程序和功能**或用第三方卸载工具看下有没有之前的版本残留，若同时在不同路径下安装了多个版本就可能会出现该问题，这种情况卸载掉所有版本重新安装即可
- 清理安装路径下的残留文件
- 清理注册表（建议用清理工具清理）

## 软件无法联网

软件的排行榜、歌单、搜索列表**都**无法加载：

- 检查是否在设置界面开启了代理（当代理乱设置时软件将无法联网）
- 检查软件是否被第三方软件/防火墙阻止联网

## 桌面歌词显示异常

### Windows 7 系统桌面歌词显示异常

Windows 7 未开启 Aero 效果时桌面歌词会有问题，详情看上面的 **Windows 7 下界面异常** 方法解决。

### MAC OS 系统、桌面歌词有残留阴影

此问题似乎是Electron的Bug，翻阅electron的issue列表发现该Bug以存在很久了，遗憾的是没有一直都没有修复，由于我没有装MAC平台的电脑，没法重现，就没再去electron提issue，更多信息看：

- <https://github.com/electron/electron/issues/21173>
- <https://github.com/electron/electron/issues/14304>

### Linux 系统下桌面歌词窗口异常

`v1.2.1`以前的版本在 Ubuntu 18.10 下第一次开启桌面歌词时歌词窗口会变白，需要关闭后再开启，
`v1.2.1`及之后的版本已修复该问题。

其他 Linux 系统未测试，如有异常也是意料之中，目前不打算去处理 Linux 平台的桌面歌词问题，但你可以尝试按照`Linux 下界面异常`的解决方案去解决。

## 歌曲下载失败，提示 `ENOENT: no such file or directory, mkdir`

更换下载歌曲目录即可解决（一般是设置的歌曲下载目录没有读写权限导致的）。

## 使用软件时导致耳机意外关机

据反馈，漫步者部分型号的耳机与本软件一起使用时将会导致耳机意外关机，
详情看：<https://github.com/lyswhut/lx-music-desktop/issues/457>，
若出现该问题可尝试添加`-dhmkh`启动参数解决，启动参数添加方法请自行百度“windows给快捷方式添加启动参数”。

## 软件安装包说明

软件发布页及网盘中有多个类型的安装文件，以下是对这些类型文件的说明：

文件名带 `win_` 的是在Windows系统上运行的版本，<br>
其中安装版（Setup）可自动更新软件，<br>
绿色版（green）为免安装版，自动更新功能不可用；

以 **`.dmg`** 结尾的文件为 MAC 版本；

以 **`.AppImage`**、**`.deb`**、**`.rpm`**、**`.pacman`** 结尾的为 Linux 版本。

带有`x64`的为64位的系统版本，带`x86`的为32位的系统版本；若两个都带有的则为集合版，安装时会自动根据系统位数选择对应的版本安装；带有`arm`的为arm架构系统的版本。

## 软件更新

软件启动时若发现新版本时会自动从本仓库下载安装包，下载完毕会弹窗提示更新。<br>
若下载未完成时软件被关闭，下次启动软件会再次自动下载。<br>
若还是**更新失败**，可能是无法访问GitHub导致的，这时需要手动更新，即下载最新安装包直接覆盖安装即可。<br>
注意：**绿色版**的软件自动更新功能**不可用**，建议使用安装版！！<br>
注意：**Mac版**、**Linux**版不支持自动更新！

### Windows 安装版在升级后，卸载了旧版本，但没有安装新版本

出现这个问题的原因一般是你当初在安装本软件的时候是以管理员身份安装的，运行软件的时候没有以管理员身份运行，所以卸载后无法再装上。

安装本软件时建议选择 `为当前用户安装`，并安装在当前用户目录或者安装在不需要管理员权限的目录（即其他分区下），不要选`为所有用户安装`。

## 缺少`xxx.dll`

这个是电脑缺少某些dll导致的，正常的系统是没有这个问题的，可以尝试如下几个解决办法：

- 以管理员权限打开`cmd`，输入`sfc /scannow`回车等待检查完成重启电脑
- 若上面的方法**修复、重启**电脑后仍然不行，就自行百度弹出的**错误信息**看下别人是怎么解决的

## MAC OS无法启动软件，提示 lx-music-desktop 已损坏

这是因为软件没有签名，被系统阻止运行，<br>
在终端里输入 `sudo xattr -rd com.apple.quarantine /Applications/lx-music-desktop.app`，然后输入你的电脑密码即可

还可以参考：

- <http://www.pc6.com/edu/168719.html>
- <https://blog.csdn.net/for641/article/details/104811538>

## 杀毒软件提示有病毒或恶意行为

本人只能保证我写的代码不包含任何**恶意代码**、**收集用户信息**的行为，并且软件代码已开源，请自行查阅，软件安装包也是由CI拉取源代码构建，构建日志：[GitHub Actions](https://github.com/lyswhut/lx-music-desktop/actions)<br>
尽管如此，但这不意味着软件是100%安全的，由于软件使用了第三方依赖，当这些依赖存在恶意行为时（[供应链攻击](https://docs.microsoft.com/zh-cn/windows/security/threat-protection/intelligence/supply-chain-malware)），软件也将会受到牵连，所以我只能尽量选择使用较多人用、信任度较高的依赖。<br>
当然，以上说明建立的前提是在你所用的安装包是从**本项目主页上写的链接**下载的，或者有相关能力者还可以下载源代码自己构建安装包。

从`v0.17.0`起，由于加入了音频输出设备切换功能，该功能调用了 [MediaDevices.enumerateDevices()](https://developer.mozilla.org/zh-CN/docs/Web/API/MediaDevices/enumerateDevices)，可能导致安全软件提示洛雪要访问摄像头（目前发现卡巴斯基会提示），但实际上没有用到摄像头，并且摄像头的提示灯也不会亮，你可以选择阻止访问。

最后，若出现杀毒软件报毒、存在恶意行为，请自行判断选择是否继续使用本软件！

## 自定义源脚本编写说明

文件请使用UTF-8编码格式编写，脚本所用编程语言为JavaScript，可以使用ES6+语法，脚本与应用的交互是使用类似事件收发的方式进行，这是一个基本的脚本例子：

```js
/**
 * @name 测试音乐源
 * @description 我只是一个测试音乐源哦
 * @version 1.0.0
 * @author xxx
 * @homepage http://xxx
 */


const { EVENT_NAMES, request, on, send } = window.lx

const qualitys = {
  kw: {
    '128k': '128',
    '320k': '320',
    flac: 'flac',
  },
}
const httpRequest = (url, options) => new Promise((resolve, reject) => {
  request(url, options, (err, resp) => {
    if (err) return reject(err)
    resolve(resp.body)
  })
})

const apis = {
  kw: {
    musicUrl({ songmid }, quality) {
      return httpRequest('http://xxx').then(data => {
        return data.url
      })
    },
  },
}

// 注册应用API请求事件
// source 音乐源，可能的值取决于初始化时传入的sources对象的源key值
// info 请求附加信息，内容根据action变化
// action 请求操作类型，目前只有musicUrl，即获取音乐URL链接，
//    当action为musicUrl时info的结构：{type, musicInfo}，
//        info.type：音乐质量，可能的值有128k / 320k / flac（取决于初始化时对应源传入的qualitys值中的一个），
//        info.musicInfo：音乐信息对象，里面有音乐ID、名字等信息
on(EVENT_NAMES.request, ({ source, action, info }) => {
  // 回调必须返回 Promise 对象
  switch (action) {
    // action 为 musicUrl 时需要在 Promise 返回歌曲 url
    case 'musicUrl':
      return apis[source].musicUrl(info.musicInfo, qualitys[source][info.type]).catch(err => {
        console.log(err)
        return Promise.reject(err)
      })
  }
})

// 脚本初始化完成后需要发送inited事件告知应用
send(EVENT_NAMES.inited, {
  status: true, // 初始化成功 or 失败
  openDevTools: false, // 是否打开开发者工具，方便用于调试脚本
  sources: { // 当前脚本支持的源
    kw: { // 支持的源对象，可用key值：kw/kg/tx/wy/mg
      name: '酷我音乐',
      type: 'music',  // 目前固定为 music
      actions: ['musicUrl'], // 目前固定为 ['musicUrl']
      qualitys: ['128k', '320k', 'flac'], // 当前脚本的该源所支持获取的Url音质，有效的值有：['128k', '320k', 'flac']
    },
  },
})

```

### 自定义源信息

文件的开头必须包含以下注释：

```js
/**
 * @name 测试脚本
 * @description 我只是一个测试脚本
 * @version 1.0.0
 * @author xxx
 * @homepage http://xxx
 */

```

- `@name `：源的名字，建议不要过长，24个字符以内
- `@description `：源的描述，建议不要过长，36个字符以内，可不填，不填时必须保留 @description
- `@version`：源的版本号，可不填，不填时可以删除 @version
- `@author `：脚本作者名字，可不填，不填时可以删除 @author
- `@homepage `：脚本主页，可不填，不填时可以删除 @homepage

### `window.lx`

应用为脚本暴露的API对象。

#### `window.lx.version`

自定义源API版本，API变更时此版本号将会更改（新增于v1.14.0之后）

#### `window.lx.EVENT_NAMES`

常量事件名称对象，发送、注册事件时传入事件名时使用，可用值：

| 事件名 | 描述
| --- | ---
| `inited` | 脚本初始化完成后发送给应用的事件名，发送该事件时需要传入以下信息：`{status, sources, openDevTools}`<br>`status`：初始化结果（`true`成功，`false`失败）<br>`openDevTools`：是否打开DevTools，此选项可用于开发脚本时的调试<br>`sources`：支持的源信息对象，<br>`sources[kw/kg/tx/wy/mg].name`：源的名字（目前非必须）<br>`sources[kw/kg/tx/wy/mg].type`：源类型，目前固定值需为`music`<br>`sources[kw/kg/tx/wy/mg].actions`：支持的actions，由于目前只支持`musicUrl`，所以固定传`['musicUrl']`即可<br>`sources[kw/kg/tx/wy/mg].qualitys`：该源支持的音质列表，有效的值为`['128k', '320k', 'flac']`，该字段用于控制应用可用的音质类型
| `request` | 应用API请求事件名，回调入参：`handler({ source, action, info})`，回调必须返回`Promise`对象<br>`source`：音乐源，可能的值取决于初始化时传入的`sources`对象的源key值<br>`info`：请求附加信息，内容根据`action`变化<br>`action`：请求操作类型，目前只有`musicUrl`，即获取音乐URL链接，需要在 Promise 返回歌曲 url，`info`的结构：`{type, musicInfo}`，`info.type`：音乐质量，可能的值有`128k` / `320k` / `flac`（取决于初始化时对应源传入的`qualitys`值中的一个），`info.musicInfo`：音乐信息对象，里面有音乐ID、名字等信息


#### `window.lx.on`

事件注册方法，应用主动与脚本通信时使用：

```js
/**
 * @param event_name 事件名
 * @param handler 事件处理回调 -- 注意：注册的回调必须返回 Promise 对象
 */
window.lx.on(event_name, handler)
```

**注意：** 注册的回调必须返回 `Promise` 对象。

#### `window.lx.send`

事件发送方法，脚本主动与应用通信时使用：

```js
/**
 * @param event_name 事件名
 * @param datas 要传给应用的数据
 */
window.lx.send(event_name, datas)
```

#### `window.lx.request`

HTTP请求方法，用于发送HTTP请求，此HTTP请求方法不受跨域规则限制：

```js
/**
 * @param url 请求的URL
 * @param options 请求选项，可用选项有 method / headers / body / form / formData / timeout
 * @param callback 请求结果的回调 入参：err, resp, body
 * @return 返回一个方法，调用此方法可以终止HTTP请求
 */
const cancelHttp = window.lx.request(url, options, callback)
```

#### `window.lx.utils`

应用提供给脚本的工具方法：

- `window.lx.utils.buffer.from`：对应Node.js的 `Buffer.from`
- `window.lx.utils.buffer.bufToString`：Buffer转字符串 `bufToString(buffer, format)`，`format`对应Node.js `Buffer.toString`的参数（v1.14.0之后新增）
- `window.lx.utils.crypto.aesEncrypt`：AES加密 `aesEncrypt(buffer, mode, key, iv)`
- `window.lx.utils.crypto.md5`：MD5加密 `md5(str)`
- `window.lx.utils.crypto.randomBytes`：生成随机字符串 `randomBytes(size)`
- `window.lx.utils.crypto.rsaEncrypt`：RSA加密 `rsaEncrypt(buffer, key)`

目前仅提供以上工具方法，如果需要其他方法可以开issue讨论。
