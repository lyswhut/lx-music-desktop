<p align="center"><a href="https://github.com/lyswhut/lx-music-desktop"><img width="200" src="https://github.com/lyswhut/lx-music-desktop/blob/master/doc/images/icon.png" alt="lx-music logo"></a></p>

<h1 align="center">LX Music Desktop</h1>

<p align="center"><a href="./README.md">简体中文</a> | English</p>

<p align="center">
  <a href="https://github.com/lyswhut/lx-music-desktop/releases"><img src="https://img.shields.io/github/release/lyswhut/lx-music-desktop" alt="Release version"></a>
  <a href="https://github.com/lyswhut/lx-music-desktop/actions/workflows/release.yml"><img src="https://github.com/lyswhut/lx-music-desktop/workflows/Build/badge.svg" alt="Build status"></a>
  <a href="https://github.com/lyswhut/lx-music-desktop/actions/workflows/beta-pack.yml"><img src="https://github.com/lyswhut/lx-music-desktop/workflows/Build%20Beta/badge.svg" alt="Build status"></a>
  <a href="https://electronjs.org/releases/stable"><img src="https://img.shields.io/github/package-json/dependency-version/lyswhut/lx-music-desktop/dev/electron/master" alt="Electron version"></a>
  <a href="https://github.com/lyswhut/lx-music-desktop/tree/dev"><img src="https://img.shields.io/github/package-json/v/lyswhut/lx-music-desktop/dev" alt="Dev branch version"></a>
</p>

<p align="center">A music player built with Electron & Vue</p>

## About

Tech stack:

- Electron 30+
- Vue 3

Supported platforms:

- Linux
- macOS
- Windows 7 and above

*Mobile version: https://github.com/lyswhut/lx-music-mobile*

> [!NOTE]
> The desktop and web versions of our new project, [Any Listen](https://github.com/any-listen/any-listen), already implement most of LX Music's features, and additionally support WebDAV song playback, WebDAV data sync, standalone playlists and more.
> Our future development effort will mainly go into the new project, and feature requests previously filed for LX Music will also be considered for it.
> If you use LX Music day to day, you are welcome to try migrating to Any Listen. If you run into any problem, please report it by opening an issue.
>
> For the reasons behind the new project, see: [LX Music project direction adjustment and new project plan](https://github.com/lyswhut/lx-music-desktop/issues/1912) (Chinese).

For changes between versions, see the [changelog](https://github.com/lyswhut/lx-music-desktop/blob/master/CHANGELOG.md) (Chinese).

To download the app, go to [GitHub Releases](https://github.com/lyswhut/lx-music-desktop/releases).

For frequently asked questions, see the [desktop FAQ](https://lyswhut.github.io/lx-music-doc/desktop/faq) (Chinese).

The only official release channel of this project is [**GitHub**](https://github.com/lyswhut/lx-music-desktop/releases). All other channels are third-party re-uploads and are unrelated to this project!

The default settings and UI of this app are not designed to be beginner-friendly, so before using it, it is recommended to browse through the settings and adjust them to your liking, and to read about the [playlist mechanism](https://lyswhut.github.io/lx-music-doc/desktop/faq/playlist) and the [available mouse and keyboard shortcuts](https://lyswhut.github.io/lx-music-doc/desktop/faq/hotkey) (Chinese).

### Scheme URL support

Scheme URLs are supported since v1.17.0. They let you invoke LX Music from places such as a web browser. We have developed a [Tampermonkey user script](https://github.com/lyswhut/lx-music-script#readme) to go with it.

Script installation: [LX Music helper script](https://greasyfork.org/zh-CN/scripts/438148).

If you want to invoke LX Music yourself, see the "[Scheme URL support](https://lyswhut.github.io/lx-music-doc/desktop/scheme-url)" section of the docs (Chinese).

### Data sync service

Since v2.2.0 we have released a standalone [data sync service](https://github.com/lyswhut/lx-music-sync-server#readme). If you have a server, you can deploy it there and use it as a private multi-device sync service. See that project's readme for details.

### Open API support

The open API service is supported since v2.7.0. When enabled, a local HTTP server is started that exposes player-related endpoints for third-party software to call. See the "[Open API service](https://lyswhut.github.io/lx-music-doc/desktop/open-api)" section of the docs for details (Chinese).

### Data storage directory

By default, the app stores its data in:

- Linux: `$XDG_CONFIG_HOME/lx-music-desktop` or `~/.config/lx-music-desktop`
- macOS: `~/Library/Application Support/lx-music-desktop`
- Windows: `%APPDATA%/lx-music-desktop`

On Windows, if a `portable` folder exists in the program folder, it is automatically used as the data storage folder (v1.17.0 and above).

## User interface

<p><img width="100%" src="./doc/images/app.png" alt="lx-music desktop UI"></p>

## Contributing

Pull requests are welcome. To help your PR get merged smoothly, please keep the following in mind:

- For PRs that add a new feature, please open an issue first to explain it and confirm that the feature is actually needed.
- For PRs that fix a bug, please describe the behavior before and after the fix and how to reproduce the bug.
- For other kinds of PRs, please add a suitable description.

Steps to contribute:

1. Set up the development environment by following [Using the source code](https://lyswhut.github.io/lx-music-doc/desktop/use-source-code) (Chinese);
2. Clone this repository and switch to the `dev` branch to develop;
3. Submit your PR to the `dev` branch.

## Using the source code

See: <https://lyswhut.github.io/lx-music-doc/desktop/use-source-code> (Chinese)

## License

This project is released under the [Apache License 2.0](https://github.com/lyswhut/lx-music-desktop/blob/master/LICENSE). The following terms supplement the Apache License 2.0; in case of conflict, the following terms prevail.

---

*Definitions: in these terms, "this project" means the LX Music (洛雪音乐助手) desktop project; "user" means the user who agrees to these terms; "official music platforms" means, collectively, the official platforms of the music sources built into this project, including Kuwo, Kugou, Migu and others; "copyrighted data" means data owned by others under copyright, including but not limited to images, audio and names.*

### 1. Data sources

1.1 The online data of the official platforms in this project is obtained by pulling data from their public servers (the same data you would get in the official platform's app when not logged in). It is displayed after simple filtering and merging, so this project is not responsible for the legality or accuracy of the data.

1.2 This project itself has no ability to obtain audio data. The online audio used by this project comes from the online links returned by the "source" selected under "Custom source" in the app settings. For example, when playing a song, all this project does is pass the song name, artist and other information to the "source". If the "source" returns a link, this project treats it as the audio data of that song and uses it. This project cannot verify whether that is actually the correct audio, so while using this project the audio you want to play may not match the audio actually played, or may fail to play.

1.3 Data on non-official platforms (for example, the lists under "My Lists") comes from the user's local system or from the sync service the user connects to. This project is not responsible for the legality or accuracy of such data.

### 2. Copyrighted data

2.1 Copyrighted data may be generated while using this project. This project does not own that copyrighted data. To avoid infringement, users must delete the copyrighted data generated while using this project **within 24 hours**.

### 3. Music platform aliases

3.1 The aliases of official music platforms used in this project are merely names used to refer to those platforms and carry no malicious intent. If an official music platform finds them inappropriate, they may contact this project to have them changed or removed.

### 4. Use of resources

4.1 Some resources used in this project, including but not limited to fonts and images, come from the Internet. If any infringement arises, you may contact this project to have the resource removed.

### 5. Disclaimer

5.1 Any direct, indirect, special, incidental or consequential damages of any kind arising from the use of this project, including those arising from these terms or from the use of or inability to use this project (including but not limited to damages for loss of goodwill, work stoppage, computer failure or malfunction, or any and all other commercial damages or losses), are borne by the user.

### 6. Restrictions on use

6.1 This project is completely free and open-sourced on GitHub for people around the world to use for learning and exchanging technology. This project makes no guarantee that the technology within it does not violate local laws and regulations.

6.2 **Using this project in violation of local laws and regulations is prohibited.** Users bear responsibility for any illegal or non-compliant behavior resulting from using this project, whether or not they knew that local laws and regulations did not allow it. This project assumes no direct, indirect, special, incidental or consequential liability arising from it.

### 7. Copyright protection

7.1 Music platforms are not easy to run. Please respect copyright and support legitimate music.

### 8. Non-commercial nature

8.1 This project is only for exploring and researching the feasibility of technology. It does not accept any commercial cooperation (including but not limited to advertising) or donations.

### 9. Acceptance of terms

9.1 If you use this project, you accept these terms.

---

If you have questions, mail to: lyswhut+qq.com (please replace `+` with `@`)
