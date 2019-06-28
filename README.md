# ui-carousel

## 学習内容
CodeGridの記事を元に、カルーセルUIを作成
- https://app.codegrid.net/entry/2018-common-ui-9
- https://app.codegrid.net/entry/2018-common-ui-10
- https://app.codegrid.net/entry/2018-common-ui-11
- https://app.codegrid.net/entry/2018-common-ui-12
- https://app.codegrid.net/entry/2018-common-ui-13

カルーセルUIにおけるJavaScriptの基本的な考え方を学ぶ。

### ポイント
css
- パネルは同じ配置にしておき、その親を子のパネルが表示できる位置まで移動させればアニメーション対象が1つで済む。
- パネルn個分を移動幅を出すとき`100% * n`で計算できるようになり、端数が出る可能性をなくせる。

js
- 現在アクティブなパネルのインデックスを変数に入れておき、それを各種ボタンのクリックイベントハンドラから参照し、UIの状態を変更していくという処理
    - タブUIでも同じことをやっている。同じ動作をするなら、同じ処理が応用できる。
- 「前」「次」ボタンで移動：インデックスを指定すれば該当インデックスのパネルまで移動する関数を作る
    - 移動距離は`-100 * index`で求める
- タッチ動作への対応にはTouch EventsとPointer Eventsの両方に対応する必要がある
- タッチ周りのイベントは`.Carousel-stage`で処理
    - `.Carousel-content`と同じサイズであり、移動することもない`.Carousel-stage`を対象とする

### 課題

