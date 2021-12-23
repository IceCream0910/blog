---
layout: post
title: "AWS EC2 기본 사용법"
description: "AWS ec2 서버 접속"
date: 2020-10-18
author: sal
categories: [ AWS ]
image: https://a0.awsstatic.com/libra-css/images/logos/aws_logo_smile_1200x630.png
---

### AWS EC2
AWS EC2는 아마존 웹 서비스에서 제공하는 서비스로서 아마존 웹 서비스 클라우드에서 확장 가능한 컴퓨팅 용량을 제공합니다.

먼저 aws 계정을 생성해주세요.
https://amzn.to/31hVhjU
AWS는 처음 가입했을 때 1년간 아무 비용 없이 Free-tier 단계로 무료로 쓸 수 있습니다!
다만 해외 결제가 가능한 신용카드 결제가 필요합니다. 1000원 정도 결제된 후 취소됩니다.

# EC2 인스턴스 생성하기
![중간 이미지](https://i.imgur.com/UoElIxZ.png)
로그인을 한후 AWS 콘솔에서 EC2를 검색합니다.

![중간 이미지](https://i.imgur.com/LuOErSB.png)
실행중인 인스턴스로 들어간 후

![중간 이미지](https://i.imgur.com/oHFHKqf.png)
인스턴스 시작을 눌러줍니다.

![중간 이미지](https://i.imgur.com/2h7DiBT.png)
여기서는 ubuntu 서버를 만들어주겠습니다.

![중간 이미지](https://i.imgur.com/qMiDDiU.png)
프리티어 사용이 가능한 t2.micro을 사용하겠습니다.
각자 본인 사용에 맞는 유형을 고르고 검토 및 시작을 눌러주세요.

![중간 이미지](https://i.imgur.com/ukgqxWx.png)
이렇게 새로운 키 생성을 선택하고 키 이름을 정해주세요. 그런 다음 다운로드를 눌러줍니다.


![중간 이미지](https://i.imgur.com/zJUE5Ie.png)
그러면 이렇게 인스턴스가 생긴것을 볼 수 있는데요.
실행중(running)으로 표시될 때까지 기다려주세요.

![중간 이미지](https://i.imgur.com/UbgrDKm.png)
해당 인스턴스를 체크하시면 아래에서 퍼블릭 IPv4 주소를 확인하실 수 있는데요.
이제 터미널로 이동해 아래 명령어를 실행합니다.

```
chmod 400 <your pem key name>.pem
ssh -i "<your pem key name>.pem" ubuntu@<your IPv4 Public IP>
```

저는 아래와 같은 오류가 뜨며 접속이 안됐습니다.
```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions for 'C:\\node-example.pem' are too open.
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
Load key "C:\\node-example.pem": bad permissions
ubunutu@3.15.207.190: Permission denied (publickey).
```
![중간 이미지](https://i.imgur.com/1OeI9yY.png)
해당 키 파일에서 마우스 우클릭 > 속성 > 보안 > 고급에서 이와 같이 설정을 변경해줬습니다.
모든 사용자에게 모든 권한을 부여해주세요.
저는 다운로드 폴더에 해당 키 파일을 저장해놓았기 때문에 다시 아래와 같이 터미널에 명령을 작성합니다.

```
ssh -i "C:\Users\danawacomputer\Downloads\<your pem key name>.pem" ubuntu@<your IPv4 Public IP>
```
![중간 이미지](https://i.imgur.com/LotecG5.png)
그럼 이렇게 welcome 어쩌구가 뜨면서 서버에 접속이 됩니다!

### 생성된 AWS EC2 인스턴스에 서버 배포하기
자 이제 서버에 프로젝트를 배포해봅시다.
터미널에서 서버에 접속된 상태로 git clone으로 원하는 프로젝트를 불러와주시고요.
다음 명령어를 실행해 필요한 모듈을 다운로드합니다.
```
sudo apt update
sudo apt install nodejs
sudo apt install npm
npm install
node app.js
```

![중간 이미지](https://i.imgur.com/l344bRi.png)
자 여기서 보안 그룹 이름을 기억해두시고, 

![중간 이미지](https://i.imgur.com/FtuUOKA.png)
보안 그룹 탭으로 이동해 아까 봤던 보안그룹이름과 똑같은 항목을 체크해주세요.

![중간 이미지](https://i.imgur.com/eIgdv9C.png)
상단에 작업 > 인바운드 규칙 편집으로 이동해주세요.

![중간 이미지](https://i.imgur.com/2TYsWOJ.png)
이렇게 세팅해주시고 규칙 저장해주세요.

이제 <your IPv4 IP Public>:3001로 접속해주면 업로드한 파일이 정상적으로 실행되는 것을 보실 수 있습니다.
저 같은 경우는 3.15.207.190:3001 여기로 들어가면 되겠죠?

![중간 이미지](https://i.imgur.com/y94wr4H.png)
이렇게 배포가 된 것을 보실 수 있습니다.


