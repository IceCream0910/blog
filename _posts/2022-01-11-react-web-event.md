---
layout: post
title: "React - 이벤트 처리하기"
author: sal
categories: [ React ]
image: https://media.vlpt.us/images/jini_eun/post/107f5cfb-e97c-4c4c-b997-06098062e5b3/image.png
---

상위 컴포넌트에서 하위 컴포넌트로 명령을 내릴 때에는 props를 사용한다고 했습니다. 그런데 props는 하위 컴포넌트에서 변경할 수 없기 때문에 하위 컴포넌트가 상위 컴포넌트로 명령을 내릴 때에는 사용할 수 없습니다.

이럴 때에는 <b>event</b>를 사용해야 합니다.

![이미지](https://i.ibb.co/2F5y4XM/Screenshot-2022-01-11-at-15-37-31.jpg)

전에 만든 화면에서 Hello를 누르면 Content 컴포넌트의 내용이 welcome 내용으로 바뀌고, skills, school, goal 이라는 목록을 각각 눌렀을 때 아래의 Content 컴포넌트의 각각의 내용으로 바뀌는 것을 구현해보도록 하겠습니다.

우선 시작에 앞서, React에서 이벤트를 처리할 때 사용하는 문법에 대해 간단히 알아보겠습니다.

기존 html 에서는 아래와 같이 onclick을 소문자로, 그리고 문자열로 함수를 전달했다면
```html
<button onclick="clickBtn()">
```
리액트에서는 onclick에서 C를 대문자로(카멜케이스) 작성하며, {}로 묶어 함수 형태로 전달합니다.
```js
<button onClick={clickBtn}>
```

예를 들어 아래와 같은 a 태그가 있다고 해봅시다.
```html
<a href="/" onClick={clickLink}>
	Click me
</a>
```

a 태그를 눌렀을 때는 기본적으로 href로 페이지 이동을 하는 동작이 지정되어 있습니다. 이를 동작하지 않게 하고 우리가 정의한 onClick 함수만 실행되게 하기 위해서는 <b>preventDefault</b>를 이용합니다.

```js
<a href="/"
   onClick={function(e){
      e.preventDefault();
      console.log('click');
  }.bind(this)}>
Click me
</a>
```

또 중요한 게 있습니다. 이벤트 함수 내에서 <b>this</b>를 호출한 경우 undefined가 반환됩니다. 따라서 컴포넌트 자체를 가르킬 수 있도록 <b>bind</b> 함수를 이용해 줘야 합니다. 바로 위의 코드에서도 사용한 것을 보실 수 있습니다.

---
이제 실습해보겠습니다.

App.js의 constructor 내 state에 다음과 같이 추가해봅시다.
```js
this.state = {
      mode:'welcome', //추가
      selected_content_id:1, //추가
      subject:{title:'Hello', sub:'My name is Yun Taein'},
      welcome:{title:'Welcome', desc:'Nice to meet react'}, //추가
      contents:[
        {id:1, title:'Skills', desc:'my skills'},
        {id:2, title:'School', desc:'my school'},
        {id:3, title:'Goal', desc:'my goal'},
      ]
    }
```
mode와 selected_content_id, welcome을 추가했습니다.

render()를 다음과 같이 수정해봅시다.
```js
render() {
    var _title, _desc = null;
    if(this.state.mode === 'welcome') {
      _title = this.state.welcome.title;
      _desc = this.state.welcome.desc;

    } else if(this.state.mode === 'read') {
      var i=0;
      while(i<this.state.contents.length) {
        var data = this.state.contents[i];
        if(data.id === this.state.selected_content_id) {
          _title = data.title;
          _desc = data.desc;
          break;
        }
        i++;
      }
     

    }
    return (
      <div className="App">
        <Subject
          title={this.state.subject.title}
          sub={this.state.subject.sub}> 
        </Subject>
        
        <Topic
        data={this.state.contents}>  
        </Topic>
        <Content title={_title} desc={_desc}></Content>
      </div>
    );
  }
```

state의 mode가 welcome이라면 welcome의 title과 desc를 Content 컴포넌트의 props로 전달해주고,
mode가 read라면 selected_content_id의 title과 desc를 Content의 컴포넌트의 props로 전달해 사용자에게 보여주는 코드가 return() 윗부분에 추가되었습니다.

여기서 실행해보면 mode가 기본으로 welcome이기 때문에 아래 Content 컴포넌트에는 welcome state에서 설정한 title과 desc가 나오는 걸 볼 수 있습니다.

state의 mode를 'read'로 변경해보면 Content 컴포넌트에는 state에서 정한 contents의 1번째 데이터가 표시됩니다.

여기서,
> state나 props가 바뀌면 render가 다시 호출되서 화면이 다시 그려집니다.

---

이제 이벤트를 만들어봅시다.
App.js에서 render()의 return을 아래와 같이 수정해봅시다.
```js
return (
      <div className="App">
        <Subject
          title={this.state.subject.title}
          sub={this.state.subject.sub}
          onChangePage={function(){
            this.setState({
              mode:'welcome'
            });
          }.bind(this)}> 
        </Subject>
        ...
      </div>
    );
```

Subject 컴포넌트에 <b>onChangePage</b>라는 이벤트를 설치한 것입니다.
src/Subject.js로 가서 아래와 같이 수정합니다.
```js
import React, {Component} from 'react';


class Subject extends Component {
    render() {
      return (
        <header>
          <h1>
          <a href="/" onClick={function(e) {
            e.preventDefault();
            this.props.onChangePage();
          }.bind(this)}>
          {this.props.title}
          </a>
          </h1>
          {this.props.sub}
        </header>
      );
    }
  }
  
  export default Subject;
```
<b>onClick</b> 이벤트에 함수를 만들고, <b>e.preventDefault()</b>를 통해 기본 동작을 금지시킵니다. <b>this.props.onChangePage();</b>로 위에서 만든 이벤트를 호출합니다.

이제 Subject 컴포넌트의 a 태그를 누르면 onClick 함수가 호출되게 되고, 여기서 기본동작을 차단한 후 App.js에서 설치한 이벤트인 onChangePage()가 호출되어 state의 mode를 'welcome'으로 바꾸게 되는 것입니다.

여기서, state의 mode를 바꿀 때 쓴 setState라는 함수가 있습니다.
#### setState 
```js
this.state.mode = 'welcome';
```
이렇게 state를 바꾼다면 실제로 state 값은 바뀌긴 합니다. 그러나 React에서 변경되었다고 인식하지 못하고, 따라서 화면도 다시 render 되지 않습니다.
그래서 아래와 같이 setState라는 함수를 사용하는 겁니다.

```js
this.setState({
   mode:'welcome'
});
```

---

이번에는 Topic의 각 목록을 선택하면 각각의 데이터로 Content 컴포넌트의 내용이 바뀌도록 해보겠습니다.
App.js에서 render()의 return 안의 Topic 부분을 수정합니다.
```js
<Topic
  onChangePage={function(id) {
          this.setState({
            mode:'read',
            selected_content_id : Number(id)
          });
        }.bind(this)}
  data={this.state.contents}>  
</Topic>
```

src/Topic.js도 수정해줍니다.

```js
import React, {Component} from 'react';

class Topic extends Component {
    render() {
      var lists = [];
      var data =this.props.data;
      var i= 0;
      while(i < data.length) {
        lists.push(<li key={data[i].id}>
          <a 
          href={"/contents/"+data[i].id}
          data-id={data[i].id}
          onClick={function(e) {
            e.preventDefault();
            this.props.onChangePage(e.target.dataset.id);
          }.bind(this)}
          >
            {data[i].title}
          </a>
          </li>)
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
참고로 <b>href={"/contents/"+data[i].id}</b> 이 부분에서 /contents/는 그냥 이후에 이동할 위치를 지정한 것이지 별 의미가 없습니다.

a 태그를 살펴봅시다.
```js
 <a 
          data-id={data[i].id}
          onClick={function(e) {
            e.preventDefault();
            this.props.onChangePage(e.target.dataset.id);
          }.bind(this)}
          >
            {data[i].title}
  </a>
```

<b>data-id</b>라고 설정해준 값은 <b>e.target.dataset.id</b>로 접근할 수 있습니다. 즉, data-ㅇㅇㅇ라고 지정한 값은 e.target.dataset.ㅇㅇㅇ로 접근할 수 있다는 얘깁니다.
이 id값을 App.js에서 Topic에 설치한 onChangePage 이벤트로 넘기며 호출합니다.

그러면 onChangePage 이벤트 내에서
```js
onChangePage={function(id) {
          this.setState({
            mode:'read',
            selected_content_id : Number(id)
          });
        }.bind(this)}
```
state의 mode를 'read'로, selected_content_id를 전달받은 id값으로 변경합니다. 여기서 id가 String 문자 형태로 전달되기 때문에, Number()를 사용해 숫자 형태로 바꿔줘야 합니다.

이제 실행해봅시다.
![이미지](https://i.ibb.co/2F5y4XM/Screenshot-2022-01-11-at-15-37-31.jpg)

Hello를 누르면 아래의 Content가 Welcome으로 바뀌고, 각각의 목록을 눌러도 Content 내용이 바뀝니다.

React를 사용해 새로고침을 하지 않아도 데이터가 바뀌는 동적인 앱을 개발한 겁니다!