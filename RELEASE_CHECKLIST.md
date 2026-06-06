# Carousella — 릴리즈 체크리스트

릴리즈 전 이 파일을 열고, 각 항목을 순서대로 확인한다.  
**모든 🔴 항목이 통과해야 릴리즈 가능.**

---

## 1. 코드 품질

- [ ] `dev` 브랜치에 미머지된 feature 브랜치가 없는가
- [ ] `npm run build` 에러 없이 통과하는가
- [ ] 콘솔 `console.log` / `TODO` / `FIXME` 잔재가 없는가
- [ ] 구버전 브랜드명(`평론 캐러셀`) 잔재가 없는가  
  검사: `index.html <title>`, 헤더 브랜드 텍스트, placeholder 문구
- [ ] `doc.label` 초기값이 라벨 picker 선택지 중 하나와 일치하는가

---

## 2. 문서 · 메타 🔴

- [ ] **README 갱신**: 새 기능·변경 사항이 반영됐는가
- [ ] **GitHub 리포지터리 Description** 갱신: Settings → About 설명 텍스트
- [ ] **GitHub 리포지터리 URL** 갱신: Settings → About Website (GitHub Pages URL)
- [ ] `package.json` `"name"` / `"version"` 이 최신인가

---

## 3. 배포 환경

- [ ] `vite.config.js` `base` 경로가 GitHub Pages 리포명과 일치하는가  
  현재 리포: `juuck14/Carousella` → `base: '/Carousella/'`
- [ ] Google Fonts `<link>` 가 `index.html` 에 포함돼 있는가  
  (Noto Serif KR, Nanum Myeongjo)
- [ ] 빌드 후 `dist/` 에 `index.html`, `assets/` 가 생성됐는가

---

## 4. 릴리즈 절차

```bash
# 1. dev → main PR 머지
git checkout main && git merge --no-ff dev

# 2. 태그 + 릴리즈 생성
gh release create vX.Y.Z --title "vX.Y.Z" --notes "변경 내용 요약"

# 3. GitHub Pages 배포 워크플로 수동 트리거
gh workflow run deploy.yml

# 4. 배포 확인
# https://juuck14.github.io/Carousella/
```

---

## 5. 배포 후 확인

- [ ] GitHub Pages URL 에서 앱이 정상 로드되는가
- [ ] 표지 생성 → PNG 다운로드 정상 동작하는가
- [ ] 전체 내보내기 ZIP 안에 `content.md` + 이미지가 포함되는가
- [ ] 모바일(375px) 에서 3탭 레이아웃이 정상 표시되는가

---

*이 파일은 릴리즈마다 업데이트한다. 새 기능이 추가되면 관련 확인 항목도 함께 추가.*
