---
layout: post
title: "학생관리 예제 프로젝트"
description: "java를 이요한 학생 성적 기록 프로그램"
author: sal
categories: [ JAVA ]
image: 
---

### 오늘은 java를 이용해 학생의 성적을 입력하는 프로그램을 만들어보겠습니다.
그럼 아래 코드.
## Score.java
```java
package Lecture190602;
import java.util.ArrayList;
import java.util.Scanner;
public class Score {
private static ArrayList<Student> studentList = new ArrayList<>();
private static Scanner scanner = new Scanner(System.in);
public static void main(String[] args) {
boolean run = true;
while (run) {
System.out.println("-----------------------------------------------");
System.out.println("1.학생추가 | 2.학생삭제 | 3.학생조회 | 4.성적입력 | 5.종료");
System.out.println("-----------------------------------------------");
System.out.println("선택>> ");
int selectNum = Integer.parseInt(scanner.next());
switch (selectNum) {
case 1:
createStudent();
break;
case 2:
deleteStudent();
break;
case 3:
searchStudent();
break;
case 4:
score();
break;
default:
run = false;
System.out.println("프로그램을 종료합니다.");
break;
}
}
}
private static void createStudent() {
System.out.print("학생이름: ");
String name = scanner.next();
System.out.print("학생나이: ");
int age = scanner.nextInt();
scanner.nextLine();
Student s = new Student();
s.setName(name);
s.setAge(age);
studentList.add(s);
}
private static void deleteStudent() {
System.out.println("학생이름: ");
String name = scanner.next();
boolean noneResult = false;
for (int i = 0; i < studentList.size(); i++) {
Student s = studentList.get(i);
if (s.getName().equals(name)) {
noneResult=true;
studentList.remove(i);
System.out.println("삭제되었습니다.");
break;
}
}
if (!noneResult) {
System.out.println("검색결과가 없습니다.");
}
}
private static void searchStudent() {
System.out.println("학생이름: ");
String name = scanner.next();
boolean noneResult = false;
for (int i = 0; i < studentList.size(); i++) {
Student s = studentList.get(i);
if (s.getName().equals(name)) {
noneResult = true;
System.out.println("이름:" + s.getName() + " | 나이:" + s.getAge() + " | 영어:" + s.getEng() + " | 수학:"
+ s.getMat() + " | 국어:" + s.getKor());
break;
}
}
if (!noneResult) {
System.out.println("검색결과가 없습니다.");
}
}
private static void score() {
System.out.println("학생이름: ");
String name = scanner.next();
boolean noneResult = false;
for (int i = 0; i < studentList.size(); i++) {
Student s = studentList.get(i);
if (s.getName().equals(name)) {
noneResult = true;
System.out.println("영어점수: ");
int eng = scanner.nextInt();
System.out.println("수학점수: ");
int mat = scanner.nextInt();
System.out.println("국어점수: ");
int kor = scanner.nextInt();
s.setEng(eng);
s.setMat(mat);
s.setKor(kor);
break;
}
}
if (!noneResult) {
System.out.println("검색결과가 없습니다.");
}
}
}
```

## Student.java

```java
package Lecture190602;
public class Student {
private String name;
private int age;
private int kor;
private int eng;
private int mat;
public String getName() {
return name;
}
public void setName(String name) {
this.name = name;
}
public int getAge() {
return age;
}
public void setAge(int age) {
this.age = age;
}
public int getKor() {
return kor;
}
public void setKor(int kor) {
this.kor = kor;
}
public int getEng() {
return eng;
}
public void setEng(int eng) {
this.eng = eng;
}
public int getMat() {
return mat;
}
public void setMat(int mat) {
this.mat = mat;
}
}
```

> 코드 사용하실 때 필요한 파일 Import 되어 있는지 확인하시고, 패키지명과 클래스명은 자기걸로 바꿔주세요.
