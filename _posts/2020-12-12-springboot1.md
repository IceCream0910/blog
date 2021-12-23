---
layout: post
title: "Spring Boot 간단한 rest api 만들기"
description: "스프링부트 이용해 json 데이터 반환하는 rest api 만들기"
author: sal
categories: [ Spring Boot ]
image: 
---

먼저 Spring Boot 프로젝트를 만들기 위한 기본 설정을 시작한다.
본 글에서는 IntellJ IDEA Community Edition 2020을 사용했다.
상단 File > Settings > Plugins에서 spring Assistant를 다운로드해준다.
![중간이미지](https://i.imgur.com/tdBEGRG.png)

File > New > Project를 눌러 프로젝트를 생성한다.
이 때 Spring Assistant를 선택하고 NEXT를 누른다.
![중간이미지](https://i.imgur.com/yXKl4M3.png)

프로젝트 속성을 입력해준다.
이 때 패키지명을 다르게 입력하지 않도록 주의한다.
또한 Project type에서 Gradle Project를 선택해준다.
Java Version도 자신이 사용하는 버전에 맞춰 지정해준다. 모두 끝나면 NEXT를 눌러 계속 진행한다.
![중간이미지](https://i.imgur.com/T9uW36D.png)

다음에 나오는 창에서 Developer Tools에서 Spring Boot DevTools와 Lombok을 체크하고,
Web에서 Spring Web과 Spring Reactive Web에 체크해주고 NEXT를 눌러 진행한다.
![중간이미지](https://i.imgur.com/Jh5MQd5.png)
![중간이미지](https://i.imgur.com/XhpQjOq.png)

finish를 누르면 생성이 완료된다.

프로젝트 생성이 완료되면, Controll라는 Directory를 생성하고, TestController라는 컨트롤러 클래스를 만들어준다.
build.gradle파일에 dependencies에 다음과 같이 세팅한다.
~~~
dependencies {
	implementation 'org.springframework.boot:spring-boot-starter'
	implementation 'org.springframework.boot:spring-boot-starter-web'
	compileOnly 'org.projectlombok:lombok'
	annotationProcessor 'org.projectlombok:lombok'
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
~~~

TestController.java에는 아래와 같이 입력해준다.
~~~
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@AllArgsConstructor
public class TestController {

    @GetMapping("/test")
    public String test() {
        String json = "{name : 'icecream'}";
        return json;
    }
}
~~~
@GetMapping("/test")는 GET이라는 메소드를 /test가 호출되면 실행한다는 의미이다.
{ name : 'icecream'} 이라는 json 데이터를 반환한다.

DemoApplication(메인 클래스)를 실행한 후 브라우저에서 localhost:8080/test를 호출하면 json데이터가 나오는 것을 볼 수 있다.
