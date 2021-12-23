---
layout: post
title: "JAVA 변수 알아보기"
author: sal
categories: [ JAVA ]
image: 
---

타입 종류와 래퍼 클래스, 리터럴, 스코프, 라이프타임, 캐스팅 등 JAVA 변수 A-Z 알아보기

## 변수란?
"하나의 값을 저장할 수 있는 저장공간"

### 변수 선언 예제

```java
		 //long 타입 값에는 소문자 l이나 대문자 L을 붙여야 합니다.
		 long longNum= 3456789L;
		 
		 // float 타입 값에는 소문자 f나 대문자 F를 붙여야 합니다.
	         float floatNum = 32.5f;

		 double ddoubleNum = 23.34; //실수형

		 boolean flag = false; //논리형

		 char charValue = 'a'; //문자형

		 int intValue = 20; //정수형
	
```


### 기본형 타입(Primitive type)
총 8가지의 기본형 타입(boolean, byte, short, int, long, float, double, char)이 있다.
기본값이 있기 때문에 Null이 존재하지 않는다. 만약 기본형 타입에 Null을 넣고 싶다면 래퍼 클래스를 활용한다.
실제 값을 저장하는 공간으로 스택(Stack) 메모리에 저장된다.
만약 컴파일 시점에 담을 수 있는 크기를 벗어나면 에러를 발생시키는 컴파일 에러가 발생한다.

---
> 타입 : 할당 메모리 - 기본값 - 표현범위
#### 논리형 -
> boolean : 1byte - false - true/false

#### 정수형
> byte : 1byte - 0 - (-128)~127

> short : 2byte - 0 - (-32,768)~32,767

> int(기본) : 4byte - 0 - (-2,147,483,648) ~ 2,147,483,647

> long : 8byte - 0L - (-9,223,372,036,854,775,808) ~ 9,223,372,036,854,775,807

#### 실수형
> float : 4byte - 0.0F -  (3.4 X 10^-38) ~ (3.4 X 10^38) 의 근사값

> double(기본) : 8byte - 0.0 - (1.7 X 10^-308) ~ (1.7 X 10^308) 의 근사값

#### 문자형
> char : 2byte(유니코드) -  '\u0000' - 0 ~ 65,535
--- 

### 참조형 타입(Reference type)
기본형 타입을 제외한 타입들은 모두 참조형 타입(Reference type)이다.
Null이 존재하며 값이 힙(Heap) 메모리에 저장된다. 즉 메모리에 바로 저장되지 않고 주소값이 저장되는 것이다.
객체나 배열을 Null 값으로 받으면 NullPointException이 발생하므로 변수값을 넣어야 한다.
타입별로 기본 메소드들을 사용할 수 있다.

```java
String str1 = null;
        String str2 = "hello";
        String str3 = new String("world"); // 메모리에 바로 저장되는게 아닌 주소값이 저장됨
        str.length(); //기본 메소드들이 존재함
```

--- 

이렇게 자바의 자료형은 크게 기본형 타입(primitive type)과 참조형 타입(reference type)으로 나눌 수 있다.
그런데 기본 타입의 데이터를 객체로 표현해야 하는 경우, 기본형 타입(primitive type)을 객체로 다루기 위해서 사용하는 클래스들을 래퍼 클래스(wrapper class)라고 한다.

| 기본타입(primitive type) | 래퍼클래스(wrapper class) |
|:------------------------:|:-------------------------:|
| byte                     | Byte                      |
| char                     | Character                 |
| int                      | Integer                   |
| float                    | Float                     |
| double                   | Double                    |
| boolean                  | Boolean                   |
| long                     | Long                      |
| short                    | Short                     |

래퍼 클래스는 java.lang 패키지에 포함되어 있으며 위 표와 같이 기본 타입에 대응되는 래퍼 클래스들이 있다.
char타입과 int타입이 각각 Character와 Integer, 나머지는 기본 타입의 첫 글자를 대문자로 바꾼 이름이다.

아래는 String(문자열)을 기본 타입(byte, int, short, long, float, double, boolean)으로 바꾸는 예제이다)
```java
        String str = "10";
        String str2 = "10.5";
        String str3 = "true";
        
        byte b = Byte.parseByte(str);
        int i = Integer.parseInt(str);
        short s = Short.parseShort(str);
        long l = Long.parseLong(str);
        float f = Float.parseFloat(str2);
        double d = Double.parseDouble(str2);
        boolean bool = Boolean.parseBoolean(str3);
		
        System.out.println("문자열 byte값 변환 : "+b);
        System.out.println("문자열 int값 변환 : "+i);
        System.out.println("문자열 short값 변환 : "+s);
        System.out.println("문자열 long값 변환 : "+l);
        System.out.println("문자열 float값 변환 : "+f);
        System.out.println("문자열 double값 변환 : "+d);
        System.out.println("문자열 boolean값 변환 : "+bool);
```
> 문자열 byte 값 변환 : 10  
> 문자열 int값 변환 : 10  
> 문자열 short값 변환: 10  
> 문자열 float값 변환 : 10.5  
> 문자열 double값 변환 : 10.5  
> 문자열 boolean값 변환 : true  

---

### 리터럴(literal)
"프로그램에서 고정된 값"
즉 변수에 넣는 변하지 않는 데이터를 의미한다.
리터럴의 종류로는 정수형(integer), 실수형(Floating point, 부동소수형), 부울형(boolean), 문자형(character), 그리고 문자열(String)이 있다.

이때 double과 float은 각각 D(생략 가능), f를 끝에 붙여줘야 한다.
```java
float a = 0.1234f;
double b = .1234D;
```

---

### 변수의 스코프와 라이프타임
#### 스코프
영역이란 뜻으로 변수에 접근할 수 있는 범위를 얘기한다.
변수가 선언된 블록({로 시작하고 }로 끝남)내에서는 접근할 수 있다.

#### 전역변수와 지역변수
Class 영역에서 선언한 변수를 전역 변수(Global Variable)라 한다. 이는 클래스 안이라면 어디서나 사용이 가능하다.
메소드 내에서 선언하는 변수는 지역 변수(Local varaible)라고 하는데 메소드 안에서만 사용할 수 있다.
	
#### 라이프타임
변수의 생명주기(변수가 생성되고 죽는것)를 의미한다.
즉, 변수가 메모리에서 살아있는 기간이 라이프타임이다.

클래스에 선언된 변수는 클래스 전체 클래스가 초기화되고 프로그램이 끝날 때 까지 살아있고,
지역변수는 선언된 블록내부 변수 선언 이후 부터 블록을 벗어날 때까지 살아있다.

static 키워드가 있는 변수는 클래스 내에서 공유되어 어디서나 사용 가능하고
main 메소드에서는 static 변수가 아닐 경우 객체화해야 클래스 변수를 사용할 수 있다.

---

### 타입 캐스팅(형변환)
형변환(type casting)이란 변수의 타입을 변경하는 것이다.
형변환에는 두 가지 종류가 있다.

#### 캐스팅(다운 캐스팅)
큰 데이터 타입에서 작은 데이터타입으로의 변환이다.
데이터 손실이 발생하므로, 직접 선언해줘야 한다(강제캐스팅)

```java
double a = 9.81;
int b = (int) a; // 9.81 -> 9 (소수점 이하 버려짐)
```

#### 타입 프로모션(업 캐스팅)
작은 데이터타입에서 큰 데이터타입으로의 변환을 의미하며 자동으로 변환된다.

```java
int x = 3;
double y = x; // 3 -> 3.0 (자동 변환 후, 대입)

String name = "sehong";
Object obj = name; // String 타입을 Object클래스로 자동 변환
```




