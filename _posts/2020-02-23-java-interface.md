---
layout: post
title: "자바 객체지향 - 인터페이스"
description: "자바 객체지향 프로그래밍, 인터페이스"
author: sal
categories: [ JAVA ]
image: 
---

> 호랑이가 오면 사과를 준다.
> 사자가 오면 바나나를 준다.

위 상황을 코드로 나타내보자.

Animal.java
```java
public class Animal {
    String name;

    public void setName(String name) {
        this.name = name;
    }
}
```


Tiger.java
```java
public class Tiger extends Animal {

}
```

Lion.java
```java
public class Lion extends Animal {

}
```

ZooKeeper.java
```java
public class ZooKeeper {
    public void feed(Tiger tiger) {
        System.out.println("feed apple");
    }

    public void feed(Lion lion) {
        System.out.println("feed banana");
    }

    public static void main(String[] args) {
        ZooKeeper zooKeeper = new ZooKeeper();
        Tiger tiger = new Tiger();
        Lion lion = new Lion();
        zooKeeper.feed(tiger);
        zooKeeper.feed(lion);
    }
}
```

실행하면 feed apple과 feed banana가 나올 것이다.
그런데 지금은 호랑이와 사자밖에 없지만 동물들이 더 많아진다면
매번 feed 메소드를 추가해야 한다.

이를 해결하기 위해 인터페이스를 사용한다.

# 인터페이스 생성

기본적으로 인터페이스는 class가 아닌 interface로 만들어준다.
Predator라는 인터페이스를 작성해보자.

```java
public interface Predator {

}
```

predator 인터페이스에 다음과 같은 메소드를 추가해보자.
```java
public interface Predator {
    public String getFood();
}
```

그리고 Lion과 Tiger는 작성한 인터페이스를 구현하도록 해준다.

```java
public class Tiger extends Animal implements Predator {
    public String getFood() {
        return "apple";
    }
}
```

사자도
```java
public class Lion extends Animal implements Predator {
    public String getFood() {
        return "banana";
    }
}

```

인터페이스 구현은 implements를 사용한다.

그런다음 feed 메소드를 변경해준다.

```java
    public void feed(Predator predator) {
        System.out.println("feed "+predator.getFood());
    }
```

이렇게 하면 정상적으로 원하는 결과가 출력된다.

```java
feed apple
feed banana
```

# 인터페이스의 필요성
동물의 개수만큼 feed메소드가 필요했던 기존 방식에서 인터페이스를 사용하면, 단 한개의 메소드로 구현이 가능하다.
또 ZooKeeper 클래스가 동물들의 종류와 상관없는 독립적인 클래스가 되었다.


