---
layout: post
title: "자바 객체지향 - 생성자"
description: "자바 객체지향 프로그래밍, 생성자"
author: sal
categories: [ JAVA ]
image: 
---

# 생성자

메소드명이 클래스이름과 동일하고 리턴 자료형이 없는 메소드를 생성자라고 한다.

> 생성자의 규칙
1. 클래스명과 메소드명이 동일한다.
2. 리턴타입을 정의하지 않는다.

HouseDog라는 클래스를 다음과 같이 수정하면
```java
public class HouseDog extends Dog {
    public HouseDog(String name) {
        this.setName(name);
    } 

    public void sleep() {
        System.out.println(this.name+" zzz in house");
    } 

    public void sleep(int hour) {
        System.out.println(this.name+" zzz in house for " + hour + " hours");
    } 

    public static void main(String[] args) {
        HouseDog dog = new HouseDog("happy"); //new로 생성했으므로 반드시 괄호안에 값이 있어야 한다.
        System.out.println(dog.name);
    }
}
```

happy가 출력된다.
생성자를 사용했을 때 얻게 되는 이득은 setName("happy")와 같은 필수적인 행동을 객체 생성시에 제어할 수 있게 된다는 점이다.

---

# default 생성자

```java
public class Dog extends Animal {
    public Dog() {
    }

    public void sleep() {
        System.out.println(this.name + " zzz");
    }
}
```

위와 같이 생성자의 입력항목이 없고 생성자 내부에 아무 내용이 없는 생성자를 default 생성자라고 부른다.

```java
    public HouseDog(String name) {
        this.setName(name);
    }

    public HouseDog(int type) {
        if (type == 1) {
            this.setName("yorkshire");
        } else if (type == 2) {
            this.setName("bulldog");
        }
    }
```

마찬가지로 하나의 클래스에 이름이 같은 여러 생성자를 만들 수 있다.
이제 다음 두가지 방법으로 객체를 생성할 수 있다.
```java
HouseDog happy = new HouseDog("happy");
HouseDog yorkshire = new HouseDog(1);
```

~~~
happy
yorkshire
~~~
