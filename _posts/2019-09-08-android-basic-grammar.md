---
layout: post
title: "안드로이드 개발에서 많이 쓰는 코드들"
description: "java 다음은, 안드로이드 앱 개발 기초를 알아보자."
author: sal
categories: [ Android ]
image: 
---

## findViewByld — layout.xml에서 지정한 컴포넌트의 id의 이름으로 찾아서 초기화해줌(컴포넌트에 변수 지정)

```java
Button bu1 = findViewById(R.id.button1);
```

## setOnClickListner — 버튼 클릭 이벤트 처리
```java
Button bu1 = findViewById(R.id.button1);
buttonReset.setOnClickListener(new View.OnClickListener() {
    @Override
    public void onClick(View v) {
        //클릭시 이벤트
    }
});
```

## Override — 메소드 재정의 (없으면 오류 발생 가능)
```java
@Override
public void onClick(View v) {
...
```
