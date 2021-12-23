---
layout: post
title: "안드로이드 레이아웃 종류"
description: "linearlayout, scollview, button 등과 같은 기본적인 안드로이드 레이아웃"
author: sal
categories: [ Android ]
image: 
---



# 1. Layout 클래스

UI 구성 시 사용되는 대표적인 레이아웃 클래스들
- LinearLayout
- RelativeLayout
- FrameLayout
- TableLayout
- ListView와 GridView
- ScrollView


![중간 이미지](https://t1.daumcdn.net/cfile/tistory/261CF539579846111B)

---

## LinearLayout

####  여러 View 위젯들을 가로 또는 세로 방향으로 나열할 때 사용
LinearLayout의 자식(Children)으로 배치되는 View 위젯들은 오직 한 방향(가로 또는 세로)으로만 배치가 가능하기 때문에 위젯의 크기(높이 또는 너비)와 관계없이 한 줄로만 배열된다.

또한 View 위젯들은 서로 중첩되지 않고 지정한 방향대로 쌓이는 형태로(stacked) 표시된다.

![중간 이미지](https://t1.daumcdn.net/cfile/tistory/231D1039579842EA11)

> LinearLayout은 전체 영역 대비 비율의 개념인 Weight(가중치)를 설정할 수 있다.

---


## RelativeLayout

####  RelativeLayout은 자식(Children) View 위젯들이 서로 간의 상대적 배치 관계에 따라 화면에 표시될 위치가 결정되도록 만들어주는 Layout 클래스

"A를 RelativeLayout 내의 왼쪽을 기준으로 배치"하거나 "B를 RelativeLayout의 한 가운데 배치"하도록 하는 경우를 예로 들 수 있다.

> RelativeLayout은 효율적이고 활용성이 뛰어나지만, 개발자가 원하는 레이아웃을 구현하기에는 다소 어려움이 있다.

![중간 이미지](https://t1.daumcdn.net/cfile/tistory/27791139579842F534)

---

## FrameLayout

#### FrameLayout은 주로 하나의 자식 View 위젯만 표시할 때 사용하는 Layout 클래스

FrameLayout에 여러 View 위젯을 자식으로 추가하면 겹쳐진 형태로 표시된다.

> FrameLayout이 많이 사용되는 예 중에 한 가지는 Fragment를 사용하는 경우이다. 특히 여러 Fragment를 동일한 위치 내에서 교체하여 표시하고자 할 때 FrameLayout을 사용한다.

ex) 채팅 앱에서 메인 화면 구성과 같이 탭으로 이루어진 UI

![중간 이미지](https://t1.daumcdn.net/cfile/tistory/24147B39579842E919)

---

## TableLayout

#### TableLayout은 자식(Children) View 위젯들을 테이블(행과 열로 구성)로 나누어 표시하는 Layout 클래스

먼저 TableRow 클래스를 사용하여 하나의 행을 추가해야 합니다. 추가된 각 행에 View 위젯을 추가하면 테이블 형태로 정렬되어 표시된다.

> 계산기 키패드 구성이 그 대표적인 예


![중간 이미지](https://t1.daumcdn.net/cfile/tistory/240C6E39579842F522)

---

## ListView, GridView

#### 동일한 자식 View 위젯을, 내용만 달리하여 반복적으로 표시해야 하는 경우에 주로 사용되는 상속 Layout 클래스

![중간 이미지](https://t1.daumcdn.net/cfile/tistory/23148E39579842EB19)

---

## ScrollView


#### 위젯이나 레이아웃이 화면에 넘칠 때 사용하는 Layout

- HorizontalScrollView를 이용해 좌우로 스크롤도 가능하다.

> 스크롤뷰에는 단 하나의 위젯만 넣을 수 있다.
따라서 스크롤뷰 안에 레이아웃을 넣고 그 안에 여러개의 위젯을 넣는 방법을 사용한다.


![중간 이미지](https://t1.daumcdn.net/cfile/tistory/25379445590961A317)

---
## 레이아웃 사용 예제

레이아웃을 사용할 때는 다양한 속성들을 이용해 레이아웃을 구성할 수 있다.
```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
              android:layout_width="match_parent"
              android:layout_height="match_parent"
              android:orientation="vertical" >
    <EditText android:id="@+id/text1"
              android:layout_width="wrap_content"
              android:layout_height="wrap_content"
              android:text="TEXTVIEW1" />
    <Button android:id="@+id/button1"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="BUTTON1" />
</LinearLayout>
```

---

# View 클래스

#### View는 Android의 UI(User Interface)화면을 구성하는 최상위 클래스이다. Android 화면에 보여주는 모든 구성요소이다.

>가장 대표적인 예로 Button과 TextView 등이 있다.

---

## Button
#### Button은 사용자가 화면을 터치했을 때 발생하는 클릭 이벤트를 처리하는 기능을 가진, 텍스트 또는 아이콘(또는 텍스트와 아이콘 모두)으로 구성된 View 위젯

## 사용법
Button1이라는 id를 가진 버튼을 추가해보는 코드.
1. layout.xml 파일에 버튼 Widget을 추가한다.

```xml
<Button
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:id="@+id/button1"
    android:text="Button Example" />
```

2. JAVA 코드에서 Button 선언

```java
  Button button1 = (Button) findViewById(R.id.button1) ;
```

3. 버튼 클릭 이벤트 생성
```java
@Override
   protected void onCreate(Bundle savedInstanceState) {

       // 여기서 부터 추가해야 할 부분

       button1.setOnClickListener(new Button.OnClickListener() {
           @Override
           public void onClick(View view) {
               // 버튼 클릭 시 실행할 코드
           }
       });
   }
```
[https://recipes4dev.tistory.com/](https://recipes4dev.tistory.com/)에서 레이아웃 설명 이미지를 가져왔습니다.