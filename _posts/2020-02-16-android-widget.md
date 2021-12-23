---
layout: post
title: "안드로이드 Widget(컴포넌트) 화면에 띄우기"
description: "다양한 widget을 앱에 적용해보기"
author: sal
categories: [ Android ]
image: 
---


오늘은 안드로이드의 다양한 위젯들을 앱에 적용해보겠습니다.
우선 위젯(widget)이란 말 그대로 앱에 띄우는 요소들을 말합니다.
대표적인 예로 버튼(button)이나 TextView, EditText 등이 있습니다ㅣ.

# 1. Button 버튼

위젯들을 화면에 추가하기 위해서는 xml에서 위젯들을 불러와줘야 합니다.
xml 파일에서 다음과 같이 추가해줍니다.

~~~
<Button
        android:id="@+id/button"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Button"
        android:back/>
 
~~~

간단하게 살펴보자면, id는 버튼의 이름이라고 생각하면 됩니다. 나중에 java코드에서 이 버튼을 가지고 어떤 작업을 수행하기 위해서는 반드시 필요합니다.
아래 width과 height는 '너비'와 '높이'를 의미합니다. 

width와 height는 아래 중 하나를 선택하여 입력해주면 됩니다.

### wrap_content - 컨텐츠 길이에 따라 자동 조절
### match_content - 부모에 맞추기(최대길이)
### 숫자 - dp나 sp, px등과 같은 단위와 함께 숫자를 써줘도 됩니다.
> ex) android:layout_width:"100dp"

이제 android:text 이 부분을 알아보겠습니다.
이 속성 역시 말 그대로 버튼에 들어갈 글자를 입력하는 겁니다.
글자를 '버튼'으로 바꿔보겠습니다.
그다음 android:backgroundTint 속성을 통해 배경색도 바꿉니다.

최종 xml
~~~
    <Button
        android:id="@+id/button"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="버튼"
        android:backgroundTint="#f0f000"/>
~~~

### 이제 java코드를 통해 버튼을 클릭하면 Toast가 출력되게 해보겠습니다.
Toast란 화면 하단 중앙에 회색으로 표시되는 알림...(?)입니다. 보시면 뭔지 아실겁니다.

우선 java로 가서 button을 선언해주어야 합니다.

~~~
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_widget_test);
        Button btn = (Button) findViewById(R.id.button); //이 부분 추가
    }
}
~~~

주석이 있는 부분을 보시면 됩니다. Button 객체의 이름을 btn으로 선언해주었고, findViewByld를 통해 레이아웃과 연결해줍니다.
이 부분은 모든 widget과 마찬가지입니다.
이제 버튼이 클릭될 때 이벤트를 추가합니다

~~~

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_widget_test);
        Button btn = (Button) findViewById(R.id.button);

        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast.makeText(getApplicationContext(), "버튼 클릭됨", Toast.LENGTH_SHORT).show();
            }

        });
    }
    
~~~
setOnClickListener를 사용하면 됩니다.
실행해볼까요?
![중간이미지](https://i.imgur.com/JEHTKXH.png)

---


## TextView 

~~~
    <TextView
        android:id="@+id/textView"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="텍스트뷰" />
        
~~~

버튼과 마찬가지로 xml에 추가해줍니다. 
그다음도 역시 버튼처럼 java에 선언해줍니다.
단순히 글자를 표시하기 위함이면 굳이 선언할 필요가 없지만, 만약 상황에 따라 TextView의 글자가 바뀌어야 한다면 선언해주어야 합니다.

다음에는 버튼을 누르면 Textview의 글자가 바뀌도록 해보겠습니다.
~~~

다음시간에 계속
