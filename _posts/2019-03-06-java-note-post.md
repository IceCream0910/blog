---
layout: post
title: "JAVA 개념 간단하게 정리"
description: "java 기초 개념 다 정리해드림."
author: sal
categories: [ JAVA ]
image: 
---

## 1. 주석
- 코드 중간에 해당코드에 대해 설명해주는 것
- 프로그램에 영향미치지 않음.
<mark>협업 시 많이 사용</mark>됨.


### 이렇게
~~~
/*
이것은 주석입니다.
이렇게 여러줄 주석을 넣을 수 있죠
멋지죠
그럼 변수에 대해 알아보죠.
*/
~~~
---
## 2. 변수
- 어떠한 <mark>값을 저장</mark>할 수 있는 공간
- 타입을 맞춰서 저장해야 함(정수형 변수에 문자 넣을 수 없음)

### 이런 식으로
~~~
int a =1;
~~~
---


## 3. 함수(method)
- 클래스의 기능, 입력을 가지고 <mark>어떤 일을 수행</mark>한 다음에 결과물을 내어놓는 것

## 함수를 사용하는 이유?

> 가끔 프로그래밍을 하다 보면 <mark>똑같은 내용</mark>을 자신이 <mark>반복</mark>해서 적고 있는 것을 발견할 때가 있다. 이 때가 바로 메소드가 필요한 때이다. 반복되는 작업을 좀 더 수월하게 할 수 있도록 도와주는 것이 바로 함수이다.

---

## 4. 기본형 타입
- 어떠한 값을 저장할 수 있는 공간
- 타입을 맞춰서 저장해야 함(정수형 변수에 문자 넣을 수 없음)

### 종류
- 정수형 : byte, short, int, long
- 부동소수점 : float, double
- 논리형(참,거짓) : boolean
- 문자형 : char, String

### 4-1. 형변환
- 다른 타입의 변수 간에 값을 공유하기 위한 과정
- 예) 숫자 -> 문자


int to String
```java
String str = Integer.toString(i);
String str = “” + i;
```
String to int
```java
int i = Integer.parseInt(str);
int i = Integer.valueOf(str).intValue();
```
double to String
```java
String str = Double.toString(d);
```
long to String
```java
String str = Long.toString(l);
```
float to String
```java
String str = Float.toString(f);
```
String to double
```java
double d = Double.valueOf(str).doubleValue();
```
String to long
```java
long l = Long.valueOf(str).longValue();
long l = Long.parseLong(str);
```
String to float
```java
float f = Float.valueOf(str).floatValue();
```
ASCII Code to String
```java
String char = new Character((char)i).toString();
```
Integer to ASCII Code
```java
int i = (int) c;
```
Integer to boolean
```java
boolean b = (i != 0);
boolean to Integer
int i = (b)? 1 : 0;
```
되게 많다. 자주 쓰이는 건 위에 몇 개 정도이다.

---

## 5. 산술연산자
- 산술하는 연산자.
- 쉽게 말하면 더하기 빼기 나누기 곱하기 이런 거.

#### 더하기(+), 빼기(-), 나누기(/), 곱하기(*), 나머지(%)
나누기와 곱하기, 나머지는 위의 기호로 표현한다.

> 타입에 따라 결과가 달라지거나 오류가 나므로 형변환을 이용해 똑같은 타입끼리 계산하는 게 좋다.

---

## 6. 비교연산자
- 부등호, 등호와 같이 <mark>두 값을 비교</mark>하는 비교연산자

![중간 이미지](https://miro.medium.com/max/697/1*4kROuXqFwiTBa18UF_-OQg.png)

---

## 7. if
- 어떠한 조건을 만족하거나 만족하지 않을 때 특정 코드를 실행하도록 하는 <mark>조건문</mark>

#### 기본 형식
```java
if(조건) {
//참일때 실행될 코드
}
else if(조건2) {
//조건2가 참일때 실행될코드
}
else {
//모두 아닐 때 실행될 코드
}
```

---

## 8. 삼항연산자
- 어떤 <mark>조건을 나타내는 연산자</mark>.
- and, or...

![중간 이미지](https://miro.medium.com/max/683/0*4mYmqfYnqf8CqB_j)

---

## 9. for
- 반복문의 한 종류로 많이 사용됨.

#### 예시
```java
for (int i =0; i<5;i++) {
//반복 코드
}
```

괄호 안에는 조건을 넣는데
0부터 5까지 5번 반복하고 싶으면 위처럼 하면 됨. 괄호 끝에 i++는 i를 1씩증가시킨다는 뜻.(i=i+1의 약식코드)

---

## 10. 배열(Array, List, arrayList)

- 자료를 저장하는 공간으로 개념 자체는 변수와 비슷한데,이건 index를 통해 특정 위치의 값을 변경하거나 삭제, 가져올 수 있음.

```java
int[] array = new int[11];
```
또는
```java
int array[] = new int[11];
```
new int[]에서 대괄호 안에 있는 숫자는 배열의 크기를 의미
이렇게 말고, 아예 선언이랑 배열 안에 값을 지정하는 방법

```java
int[] array = {1, 2, 3, 4, 5};
```

배열도 역시 자료의 타입이랑 변수 타입이랑 맞춰줘야 함.
문자를 배열에 넣으려면

```java
String[] array = {"a", "b", "c", "d");
```
배열의 index는 0부터 시작
위 예제에서 a를 가져오려면 index 0값을 가져와야 함.
가져오는 방법은

배열의 이름[index값];
```java
array[0];
```
값을 수정하는 것도 마찬가지
```java
array[0] = 3;
```

