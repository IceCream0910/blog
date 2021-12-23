---
layout: post
title: "자바 객체지향 - 클래스"
description: "자바 객체지향 프로그래밍, 클래스"
author: sal
categories: [ JAVA ]
image: 
---

# 클래스란?

클래스란 어떤 객체의 변수나 메소드가 모여 만들어지는 객체지향 프로그래밍의 단위이다.



# 클래스 생성

"Lecture"라는 클래스는 다음과 같이 생성한다.
~~~
public class Lecture {

}
~~~
이렇게 클래스를 생성하면 객체(Object)를 만들 수 있게 된다.

#객체 생성
~~~
Lecture math = new Lecture();
~~~
Lecture클래스의 인스턴스(instance)인 math라는 객체가 생성된다.
이런 객체는 무수히 많이 만들 수 있다.

---
# 객체변수

이제 Lecture라는 클래스에 만들어지는 강의들에 평점을 부여해보자.
~~~
public class Lecture {
   int rate;
}
~~~
객체에는 '.'으로 접근할 수 있다.
~~~
math.rate   // 객체: math, 객체변수: rate
~~~
이제 객체 변수의 값을 출력해보자.

~~~
public class Lecture {
   int rate;

    public static void main(String[] args) {
        Lecture math = new Lecture();
        System.out.println(math.rate);
    }
}
~~~
실행하면 null이 출력될 것이다.
그 이유는 객체 변수 rate를 선언했지만 아직 아무런 값도 대입하지 않았기 때문이다.
---

클래스에는 객체 변수와 메소드라는 것이 있다.
메소드는 함수를 의미한다.
이제 rate에 값을 대입해보겠다.

~~~
public class Lecture {
   int rate;

    public void setRate(int rate) {
        this.rate = rate;
    }
    
    
    public static void main(String[] args) {
        Lecture math = new Lecture();
        math.setRate(4);  // 메소드 호출
        System.out.println(math.rate);
    }
}
~~~
출력해보면 4가 정상적으로 나올 것이다.

여기서
~~~
this.rate = rate;
~~~
이 부분을 자세히 알아보자.
여기서 'this'는 생성된 객체를 지칭한다.
즉 math라는 객체를 만들고 메소드를 호출하면 this는 math를 의미한다.
---

# 객체 변수는 서로 공유되지 않는다.
~~~
    public static void main(String[] args) {
        Animal cat = new Animal();
        cat.setName("boby");

        Animal dog = new Animal();
        dog.setName("happy");

        System.out.println(cat.name);
        System.out.println(dog.name);
    }
~~~

결과는 이렇게 나온다.
~~~
boby
happy
~~~
  
즉 name이라는 객체 변수는 공유되지 않고 독립적으로 유지된다.
