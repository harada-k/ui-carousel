(function () {
  const root = document.querySelector('.js-carousel');
  const container = root.querySelector('.js-carouselContainer');
  const stage = root.querySelector('.js-carouselStage');
  const content = root.querySelector('.js-carouselContent');
  const items = root.querySelectorAll('.js-carouselItem');
  const footer = root.querySelector('.js-carouselFooter');

  const itemsLength = items.length;
  const lastIndex = itemsLength - 1;
  let currentIndex;

  const nav = createIndicator(itemsLength);
  const indicator = nav.list;
  // indicatorButtonsはボタンの配列
  const indicatorButtons = nav.buttons;

  // ボタン作成
  const prevButton = createButton(['Carousel-button', '_prev'], '前のパネルを表示する');
  const nextButton = createButton(['Carousel-button', '_next'], '次のパネルを表示する');
  // ボタンが非活性かどうかを格納する変数
  // 状態をキャッシュしておくことで、判定の際にDOMにアクセスする必要がなくなる
  const controllersDisabledStatus = {
    prev: false,
    next: false
  };

  // タッチの動作管理のための変数
  // スワイプ動作がパネルのどのくらいの割合を移動させたかで、元に戻すのかスワイプ先に移動するのかを決定
  const thresholdBase = 0.2;
  // タッチのスタートX地点、X軸の移動距離、`.Carousel-stage`内でタッチがスタートしたかを管理
  const pointer = {
    startX: 0,
    moveX: 0,
    hold: false,
  };
  // slideAnim関数で指定しているパネルがぴたりと合う状態をキャッシュし、追従動作に使用
  let currentTransformValue = '';

  function createButton(classNames, text) {
    const button = document.createElement('button');
    const textNode = document.createTextNode(text);
    button.setAttribute('type', 'button');
    // IE11はElement.classList.addに複数の引数が指定できない
    classNames.forEach(function (className) {
      button.classList.add(className);
    });
    // IE11に対応しないなら
    // button.classList.add.apply(button.classList, classNames);
    // またはスプレッド演算子が使えるなら
    // button.classList.add(...classNames);
    button.appendChild(textNode);
    return button;
  }

  // インジケータ作成
  function createIndicator(count) {
    // インジケータのルートとなるol要素
    const ol = document.createElement('ol');
    // ボタンだけの配列
    const buttons = [];
    // ループで <li><button>N</button></li> を作っていく
    for (let i = 0; i < count; i++) {
      const li = document.createElement('li');
      const button = createButton(['Carousel-indicatorButton'], i + 1);
      li.classList.add('Carousel-indicatorItem');
      li.appendChild(button);
      // button要素の親であるli要素をol要素に追加
      ol.appendChild(li);
      // buttonはボタンの配列にも追加しておく
      buttons.push(button);
    }
    ol.classList.add('Carousel-indicator');

    // インジケータのol要素と、ボタンの配列をそれぞれ返す
    return {
      list: ol,
      buttons: buttons
    }
  }

  // 作成したボタンをDOMに挿入
  function appendNavigations() {
    const controllersFragment = document.createDocumentFragment();
    controllersFragment.appendChild(prevButton);
    controllersFragment.appendChild(nextButton);
    container.appendChild(controllersFragment);
    footer.appendChild(indicator);
  }

  // ボタン押下時の動作

  // 前へボタン押下
  function onClickPrevButton(event) {
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      return;
    }
    changeItem(prevIndex);
  }

  // 次へボタン押下
  function onClickNextButton(event) {
    const nextIndex = currentIndex + 1;
    if (nextIndex > lastIndex) {
      return;
    }
    changeItem(nextIndex);
  }

  // 引数に、対象のボタン、キャッシュのキー、状態の判定式を渡す
  // それに応じてボタンのdisabledプロパティを変更して、状態のキャッシュを更新
  function updateControllerDisabledProp(button, key, disablingCondition) {
    const needUpdate = disablingCondition !== controllersDisabledStatus[key];
    if (!needUpdate) {
      return;
    }
    button.disabled = disablingCondition;
    controllersDisabledStatus[key] = disablingCondition;
  }

  // インジケータのボタンクリック時の挙動
  function onClickIndicatorButton(event) {
    const target = event.target;
    // 親要素indicatorにイベントハンドラを追加しているので
    // クリックされた要素がbutton要素かどうかを判定して、そうでなければ何もしない
    if (target.tagName.toLowerCase() !== 'button') {
      return;
    }
    // クリックされたものがbuttonならば、変数indicatorButtonsに格納しておいたボタンの配列から、該当するボタンを検索し、インデックスを取得します。
    const index = indicatorButtons.indexOf(target);
    // 取得したボタンのインデックスをchangeItem関数の引数に渡して表示するパネルを変更
    changeItem(index);
  }

  // インジケータボタンのdisabled処理
  function updateIndicatorDisabledProp(index) {
    if (currentIndex > -1) {
      indicatorButtons[currentIndex].disabled = false;
    }
    indicatorButtons[index].disabled = true;
  }

  // アイテムの指定
  function changeItem(index) {
    // 現在アクティブなインデックスが指定されたら何もしない
    if (index === currentIndex) {
      return;
    }
    // パネル表示を変更
    slideAnim(index);
    // ボタンの状態（disabled）を更新
    updateControllerDisabledProp(prevButton, 'prev', index === 0);
    updateControllerDisabledProp(nextButton, 'next', index === lastIndex);
    // インジケータボタンの状態（disabled）を更新
    updateIndicatorDisabledProp(index);
    // 現在アクティブなインデックスを書き換え
    currentIndex = index;
  }

  // パネル表示を変更
  function slideAnim(index) {
    const distance = -100 * index;
    const transformValue = 'translateX(' + distance + '%)';
    // パネル移動のためにcontentのtransformプロパティに値を指定
    content.style.transform = transformValue;
    // その値をcurrentTransformValueにキャッシュ
    currentTransformValue = transformValue;
  }

  // タッチされたときのイベントハンドラ
  function onTouchstart(event) {
    // タッチのポイントが複数かどうかを判定
    // ピンチイン/アウトなどマルチタッチ動作の場合は何もしない
    if (event.targetTouches.length > 1) {
      return
    }
    // pointer変数にスタート時点の状況を保存していく
    pointer.startX = event.targetTouches[0].clientX;
    pointer.hold = true;
    // transition-durationの値が大きい（現在は0.2s）ままだと追従時に違和感のある動作となってしまうので
    // transition-durationの値を0sに変更（タッチが終了した時点で削除）
    content.style.transitionDuration = '0s';
  }

  // タッチした指が移動した際の処理（追従動作）
  // 現在タッチしているX軸の位置とスタート時のX軸の位置を比較し、その差をcontentのスタイルに反映
  function onTouchmove(event) {
    if (event.targetTouches.length > 1 || !pointer.hold) {
      return;
    }
    // 現在タッチしているX軸の位置
    const currentX = event.targetTouches[0].clientX;
    // 現在タッチしているX軸の位置 - スタート時のX軸の位置
    const moveX = currentX - pointer.startX;
    const additionalTransformValue = 'translateX(' + moveX + 'px)';
    // キャッシュしておいたtransformの値と、タッチで動かした分のtransformの値をcontentのスタイルに反映
    // transformプロパティの値には数種類の関数を空白区切りで指定可能（同じ関数を複数回使っても問題なし）
    content.style.transform = currentTransformValue + ' ' + additionalTransformValue;
    // pointer.moveXに現在位置を保存
    pointer.moveX = moveX;
  }

  // タッチ終了時の処理
  function onTouchend(event) {
    if (event.targetTouches.length > 1 || !pointer.hold) {
      return;
    }

    // タッチが終了した時点で次にどのインデックスのパネルが表示されるべきか、という処理の結果のインデックス
    const nextIndex = getIndexSwipeEnd();
    // スタート時に指定したスタイルtransition-durationを削除し、通常どおりのトランジションが行われるようにする
    content.style.transitionDuration = '';

    // パネルを変更しないならキャッシュしておいたtransformの値を指定し直す
    if (nextIndex === currentIndex) {
      content.style.transform = currentTransformValue;
    } else {
      // 変更する場合はchangeItem関数を実行
      changeItem(nextIndex)
    }
    // pointerオブジェクトの各プロパティ値を初期化
    pointer.startX = 0;
    pointer.moveX = 0;
    pointer.hold = false;

    function getIndexSwipeEnd() {
      // X軸移動距離の絶対値を格納（正の符号を持つ）
      // 最初に指定したしきい値を超えているかどうかの判定に使用する
      const absoluteMoveX = Math.abs(pointer.moveX);
      // スワイプがどの方向に行われたかを判定、次にどのインデックス分変更するのかを決め格納
      // pointer.moveXはタッチ開始時からのX軸の移動距離なので、正の値の場合、タッチは左から右に移動したことになる
      // このまま現在のパネルを左から右に移動すると、1つ前のパネルに => インデックスの変更は-1
      const addIndex = pointer.moveX > 0 ? -1 : 1;
      // 現在表示されているインデックスを変更しないのか、addIndex分変更するのかを判断
      if (
        // タッチの移動距離がしきい値を超えていない
        (absoluteMoveX < container.clientWidth * thresholdBase) ||
        // しきい値に関係なく、現在0番目が表示されていて、それより前に移動しようとしている
        (currentIndex === 0 && addIndex === -1) ||
        // 最後のパネルが表示されていて、それより次に移動しようとしている
        (currentIndex === lastIndex && addIndex === 1)
      ) {
        // これらの条件のどれかが当てはまった場合はインデックスを変更せずに、現在のインデックスを返却
        return currentIndex;
      }
      // そうでなければ、addIndex分を加算して返却
      return currentIndex + addIndex;
    }
  }

  // 初期化
  function init() {
    // ボタンのイベント
    prevButton.addEventListener('click', onClickPrevButton, false);
    nextButton.addEventListener('click', onClickNextButton, false);
    // インジケータボタンのクリック
    // 数が多いので、イベントバブリングを使ってインジケータのルートとなるindicatorにイベントハンドラを追加
    indicator.addEventListener('click', onClickIndicatorButton, false);
    // タッチイベント
    stage.addEventListener('touchstart', onTouchstart, false);
    stage.addEventListener('touchmove', onTouchmove, false);
    stage.addEventListener('touchend', onTouchend, false);
    // 何らかの原因でタッチが中断されたときにもタッチ終了時と同じ動作を実行
    stage.addEventListener('touchcancel', onTouchend, false);
    // ボタンの挿入
    appendNavigations();
    // 一番最初のパネルを表示
    changeItem(0);
  }

  init();

})();