---
layout: post
title: "Spring Boot와 MySQL DB 연결하기"
description: "스프링부트 이용해 DB에서 데이터 받아오기"
author: sal
categories: [ Spring Boot, MySQL ]
image: https://media.vlpt.us/images/hj8853/post/e3d4ef3d-3a2b-4606-a9ff-4daddda17a05/mysql.jpg
---

# MySQL
MySQL은 가장 널리 사용되고 있는 관계형 데이터베이스 관리 시스템(RDBMS: Relational DBMS)입니다.
#### 장점
1. 오픈 소스 라이센스를 따르기 때문에 무료로 사용할 수 있습니다.
2. 다양한 운영체제에서 사용할 수 있으며, 여러 가지의 프로그래밍 언어를 지원합니다.
3. 크기가 큰 데이터 집합도 아주 빠르고 효과적으로 처리할 수 있습니다.
4. 널리 알려진 표준 SQL 형식을 사용합니다.
5. MySQL 응용 프로그램을 사용자의 용도에 맞게 수정할 수 있습니다.

---

그럼 실습을 시작해봅시다.
먼저 MySQL을 다운로드해주세요. 설치 할 때 설정한 비밀번호를 잘 기억해두세요!
> 비밀번호를 분실해 오류가 발생하는 경우, 클린 재설치를 하면 간단하게 해결된다. [참고](https://bicloud.tistory.com/5)
[MySQL 다운로드 페이지](https://dev.mysql.com/downloads/mysql/)
자세한 설치과정은 생략합니다. 도움이 필요하신 분은 [이 글](https://m.blog.naver.com/bjh7007/221829548634)을 참고하세요.

설치가 완료되면 MySQL Workbench라는 걸 실행할 수 있습니다.
![중간 이미지](https://i.imgur.com/RwOn7N5.png)

새로운 Connections을 만들고 실행합니다.
![중간 이미지](https://i.imgur.com/e2U4tXb.png)

접속이 성공적으로 됐다면 아래와 같은 창이 뜹니다.
왼쪽 네비게이터에서 Schemas를 눌러줍니다.
![중간 이미지](https://i.imgur.com/a1QUIPY.png)

새로운 Schema를 생성해줍시다. 이름은 test로 하고, Charset은 UTF8, Collation은 utf8_general_ci로 설정합니다.
Apply를 눌러줍니다.
![중간 이미지](https://i.imgur.com/1tN8h2q.png)

왼쪽 네비게이터에 test라는 Schema가 만들어졌습니다.
test > Tables를 우클릭해 New Table를 만들어줍니다.
![중간 이미지](https://i.imgur.com/5WSQZvO.png)

idx는 각 리스트에 번호를 붙여주는 필드입니다.
옆에 있는 옵션 중 사용할 옵션을 살펴보도록 합시다.
PK는 Primary Key로 고유키임을 알려줍니다.
NN은 Not Null로 필수항목 여부를 의미합니다.
AI는 값을 자동으로 부여하도록 합니다.

왼쪽 네비게이터에서 만들어진 user에 마우스 우클릭 > 제일처음에 있는 Select Rows를 눌러주면 Result Grid가 표시되는데 여기서 데이터를 넣어줍시다.
![중간 이미지](https://i.imgur.com/pcAGf4j.png)
---


이제 SpringBoot 프로젝트를 만들어주세요.
프로젝트 생성 과정은 생략합니다.

프로젝트가 만들어지면 build.gradle의 dependencies를 아래와 같이 세팅해주세요.
```gradle
dependencies {
	implementation 'org.springframework.boot:spring-boot-starter-web'
	implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
	implementation 'com.h2database:h2'
	compileOnly 'org.projectlombok:lombok'
	runtimeOnly 'mysql:mysql-connector-java'
	annotationProcessor 'org.projectlombok:lombok'
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
	testImplementation 'org.junit.platform:junit-platform-launcher:1.5.0'
	testImplementation 'org.junit.jupiter:junit-jupiter-api:5.5.0'
	testImplementation 'org.junit.jupiter:junit-jupiter-engine:5.5.0'

}
```

다음은 resources의 application.properties을 다음과 같이 입력해주세요.
```properties
# db source url
spring.datasource.url=jdbc:mysql://localhost:[포트(기본 3306)]/[table이름(여기서는 test)]?useSSL=false&useUnicode=true&serverTimezone=Asia/Seoul&allowPublicKeyRetrieval=true

# db response name
spring.datasource.username=[설정한유저네임(기본 root)]

# db response password
spring.datasource.password=[설정한비밀번호]

spring.jpa.show-sql=true
```

이제 controller 디렉토리를 만들고 이름은 TestController라고 하겠습니다.
### TestController.java
```java
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@AllArgsConstructor
public class TestController {

    private final TestService testService;

    @GetMapping(value = "api/test")
    public String test() {
        String json = "{name : 'icecream'}";
        return json;
    }

    @GetMapping(value = "/api/user")
    public List<User> getUserList() {
        return testService.getUserList();
    }

    @GetMapping(value = "/api/user/{userId}")
    public String getUser(@PathVariable Long userId) {
        return testService.getUser(userId);
    }



}
```
필요한 패키지는 추가로 import해주세요.(패키지명이 포함된 import 코드는 생략되어 있음)
간단하게 코드를 살펴봅시다.

@RestController 어노테이션을 통해 Controller라는 것을 알려줍니다.
@GetMapping 어노테이션으로 /api/user로 요청이 들어오면 testService의 getUserList를 호출하도록 했습니다.
그런데 우리는 testService를 아직 만들지 않았기 때문에 오류가 날겁니다.

여기서 간단하게 Spring의 기본 동작 방식을 알아보도록 하겠습니다.

1) Client 가 Request 를 보낸다.

2) Request URL에 알맞은 Controller 가 수신한다.

3) Controller 는 넘어온 요청을 처리하기 위해 Service 를 호출한다.

4) Service 는 알맞은 정보를 가공하여 Controller 에게 데이터를 넘긴다.

5) Controller 는 Service 의 결과물을 Client 에게 전달해준다.

즉, Controller는 요청을 받고 Service를 호출해주고, 결과를 다시 Client에게 전달해줍니다.
Service는 데이터를 가공해 Controller로 넘겨주는 일을 하죠.

---

이번에는 service 디렉토리를 만들고 TestService 클래스를 만들어줍니다.
### TestService.java
```java
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class TestService {

    private UserRepository userRepository;

    public List<User> getUserList() {
       return userRepository.findAll();
    }

    public String getUser(Long userId) {
        return "{\n" +
                "\t\t\"id\": 1,\n" +
                "\t\t\"name\": \"김길동\",\n" +
                "\t\t\"age\": 16,\n" +
                "\t\t\"학교\": \"길동중\"\n" +
                "\t}";

    }
}
```
역시 @Service 어노테이션으로 Service임을 명시해줬습니다.

이번에는 repository 디렉토리를 만들고 그 안에 UserRepository 인터페이스를 만들어줍니다.
### UserRepository.java
```java
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

}
```

마찬가지로 @Repository로 Repository임을 명시해주는 것, 꼭 기억해주세요.

이제 entity를 만들어보겠습니다.
entity는 DB테이블 구조를 명시해주는 역할을 합니다.
entity 디렉토리를 만들고 그 안에 User 클래스를 추가해줍니다.
### User.java
```java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idx;
    private String name;
    private Long age;
    private String school;
    private Long weight;
}
```

아까 mySQL에서 만들어주었던 DB의 구조를 그대로 작성해줬습니다.
@Data와 @Entity 어노테이션으로 데이터 구조를 나타낸 Entity임을 명시했고요.

이제 Main 메소드가 있는 SpringBootApplication으로 이동해 실행해봅시다.
실행이 되면 브라우저로 localhost:8080/api/user를 접속해 요청을 보내봅시다.

![중간 이미지](https://i.imgur.com/uZfx85L.png)

이렇게 DB에 있는 데이터가 json형식으로 나오는 것을 보실 수 있습니다.



