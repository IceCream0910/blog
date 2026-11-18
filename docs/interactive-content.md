# 인터랙티브 콘텐츠 작성 가이드

블로그 글이나 Forest 문서에 차트, 자료구조, React 실습을 넣을 때 사용하는 규약입니다. [Notion 테스트 문서](https://app.notion.com/p/41cfc9b93eca81648f10fe0ba24b2f77)에서 차트 7종과 LLM 실습 6개의 실제 소스를 확인할 수 있습니다.

## 형식 선택

| 요구 사항 | Notion 코드 블록 | 식별자 |
| --- | --- | --- |
| 표 형태 데이터의 비교, 추세, 분포, 흐름 | JSON | `"$viz": 1, "kind": "chart"` |
| 스택, 큐, 리스트, 이진 트리 | JSON | `"$viz": 1`과 `"kind": "stack" \| "queue" \| "list" \| "tree"` |
| 저장소에 등록된 React 모듈 | JSON | `"$viz": 1, "kind": "component"` |
| 직접 구현한 UI, 이벤트, 상태, 계산 | TypeScript | 첫 줄에 `// @blog-interactive/react v1` |

콘텐츠는 일반 문서(`/[pageId]`), Forest(`/forest?document=<pageId>`), Embed(`/embed/<pageId>`)에서 렌더링됩니다. `/recap`은 시각화 블록을 본문, 페이지 분할, 내레이션 대상에서 제외합니다. 식별자가 없는 코드 블록은 기존 코드 예시로 표시됩니다.

## 선언형 차트

Notion에서 언어가 **JSON**인 코드 블록을 만들고 아래 내용을 넣습니다. API로 Markdown을 작성할 때는 `json` 코드 펜스를 사용합니다. 최상위 `$viz`에는 숫자 `1`을 사용하고, `spec`은 [ztd charts 공식 문서](https://charts.ztd.app/)의 형식을 따릅니다.

AI Agent는 차트를 만들기 전에 공식 `llms.txt`에서 차트 유형과 JSON 예시를 확인합니다. 선택한 유형의 필수 채널과 옵션은 문서에 연결된 스키마를 참고합니다. [ztd charts llms.txt](https://charts.ztd.app/llms.txt)

```json
{
  "$viz": 1,
  "kind": "chart",
  "spec": {
    "type": "line",
    "data": [
      { "n": 1, "linear": 1, "quadratic": 1 },
      { "n": 2, "linear": 2, "quadratic": 4 },
      { "n": 4, "linear": 4, "quadratic": 16 },
      { "n": 8, "linear": 8, "quadratic": 64 }
    ],
    "encoding": { "x": "n", "y": ["linear", "quadratic"] },
    "card": { "title": "입력 크기별 연산 횟수", "legend": "toggle" }
  }
}
```

- `spec.data`에 객체 배열, `{ "values": [...] }` 또는 `{ "csv": "..." }`를 넣습니다. 블로그 렌더러는 데이터 URL을 거부합니다.
- 차트마다 필요한 `encoding`이 다릅니다. 예를 들어 선·막대 차트는 `x`와 `y`, 도넛은 `label`과 `value`, 히트맵은 `x`, `y`, `value`를 사용합니다. 필드 이름을 데이터의 키와 맞춥니다.
- 차트 제목은 보통 `spec.card.title`에 한 번만 넣습니다. 축이나 제목에 단위를 표시하고, 설명용 수치라면 `spec.card.sample` 또는 본문에 예시 데이터임을 밝힙니다.
- 기본 로캘은 `ko-KR`입니다. `spec.options.locale`로 바꿀 수 있으며 색상은 블로그 테마를 따릅니다.

## 자료구조와 등록 모듈

```json
{
  "$viz": 1,
  "kind": "stack",
  "title": "스택에서 꺼내는 순서",
  "initial": [10, 20, 30],
  "options": { "capacity": 6, "allowPush": true, "allowPop": true, "animated": true }
}
```

- `initial`의 항목은 유한한 숫자 또는 최대 24자의 문자열입니다. `capacity`는 1~31의 정수이며 초기 항목 수 이상으로 지정합니다. 생략하면 `max(8, initial.length)`입니다.
- 스택과 리스트는 마지막 값을 꺼내고, 큐는 첫 값을 꺼냅니다. 트리는 `initial`을 레벨 순서로 배치하고 너비 우선 방문을 재생합니다. `allowPush`, `allowPop`, `animated`는 스택·큐·리스트의 삽입, 제거, 전환 효과를 제어하며 기본값은 모두 `true`입니다.
- 등록된 모듈은 `{"$viz":1,"kind":"component","name":"cpu-8bit","title":"8비트 레지스터"}`처럼 참조합니다. 사용 가능한 이름은 [registry.tsx](../components/Interactive/registry.tsx)에서 확인합니다. 새 등록 모듈에는 저장소 변경과 배포가 필요합니다.

## 커스텀 React

Notion에서는 **TypeScript** 코드 블록을 사용합니다. 실제 블록 안에는 코드 펜스 없이 식별자와 소스만 넣습니다. Notion API로 Markdown을 작성할 때는 아래처럼 `typescript` 펜스를 사용합니다.

```typescript
// @blog-interactive/react v1
import { useState } from "react";
import { Binary, Button, Controls, Frame, Slider } from "@blog-interactive/react";

export default function RegisterDemo() {
  const [value, setValue] = useState(3);

  return (
    <Frame title="4비트 레지스터">
      <p role="status">십진수 {value}</p>
      <Binary value={value} bits={4} />
      <Controls>
        <Slider label="레지스터 값" min={0} max={15} step={1}
          value={value} onChange={setValue} />
        <Button onClick={() => setValue((current) => (current * 2) % 16)}>두 배</Button>
        <Button onClick={() => setValue(3)}>초기화</Button>
      </Controls>
    </Frame>
  );
}
```

### 실행 규약

- 한 코드 블록에 하나의 기본 내보내기(`export default`)를 둡니다. 보조 컴포넌트, 함수, 데이터는 같은 파일에 정의합니다.
- 사용할 수 있는 import는 `react`와 `@blog-interactive/react`입니다. 각 블록은 별도의 프레임에서 실행되므로 여러 단계를 설명할 때는 공통 예시 입력을 사용하고 각 단계가 자체 초기 상태로 동작하게 구성합니다.
- 블록별 소스 한도는 64,000자입니다. 필요한 예시 데이터는 소스에 포함합니다. 프레임에서 사용할 수 있는 높이는 최대 2,000px이므로 폭과 높이가 작은 대표 상태를 기본으로 두고, 길어지는 결과는 접거나 단계로 나눕니다.
- 부모 문서, 쿠키, 저장소와 일반 네트워크 요청이 격리됩니다. 코드는 자체 입력과 상태로 결과를 계산하도록 작성하고, 타이머나 이벤트 구독을 쓰면 해제합니다. 장시간 동기 계산은 화면을 멈출 수 있으므로 단계별로 제한합니다.

### 공통 컴포넌트 선택

| 필요 | 컴포넌트와 사용법 |
| --- | --- |
| 시각화의 바깥 영역 | `Frame title` 한 개 |
| 값, 결과 영역, 조작 설명 | `Panel`, `Badge`, `Code` |
| 입력과 상태 변경 | `Controls`, `Button`, `Slider`, `Select`, `Tabs` |
| 비트와 자료구조 | `Binary`, `Node`, `Edge`, `Stack`, `Tree` |

`Controls`는 테두리 없이 정렬과 줄바꿈을 제공합니다. 버튼과 입력을 별도의 카드로 한 번 더 감싸지 않습니다. `Slider`의 `onChange`에는 숫자가 들어오고, `Select`는 브라우저의 변경 이벤트를 전달합니다. `Tabs`는 `label`, `value`, `options: [{ value, label }]`, `onChange(value)`를 받습니다. 전체 인자는 [sdk.tsx](../components/Interactive/sdk.tsx)에 정의되어 있습니다.

공통 스타일의 `--viz-accent`, `--viz-fg`, `--viz-surface`를 사용할 수 있습니다. 버튼에는 동작을 나타내는 이름을 쓰고, 입력에는 레이블을 붙입니다. 중요한 결과는 색 변화와 함께 글자나 숫자로 보여 주고, 키보드로 조작할 수 있게 합니다.

## 작성과 검증 순서

1. 대상 Notion 문서를 읽고, 어느 문단에 어떤 조작을 넣을지 정합니다. 본문에 독자가 바꿔 볼 값과 결과에서 확인할 점을 짧게 적습니다. 여러 단계라면 실제 계산이나 인과관계 순서에 맞춰 배치합니다.
2. 위 형식으로 블록을 작성합니다. 선언형 차트는 `ztd-charts/spec`의 `validateSpec`에 바깥 객체가 아닌 `spec`을 전달합니다. React는 [런타임의 Babel 설정](../components/Interactive/sandbox/runtime.tsx)으로 변환 가능 여부를 먼저 확인합니다.
3. 대상 위치에 코드 블록을 넣고 Notion에서 다시 읽어 언어, 식별자, 소스가 모두 저장됐는지 확인합니다. 새 Forest 문서를 만드는 경우 Forest 데이터베이스의 `forest_분류`를 `문서`로 지정합니다.
4. `yarn dev`로 블로그를 실행한 뒤 실제 문서 경로에서 확인합니다. 각 블록을 화면에 띄우고 입력을 조작해 결과 변화와 초기화를 검증합니다. 데스크톱과 모바일 너비, 밝은 테마와 어두운 테마에서 레이블과 값이 읽히는지 확인합니다.
5. 렌더링 규약을 수정했다면 일반 코드 블록의 표시와 `/api/recap/<pageId>`의 시각화 제외를 함께 검증합니다. Notion에 저장한 상태, 로컬에서 조작한 결과, 배포된 환경에서 확인한 결과를 구분해 기록합니다.

| 증상 | 먼저 확인할 항목 |
| --- | --- |
| 소스가 일반 코드로 보임 | 블록 언어, 숫자 `$viz`, React 첫 줄 식별자 |
| 차트에 오류가 표시됨 | `validateSpec`의 에러, 필수 채널, 데이터 키, 인라인 데이터 |
| React가 실행되지 않음 | 화면에 들어왔는지, 허용된 import, `export default`, 브라우저 오류 |
| Notion 수정이 미리보기에 아직 보이지 않음 | 같은 페이지 ID인지, Notion에서 읽어 온 내용과 블로그 재검증 상태 |
