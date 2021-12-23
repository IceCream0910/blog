---
layout: post
title: "안드로이드 Retrofit으로 API 요청하기"
description: "안드로이드에서 retrofit으로 api 정보 불러오기"
author: sal
categories: [ Android ]
image: 
---
안드로이드 앱을 개발하면서 api를 사용해 정보를 불러와야 할 때가 생긴다.
사용하는 라이브러리는 Volley등 다양한 것이 있지만, Retrofit을 사용해보겠다.

우선 공식 사이트
https://square.github.io/retrofit/

먼저 build.gradle(app)에서 필요한 라이브러리들을 implementation 해주어야 한다.

### build.gradle
~~~
    implementation 'com.squareup.retrofit2:retrofit:2.4.0'
    implementation 'com.squareup.retrofit2:converter-gson:2.4.0'
~~~

여기서는 테스트를 위해 간단한 샘플 api를 불러와보겠다.
https://jsonplaceholder.typicode.com/posts

이제 레이아웃을 만들어보겠다. 간단하게 ScrollView에 TextView로 구성해보겠다.

### activity_main.xml
~~
 <androidx.core.widget.NestedScrollView
        android:layout_width="match_parent"
        android:layout_height="match_parent">


    <TextView
        android:id="@+id/text_view_result"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:textColor="#000"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintLeft_toLeftOf="parent"
        app:layout_constraintRight_toRightOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

    </androidx.core.widget.NestedScrollView>
    
~~~

그 다음, Post라는 자바 클래스를 생성해준다.

### Post.java
~~~

public class Post {

    private int userId;
    private String id;
    private String title;

    @SerializedName("body")
    private String text;

    public int getUserId() {
        return userId;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getText() {
        return text;
    }
}
~~~

JsonPlaceHolderApi라는 인터페이스도 생성해준다.
생성방법은 클래스 생성과 똑같은데, 생성시 나타나는 대화창에서 Class를 InterFace로 바꿔주면 된다.

### JsonPlaceHolderApi.java
~~~
public interface JsonPlaceHolderApi {

    @GET("posts")
    Call<List<Post>> getPosts();
}
~~~

이제 MainActivity.java를 수정해준다.

### MainActivity.java
~~~
public class MainActivity extends AppCompatActivity {
    private TextView textviewResult;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        textviewResult = findViewById(R.id.text_view_result);

        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("https://jsonplaceholder.typicode.com/")
                .addConverterFactory(GsonConverterFactory.create())
                .build();

        JsonPlaceHolderApi jsonPlaceHolderApi = retrofit.create(JsonPlaceHolderApi.class);

        Call<List<Post>> call = jsonPlaceHolderApi.getPosts();

        call.enqueue(new Callback<List<Post>>() {
            @Override
            public void onResponse(Call<List<Post>> call, Response<List<Post>> response) {

                if(!response.isSuccessful()) {
                    textviewResult.setText("Code : "+response.code());
                    return;
                }

                List<Post> posts = response.body();

                for(Post post : posts) {
                    String content = "";
                    content += "ID : "+post.getId() + "\n";
                    content += "User ID: "+post.getUserId() + "\n";
                    content += "Title: "+post.getTitle()+"\n";
                    content += "Text: "+post.getText()+"\n\n";

                    textviewResult.append(content);

                }

            }

            @Override
            public void onFailure(Call<List<Post>> call, Throwable t) {
                textviewResult.setText(t.getMessage());

            }
        });
    }
}

~~~

간단하게 코드를 설명하자면 Retrofit으로 api의 내용을 가져온 다음 Post클래스를 이용해 id와 userid, title, text를 각각 불러와준다.
그 다음 textview에 차례대로 출력해준다.

위 코드에도 있지만 api를 불러오는 기본 코드는 다음과 같다.
~~~
Retrofit retrofit = new Retrofit.Builder()
    .baseUrl("https://api.github.com")
    .addConverterFactory(GsonConverterFactory.create())
    .build();
~~~
