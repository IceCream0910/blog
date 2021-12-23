---
layout: post
title: "JAVA 웹 크롤링"
description: "java로 웹에서 정보를 가져오는 방법."
author: sal
categories: [ JAVA ]
image: 
---

### 오늘은 웹사이트의 정보를 java로 가져와 볼겁니다.

## 알아야 할 개념
- Document 클래스 : 연결해서 얻어온 HTML 전체 문서
- Element 클래스 : Document의 HTML요소 ELEMENT
- 클래스 : Element가 모인 자료형.
- substring은 문자열 자르기
- doc = Jsoup.connect(url).get();
- IOException를이용한 try/catch문은 예외처리에 사용

### 기본 사용법
~~~
Elements element = doc.select(“div.home_news”); //가져올 div id
  for (Element el : element.select("li")) { //select("")부분에 가져올 부분의 태그(li,a, ul등)
System.out.println(el.text());
}
~~~
---
## 네이버 스포츠 뉴스
~~~
String url = "https://sports.news.naver.com/wfootball/index.nhn";
Document doc = null;
try {
doc = Jsoup.connect(url).get();
} catch (IOException e) {
e.printStackTrace();
}
Elements element = doc.select("div.home_news");
String title = element.select("h2").text().substring(0,4);
System.out.println("스포츠 "+title);
System.out.println("===========================");
for (Element el : element.select("li")) {
System.out.println(el.text());
}
System.out.println("===========================");
}
}
~~~
실행하면 아래와 같이 출력
~~~
스포츠 주요뉴스
===========================
수아레스 “‘핵이빨 사건’ 이후 비인간적 대우 받았다”
발렌시아 잔류 원하는 이강인? 토레스와는 경우 다르다
“로즈 대신 세세뇽?’ 토트넘, 유망주 영입에 성공할까
시작부터 ‘완패’… 머리 감싸 쥔 메시, 안 풀리는 아르헨
레알, ‘日 메시’ 쿠보 영입 성공 배경 “계약 만료 알았던 유일 클럽”
레알행 간절한 포그바, 이적 위해 파업까지 불사한다
“이강인, 최고선수 반열” 소속팀 발렌시아, 홈페이지 극찬
‘추락 계속’ 아르헨티나, 40년 만의 코파 아메리카 1차전 패배 기록
네덜란드, 카메룬 잡고 2연승…여자월드컵 16강 진출
伊언론 이강인 집중조명 ‘미스터 8천만 유로: 발렌시아의 뉴 실바’
분 안 풀린 리베리, “2013년 발롱도르, 가장 불공정했던 일”
‘마르티네스-사파타 골’ 콜롬비아, ‘메시 침묵’ 아르헨에 2–0 완승 [코파 B조①]
로버트슨, “아자르, 메시-호날두보다 상대하기 힘들어”
리버풀-살라, 레알-유벤투스 2250억 이적 제안 거절
아약스, 지예흐 이적료 ‘450억’ 책정…이적시장 불붙나
라모스-루비오 결혼식, 불참자 지단 호날두 베일 벤제마 더 주목
너무 비싼 완 비사카…맨유, 차선책으로 트리피어 낙점
수아레스, UCL 탈락 후 “인생 최악, 세상에서 사라지고 싶었다”
“마르셀리노, 골든볼 이강인 좀 써라”…발렌시아 팬 성원 폭발
당장의 야심이냐 후일 도모냐, 친정 첼시 관심에 고민 빠진 램파드
===========================
~~~
---
## 네이버 날씨
~~~
System.out.println("지역명을 입력하세요 : ");
Scanner sc = new Scanner(System.in);
String station = sc.next();
String url = "https://m.search.naver.com/search.naver?sm=mtp_hty.top&where=m&query="+station+"날씨";
Document doc = null;
System.out.println("날씨를 불러오는 중입니다. \n(현재 온도, 체감온도, 내일 최저, 내일 최고, 모레 최저, 모레 최고)형식으로 출력됩니다.");
try {
doc = Jsoup.connect(url).get();
} catch (IOException e) {
e.printStackTrace();
}
Elements element = doc.select("div.wt_text");
System.out.println("---------------");
for (Element el : element.select("em")) {
System.out.println(el.text());
}
System.out.println("===========================");
}
~~~
실행하면 아래와 같이 출력
~~~
지역명을 입력하세요 :수내
날씨를 불러오는 중입니다.
(현재 온도, 체감온도, 내일 최저, 내일 최고, 모레 최저, 모레 최고)형식으로 출력됩니다.
— — — — — — — -
23
24.6
17
27
17
28
===========================
~~~
---

## 청와대 국민청원
~~~
String url = "http://www1.president.go.kr/petitions";
Document doc = null;
try {
doc = Jsoup.connect(url).get();
} catch (IOException e) {
e.printStackTrace();
}
Elements element = doc.select("div.bl_body");
System.out.println("===========================");
for (Element el : element.select("li")) {
System.out.println(el.text());
}
System.out.println("===========================");
}
~~~
실행하면 아래와 같이 출력
~~~
===========================
분류 기타 제목 버닝썬 VIP룸 6인을 수사해 주세요 청원 만료일 19.05.11 참여인원 213,327명
분류 정치개혁 제목 문재인 대통령의 탄핵을 청원합니다. 청원 만료일 19.05.30 참여인원 250,219명
분류 인권/성평등 제목 우리딸을 성폭행한 후 잔인하게 목졸라 죽인 극악무도한 살인마를 사형시켜 주세요 청원 만료일 19.07.04 참여인원 273,040명
===========================
~~~
---
## 멜론 차트
~~~
String url = "https://www.melon.com/chart/index.htm";
Document doc = null;
try {
doc = Jsoup.connect(url).get();
} catch (IOException e) {
e.printStackTrace();
}
Elements element = doc.select("div.wrap");
System.out.println("\n실시간 음원 차트(멜론)\n(제목, 아티스트, 앨범아티스트, 앨범명)순으로 표시됩니다.");
System.out.println("---------------");
for (Element el : element.select("a")) {
String a = el.text();
String result = a.replaceFirst("재생", "");
String result2 = a.replaceFirst("곡정보", "");
if (result2.contains("1위") || result2.contains("2위") || result2.contains("3위")) {
System.out.print("");
} else {
System.out.println(result2);
}
}
System.out.println("===========================");
}
~~~
실행하면 아래와 같이 출력
~~~
실시간 음원 차트(멜론)
(제목, 아티스트, 앨범아티스트, 앨범명)순으로 표시됩니다.
— — — — — — — -
솔직하게 말해서 나
김나영
김나영
솔직하게 말해서 나
2002
Anne-Marie
Anne-Marie
Speak Your Mind (Deluxe)
사랑에 연습이 있었다면 (Prod. 2soo)
임재현
임재현
사랑에 연습이 있었다면 (이하생략)
~~~
---
## 네이버 실시간 검색어
~~~
String url = "https://www.naver.com/";
Document doc = null;
try {
doc = Jsoup.connect(url).get();
} catch (IOException e) {
e.printStackTrace();
}
Elements element = doc.select("div.ah_list");
System.out.println("실시간 급상승 검색어");
System.out.println("===========================");
for (Element el : element.select("li")) {
String a = el.text();
String result = a.replaceFirst("데이터랩 그래프 보기", "");
System.out.println(result);
}
System.out.println("===========================");
}
~~~

실행하면 아래와 같이 출력
~~~
실시간 급상승 검색어
===========================
1 축구결과
2 로또863회당첨번호
3 이엘리야
4 이강인 골든볼
5 골든볼
6 김정민
7 우크라이나 한국
8 축구선수 김정민
9 대한민국 우크라이나
10 동물농장
11 공단기
12 서울책보고
13 김현우
14 김동준
15 u20 골든볼
16 일동 프로바이오틱스 세럼
17 아르헨티나 콜롬비아
18 아스달 연대기 등장인물
19 추성훈
20 박지성
===========================
~~~
