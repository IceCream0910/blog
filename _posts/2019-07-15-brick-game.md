---
layout: post
title: "JAVA로 게임 만들기 - 벽돌깨기"
description: "java로 간단한 게임을 만들어보자. 벽돌깨기 게임!"
author: sal
categories: [ JAVA ]
image: 
---

#### 바로 코드 나갑니다.

> 코드 사용하실 때 Import 되어 있는지 확인하시고, 패키지명과 클래스명은 자기걸로 바꿔주세요.

---

## Main.java — 기본 창 띄워줌

~~~
package brickBracker;
import javax.swing.JFrame;
public class Main {
public static void main(String[] args) {
JFrame obj = new JFrame();
Gameplay gamePlay = new Gameplay();
obj.setBounds(10, 10, 700, 600);
obj.setTitle("Breakout Ball");
obj.setResizable(false);
obj.setVisible(true);
obj.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
obj.add(gamePlay);
}
}
~~~

---

## Gameplay.java — 전체적인 게임로직

~~~
package brickBracker;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import javax.swing.JPanel;
import javax.swing.Timer;
public class Gameplay extends JPanel implements KeyListener, ActionListener {
private boolean play = false;
private int score = 0;
private int totalBricks = 21;
private Timer timer;
private int delay = 8;
private int playerX = 310;
private int ballposX = 120;
private int ballposY = 350;
private int ballXdir = -1;
private int ballYdir = -2;
private Mapgenerator map;
public Gameplay() {
map = new Mapgenerator(3, 7);
addKeyListener(this);
setFocusable(true);
setFocusTraversalKeysEnabled(false);
timer = new Timer(delay, this);
timer.start();
}
public void paint(Graphics g) {
g.setColor(Color.black);
g.fillRect(1, 1, 692, 592);
map.draw((Graphics2D) g);
g.setColor(Color.yellow);
g.fillRect(0, 0, 3, 592);
g.fillRect(0, 0, 692, 3);
g.fillRect(0, 0, 3, 592);
g.setColor(Color.white);
g.setFont(new Font("serif", Font.BOLD, 25));
g.drawString("" + score, 590, 30);
g.setColor(Color.green);
g.fillRect(playerX, 550, 100, 8);
g.setColor(Color.yellow);
g.fillOval(ballposX, ballposY, 20, 20);
if (totalBricks <= 0) {
play = false;
ballXdir = 0;
ballYdir = 0;
g.setColor(Color.red);
g.setFont(new Font("serif", Font.BOLD, 30));
g.drawString("블록을 모두 제거하였습니다 ", 190, 300);
g.setFont(new Font("serif", Font.BOLD, 20));
g.drawString("Enter키를 눌러 다시 시작하세요. ", 230, 350);
}
if (ballposY > 570) {
play = false;
ballXdir = 0;
ballYdir = 0;
g.setColor(Color.red);
g.setFont(new Font("serif", Font.BOLD, 30));
g.drawString("모든 블록을 제거하지 못했습니다.", 190, 300);
g.setFont(new Font("serif", Font.BOLD, 20));
g.drawString("Enter키를 눌러 다시 시작하세요.  ", 230, 350);
}
g.dispose();
}
@Override
public void actionPerformed(ActionEvent e) {
timer.start();
if (play) {
if (new Rectangle(ballposX, ballposY, 20, 20).intersects(new Rectangle(playerX, 550, 100, 8))) {  //블록 만들기
ballYdir = -ballYdir;
}
A: for (int i = 0; i < map.map.length; i++) {
for (int j = 0; j < map.map[0].length; j++) {
if (map.map[i][j] > 0) {
int brickX = j * map.brickWidth + 80;
int brickY = i * map.brickHeight + 50;
int brickWidth = map.brickWidth;
int brickHeight = map.brickHeight;
Rectangle rect = new Rectangle(brickX, brickY, brickWidth, brickHeight);
Rectangle ballRect = new Rectangle(ballposX, ballposY, 20, 20);
Rectangle brickRect = rect;
if (ballRect.intersects(brickRect)) {
map.setBrickValue(0, i, j);
totalBricks--;
score += 5;
if (ballposX + 19 <= brickRect.x || ballposX + 1 >= brickRect.x + brickRect.width) {
ballXdir = -ballXdir;
} else {
ballYdir = -ballYdir;
}
break A;
}}}}
ballposX += ballXdir;
ballposY += ballYdir;
if (ballposX < 0) {
ballXdir = -ballXdir;
}
if (ballposY < 0) {
ballYdir = -ballYdir;
}
if (ballposX > 670) {
ballXdir = -ballXdir;
}
}
repaint();
}
@Override
public void keyPressed(KeyEvent e) {
if (e.getKeyCode() == KeyEvent.VK_RIGHT) {
if (playerX >= 600) {
playerX = 600;
} else {
moveRight();
}
}
if (e.getKeyCode() == KeyEvent.VK_LEFT) {
if (playerX < 10) {
playerX = 10;
} else {
moveLeft();
}
}
if (e.getKeyCode() == KeyEvent.VK_ENTER) {
if (!play) {
play = true;
ballposX = 120;
ballposY = 350;
ballXdir = -1;
ballYdir = -2;
score = 0;
totalBricks = 21;
map = new Mapgenerator(3, 7);
repaint();
}
}
}
public void moveRight() {
play = true;
playerX += 20;
}
public void moveLeft() {
play = true;
playerX -= 20;
}
@Override
public void keyReleased(KeyEvent e) {
// TODO Auto-generated method stub
}
@Override
public void keyTyped(KeyEvent e) {
// TODO Auto-generated method stub
}
}
~~~

---

## Mapgenerator.java —블록들과 공 위치 지정&표시

~~~
package brickBracker;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Graphics2D;
public class Mapgenerator {
public int map[][];
public int brickWidth;
public int brickHeight;
public Mapgenerator(int row, int col) {
map = new int[row][col];
for(int i=0; i<map.length; i++) {
for(int j=0; j<map[0].length; j++) {
map[i][j] = 1;
}
}
brickWidth = 540/col;
brickHeight = 150/row;
}
public void draw(Graphics2D g) {
for(int i=0; i<map.length; i++) {
for(int j=0; j<map[0].length; j++) {
if(map[i][j]> 0) {
g.setColor(Color.white);
g.fillRect(j*brickWidth + 80, i*brickWidth + 50, brickWidth, brickHeight);
g.setStroke(new BasicStroke(3));
g.setColor(Color.black);
g.drawRect(j*brickWidth + 80, i*brickWidth + 50, brickWidth, brickHeight);
}
}
}
}
public void setBrickValue(int value, int row, int col) {
map[row][col] = value;
}
}
~~~

## jar file로 export하는 법

> File -> Export -> JAVA -> Runnable JAR file -> Next ->java파일 선택 -> 경로지정 -> next
