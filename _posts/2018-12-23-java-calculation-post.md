---
layout: post
title: "JAVA 연산자"
description: "java 연산자 개념 정리"
author: sal
categories: [ JAVA ]
image: 
---

### 산술 연산자

말 그대로 산술하는 연산자이다.
더하기 빼기 나누기 곱하기와 같은 계산에 사용된다.

> 더하기(+), 빼기(-), 나누기(/), 곱하기(\*), 나머지(%)
> 나누기와 곱하기, 나머지는 위의 기호로 표현한다.

타입에 따라 결과가 달라지거나 오류가 나므로 형변환을 이용해 똑같은 타입끼리 계산해야 한다.

이때 ++와 --는 기술하는 위치에 따라 순서에 차이가 있다.
연산자를 왼쪽에 작성하면(전치 연산) 먼저 계산을 한 후 그 결과를 사용한다.
반대로 연산자를 오른쪽에 작성하면(후치 연산) 현재의 값이 사용되고 나서 그 후에 계산을 한다.
아래 코드를 통해 살펴보자.

```java
int numberA = 1;
int numberB = 1;

System.out.println(numberA+numberB); //더하기
System.out.println(numberA-numberB); //빼기
System.out.println(numberA*numberB); //곱하기
System.out.println(numberA/numberB); //나누기
System.out.println(numberA%numberB); //나머지
System.out.println(++numberA); //2
System.out.println(numberB++); //1
System.out.println(numberB); //2
```

---

### 비트연산자

비트 연산자는 숫자값의 비트 연산을 할 수 있는 연산자다.

| 연산자 | 설명          | 예                                                  |
| ------ | ------------- | --------------------------------------------------- |
| ~      | 비트의 반전   | a = ~a;                                             |
| &      | 비트 단위 AND | 1 & 1 //1반환 그 외는 0                             |
| \|     | 비트 단위 OR  | 0\|0 //0반환 그 외는 1                              |
| ^      | 비트 단위 XOR | 두 개의 비트가 서로 다른 경우에 1 반환              |
| <<     | 왼쪽 shift    | a << 2 //변수 a를 2비트만큼 왼쪽으로 이동           |
| >>     | 오른쪽 shift  | a >> 2 //변수 a를 2비트만큼 오른쪽으로 이동         |
| >>>    | 오른쪽 shift  | >>와 동일한 연산 채워지는 비트가 부호와 상관 없이 0 |

---

### 관계연산자

관계 연산자는 2개의 값을 비교해 true/false를 반환하는 연산자이다.

| 연산자 |       설명                                                          |
|--------|---------------------------------------------------------------|
| <      | 왼쪽 항이 크면 true, 아니면 false 반환                        |
| >      | 왼쪽 항이 작으면 true, 아니면 false 반환                      |
| <=     | 왼쪽 항이 오른쪽 항보다 크거나 같으면 ture, 아니면 false 반환 |
| <=     | 왼쪽 항이 오른쪽 항보다 작거나 같으면 true, 아니면 false 반환 |
| ==     | 두 개 항의 값이 같으면 true, 아니면 false 반환                |
| !=     | 두 개 항이 다르면 true, 아니면 false 반환                     |

---

### 논리연산자

논리 연산자는 참과 거짓을 판정하는 논리 연산을 실시하기 위한 연산자이다.

| 연산자 | 설명                                                 |
|--------|------------------------------------------------------|
| &&     | 왼쪽 항이 크면 true, 아니면 false 반환               |
| \|\|   | 왼쪽 항이 작으면 true, 아니면 false 반환             |
| !      | 참인 경우 거짓으로 바꾸고, 거짓인 경우 참으로 바꾼다 |

```java
boolean flag1 = true;
        boolean flag2 = false;
        System.out.println(conditionA || conditionB); //true
	System.out.println(conditionA && conditionB); //false
```

---

### 삼항연산자

> 조건식? 결과1: 결과2;
> 조건식이 ture이면 결과1을 실행하고 false면 결과2를 실행하라는 조건문을 만들어내는 연산자 이다.

```java
int num3= (5>3)? 10:20;
System.out.println(num3); // 10

int num4 = 10;
int num5 = 20;
int max = (num4 > num5)?num4:num5;
System.out.println(max); //20
```

### 연산자 우선순위

기본적으로 연산자에는 우선순위가 있으며, 괄호의 우선순위가 제일 높고, 산술 > 비교 > 논리 > 대입의 순서로 수행된다(비트 > 관계 > 논리 > 삼항)
연산자의 연산 진행방향은 왼쪽에서 오른쪽으로 수행되며, 단항 연산자와 대입 연산자의 경우에는 오른쪽에서 왼쪽으로 수행된다.
