---
layout: post
title: "자바 객체지향 - 메소드"
description: "자바 객체지향 프로그래밍, 메소드"
author: sal
categories: [ JAVA ]
image: 
---

# 메소드가 하는 일

입력을 가지고 어떤 일을 수행한 다음 결과를 반환하는 것이다.
똑같은 작업이 반복해서 필요할 때, 메소드를 사용한다.

예시를 보자.
~~~
public int sum(int a, int b) {
    return a+b;
}
~~~

sum이라는 메소드는 두개의 정수값을 더하는 메소드이다.
여기서 return은 결과 값을 반환하는 명령어이다.

~~~
public class Test {
    public int sum(int a, int b) {
        return a+b;
    }

    public static void main(String[] args) {
        int a = 3;
        int b = 4;

        Test myTest = new Test();
        int c = myTest.sum(a, b);

        System.out.println(c);
    }
}
~~~

3과 4라는 값을 더해 7이라는 값을 반환하는 것을 볼 수 있다.

---

# 입력값이 없는 메소드

~~~
public String say() {
    return "Hi";
}
~~~

이런 메소드는 입력값이 없다.
이런 경우 호출할 때 괄호 안에 아무것도 쓰지 않으면 된다.

~~~
myTest.say();
~~~

# 리턴값이 없는 메소드

~~~
public void sum(int a, int b) {
    System.out.println(a+"과 "+b+"의 합은 "+(a+b)+"입니다.");
}
~~~

이 경우 반환(return)값이 없고, 메소드 자체에서 출력까지 한다.
> 이럴 때는 리턴타입 부분에 void라고 명시해야 한다

return;은 메소드를 빠져나갈 때에도 단독으로 써서 사용할 수 있다.
~~~
public void say_nick(String nick) {
    if ("fool".equals(nick)) {
        return; //메소드 빠져나가기
    }
    System.out.println("나의 별명은 "+nick+" 입니다.");
}
~~~

아래는 a값을 1씩 증가시키는 코드이다.
~~~
public int vartest(int a) {
    a++;
    return a;
}

public static void main(String[] args) {
    int a = 1;
    Test myTest = new Test();
    a = myTest.vartest(a);
    System.out.println(a);
}
~~~
여기서 return a로 main메소드의 a에 대입하지 않으면 결과는 2가 아닌 1로 출력될 것이다.

> 메소드의 내부(local)변수는 외부에 같은 이름의 변수가 있어도 영향을 받지 않는다.


아니면 이렇게 a를 맨 위에 선언한 후 public void를 사용해도 된다.
~~~
public class Test {

    int a;  // 객체변수 a

    public void vartest(Test test) {
        test.a++;
    }

    public static void main(String[] args) {
        Test myTest = new Test();
        myTest.a = 1;
        myTest.vartest(myTest);
        System.out.println(myTest.a);
    }
}
~~~




