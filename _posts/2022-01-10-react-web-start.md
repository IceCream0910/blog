---
layout: post
title: "React 시작하기(개발환경 세팅)"
author: sal
categories: [ React ]
image: https://media.vlpt.us/images/jini_eun/post/107f5cfb-e97c-4c4c-b997-06098062e5b3/image.png
---

## React란?
React는 웹 프레임워크의 하나로, facebook에서 개발한 라이브러리입니다. 싱글 페이지 애플리케이션이나 모바일 애플리케이션의 개발에 사용될 수 있습니다.

##### 그렇다면 React는 왜 필요할까요?
html, css, js만으로 웹 페이지를 충분히 개발할 수 있습니다.
쉽게 이야기하자면 복잡한 html 태그들을 컴포넌트를 이용해 아주 간단하게 나타낼 수 있습니다. <b>가독성이 좋고, 재사용성이 뛰어나며, 유지보수에 용이</b>하다는 이야기입니다.

자 이제 React 를 개발하기 위한 개발환경을 세팅해봅시다.

### node.js
nodejs를 설치해주세요. 설치 방법은 생략하겠습니다.
본인의 컴퓨터에 설치되어있는지 확인하시려면 터미널에 node-v를 입력하면 자신의 버전이 나옵니다.

```console
> node -v
```

### npm
npm은 node로 만들어진 package 관리 도구입니다. npm은 nodejs와 함께 설치됩니다.

### create-react-app
create-react-app은 npm 패키지로 react앱을 빠르게 생성할 수 있도록 도와줍니다.
원하는 경로에 프로젝트 폴더를 만들고, 터미널에서 해당 경로로 이동해 아래와 같이 입력해줍니다.

여기서 두 가지 방법이 있습니다.

```console
> npm install -g create-react-app
```
이 방법은 로컬에 전역적으로 설치하는 방식입니다. 어디에서나 create-react-app을 사용할 수 있지만 버전 업데이트가 복잡하고 저장공간을 차지합니다.

```console
> npx create-react-app {앱 이름}
```
npx을 이용하면 최신 버전들을 이용해 세팅 이후 제거되기 때문에 무거운 라이브러리들이 남지 않게 됩니다.

---

조금 기다리면, 프로젝트가 만들어집니다. 터미널에서 실행시켜 봅시다.
```console
> npm start
```

Compiled successfully!가 뜨며 자동으로 브라우저 창이 열리고 아래와 같은 화면을 볼 수 있습니다.
![이미지](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2Fcj8mc6%2FbtqBr7Q8r4q%2FsVr398a5f2FfmsriFKEp3K%2Fimg.png)