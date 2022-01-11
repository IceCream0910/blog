---
layout: post
title: "React - State와 Props"
author: sal
categories: [ React ]
image: https://media.vlpt.us/images/jini_eun/post/107f5cfb-e97c-4c4c-b997-06098062e5b3/image.png
---

### State란?
State는 앞에서 배운 Props처럼 컴포넌트의 렌더링에 필요한 데이터를 갖고 있는 객체입니다. 그렇다면 props와 state는 뭐가 다른 걸까요?

props는 함수 매게변수와 같이 컴포넌트에 전달되지만, state는 함수 내에 선언된 변수처럼 <b>컴포넌트 안에서</b> 관리됩니다.
이 둘을 각각 사용하는 이유는 사용하는 쪽과 구현하는 쪽을 철저하게 분리시켜 더 좋은 서비스를 만드는 것에 있습니다.
비유하자면 스마트폰에 내부 전선들이 밖으로 나와있으면 좋은 제품이라고 할 수 없겠죠? 마찬가지로 외부에서 알 수 없도록 철저하게 숨기고 내부적으로 사용하는 것이 바로 state라고 보시면 되겠습니다.

### 사용
그렇다면 이제 State 객체를 사용해봐야겠죠.
State를 ㅅ용하기 위해서는 컴포넌트를 생성할 때 render() 함수보다 위, 즉 맨 윗부분에 constructor() 함수를 만들어주어야 합니다.

App.js에 아래와 같이 추가해봅시다.
```js
import React, {Component} from 'react';
import Intro from "./components/Intro" 
import Content from "./components/Content"
import './App.css';



class App extends Component {
  // ** 이 부분
  constructor(props) {
    super(props);
    this.state = {
      intro:{title:'Hello', sub:'My name is Yun Taein'}
  }
  // 추가 **

  render() {
    return (
      <div className="App">
        <Intro title="Hello" sub="My name is Yun Taein"></Intro>
        <Content title="I'm a student." desc="My future job is a software developer."></Content>
      </div>
    );
  }
}

export default App;
```
Component가 실행될 때 constructor가 있다면 가장 먼저 실행되어 초기화를 담당합니다.

아래 render 함수 부분도 수정해봅시다.
```js
 render() {
    return (
      <div className="App">
        <Intro
          title={this.state.subject.title}
          sub={this.state.subject.sub}></Intro>
        <Content title="I'm a student." desc="My future job is a software developer."></Content>
      </div>
    );
  }
```
실행해보면 이전과 동일한 결과물을 얻을 수 있습니다.
이때 Intro와 Content를 비교해볼까요?
State를 사용하지 않은 Content는 사용자에게 노출되는 부분에 props 데이터를 직접 적는 방식인데 반해, State를 사용한 Intro 컴포넌트는 <b>사용자가 알 필요가 없는 데이터를 내부에서 전달</b>해주는 것입니다.

---

State를 조금 더 알아보기 위해, 새로운 컴포넌트를 만들어줍시다.
컴포넌트를 만들기 전에 App.js에 먼저 state 데이터를 추가해주겠습니다.
constructor() 안에 this.state의 데이터에 아래와 같이 contents를 추가해주겠습니다.
```js
this.state = {
      subject:{title:'Hello', sub:'My name is Yun Taein'},
      contents:[
        {id:1, title:'Skills', desc:'my skills'},
        {id:2, title:'School', desc:'my school'},
        {id:3, title:'Goal', desc:'my goal'}
      ]
    }
```
App.js의 render 안쪽에도 Topic 컴포넌트를 추가해줍시다.
```js
 render() {
    return (
      <div className="App">
        <Intro
          title={this.state.subject.title}
          sub={this.state.subject.sub}></Intro>
          <Topic data={this.state.contents}></Topic>
        <Content title="I'm a student." desc="My future job is a software developer."></Content>
      </div>
    );
  }
```
Topic이라는 컴포넌트에 state 데이터를 props로 넘겨주었습니다.

이제, src/components 아래에 Topic.js를 만들어주세요.
```js
import React, {Component} from 'react';

class Topic extends Component {
    render() {
      var lists = [];
      var data =this.props.data;
      var i= 0;
      while(i < data.length) {
        lists.push(<li key={data[i].id}><a href={"/contents/"+data[i].id}>{data[i].title}</a></li>)
        i++;
      }
      return (
        <nav>
          <ul>
            {lists}
          </ul>
        </nav>
      );
    }
  }

  export default TOC; 
```
코드를 살펴볼까요?
lists라는 배열을 만들고, data라는 변수에 props로 받은 데이터를 저장합니다.
while문을 이용해 lists 배열에 각각의 데이터를 push 해줍니다.

이때, 아래 코드에서 key는 무엇일까요?
```js
lists.push(
  <li key={data[i].id}>
  <a href={"/contents/"+data[i].id}>{data[i].title}</a>
  </li>)
```
key가 없으면 아래와 같은 오류가 발생합니다.
![이미지](https://i.ibb.co/hdWjBqW/Screenshot-2022-01-11-at-14-28-36.jpg)

react가 내부적으로 필요로 하는 부분이니 그냥 명시해주면 됩니다.


