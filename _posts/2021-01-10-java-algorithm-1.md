---
layout: post
title: "프로그래머스 JAVA, 모의고사"
description: "프로그래머스 코딩테스트 연습 level1, 모의고사"
author: sal
categories: [ JAVA ]
image: 
---

### 문제 설명
수포자는 수학을 포기한 사람의 준말입니다. 수포자 삼인방은 모의고사에 수학 문제를 전부 찍으려 합니다. 수포자는 1번 문제부터 마지막 문제까지 다음과 같이 찍습니다.

1번 수포자가 찍는 방식: 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, ...
2번 수포자가 찍는 방식: 2, 1, 2, 3, 2, 4, 2, 5, 2, 1, 2, 3, 2, 4, 2, 5, ...
3번 수포자가 찍는 방식: 3, 3, 1, 1, 2, 2, 4, 4, 5, 5, 3, 3, 1, 1, 2, 2, 4, 4, 5, 5, ...

1번 문제부터 마지막 문제까지의 정답이 순서대로 들은 배열 answers가 주어졌을 때, 가장 많은 문제를 맞힌 사람이 누구인지 배열에 담아 return 하도록 solution 함수를 작성해주세요.

---
### 제한 조건
시험은 최대 10,000 문제로 구성되어있습니다.
문제의 정답은 1, 2, 3, 4, 5중 하나입니다.
가장 높은 점수를 받은 사람이 여럿일 경우, return하는 값을 오름차순 정렬해주세요.
---
### 입출력 예
answers	return

[1,2,3,4,5]	[1]

[1,3,2,4,2]	[1,2,3]

---
### 입출력 예 설명
#### 입출력 예 #1

수포자 1은 모든 문제를 맞혔습니다.
수포자 2는 모든 문제를 틀렸습니다.
수포자 3은 모든 문제를 틀렸습니다.
따라서 가장 문제를 많이 맞힌 사람은 수포자 1입니다.

#### 입출력 예 #2

모든 사람이 2문제씩을 맞췄습니다.

> 나의 문제 해석 : 수포자 1, 2, 3번이 일정한 패턴으로 문제를 찍는다. 가장 많은 정답을 맞춘 사람의 번호를 배열에 넣어 출력하라.
---

## 풀이

```java
import java.util.*;

class Solution {
    public int[] solution(int[] answers) {
int[] answer = {};
        //수포자 1,2,3의 찍기 패턴
        int[] p1 = {1,2,3,4,5};
        int[] p2 = {2,1,2,3,2,4,2,5};
        int[] p3 = {3,3,1,1,2,2,4,4,5,5};
        int ans1=0, ans2 =0, ans3 =0;
        
        for(int i =0; i<answers.length; i++){
            if(p1[i%p1.length] == answers[i]) ans1++;
            if(p2[i%p2.length] == answers[i]) ans2++;
            if(p3[i%p3.length] == answers[i]) ans3++;
        }
        int max = Math.max(Math.max(ans1, ans2),ans3); // 수포자 1, 2, 3중 가장 높은 점수 구하기
        ArrayList<Integer> list = new ArrayList<Integer>();
        if(max==ans1) list.add(1); //최댓값과 같으면 list에 수포자번호(1, 2, 3) 넣기
        if(max==ans2) list.add(2);
        if(max==ans3) list.add(3);
        
        answer = new int[list.size()]; 
        
        for(int i =0; i<answer.length; i++) {
        	answer[i] = list.get(i);
        }
        
        return answer;
    }
}
```

수포자 1, 2, 3번의 찍기 방식을 배열로 선언한 후, 정답과 비교해 각각의 점수를 계산한 다음 가장 높은 점수를 얻은 사람의 번호를 배열에 저장하는 방법으로 풀이할 수 있다.

```java
int[] p1 = {1,2,3,4,5};
int[] p2 = {2,1,2,3,2,4,2,5};
int[] p3 = {3,3,1,1,2,2,4,4,5,5};
```java

이 부분은 말그대로 수포자 1, 2, 3번의 찍기 방식을 각각 선언해준 것이다.
주어진 문제를 보면 특정 번호를 반복해 찍는 것을 볼 수 있다.

```java
for(int i =0; i<answers.length; i++){
            if(p1[i%p1.length] == answers[i]) ans1++;
            if(p2[i%p2.length] == answers[i]) ans2++;
            if(p3[i%p3.length] == answers[i]) ans3++;
}
```java

그런 다음, for문을 이용해 각각의 수포자가 찍은 번호와 주어진 정답표를 비교해 같으면 ans1, ans2, ans3에 각각 1씩 더한다.
```java
i%p1.length
```java
이 코드는 문제수보다 찍기 패턴의 배열 크기가 더 크면 오류가 발생하기 때문에 나머지를 인덱스로 하는 값을 비교하도록 해주었다.

```java
int max = Math.max(Math.max(ans1, ans2),ans3); // 수포자 1, 2, 3중 가장 높은 점수 구하기
        ArrayList<Integer> list = new ArrayList<Integer>();
        if(max==ans1) list.add(1); //최댓값과 같으면 list에 수포자번호(1, 2, 3) 넣기
        if(max==ans2) list.add(2);
        if(max==ans3) list.add(3);
        
        answer = new int[list.size()]; 
```

Math함수를 이용하면 최댓값을 쉽게 구할 수 있다. ans1과 ans2 중 큰 값과 ans3을 비교하는 방식이다. ans1, ans2, ans3중 가장 높은 점수를 구해 정수형 변수 max에 저장한다.
그런 다음 ArrayList인 list를 만들어 최댓값과 각각의 점수가 같으면 list에 번호를 add한다.
최종적으로 리턴해야 하는 배열은 한명이 아니라 여러명이 될수도 있기 때문에 ArrayList를 사용했다.

```java
answer = new int[list.size()]; 
        
        for(int i =0; i<answer.length; i++) {
        	answer[i] = list.get(i);
        }
        
        return answer;
```
마지막으로 ArrayList인 list를 int배열 answer에 담아 리턴해준다.
