---
layout: post
title: "정수 각자릿수 내림차순 정렬"
description: "n의 각 자릿수를 큰것부터 작은 순으로 정렬한 새로운 정수 리턴 문제 예시"
author: sal
categories: [ JAVA ]
image: 
---

n의 각 자릿수를 큰것부터 작은 순으로 정렬한 새로운 정수 리턴 문제 예시

## Q. 함수 solution은 정수 n을 매개변수로 입력받습니다. n의 각 자릿수를 큰것부터 작은 순으로 정렬한 새로운 정수를 리턴해주세요.
>예시) n=118372면 output=873211

코드
```java
public static void solution(int input) {
int n,temp;
n =0;
temp = input; //temp는 일단 입력받은 값
while(temp!=0) { //temp가 0이 아니면 계속 반복
n++;
temp /= 10; // temp = temp / 10;
}
int[] A= new int[n]; // 배열 생성
temp = input; // 각 자릿수를 분해하기
for(int i=A.length-1;i>=0;i--) {  //배열의 맨 뒤에서부터
A[i] = temp %10; //입력받은 수의 제일 낮은 자리(1의자리수)를 나머지연산을 통해 저장.
temp /= 10; // 10으로 나누어 10의자리수가 1의자리가 되도록 함.
}
Arrays.sort(A); //오름차순으로 정렬
for(int i=A.length-1; i>=0; i=i-1) { //내림차순으로 해야되니까 오름차순 배열에서 역으로 출력
System.out.print(A[i]); //A배열에 i(내림차순) 출력
}
}
public static void main(String[] args) {
Scanner sc = new Scanner(System.in); //scanner 만듦
int input = sc.nextInt(); //input에 값 입력받음
solution(input); //solution 메소드 호출
}
}
```
>input : 118372
output : 873211
