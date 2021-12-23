---
layout: post
title: "자바 객체지향 - Call By value"
description: "자바 객체지향 프로그래밍, Call By value"
author: sal
categories: [ JAVA ]
image: 
---

# 메소드로 객체를 전달할 경우 메소드에서 객체의 객체변수(속성) 값을 변경할 수 있게 된다.

~~~
class Updater {
    public void update(int count) {
        count++;
    }
}

public class Counter {
    int count = 0;  // 객체변수
    public static void main(String[] args) {        
        Counter myCounter = new Counter();        
        System.out.println("before update:"+myCounter.count);
        Updater myUpdater = new Updater();
        myUpdater.update(myCounter.count);
        System.out.println("after update:"+myCounter.count);
    }
}
~~~

위 코드에서 Updater클래스는 전달받은 숫자를 1만큼 증가시키고, update라는 메소드를 가지고 있다.
Counter클래스는 counter라는 객체 변수를 가지고 있다.
그런데 실행해보면
~~~
before update:0
after update:0
~~~
이렇게 나온다.
전에 설명했듯이 update 메소드는 독립적인 값을 전달받았기 때문이다.
아래와 같이 변경해보자.

~~~
class Updater {
    public void update(Counter counter) {
        counter.count++;
    }
}

public class Counter {
    int count = 0;
    public static void main(String[] args) {
        Counter myCounter = new Counter();
        System.out.println("before update:"+myCounter.count);
        Updater myUpdater = new Updater();
        myUpdater.update(myCounter);
        System.out.println("after update:"+myCounter.count);
    }
}
~~~

이전에는 int count와 같이 값을 전달받았다면 지금은 Counter counter와 같이 객체를 전달받도록 변경했다.
이렇게 메소드의 입력으로 객체를 전달받는 경우에는 메소드가 입력받은 객체를 그대로 사용하기 때문에
메소드가 객체의 속성값을 변경하면 메소드 수행 후 객체의 변경된 속성값이 유지되게 된다.
