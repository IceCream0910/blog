---
layout: post
title: "nodeJs 사용법과 Express 프레임워크"
description: "nodeJs 서버 구축 및 Express 프레임워크를 사용해 웹페이지 만들기"
author: sal
categories: [ node.js ]
image: 
---

### nodeJs란?
nodeJS는 자바스크립트이지만 브라우저를 벗어났다는 점에서 주목을 받았습니다.
보통 자바스크립트하면 front end 개발의 전유물이라고 생각했었지만 구글 크롬의 자바스크립트 엔진에 기반해서
서버사이드 플랫폼으로 만들어졌다는 게 큰 특징입니다.

다운로드는 홈페이지[https://nodejs.org/en/]에서 가능합니다. 다운로드 하고 나면 console에서
~~~
node -v
~~~
를 입력했을 때 버전 정보가 출력되면 정상적으로 설치된 것입니다.
~~~
npm init
~~~
를 입력하면 기본 정보들을 설정할 수 있습니다. 모두 완료하면 Package.json이라는 파일이 생기는데요.
여기까지가 nodeJs 기본 세팅 방법입니다. 이제부터는 npm을 이용해 express를 설치하고, 서버를 구축해보겠습니다.

---

먼저 간단하게 Express에 대해 알아보자면 간편하게 웹서버를 구축 할 수 있도록 하는 프레임워크입니다.
npm은 패키지를 설치할 수 있게 해줍니다. (python을 아신다면 pip와 같은 기능을 수행합니다)

~~
npm install <패키지명>
~~~
위 코드가 의존 패키지를 설치하는 방법인데요. 여기서는 express를 입력해 설치해줍니다.

~~~
npm install express
~~~

이렇게 하면 여러 파일들이 생기는데, index.js로 들어가 코드를 입력해줍니다.

~~~
// index.js

var express = require('express')
var app = express()
app.listen(3000);
// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
res.send('hello world')
})
~~~

코드를 살펴보겠습니다.
먼저 express라는 의존패키지를 가져와 변수로 선언해줍니다.
app.listen(3000)은 포트를 지정해주는 부분인데요. 여기서는 nodeJs의 기본 포트인 3000으로 지정해주었습니다.
그 아래에는 페이지에 접속하면 'hello world'라는 문자열을 출력해주는 코드입니다.

수정내용을 저장한 후, 터미널에서 서버를 실행시켜보겠습니다
~~~
node index.js
~~~
액세스 허용창이 나오면 허용해주시면 됩니다.
이제 브라우저에서 localhost:3000 을 입력해 접속하면
hello world라고 표시되는 페이지가 나오는 것을 보실 수 있습니다.

여기까지는 단순히 hello world라는 문자를 띄우는 작업이었는데요.
이제부터는 html, css, js와 같은 실제 페이지를 띄워보도록 하겠습니다.

---

/views 디렉토리를 만들고, index.html 파일을 만들어주세요.
index.html에는 이렇게 입력해줍니다.
~~~
<html>
  <head>
    <title>Main</title>
    <link rel="stylesheet" type="text/css" href="css/style.css">
  </head>
  <body>
    Hey, this is index page
  </body>
</html>
~~~

저장후, index.js 파일을 다음과 같이 수정해봅시다.
~~~
// index.js

var express = require('express')
var app = express()

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function (req, res) {
res.sendFile(__dirname + 'index.html')
});

// Port setting
var port = 3000;
app.listen(port, function() {
    console.log('server on! http://localhost:' + port);
});
~~~

다시 브라우저로 접속해보면 html 페이지가 표시될 겁니다.
public 폴더를 만들어 style.css를 만들어 연결하면 레이아웃도 수정이 가능합니다.
다음에 더 자세한 내용을 예제를 통해 알아보도록 하겠습니다.
