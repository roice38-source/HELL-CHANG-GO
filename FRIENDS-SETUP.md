# 친구 공유 기능 설정 (Firebase, 무료)

서버 코드 없이 Firebase 무료(Spark) 플랜만 씁니다. 한 번만 설정하면 친구들은 앱만 열면 됩니다.

## 1. Firebase 프로젝트 만들기 (5분)
1. https://console.firebase.google.com → **프로젝트 추가** → 이름 `hellchanggo` (아무거나) → Google 애널리틱스는 꺼도 됨
2. 왼쪽 **빌드 → Authentication → 시작하기 → 로그인 방법 → 익명** 사용 설정
3. 왼쪽 **빌드 → Realtime Database → 데이터베이스 만들기**
   - 위치: `asia-southeast1` (싱가포르, 한국에서 가장 가까움)
   - 보안 규칙: 일단 **잠금 모드**로 시작 → 아래 3번에서 교체
4. **프로젝트 설정(톱니) → 일반 → 내 앱 → 웹 앱 추가(</>)** → 닉네임 아무거나 → 등록
   → `firebaseConfig = { ... }` 블록이 나옵니다. 이걸 복사.

## 2. index.html 에 붙여넣기
`index.html` 에서 `const FB_CONFIG = null;` 을 찾아 아래처럼 교체:

```js
const FB_CONFIG = {
  apiKey: "AIza...",
  authDomain: "hellchanggo.firebaseapp.com",
  databaseURL: "https://hellchanggo-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hellchanggo",
  appId: "1:1234567890:web:abcdef"
};
```
`databaseURL` 이 꼭 있어야 합니다 (Realtime Database 화면 상단 주소).

## 3. 보안 규칙 적용
Realtime Database → **규칙** 탭 → 아래 내용으로 교체 → 게시

```json
{
  "rules": {
    "codes": {
      ".read": "auth != null",
      "$code": {
        ".write": "auth != null && (!data.exists() || data.val() === auth.uid) && newData.val() === auth.uid"
      }
    },
    "users": {
      "$uid": {
        "pub":     { ".read": "auth != null",      ".write": "auth.uid === $uid" },
        "friends": { ".read": "auth.uid === $uid", ".write": "auth.uid === $uid" }
      }
    },
    "requests": {
      "$uid": {
        ".read": "auth.uid === $uid",
        "$from": {
          ".write": "(auth.uid === $from && newData.val() === true) || (auth.uid === $uid && !newData.exists())"
        }
      }
    }
  }
}
```

- 내 공개 데이터(`users/내uid/pub`)는 나만 쓸 수 있고, 로그인한 사람은 누구나 읽을 수 있음 (초대코드 없이는 uid를 알 수 없어 사실상 친구만 봄)
- 친구 목록은 본인만 읽기/쓰기
- `requests` 는 "상대가 내 코드를 넣으면 나한테도 자동으로 친구 추가" 용

## 4. 배포
GitHub Pages 에 올리면 끝. 친구들은 앱 열고 **친구 탭 → 닉네임 → 코드 입력**.

## 동작 방식
- 로그인: 익명 로그인 (가입 없음). 기기별 계정이라 **앱 데이터 삭제/기기 변경 시 코드가 바뀜** → 친구를 다시 추가해야 함
- 공유되는 데이터: `날짜 / 몸무게 / 운동종류+분+메모` 최근 60일만
- 출석 체크하면 그날 분할(푸시/풀/레그…)과 소요 시간이 자동으로 피드에 올라감
- 맨몸·러닝·걷기 등은 친구 탭에서 직접 입력
- 인바디 탭에서 체중 입력해도 피드에 반영됨 (반대도 마찬가지)
