# 五子棋 · Android 版 (Gomoku for Android)

把纯前端的五子棋游戏（`../gomoku-game`）打包成可直接安装的安卓 APK。
应用是一个最小化的 WebView 外壳：启动后直接加载内置的 HTML/CSS/JS 游戏，
**无需联网即可游玩**。

## 安装

下载并安装 `dist/gomoku-android.apk`（或 GitHub Release 上的 APK），
首次安装时需在系统设置中允许“安装未知来源应用”。

## 构建

依赖：JDK 8+、Android SDK（`build-tools;34.0.0` 与 `platforms;android-34`）。
无需 Gradle：

```bash
export ANDROID_HOME=/path/to/android-sdk
export PATH="$ANDROID_HOME/build-tools/34.0.0:$PATH"
./build.sh   # 产物: dist/gomoku-android.apk
```

## 文件结构

| 文件                     | 说明                                     |
| ------------------------ | ---------------------------------------- |
| `AndroidManifest.xml`    | 应用清单（包名 `com.yrit.gomoku`）       |
| `src/.../MainActivity.java` | 唯一的 Activity，加载 WebView 游戏    |
| `res/mipmap-*/ic_launcher.png` | 各分辨率启动图标                 |
| `assets/`                | 游戏本体（index.html / style.css / game.js）|
| `build.sh`               | 一键构建脚本                             |

## 说明

- 游戏逻辑与网页版一致：双人对战、人机对战、悔棋、重新开始、胜负判定。
- 棋盘会随手机屏幕宽度自动缩放，适配不同尺寸的手机。
- 签名使用自签名的发布密钥（构建脚本会自动生成），
  后续升级请保留同一密钥，否则需要先卸载旧版。
