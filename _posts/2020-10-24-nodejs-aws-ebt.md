---
layout: post
title: "AWS Elastic Beanstalk 배포"
description: "AWS Elastic Beanstalk Node.js 애플리케이션 배포하기"
author: sal
categories: [ AWS ]
image: https://i.imgur.com/2M0Rg4t.png
---

### AWS EC2
AWS Elastic Beanstalk는 웹 애플리케이션 및 서비스를 서버에 손쉽게 배포하고 확장할 수 있는 서비스입니다.
[AWS Elastic Beanstalk 콘솔 바로가기](https://us-east-2.console.aws.amazon.com/elasticbeanstalk/home)

## 배포하기
먼저 Hello World!를 출력하는 간단한 페이지를 만들어줍니다.
```js
var http = require('http');

var server = http.createServer(function(request, response) {

    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Hello World!");

});

var port = 8080;
server.listen(port);
```


AWS 콘솔에 로그인을 한 후 Elastic Beanstalk 콘솔로 이동해줍니다.
Create Application을 눌러 새로운 애플리케이션을 생성해줍니다.

![중간 이미지](https://i.imgur.com/wJCSnGV.jpg)

애플리케이션 이름을 정해주고, 플랫폼은 Node.js를 선택해주세요.
애플리케이션 생성 버튼을 눌러줍니다.

![중간 이미지](https://i.imgur.com/h3lqiVW.png)

![중간 이미지](https://i.imgur.com/lkPCUUn.png)

환경이 생성될 때까지 몇 분 정도 기다려주면 앱 배포가 완료됩니다.
완료되면 애플리케이션으로 이동해 만든 애플리케이션을 눌러주세요.

![중간 이미지](https://i.imgur.com/Ku7WL93.png)

상태가 OK인 것을 확인하고 환경 이름(위에서는 Helloworld-env)를 눌러주세요.

![중간 이미지](https://i.imgur.com/0zRoSTc.png)

이런 창이 뜨면 성공입니다.

![중간 이미지](https://i.imgur.com/J1dJxBO.png)

Helloworld-env 아래에 있는 링크를 눌러 이동해봅시다.
여기서는 샘플 애플리케이션으로 시작을 설정했으므로 아직 소스코드를 올리지 않았지만, 애플리케이션 링크를 클릭하면 다음과 같이 샘플 페이지가 나오는 것을 볼 수 있습니다.

![중간 이미지](https://i.imgur.com/2M0Rg4t.png)

이제 처음에 만든 Hello World 웹페이지를 업로드해봅시다.

![중간 이미지](https://i.imgur.com/G7HttiJ.png)

먼저 아까전에 만든 앱 폴더를 zip으로 압축해줘야 합니다.
알집과 같은 압축 프로그램을 사용하시면 됩니다.

파일 선택을 눌러 zip파일을 업로드한 후에 버전 레이블의 이름을 변경해줍니다.
버전 레이블은 배포할 때마다 달라져야 합니다.

![중간 이미지](https://i.imgur.com/5ymTXG3.png)

이제 배포를 눌러주세요. 상태가 체크 표시로 바뀔 때까지 기다린 후 아까 전에 접속했던 링크로 다시 들어가줍니다.

![중간 이미지](https://i.imgur.com/4iInEhz.png)

성공적으로 배포된 것을 볼 수 있습니다!
이번 포스팅에서 사용한 것은 zip파일을 직접 업로드하는 방식인데요. 
AWS CLI라는 것을 이용해서 콘솔에서 업로드할 수도 있습니다.


## 노트
필자는 처음 서버 배포 후 상태가 체크표시(확인)이 아닌 심각으로 표시되며 502 Gateway Error가 표시되었다.
확인해보니 배포한 코드에서 포트가 3000으로 지정되어 있었는데,  8080으로 지정해주어야 한다.






