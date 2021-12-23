---
layout: post
title: "JAVA 객체지향 개념"
description: "java가 객체지향이라고 하는데, 그게 도대체 뭘까?"
author: sal
categories: [ JAVA ]
image: 
---


## 객체지향—
#### 여러 작업을 분업화한 다음 나중에 합치는 프로그래밍 패러다임

## 클래스 —
프로그래밍에서 특정 객체를 생성하기 위해 변수와 메소드를 정의하는 틀
프로그램을 만들 때는 구조를 파악하기 쉽도록 프로그램을 분할하는데 그때 우선 클래스 단위로의 분할을 고려한다.

~~~
public class 클래스명 {

}
~~~

클래스는 class 블록 내에 유지시킬 변수를 선언하여 만든다.
클래스가 갖는 변수를 '필드'라고 부른다.
    
---

## 객체(인스턴스) - 클래스를 이용해 만들어진 조각
> 클래스명 객체명 = new 클래스명()

#### new 키워드

new는 메모리를 할당하는 키워드이다.
힙(Heap) 영역에 공간을 할당해서 참조 값을 반환하여 주는 것인데
힙은 참조형 공간으로 해제 하기 전까지는 삭제되지 않는다.

객체변수는 각 클래스에서 <mark>독립적</mark>으로 활동 (서로 공유 X)

~~~
public static void main(String[] args) {
Animal cat = new Animal(); cat.setName("boby");
Animal dog = new Animal(); dog.setName("happy");
System.out.println(cat.name);
System.out.println(dog.name);
}
~~~
> [출력] boby happy

---
## 메소드 — 어떤 일을 수행한 다음에 결과물을 내어놓는 것
~~~
public int sum(int a, int b) {
return a+b;
public 자료형 메소드명(입력자료형1 입력변수1, 입력자료형2 입력변수2, …) {
…
return 리턴값;
}
~~~

### 메소드의 분류
- 입력과 출력이 모두 있는 메소드
- 입력과 출력이 모두 없는 메소드
- 입력은 없고 출력은 있는 메소드
- 입력은 있고 출력은 없는 메소드

### 생성자 — 클래스의 변수를 정하는 역할
생성자는 객체를 생성할 때 호출되는 메소드이다.
생성자는 다음 두 가지 특징을 갖는다.
- 메소드명이 클래스명과 동일하다.
- 반환값이 존재하지 않는다.
---
### 상속 — 쉽게 말하면 자식클래스가 부모클래스로 부터 무언가를 물려받는 것

~~~
자식클래스 extends 부모클래스
public class Animal {
…
}
public class Dog extends Animal {
…
}
~~~

위 코드에서 <mark>Dog클래스는 Animal클래스와 상속</mark>되었다.
그래서 Animal과 Dog클래스의 메소드, 객체는 서로 공유한다.

단, 아래 코드를 작성하면
~~~
Dog dog = new Animal();
~~~
컴파일 오류: 부모 클래스로 만든 객체는 자식 클래스의 자료형으로 사용할 수 없다.

>다른 언어에서 가능한 다중 상속은 java에서 지원하지 않는다.

[참고]
https://wikidocs.net/218

---

## 예제
사각형을 의미하는 클래스 Rectangle을 만들어보자.
~~~
public class Rectangle {
    public double width;
    public double height;
    
    public Rectangle() {
    }

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }
    
    public Rectangle(double width) {
        this.width = width;
    }
    
    public double getArea(double width, double width) {
        return width*height;
    }
    
     public double getArea() {
        return this.width*this.height;
    }
}
~~~

~~~
public double width;
public double height;
~~~
이 부분은 필드를 선언해준 부분이다.

다음은 생성자를 살펴보자. 인수와 필드의 이름이 동일할때는 단순히 width나 height를 사용하면 필드가 아닌 인수가 사용된다.
따라서 필드 변수에 접근할 때에는 명시적으로 this를 붙인다

~~~
public Rectangle() {}
~~~
이렇게 되어있는 부분을 보자. 인자값도 없고 안에 코드도 없다. 이는 기본 생성자이다.
기본 생성자는 굳이 작성하지 않아도 생성되어 있다. 단, 기본 생성자가 아닌 생성자를 만들면 이렇게 기본 생성자를 선언해줘야 사용할 수 있다.


~~~
public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }
~~~
위의 소스코드는 생성자에서 필드를 '초기화'하고 있는 예다.

#### 메소드 오버로딩
하나의 클래스 안에서는 이름이 같은 메소드를 여러개 지정할 수 없다.
단, 인수의 타입이나 인수의 수가 다를 경우에 한해 이름이 같은 메소드를 정의할 수 있다.
이를 메소드 오버로딩이라 한다.

생성자에서도 일반 메소드와 동일하게 오버로딩이 가능하다.
즉, 인수가 다른 생성자를 여러 개 정의할 수 있다.

~~~
public Rectangle(double width) {
        this.width = width;
    }
~~~
그래서 이런 식으로 이름이 같지만 인자가 다른 생성자를 여러개 만들 수 있다.

Main클래스를 만들어 main 메소드를 다음과 같이 작성해보자.

~~~
 public static void main(String[] args) {
        Rectangle r1 = new Student(); //기본 생성자 이용해 객체 생성
        Rectangle r2 = new Student(1.5, 2.5); //width와 height를 모두 인자로 갖는 생성자 이용해 객체 생성
        Rectangle r3 = new Student(1.5); //width만 인자로 넘기는 생성자 이용해 객체 생성
        
        System.out.println(r1.getArea()); //넓이 출력
    }
 ~~~
 
 다시 Rectangle 클래스로 돌아가 아래 부분을 살펴보자.
 ~~~
 public double getArea(double width, double width) {
        return width*height;
    }
 
 public double getArea() {
        return this.width*this.height;
    } 
    
 ~~~
이 코드는 메소드를 생성한 부분이다.
가로와 세로를 인수로 받아 넓이를 반환하는 메소드이다.
여기서도 동일 명칭의 메소드를 정의할 수 있는 '메소드 오버로딩'이 사용됐다.

메소드는 다음의 형태로 클래스 안에 선언한다.

> <수식자> <반환값의 타입> <메소드의 이름> (<인수1의 타입><인수1의 이름>, <인수2의 타입><인수2의 이름>....)

메소드는 호출시 값을 건넬 수 있는데 이 값을 '인수'라고 한다.
인수의 개수에는 제한이 없으며 아예 없어도 무관하다.

메소드를 호출한 후 결과를 반환할 수 있고 이 값을 '반환값'이라고 한다.
반환값이 없는 경우는 타입으로 'void'를 지정한다.
void가 아닌 경우 return을 통해 반드시 반환값을 넘겨줘야 한다.

~~~
        System.out.println(r1.getArea()); //넓이 출력
~~~
위 코드를 통해 넓이를 반환하는 메소드인 getArea를 호출해 넓이값을 반환받았고 이를 출력할 수 있다.
