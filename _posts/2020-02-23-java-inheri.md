---
layout: post
title: "자바 객체지향 - 상속"
description: "자바 객체지향 프로그래밍, 상속"
author: sal
categories: [ JAVA ]
image: 
---

# 상속

말 그대로 자식이 부모로 부터 무언가를 물려받는 것이다.

예시를 보자.
```java
public class Animal {
    String name;

    public void setName(String name) {
        this.name = name;
    }
}

public class Dog extends Animal {

}
```

클래스 상속을 위해서는 extends라는 키워드를 사용한다.
Dog 클래스에 name 이라는 객체변수와 setName 이라는 메소드를 만들지 않았지만 Animal클래스를 상속을 받았기 때문에
그대로 사용이 가능하다. 
Dog 클래스에 다음과 같은 main 메소드를 구현하고 실행시켜 보자.

```
public class Dog extends Animal {
    public static void main(String[] args) {
        Dog dog = new Dog();
        dog.setName("poppy");
        System.out.println(dog.name);
    }
}
```java

실행하면 "poppy"가 출력된다.

```java
public class Dog extends Animal {
    public void sleep() {
        System.out.println(this.name+" zzz");
    }

    public static void main(String[] args) {
        Dog dog = new Dog();
        dog.setName("poppy");
        System.out.println(dog.name);
        dog.sleep();
    }
}
```
Dog클래스가 Animal클래스보다 더 많은 기능을 가지고 있다.
이렇듯 보통 부모 클래스를 상속받은 자식 클래스는 부모의 기능에 더하여 좀 더 많은 기능을 갖도록 한다.

# IS-A 관계

위 예제처럼 Dog가 Animal의 하위개념이기 때문에 이럴 때 IS-A라고 표현한다.
즉 Dog는 Animal이다. 라고 말할 수 있는 관계이다.

```
Dog dog = new Animal();
```java
컴파일 오류: 부모 클래스로 만든 객체는 자식 클래스의 자료형으로 사용할 수 없다.

---

#메소드 오버라이딩

```
public class HouseDog extends Dog {
    public void sleep() {
        System.out.println(this.name+" zzz in house");
    } 

    public static void main(String[] args) {
        HouseDog houseDog = new HouseDog();
        houseDog.setName("happy");
        houseDog.sleep();
    }
```java

HouseDog클래스에 Dog클래스와 동일한 형태의 메소드를 구현한다면 HouseDog의 sleep이 Dog클래스의 sleep보다 더 우선적으로 실행되어
실행되게 된다. 즉, 입력항목이 다른 경우 동일한 이름의 메소드를 만들 수 있다.
이렇게 부모클래스의 메소드를 자식클래스가 동일한 형태로 또다시 구현하는 행위를 메소드 오버라이딩(Method Overriding)이라고 한다. (※ 메소드 덮어쓰기)

---

# 자바는 아래와 같은 식의 다중 상속을 지원하지 않는다.

```java
class C extends A, B {
    public void static main(String[] args) {
        C test = new C();
        test.msg();
    }
}
```

