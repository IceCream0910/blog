---
layout: post
title: "React 컴포넌트, props"
author: sal
categories: [ React ]
image: https://media.vlpt.us/images/jini_eun/post/107f5cfb-e97c-4c4c-b997-06098062e5b3/image.png
---

학습을 진행하기에 앞서 초기 세팅에서 필요없는 부분들을 지워보겠습니다.
src/index.js로 가봅시다.
```js
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(<App />,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

```
위와 같이 최소한의 코드만 남겨주세요.

src 디렉토리 내에 css파일은 일단 모두 비워주세요.

src/App.js도 아래와 같이 수정해주세요.

```js
import React, {Component} from 'react';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        Hello, React!!
      </div>
    );
   }
  }

export default App;

```

---
자 먼저 컴포넌트 개념에 대해 알아봅시다.
### 컴포넌트 component
컴포넌트 독립적인 단위의 모듈을 말합니다.
예를 들어봅시다.

```html
<header>
        <h1>Hello</h1>
        My name is Yun Taein
</header>
```
이런 html 소스가 있었다고 가정해봅시다.
지금은 괜찮지만 header 내의 태그들이 더욱 많고 복잡해지면 가독성이 떨어질 뿐 아니라 유지보수도 어려워집니다.

위의 소스를 이렇게 작성할 수 있다면 어떨까요?
```html
<Intro></Intro>
```

이게 바로 React의 가장 핵심적인 기능인 Component의 탄생입니다.

App.js에서 아래와 같이 컴포넌트를 추가해봅시다.
```js
import React, {Component} from 'react';
import './App.css';

// ** 여기서부터
class Intro extends Component {
  render() {
    return (
      <header>
        <h1>Hello</h1>
        My name is Yun Taein
      </header>
    );
  }
}
// 여기 추가 **

class App extends Component {
  render() {
    return (
      <div className="App">
        Hello, React!!
      </div>
    );
   }
  }

export default App;
```

이 부분이 바로 Component를 만드는 기본적인 틀입니다.
return 안에 html 태그를 넣어주면 됩니다.
텍스트는 여러분이 마음대로 바꿔보세요 😃
```js
class Intro extends Component {
  render() {
    return (
      <header>
        <h1>Hello</h1>
        My name is Yun Taein
      </header>
    );
  }
}
```
위와 같은 방식으로 아래처럼 Content 컴포넌트도 만들어봅시다.
```js
class Content extends Component {
  render() {
    return (
      <article>
        <h2>I'm a student.</h2>
        My future job is a software developer.
      </article>
    );
  }
}
```

자 컴포넌트를 만들었으니 컴포넌트를 사용해야겠죠?
```js
class App extends Component {
  render() {
    return (
      <div className="App">
        <Intro></Intro>
        <Content></Content>
      </div>
    );
   }
  }
```

이렇게 바꾸고 저장하여 브라우저를 확인해봅시다.
![이미지](https://i.imgur.com/6sSczjN.jpg)
아주 잘 나옵니다.

자, 여기서 끝나면 재미가 없죠?
지금까지 만들었던 컴포넌트들은 항상 똑같은 내용을 반환합니다.

```js
class App extends Component {
  render() {
    return (
      <div className="App">
        <Intro title="Hello" sub="My name is Yun Taein"></Intro>
        <Content title="I'm a student." desc="My future job is a software developer."></Content>
      </div>
    );
  }
}
```

이렇게 가능하다면 어떨까요?
이게 바로 Props입니다.
### Props
props는 부모 컴포넌트에서 자식 컴포넌트로 전달해주는 데이터입니다.
자식 컴포넌트에서 전달받은 props는 변경할 수 없는 읽기 전용 데이터죠. props를 전달해준 최상위 부모 컴포넌트만 변경이 가능합니다. 참고로 알아두세요.

props를 사용하려면 컴포넌트의 코드를 조금 바꿔줘야 합니다.
이렇게 말이죠.
```js
class Subject extends Component {
  render() {
    return (
      <header>
        <h1>{this.props.title}</h1>
        {this.props.sub}
      </header>
    );
  }
}

class Content extends Component {
  render() {
    return (
      <article>
        <h2>{this.props.title}</h2>
        {this.props.desc}
      </article>
    );
  }
```
텍스트 대신 {this.props.title} 이런 것들이 들어와 있습니다.
```js
<Intro title="Hello" sub="My name is Yun Taein"></Intro>
```
여기서 title을 받아오려면 {this.props.title}을
sub를 받아오려면 {this.props.sub}를 넣어주면 되는겁니다.

실행해보면 이전과 동일한 결과를 얻을 수 있습니다.

---

React의 시작이자 가장 핵심적인 내용들입니다. 컴포넌트와 props 만으로 React를 이용해 많은 것들을 할 수 있습니다.

컴포넌트와 Props에 대해서 정리된 공식문서를 첨부합니다.
[https://reactjs-kr.firebaseapp.com/docs/components-and-props.html](https://reactjs-kr.firebaseapp.com/docs/components-and-props.html)