---
layout: post
title: "JAVA로 GUI 인터페이스 구현"
description: "java로 gui 인터페이스 구현하기"
author: sal
categories: [ JAVA ]
image: 
---

## Import 해주세요
- java.awt 클래스 이용 — 만들기가 쉽지만 느리고 무거움
- javax.swing 패키지 클래스 이용 — 만들기가 힘들지만 빠르고 가벼움
- MVC(Model-View-Controller) 패턴 —
- Model : 데이터를 가져와 작업을 처리하거나 작업을 저장
- View : 데이터를 보여줌
- Controller : 모델과 뷰 사이의 흐름을 제어

## 알아야 할 개념

#### 컴포넌트 : 화면을 구성하는 부품으로 컨테이너에 포함되어야 비로소 화면에 출력될 수 있는 GUI 객체

- 모든 GUI 컴포넌트의 최상위 클래스 : java.awt.Component
- 스윙 컴포넌트의 최상위 클래스 : javax.swing.Jcomponent
- 컨테이터 : 컴포넌트가 나올 하나의 윈도우 창(영역),
다른 컨테이너에 포함될 수 있음.
- AWT 컨테이너 : Panel, Frame, applet, Dialog, Window ..
- Swing 컨테이너 — 독립적으로 존재가능 컨테이너 — 최상위 컨테이너
- JFrame, JDialog, JApplet — 스스로 화면에 자신을 출력

> 모든 컴포넌트는 컨테이너에 포함되어야 화면에 출력 가능

### 백문이 불여일견
## Frame 예제

~~~
import java.awt.Frame;
public class FrameTest1
{
public static void main(String args[])
{
Frame f= new Frame(); //f라는 Frame 생성
f.setTitle("첫 번째 프레임 입니다."); //창제목을 설정
f.setBounds(100, 100, 300, 300); //창크기를 설정
//         (x, y, width, height)
f.setVisible(true); //창보이기 값 설정
}
}
~~~
실행해보면 창이 하나 나옵니다.

![중간 이미지](https://miro.medium.com/max/848/1*vjkgn0tlwxpMcWWLCDNQKw.png)


---

## Frame 상속 예제
~~~
import java.awt.Frame;
public class FrameTest extends Frame
{
public FrameTest()
{
super("두 번째 프레임입니다.");
setBounds(100, 100, 300, 300);
setVisible(true);
}
public static void main(String args[])
{
FrameTest Obj = new FrameTest(); //FrameTest 클래스 obj 객체 선언
}
}
~~~
![중간 이미지](https://miro.medium.com/max/865/1*IKPUIm-egVZ-mewX_kzwhw.png)

---
> Panel — 컴포넌트들을 그룹 별로 묶어서 처리 — 생성자:Panel()

~~~
import java.awt.*;
public class PanelTest extends Frame {
public PanelTest(String str) {
super(str);
Panel panel1 = new Panel();
// 색을 빨강으로 지정
panel1.setBackground(Color.RED);
// 추가
add(panel1);
// 크기
setSize(300, 300);
setVisible(true);
}
public static void main (String[] args) {
new PanelTest("패널 테스트");
}
}
~~~

![중간 이미지](https://miro.medium.com/max/893/1*Tb5QXmwA3G3eNwNCzbAALA.png)

---

## Dialog — 메인창 이외에 메시지 출력 or 자료 입력
- Dialog(Dialog owner) — 소유하는 Frame이 owner인 Dialog 생성
- Dialog(Dialog owner, String title) — title을 가진 Modeless Dialog 생성
- Dialog(Dialog owner, String title, boolean modal) — modal이 true이면 modal다이얼 로그 생성
- Dialog(Frame owner) — owner 프레임이 소유하는 Modeless 다이얼로그 생성


## Dialog 예제
~~~
import java.awt.Dialog;
import java.awt.Frame;
public class ModelessDialog extends Frame
{
public ModelessDialog()
{
super("다이얼로그 테스트");
// 객체 생성
Dialog d= new Dialog(this, "모덜리스 다이얼로그");
// 위치와 크기 결정
setBounds(0, 0, 400, 400);
// 창을 화면에 보이게함
setVisible(true);
// 크기 결정
d.setSize(200,200);
// 다이어로그를 화면에 보이게함
d.setVisible(true);
}
}
~~~
![중간 이미지](https://miro.medium.com/max/1041/1*XLj4gkTm7bKkrg4B7f8xtA.png)

---

## AWT 컨테이너
- button 만들기 —

~~~
Button(); //버튼 선언
new Button(""); //버튼 이름 정해주기
~~~

### Button 예제 코드
~~~
package dfsfd;
import java.awt.Button;
import java.awt.Frame;
import java.awt.Panel;
// class를 Button으로 만들게되면 Button 객체와 겹치게되므로
// Button1로 만들어주는게 편하다.
public class Button1 extends Frame
{
// 버튼 변수 선언
Button btn1, btn2, btn3;
// 버튼 생성자
public Button1(String str)
{
super(str);
// 버튼을 생성하기위해 패널 생성
Panel p = new Panel();
// 가위 버튼 생성
btn1 = new Button(" 가위 ");
// 바위 버튼 생성
btn2 = new Button(" 바위 ");
// 보 버튼 생성
btn3 = new Button("  보  ");
// 패널에 3가지 버튼 생성 -> 이거 해야 화면에 보임
p.add(btn1); p.add(btn2); p.add(btn3);
add(p);
btn3.setEnabled(false); //버튼 비활성화 여부 지정
// 윈도우창 크기는 200 x 200
setSize(200, 200);
// 윈도우창 띄우기
setVisible(true);
}
public static void main(String args[])
{
// 버튼 생성자
new Button1("버튼 만들기");
}
}
~~~

![중간 이미지](https://miro.medium.com/max/853/1*pNzi0SDK9dDQdFKKE2CoOw.png)

짜잔 버튼이 만들어졌습니다.

---

## 체크박스(Radio) 만들기 —
- CheckBox() — 레이블이 없는 체크 박스 생성
- CheckBox(String lable) — 레이블을 설정한 체크 박스 생성
- CheckBox(String label, Boolean state) — 지정된 레이블과 state를 넣어서 생성
- CheckBox(String label, boolean state, CheckboxGroup group) — 지정된 레이블이 붙은 체크 박스를 지정된 체크 박스 그룹에 구축해 지정된 상태로 생성
- CheckboxGroup — 객체를 생성해서 지정해주면 라디오 버튼이 됩니다.

### Checkbox 예제 코드
~~~
package dfsfd;
import java.awt.Checkbox;
import java.awt.CheckboxGroup;
import java.awt.Frame;
import java.awt.Panel;
public class Checkbox1 extends Frame
{
// 레이블이 있는 생성자
public Checkbox1(String str)
{
super(str);
// 패널 생성
Panel p = new Panel();
// 치킨 체크 박스 체크 표시
Checkbox cbx1=new Checkbox("치킨", true);
// 피자 체크 박스 디폴트여도 true
Checkbox cbx2=new Checkbox("피자");
// 피자 체크 박스 디폴트여도 true
Checkbox cbx3=new Checkbox("햄버거");
// 패널에 생성
p.add(cbx1);
p.add(cbx2);
p.add(cbx3);
// 체크 박스 그룹 생성
CheckboxGroup group = new CheckboxGroup();
// 치킨 체크 박스 체크 표시 (이름, 그룹명, 체크여부)
Checkbox cbx4=new Checkbox("치킨",group,true);
// 피자 체크 박스 체크 표시X
Checkbox cbx5=new Checkbox("피자",group,false);
// 햄버거 체크 박스 체크 표시X
Checkbox cbx6=new Checkbox("햄버거",group,false);
// 패널에 생성
p.add(cbx4);
p.add(cbx5);
p.add(cbx6);
add(p);
// 윈도우 사이즈 180 x 300
setSize(180, 300);
// 윈도우
setVisible(true);
}
public static void main(String args[])
{
// 체크박스
new Checkbox1("체크 박스 테스트");
}
}
~~~
![중간 이미지](https://miro.medium.com/max/1001/1*XNkHe5Bo4dknaFhw-tl8Kg.png)

치킨은 맛있죠

---

## Choice — (콤보박스)(List와 유사)
- void add(String item) — 항목을 추가
- String getItem(int index) — 선택 항목 리턴
- int getItemCount() — 항목 수를 리턴
- int getSelectedIndex() — 현재 선택된 항목의 인데스를 리턴
- String getSelectedItem() — 현재 선택된 항목의 문자열을 리턴
- void insert(String item, int index) — 항목을 지정된 위치에 삽입
- void remove(int position) — 지정된 위치의 항목을 삭제
- void remove(String item) — item 처음 표시되는 항목을 삭제
- void removeAll() — 모든 항목 삭제
- void select(int pos) — 위치를 설정
- void select(String str) — 지정된 항목으로 설정

### Choice 예제
~~~
package dfsfd;
import java.awt.Choice;
import java.awt.Frame;
public class Choice1 extends Frame {
// 콤보 박스 변수 생성
Choice ch;
// 레이블이 있는 콤보 박스 생성자
public Choice1(String str) {
super(str);
// 콤보 박스 객체 생성
ch = new Choice();
// 콤보 박스 아이템 생성
ch.addItem("치킨");
ch.addItem("피자");
ch.addItem("햄버거");
// 추가
add(ch);
setSize(300, 100);
setVisible(true);
}
public static void main(String args[]) {
// 콤보 박스 생성자
new Choice1("초이스 테스트");
}
}
~~~
![중간 이미지](https://miro.medium.com/max/906/1*n-IxwRTTG--sPUYx2DfQaw.png)
---

## Label(레이블) — 문자열 표시
- getText() — text를 리턴
- setText(String text) — text로 레이블 설정
- setAlignment(int align) — 정렬 상태 설정

### Label 예제 코드
~~~
package dfsfd;
import java.awt.Color;
import java.awt.Frame;
import java.awt.Label;
import java.awt.Panel;
public class LableTest extends Frame
{
// 패널 변수
Panel p;
// 레이블 변수
Label label1, label2, label3;
// 레이블 생성자
public LableTest(String str)
{
super(str);
// 패널 생성
p = new Panel();
// 레이블 설정
label1=new Label("치킨");
label2=new Label("피자", Label.CENTER); //가운데 배치
label3=new Label("종로", Label.LEFT); //왼족에 배치
// 레이블 색 설정
label1.setBackground(Color.red);
label2.setBackground(Color.blue);
label3.setBackground(Color.green);
// 패널에 레이블
p.add(label1);     p.add(label2);     p.add(label3);
add(p);
setSize(300,300);
setVisible(true);
}
public static void main(String args[])
{
// 레이블
new LableTest("레이블 테스트");
}
}
~~~
![중간 이미지](https://miro.medium.com/max/932/1*UQcaB6olGp9VU8IZpE7Q2A.png)

컬러풀

---

## List — Choice와 비슷 — 여러개중하나
- Choice 주요 메소드와 동일

### choice 예제 코드
~~~
package dfsfd;
import java.awt.Frame;
import java.awt.List;
import java.awt.Panel;
public class ListTest extends Frame
{
Panel p;
List list;
public ListTest(String str)
{
super(str);
// 패널 생성
p = new Panel();
// 크기 2행 배열 생성
list = new List(2,true);
// 리스트
list.add("치킨");
list.add("피자");
list.add("햄버거");
list.add("족발");
p.add(list);
add(p);
setSize(300,100);
setVisible(true);
}
public static void main(String args[])
{
// 리스트 생성자 호출
new ListTest(" 선택 리스트");
}
}
~~~

![중간 이미지](https://miro.medium.com/max/855/1*eOcnT-09xjv5ysUEog-YSA.png)
---

## TextField — 문자 입력창
- setEchoChar(char c) — 보여지는 문자를 설정
- int getCaretPosition() — 텍스트 내에서 현재 마우스 포인터의 위치를 리턴
- String getText() — 텍스트 내의 표시되는 텍스트를 리턴
- void select(int selectionStart, int selection End) — 시작위치부터 마지막위치까지 선택
- void selectAll() — 텍스트 컴퍼넌트 내의 모든 텍스트를 선택
- void setBackground(Color c) — 백그라운드 칼라를 설정
- void setCaretPosition(int position) — caret의 위치를 설정
- void setText(String t) — 표시되는 텍스트를 지정된 텍스트로 설정

### Textfield 예제 코드
~~~
package dfsfd;
import java.awt.Frame;
import java.awt.Label;
import java.awt.Panel;
import java.awt.TextField;
public class TextField1 extends Frame
{
public TextField1(String str)
{
super(str);
// 패널 생성
Panel p = new Panel();
// 레이블 생성
Label lbl1 = new Label(" 아 이 디:");
Label lbl2 = new Label(" 비밀번호:");
// 20자리 텍스트 필드 생성
TextField txt1 = new TextField("ID", 20 );
TextField txt2 = new TextField(20);
// 비밀번호 * 로
txt2.setEchoChar('*');
p.add(lbl1);
p.add(txt1);
p.add(lbl2);
p.add(txt2);
add(p);
setSize(200,200);
setVisible(true);
}
public static void main(String args[])
{
// 텍스트 필드 생성자
new TextField1("TextField 테스트");
}
}
~~~
![중간 이미지](https://miro.medium.com/max/965/1*wJ78zOL_gOTdyat9KWMLUw.png)
---

## TextArea — 여러줄 텍스트
- TextArea() — 새로운 텍스트 영역을 생성
- TextArea(int rows, int columns) — 행수와 열수 지정 생성
- TextArea(String text) — 초기값을 설정
- TextArea(String text, int rows, int columns) — 초기값과 행수와 열수 지정 생성
- TextArea(String text, int rows, int columns, int scrollbars) — 행수와 열수를 지정하고 스크롤바 표시여부를 설정해서 생성

### Textarea 예제 코드
~~~
package dfsfd;
import java.awt.Color;
import java.awt.Font;
import java.awt.Frame;
import java.awt.Panel;
import java.awt.TextArea;
import java.awt.TextField;
public class TextArea1 extends Frame
{
public TextArea1(String str)
{
super(str);
// 패널 생성
Panel p = new Panel();
// 텍스트 에어리어 10행 30열 생성
TextArea txt1 = new TextArea(10,30);
// 텍스트 필드 생성
TextField txt2 = new TextField("Hello Java",20);
txt1.setText("  Java World ");
// 배경색 노랑
txt1.setBackground(Color.yellow);
// 폰트 궁서체
txt1.setFont(new Font("궁서체",Font.BOLD, 10));
// 폰트색 파랑
txt1.setForeground(Color.blue);
// 텍스트필드 '@'로 대체
txt2.setEchoChar('@');
// 텍스트 필드 폰트 색
txt2.setForeground(Color.red);
p.add(txt1);
p.add(txt2);
add(p);
setSize(200,200);
setVisible(true);
}
public static void main(String args[])
{
// 텍스트에어리어 생성자
new TextArea1("Text Area 테스트");
}
}
~~~
![중간 이미지](https://miro.medium.com/max/980/1*1P3lgjgZFqyR6KCIwESagQ.png)
---
## 메뉴 컴포넌트
- MenuBar : 메뉴 표시줄을 만들 때 사용
- Menu : 메뉴 표시줄에 보이게 될 메뉴를 만들 때 사용
- MenuItem : 메뉴에 포함될 세부 메뉴를 만들 때 사용
- CheckboxMenuItem : 체크 박스가 있는 메뉴
- PopupMenu : 동적 메뉴를 만들 때 사용

### 메뉴 예제 코드
~~~
package dfsfd;
import java.awt.CheckboxMenuItem;
import java.awt.Frame;
import java.awt.Menu;
import java.awt.MenuBar;
import java.awt.MenuItem;
public class Menu1 extends Frame
{
public Menu1(String str)
{
super(str);
// 메뉴바 생성
MenuBar mb = new MenuBar();
// 메뉴 '파일' 생성
Menu file = new Menu("파일");
// 하위 항목 정의
MenuItem file_new = new MenuItem("새로 만들기");
MenuItem file_open = new MenuItem("열기");
MenuItem file_save = new MenuItem("저장");
MenuItem file_newname = new MenuItem("저장");
// 하위 항목
file.add(file_new);
file.add(file_open);
file.add(file_save);
file.add(file_newname);
Menu edit = new Menu("편집");
MenuItem edit_undo = new MenuItem("실행취소");
MenuItem edit_cut = new MenuItem("잘라내기");
MenuItem edit_copy = new MenuItem("복사");
MenuItem edit_paste = new MenuItem("붙여넣기");
edit.add(edit_undo);
edit.add(edit_cut);
edit.add(edit_copy);
edit.add(edit_paste);
Menu view = new Menu("보기");
CheckboxMenuItem view_status = new CheckboxMenuItem("상태표시줄");
view.add(view_status);
mb.add(file);
mb.add(edit);
mb.add(view);
setMenuBar(mb);
setSize(200,200);
setVisible(true);
}
public static void main(String args[])
{
// 메뉴 생성자
new Menu1("메뉴 테스트 ");
}
}
~~~
![중간 이미지](https://miro.medium.com/max/1058/1*0fvEHs4YEXR1VBnKU1A0ig.png)

그림판 같은데서 많이 보던거

---
> 코드 사용하실 때 Import 되어 있는지 확인하시고, 패키지명과 클래스명은 자기걸로 바꿔주세요.

[참고 사이트] https://raccoonjy.tistory.com/16
