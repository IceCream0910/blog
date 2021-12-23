---
layout: post
title: "스프링부트 Annotation"
description: "스프링 (부트)에서 사용되는 Annotation"
author: sal
categories: [ Spring Boot ]
image: 
---

## Annotation이란?
- @를 이용한 주석, 자바코드에 주석을 달아 특별한 의미를 부여한 것 (모든 요소에 선언 가능)
자바 코드에 주석처럼 달아 특수한 의미를 부여해준다.
~~~
@Controller
@RequestMapping(value = "/test")
public class testController {
// 내용
}
~~~

## 왜 사용할까?
데이터에 대한 유효성 검사조건을 어노테이션을 사용하여 클래스에 직접 명시함으로써 
해당 데이터들에 대한 유효 조건을 쉽게 파악할수 있게되며, 코드의 양도 줄어든다. 
(코드가 깔끔해지고, 어노테이션의 재사용도 가능해진다. )

## 종류
### @Component
component-scan을 선언에 의해 특정 패키지 안의 클래스들을 스캔하고, @Component Annotation이 있는 클래스에 대하여 bean 인스턴스를 생성한다.

- @Controller, @Service, @Repository
@Component —구체화—> @Controller, @Service, @Repository
bean으로 등록
해당 클래스가 Controller/Service/Repository로 사용됨을 Spring Framework에 알린다.

### @RequestMapping
~~~
@Controller
@RequestMapping("/home") // 1) Class Level
public class HomeController {
    /* an HTTP GET for /home */ 
    @RequestMapping(method = RequestMethod.GET) // 2) Handler Level
    public String getAllEmployees(Model model) {
        ...
    }
    /* an HTTP POST for /home/employees */ 
    @RequestMapping(value = "/employees", method = RequestMethod.POST) 
    public String addEmployee(Employee employee) {
        ...
    }
}
~~~
@RequestMapping에 대한 모든 매핑 정보는 Spring에서 제공하는 HandlerMapping Class가 가지고 있다.
1) Class Level Mapping
모든 메서드에 적용되는 경우
“/home”로 들어오는 모든 요청에 대한 처리를 해당 클래스에서 한다는 것을 의미한다.
2) Handler Level Mapping
요청 url에 대해 해당 메서드에서 처리해야 되는 경우
“/home/employees” POST 요청에 대한 처리를 addEmployee()에서 한다는 것을 의미한다.
- value: 해당 url로 요청이 들어오면 이 메서드가 수행된다.
- method: 요청 method를 명시한다. 없으면 모든 http method 형식에 대해 수행된다.

### @RestController
@ResponseBody를 모든 메소드에서 적용한다.
메소드의 반환 결과(문자열)를 JSON 형태로 반환한다.

### @Autowired
org.springframework.beans.factory.annotation.Autowired
Type에 따라 알아서 Bean을 주입한다.
필드, 생성자, 입력 파라미터가 여러 개인 메소드(@Qualifier는 메소드의 파라미터)에 적용 가능
Type을 먼저 확인한 후 못 찾으면 Name에 따라 주입한다

### @Resource
javax.annotation.Resource
표준 자바(JSR-250 표준) Annotation으로, Spring Framework 2.5.* 부터 지원 가능한 Annotation이다.
Annotation 사용으로 인해 특정 Framework에 종속적인 어플리케이션을 구성하지 않기 위해서는 @Resource를 사용할 것을 권장한다.
@Resource를 사용하기 위해서는 class path 내에 jsr250-api.jar 파일을 추가해야 한다.
필드, 입력 파라미터가 한 개인 bean property setter method에 적용 가능

---
## Parameter를 받는 방법
### @RequestParam
HTTP GET 요청에 대해 매칭되는 request parameter 값이 자동으로 들어간다.
url 뒤에 붙는 parameter 값을 가져올 때 사용한다.
~~~
@GetMapping("/home")
public String show(@RequestParam("page") int pageNum {
}
~~~
위의 경우 GET /home?index=1&page=2와 같이 uri가 전달될 때 page parameter를 받아온다.
@RequestParam 어노테이션의 괄호 안의 문자열이 전달 인자 이름(실제 값을 표시)이다.

### @PathVariable
HTTP 요청에 대해 매칭되는 request parameter 값이 자동으로 들어간다.
uri에서 각 구분자에 들어오는 값을 처리해야 할 때 사용한다.
REST API에서 값을 호출할 때 주로 많이 사용한다.
~~~
@PostMapping("/index/{idx}")
@ResponseBody
public boolean deletePost(@PathVariable("idx") int postNum) {
return postService.deletePost(postNum);
}
~~~
위의 경우 POST /index/{idx}와 같이 uri가 전달될 때 해당하는 구분자 {idx}를 받아온다.
> @RequestParam와 @PathVariable 동시 사용 예제
~~~
@GetMapping("/user/{userId}/invoices")

public List<Invoice> listUsersInvoices(@PathVariable("userId") int user,
	                                  @RequestParam(value = "date", required = false) Date dateOrNull) {
}
~~~
위의 경우 GET /user/{userId}invoices?date=190101 와 같이 uri가 전달될 때
구분자 {userId}는 @PathVariable(“userId”)로,
뒤에 이어붙은 parameter는 @RequestParam(“date”)로 받아온다.

### @RequestBody
반드시 HTTP POST 요청에 대해서만 처리한다.
HTTP POST 요청에 대해 request body에 있는 request message에서 값을 얻어와 매칭한다.
RequestData를 바로 Model이나 클래스로 매핑한다.
이를테면 JSON 이나 XML같은 데이터를 적절한 messageConverter로 읽을 때 사용하거나 POJO 형태의 데이터 전체로 받는 경우에 사용한다.

### @ModelAttribute
@RequestParam과 비슷하다.

종류는 매우 다양하나, 여기서는 이정도만 설명하겠다.
---

## References
https://gmlwjd9405.github.io/2018/12/02/spring-annotation-types.html
https://jojoldu.tistory.com/255?category=635883
https://jeong-pro.tistory.com/151
https://cheese10yun.github.io/jackson-annotation-03/
https://gmlwjd9405.github.io/2018/12/02/spring-annotation-types.html
