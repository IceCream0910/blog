---
layout: post
title: "JAVA 생성자, 메소드 오버로딩"
description: "JAVA 생성자, 메소드 오버로딩 정리"
author: sal
categories: [ JAVA ]
image: 
---

## 생성자
생성자는 객체를 만들 때 호출된다.
생성자는 다음과 같은 형식으로 만들 수 있다.
```java
  public Car(인자변수타입1 인자변수명1, 인자변수타입2 인자변수명2) {
        
    } 
```

생성자는 다음과 같은 규칙을 따른다.
- 클래스명과 메소드명이 동일하다.
- 리턴타입을 정의하지 않는다.

예제 코드를 보며 자세히 알아보자.

### Car.java
```java
public class Car {
    String color;
    String mission;
    String kind;
    int doorCount;
    int seat;

    Car() {
    }

    Car(String color, int doorCount, String kind, String mission, int seat){
        this.color = color;
        this.doorCount = doorCouont;
        this.kind = kind;
        this.mission = mission;
        this.seat = seat;
    }

    Car(String color) {
        this.color = color;
    }
}
```
Car 클래스에서 선언된 color, mission, kind, doorcount, seat는 멤버 변수라고 한다.
그 아래에 있는 코드가 바로 생성자를 만들어주는 것이다.
```jvaa
Car() {}
```
인자값이 아무것도 없는 이 생성자가 바로 기본 생성자이다. 이 기본 생성자는 별도로 만들지 않아도 클래스에 포함되어 있다.(생략되어있음)
그러나 위 예제 코드와 같이 인자값을 받는 다른 생성자가 존재하는 경우 기본 생성자를 따로 생성해주어야 한다.

```java
    Car(String color, int doorCount, String kind, String mission, int seat){
        this.color = color;
        this.doorCount = doorCouont;
        this.kind = kind;
        this.mission = mission;
        this.seat = seat;
    }
```
위 코드는 color, mission, seat을 인자값으로 받는 생성자이다.
여기서 this.을 이용해 멤버 변수의 값을 변경해준다.

## 메소드 오버로딩

```java
Car(String color) {
        this.color = color;
    }
```
그런데, 그 아래를 보자. 이번에는 color만을 인자로 받는 Car 생성자를 만들어주었다.
뭔가 이상한 점을 발견할 수 있다. 위에서 선언한 메소드들과 이름이 Car로 모두 같다.
이것이 바로 메소드 오버로딩이다. 메소드 오버로딩은 인자값의 개수와 종류가 다른 경우 이름이 같을 수 있다는 것을 의미한다.

이제 Main함수에서 객체를 선언하고 Car클래스에 있는 멤버변수들을 출력해보자.
Main.java
```java
Car car1 = new Car();
        car1.color = "white";
        car1.doorCount = 1;
        car1.kind = "suv";
        car1.mission =  "manual";
        car1.seat = 5;
```
기본 생성자를 이용한 코드이다. car1 객체를 선언해준 다음, 각각의 변수들을 지정해주었다.
이때 위에서 만든 생성자를 이용하면 코드를 줄일 수 있다.

```java
Car car1 = new Car("white", 1, "suv", "manual", 5);
```

---
## Getter와 Setter
Animal 클래스를 새로 만들어보자.
```java
public class Animal {
    private String name;
    private int age;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public Animal(String name) {
        this.name = name;
    }

    public Animal(int age) {
        this.age = age;
    }

    public Animal() {}

}
```

Animal클래스의 멤버변수들이 모두 private(접근 제어자)로 선언되었다. 즉 동일한 클래스에서만 접근이 가능하기 때문에 위에서 했던 방법으로 멤버변수들에 접근할 수 없다.
이때 Getter, Setter를 사용할 수 있다.

Getter와 Setter는 이클립스나 Intellj와 같은 IDE에서 마우스 우클릭 > Generate > Getter and Setter를 이용해 쉽게 만들 수 있다.

```java
public String getName() {
    return name;
}
```
이게, getter이다. 말그대로 멤버변수 name을 반환하는 메소드이다.

```java
public void setName(String name) {
   this.name = name;
}
```
이건 setter, name을 받아 멤버변수에 저장해주는 메소드이다.
이제 이 Getter와 Setter를 사용해 Main 클래스에서도 멤버변수의 값을 변경하고 가져올 수 있다.

```java
Animal cat = new Animal();
        cat.setAge(1);
        cat.setName("나비");
        System.out.println("고양이의 나이는 "+cat.getAge());
        System.out.println("고양이의 이름은 "+cat.getName());
```
Animal 객체를 생성해준후, setAge, getAge와 같은 메소드를 활용해 Animal클래스의 멤버변수 값에 접근할 수 있다.




