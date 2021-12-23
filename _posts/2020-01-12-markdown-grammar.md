---
layout: post
title: "Markdown 문법"
description: "마크다운 기본 개념 및 문법 정리"
author: sal
categories: [  ]
image: 
---

# 마크다운이란?

Markdown은 텍스트 기반의 마크업 언어로 웹컨텐츠를 매우 간단한 구조의 문법을 사용하여 작성할 수 있다.
마크다운은 지원 플랫폼이 다양하며 보관이 용이하다는 장점이 있다.

---

# 마크다운 문법

## Header

~~~
This is an H1
=============
~~~

## 작은 Header

~~~
This is an H2
-------------
~~~

## 문서 제목(h1 ~ h6)

~~~
# This is a H1
## This is a H2
### This is a H3
#### This is a H4
##### This is a H5
###### This is a H6
~~~

## BlockQuote

~~~
> This is a blockqute.
~~~

## 목록

~~~
1. 첫번째
2. 두번째
3. 세번째
~~~

~~~
* 빨강
  * 녹색
    * 파랑

+ 빨강
  + 녹색
    + 파랑

- 빨강
  - 녹색
    - 파랑
~~~

## 코드

~~~
``` This is a normal paragraph: This is a code block. end code block. ```
~~~


## 수평선(문서 나누기)

~~~
* * *

***

*****

- - -

---------------------------------------
~~~

## 링크

~~~
[link keyword][id]
[id]: URL "Optional Title here"
~~~

이런 형식으로 작성하면 된다.
아래는 구글 링크 예제

~~~
Link: [Google][googlelink]
[googlelink]: https://google.com "Go google"
~~~

## 강조

~~~
*single asterisks*
_single underscores_
**double asterisks**
__double underscores__
++underline++
~~cancelline~~
~~~

## 이미지

~~~
![Alt text](/path/to/img.jpg)
![Alt text](/path/to/img.jpg "Optional title")
~~~

사이즈 조절이 필요한 경우는 아래 코드 사용

~~~
<img src="/path/to/img.jpg" width="450px" height="300px" title="px(픽셀) 크기 설정" alt="RubberDuck"></img><br/>
<img src="/path/to/img.jpg" width="40%" height="30%" title="px(픽셀) 크기 설정" alt="RubberDuck"></img>
~~~

이 블로그는 한글 마크다운을 지원하므로 아래와 같이 작성해도 가능하다.

~~~
![중간 이미지](/path/to/img.jpg)
~~~

---