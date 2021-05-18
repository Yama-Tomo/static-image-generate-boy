# static-image-generate-boy

動画ファイルから静止画を生成する WEB ツールです

https://angry-bell-86a4e9.netlify.app/

## URL params

パラメータによってこのツールの挙動を制御することができます

|  パラメータ名  |  NOTE  |
| ---- | ---- |
| u[] |  URL．URL エンコードされた動画の URL を配列で渡します<br />`csu` も併用された場合はマージされます  |
| csu |  URL．URL エンコードされた動画の URL をカンマ区切りで渡します<br />`u[]` も併用された場合はマージされます  |
| i | 何秒ごとに生成するかの値 |
| w | 横幅を何 px で生成するかの値 |
| v | `1` を渡すと生成画像を縦に並べます |
| nohead | `1` を渡すとヘッダを非表示にします |
| noform | `1` を渡すと生成条件を入力するフォームを非表示にします |

# get started

```bash
$ yarn dev
```
