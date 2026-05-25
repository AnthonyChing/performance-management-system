# Frontend Documentation

# Site Plan

## 主管 (Manager)

### 登入 (Resource: Session or Auth)
- **POST /sessions**: 登入

### 查看通知 (Resource: Notifications)
- **GET /notifications?type=system**: 查看一般系統通知
- **GET /notifications?type=todo**: 查看待辦事項
- **PATCH /notifications/{id}**: 更新通知狀態

### 目標與 KPI 管理
#### 團隊 SMART 目標設定 (Resource: Team-Goals)
- **POST /teams/{team_id}/goals**: 新增本期團隊目標
- **PATCH /teams/{team_id}/goals/{goal_id}**: 編輯團隊目標

#### 個人 SMART 目標設定 (Resource: Subordinate-Goals)
- **POST /users/{subordinate_id}/goals**: 新增本期個人目標
- **PATCH /users/{subordinate_id}/goals/{goal_id}**: 編輯個人目標

#### 團隊 KPI 與評分規則設定 (Resource: Subordinate-KPIs)
- **POST /teams/{team_id}/kpis**: 為團隊設定或審核 KPI
- **PATCH /teams/{team_id}/kpis/{kpi_id}**: 調整 KPI 評分規則與權重

#### 部屬 KPI 與評分規則設定 (Resource: Subordinate-KPIs)
- **POST /users/{subordinate_id}/kpis**: 為部屬設定或審核 KPI
- **PATCH /users/{subordinate_id}/kpis/{kpi_id}**: 調整 KPI 評分規則與權重

### 團隊績效評估與執行
#### 團隊考核進度追蹤 (Resource: Team-Evaluations)
- **GET /teams/{team_id}/evaluations/status**: 查看部屬考核完成狀態總覽

#### 執行部屬績效評估 (Resource: Subordinate-Evaluations)
- **PATCH /users/{subordinate_id}/evaluations/{evaluation_id}**: 填寫部屬績效評分表
- **POST /users/{subordinate_id}/evaluations/{evaluation_id}/calculate**: 執行績效計算
- **PATCH /teams/{team_id}/evaluations/publish**: 團隊考核結果發佈
- **PATCH /users/{subordinate_id}/evaluations/{evaluation_id}**: 單一部屬考核結果發佈 (published)

#### 附件上傳 (Resource: Files)
- **POST /files**: 回傳 File ID 綁定到 Evaluation

### 歷史紀錄與查詢
#### 瀏覽部屬目標與 KPI (Resource: Subordinate-Goals & Subordinate-KPIs)
- **GET /users/{subordinate_id}/goals**: 查看個別部屬目標
- **GET /users/{subordinate_id}/kpis**: 查看個別部屬 KPI

#### 瀏覽團隊目標與 KPI (Resource: Team-Goals & Team-KPIs)
- **GET /teams/{team_id}/goals**: 查看個別團隊目標
- **GET /teams/{team_id}/kpis**: 查看個別團隊 KPI

#### 瀏覽部屬歷史考核 (Resource: Subordinate-Evaluations)
- **GET /users/{subordinate_id}/evaluations**: 查看個別部屬歷史考核結果

### 部屬績效異議處理
#### 待處理異議列表 (Resource: Team-Appeals)
- **GET /teams/{team_id}/appeals**: 查看部屬提交的異議申請列表
- **GET /teams/{team_id}/appeals/{appeal_id}**: 查看部屬提交的異議申請資訊與相關佐證文件
- **PATCH /teams/{team_id}/appeals/{appeal_id}**: 填寫處理意見 / 通過、駁回或取消異議

---

## 員工 (Employee)

### 登入 / 登出 (Resource: Session or Auth)
- **POST /sessions**: 登入
- 忘記密碼 (用 Google 帳戶登入的話就不用做)

### 我的資料 (Resource: Employee-Profile)
- **GET /me/profile**: 查看個人基本資料
- **GET /me/performance-cycles/current**: 查看目前考核週期
- **PATCH /me/password**: 重設密碼

### 查看通知 (Resource: Notifications)
- **GET /notifications?type=system**: 查看一般系統通知
- **GET /notifications?type=todo**: 查看待辦事項
- **PATCH /notifications/{id}**: 更新通知狀態

### 個人自評 (Resource: Employee-Self-Evaluation)
- **GET /me/self-evaluation**: 抓取自評
- **PUT /me/self-evaluation**: 暫存自評
- **POST /me/self-evaluation**: 提交自評

### 查看個人績效 (Resource: Employee-KPIs)
- **GET /me/kpis/standards**: 查看本期 KPI 標準
- **GET /me/kpis/result**: 查看本期考核結果
- **POST /me/kpis/result-confirmations**: 確認評估結果
- **GET /me/kpis/result?status=historical&page={page}**: 查看歷史 KPI

### 查看團隊績效 (Resource: Team-KPIs)
- **GET /teams/{team_id}/kpis/standards**: 查看本期 KPI 標準
- **GET /teams/{team_id}/kpis/result**: 查看本期考核結果
- **GET /teams/{team_id}/kpis/progress**: 查看本期考核進度
- **GET /teams/{team_id}/kpis/audit-logs**: 查看本期考核操作紀錄
- **GET /teams/{team_id}/kpis/result?status=historical&page={page}**: 查看歷史 KPI

### 個人績效異議 (Resource: Employee-Appeals)
- **GET /me/appeals**: 讀取本期異議頁狀態
- **POST /me/appeals/submit**: 提交績效異議
- **GET /me/appeals/result**: 查看本期績效異議處理結果

---

## HR

### 評估模板 (Resource: Assessment-Templates)
- **POST /hr/assessment-templates**: 建立評估模板
- **PATCH /hr/assessment-templates/{template_id}**: 編輯/暫存評估模板
- **DELETE /hr/assessment-templates/{template_id}**: 刪除評估模板
- **GET /hr/assessment-templates/{template_id}**: 瀏覽特定評估模板
- **GET /hr/assessment-templates?page=1**: 瀏覽所有評估模板
- **POST /hr/assessment-templates/{template_id}/applications**: 套用模版至指定員工群組

### 評估週期
- **POST /hr/performance-cycles**: 設定評估週期
- **GET /hr/performance-cycles**: 查看所有週期清單
- **GET /hr/performance-cycles/{cycle_id}**: 查看單一週期設定細節
- **PATCH /hr/performance-cycles/{cycle_id}**: 修改特定週期
- **PATCH /hr/performance-cycles/{cycle_id}/status**: 手動切換週期狀態

### 稽核紀錄 (Resource: Audit-Logs)
- **GET /hr/audit-logs?page=1**: 查看稽核紀錄
- **GET /hr/audit-logs?**: 篩選稽核紀錄
- **POST /hr/audit-log-exports**: 匯出稽核紀錄

### 設定通知 (Resource: Notifications)
- **POST /hr/notifications**: 設定通知

### 考核評估完成狀態 (Resource: Assessment-Statuses)
- **GET /hr/assessment-statuses**: 查看
- **GET /hr/assessment-statuses?**: 篩選

---

## 系統

- 自動匯入績效相關文件
- 發送「目標已修改」通知
- 發送「KPI 已修改」通知
- 發送催填提醒

# Frontend Test Cases - Performance Management System

This document outlines the frontend test cases based on the `site-plan.txt`. The test cases are categorized by user roles (Manager and Employee) and their respective features.

---

## Part 1: 主管 (Manager)

### 1.1 登入與基礎操作 (Authentication)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| M-AUTH-01 | 登入 | 成功使用有效的主管帳密登入系統 (`POST /sessions`) | 畫面導向主管儀表板，並在 localStorage/Cookie 儲存驗證 Token |
| M-AUTH-02 | 登入 | 輸入錯誤的帳密登入 | 登入失敗，顯示相對應的錯誤提示訊息 |

### 1.2 通知管理 (Notifications)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| M-NOTI-01 | 一般系統通知 | 點擊通知圖示，切換到「一般系統通知」標籤 (`GET /notifications?type=system`) | 通知列表顯示所有的系統通知 |
| M-NOTI-02 | 待辦事項 | 切換到「待辦事項」標籤 (`GET /notifications?type=todo`) | 顯示待處理事項，例如待評分、待處理異議等 |
| M-NOTI-03 | 更新通知狀態 | 點擊單一未讀通知或點擊「標示為已讀」(`PATCH /notifications/{id}`) | 該通知的 UI 狀態轉為已讀，未讀計數減少 |

### 1.3 目標與 KPI 管理 (Goals & KPIs Configuration)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| M-GOAL-01 | 新增團隊目標 | 填寫並送出本期團隊目標表單 (`POST /teams/{team_id}/goals`) | 成功新增，UI 列表更新並顯示成功訊息 |
| M-GOAL-02 | 編輯團隊目標 | 修改已建立的團隊目標 (`PATCH /teams/{team_id}/goals/{goal_id}`) | 成功更新，列表顯示最新內容 |
| M-GOAL-03 | 新增部屬目標 | 指派/新增本期個人目標給特定部屬 (`POST /users/{subordinate_id}/goals`) | 成功新增部屬目標 |
| M-GOAL-04 | 編輯部屬目標 | 修改個人目標內容 (`PATCH .../{goal_id}`) | 成功編輯部屬目標 |
| M-KPI-01 | 設定團隊 KPI | 為團隊設定 KPI 項目及其衡量標準 (`POST /teams/{team_id}/kpis`) | 儲存成功，團隊 KPI 列表更新 |
| M-KPI-02 | 調整團隊權重 | 調整團隊 KPI 的評分規則與權重 (`PATCH .../{kpi_id}`) | 權重更新成功，且前端驗證確保權重加總 = 100% |
| M-KPI-03 | 設定部屬 KPI | 為部屬設定或審核 KPI (`POST /users/{subordinate_id}/kpis`) | 部屬 KPI 成功登錄 |
| M-KPI-04 | 調整部屬權重 | 調整部屬的單一項 KPI 評分規則或權重 | 成功更新該項 KPI |

### 1.4 團隊績效評估與執行 (Performance Evaluation)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| M-EVAL-01 | 考核狀態總覽 | 檢視團隊內所有部屬的考核進度 (`GET .../evaluations/status`) | 列表能清楚標示哪些員工「未提交、已提交、已評分、待發佈」 |
| M-EVAL-02 | 填寫部屬評分表 | 在部屬清單中進入評分畫面並暫存/送出評分 (`PATCH .../{evaluation_id}`) | 成功暫存或送出分數，重新讀取後分數保留 |
| M-EVAL-03 | 績效計算 | 點擊「計算績效」觸發綜合分數計算 (`POST .../{evaluation_id}/calculate`) | 系統計算並顯示這名部屬的最終總分/等第 |
| M-EVAL-04 | 單一部屬結果發佈 | 對單一部屬點擊「發佈結果」 (`PATCH .../{evaluation_id}`) | 該部屬狀態變更為 "published"，不可再次修改 |
| M-EVAL-05 | 團隊結果發佈 | 對整個團隊進行批次考核結果發佈 (`PATCH /teams/{team_id}/evaluations/publish`) | 團隊全部屬的考核狀態更新為已發佈 |
| M-EVAL-06 | 附件上傳 | 在評鑑過程上傳績效佐證附件 (`POST /files`) | 上傳進度條顯示完成，並顯示檔案清單，支援刪除/預覽 |

### 1.5 歷史紀錄與查詢 (History & Query)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| M-HIST-01 | 部屬目標查詢 | 選擇特定部屬，檢視其目前的目標與 KPI 列表 | 正確顯示指定員工的目標與 KPI |
| M-HIST-02 | 團隊目標查詢 | 檢視團隊目前的目標與 KPI 列表 | 正確顯示團隊整體的目標與 KPI |
| M-HIST-03 | 歷史考核檢視 | 切換年份/週期，查詢個別部屬的歷史評價 (`GET .../evaluations`) | 成功讀取並顯示過往評分紀錄，權限不符時應顯示無法存取 |

### 1.6 部屬績效異議處理 (Appeals Handling)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| M-APPL-01 | 異議列表查看 | 進入異議處理模組，查看待處理清單 (`GET /teams/{team_id}/appeals`) | 顯示所有提出異議的部屬名單與提案摘要 |
| M-APPL-02 | 異議詳情檢視 | 進入單一異議案件，檢視說明內容與佐證檔案 (`GET .../{appeal_id}`) | 正確呈現員工陳述及其上傳的圖文附件 |
| M-APPL-03 | 處理異議申請 | 填寫處理意見 (通過、駁回或取消)，送出 (`PATCH .../{appeal_id}`) | 表單送出後，該異議案件標記為 `approved` / `rejected` / `cancelled`，提示會自動發送通知員工 |

---

## Part 2: 員工 (Employee)

### 2.1 登入與基本資料 (Auth & Profile)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| E-AUTH-01 | 登入 | 員工輸入有效的帳號密碼登入或使用 Google 登入 | 成功登入並導引至員工首頁 |
| E-PROF-01 | 我的資料 | 進入個人資料頁查看基本資料與目前考核週期 (`GET /me/profile` & `/me/performance-cycles/current`) | 正確顯示姓名、部門、職位、考核週期階段等資訊 |
| E-PROF-02 | 重設密碼 | 填寫舊密碼與新密碼後送出 (`PATCH /me/password`) | 密碼成功重設，可選擇是否踢除其他裝置登入登出 |

### 2.2 通知管理 (Notifications)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| E-NOTI-01 | 員工通知查看 | 查看系統通知與代辦事項列表並點擊已讀 | 成功取得通知內容，點擊後觸發 `PATCH` 將其標記為已讀 |

### 2.3 個人自評 (Self-Evaluation)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| E-SELF-01 | 讀取自評表 | 進入自評區塊載入表單 (`GET /me/self-evaluation`) | 正確帶出本期考核題目、KPI 以及之前暫存的內容 |
| E-SELF-02 | 暫存自評 | 填寫部分自評內容後點擊「暫存」(`PUT /me/self-evaluation`) | 無需填寫完整即可儲存，資料保留以供下次編輯 |
| E-SELF-03 | 提交自評 | 檢查必填欄位後點擊「提交」(`POST /me/self-evaluation`) | 提交成功，自評表被鎖定為唯讀狀態，顯示已送出 |

### 2.4 查看績效 (KPI Tracking)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| E-KPI-01 | 個人績效檢視 | 查看個人 KPI 標準、考核進度及考核結果 (`GET /me/kpis/*`) | 清晰呈現權重標準與階段進度。考核結束時可看到最終結果 |
| E-KPI-02 | 考核結果確認 | 閱讀最新考核結果後點擊「確認」(`POST /me/kpis/result-confirmations`) | 結果變為已確認狀態，記錄簽核時間 |
| E-KPI-03 | 個人歷史 KPI | 切換至歷史檢視分頁/篩選器查看去年度績效 | 分頁形式列出歷年紀錄 |
| E-KPI-04 | 團隊績效檢視 | 進入團隊成績公告區查看團隊 KPI 標準、進度、與最終結果 | 可用圖表或列表查看團隊目前的達成率與最終成績 |

### 2.5 個人目標設定與進度 (Goal Management)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| E-GOAL-01 | 本期目標檢視 | 檢視被設定的本期目標清單 (`GET /me/goals`) | 呈現各目標的描述、期限與狀態 |
| E-GOAL-02 | 設定與修改目標 | 新增或編輯本期個人目標 (`POST /me/goals`) | 前端成功呼叫寫入後，更新畫面。若考核已啟動應鎖定不可改 |
| E-GOAL-03 | 更新目標進度 | 定期回報目標進度 % 數 (`POST /me/goals/{goal_id}/progress-updates`) | 進度條正確渲染最新的百分比數值 |
| E-GOAL-04 | 團隊目標檢視 | 檢視團隊整體的本期/歷史目標，並查看進度 | 唯讀模式查看團隊大目標狀態 |

### 2.6 個人績效異議 (Appeals)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| E-APPL-01 | 發起異議 | 在考核結果畫面選擇發起績效異議，填寫理由後送出 (`POST /me/appeals/submit`) | 異議成功建檔進入流程 |
| E-APPL-02 | 查看異議狀態 | 讀取目前本期異議頁狀態 (`GET /me/appeals`) | 尚未提交時顯示填寫表單，已提交時顯示案件狀態 |
| E-APPL-03 | 查看處理結果 | 查看目前的異議案件處於 `submitted` / `under_review` / `need_more_info` / `approved` / `rejected` / `cancelled` 狀態 (`GET /me/appeals/result`) | 顯示最新員工端可見處理意見與最終結果 |

---

## Part 3: 人資 (HR)

### 3.1 評估模板管理 (Assessment Templates)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| HR-TMPL-01 | 建立評估模板 | 填寫模板名稱並新增題目，點擊儲存 (`POST /hr/assessment-templates`) | 成功建立新模板，並跳轉回列表頁 |
| HR-TMPL-02 | 編輯/暫存模板 | 編輯現有模板內容，或暫存編輯中的草稿 (`PATCH /hr/assessment-templates/{template_id}`) | 成功更新模板，介面反應最新欄位 |
| HR-TMPL-03 | 刪除評估模板 | 針對未使用的模板點擊刪除 (`DELETE /hr/assessment-templates/{template_id}`) | 確認提示後刪除，列表不再顯示該模板 |
| HR-TMPL-04 | 瀏覽模板 | 檢視單一模板與所有模板分頁列表 (`GET /hr/assessment-templates`) | 正確顯示模板詳細結構及分頁列表 |
| HR-TMPL-05 | 套用模板至群組 | 將建立的模板應用至特定部門或員工群組 (`POST .../{template_id}/applications`) | 成功派發，系統提示綁定成功 |

### 3.2 評估週期管理 (Performance Cycles)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| HR-CYCL-01 | 設定評估週期 | 建立新的考核週期(含名稱、起訖時間、涵蓋群組) (`POST /hr/performance-cycles`) | 新週期建立成功並顯示在週期清單，狀態為未啟用 |
| HR-CYCL-02 | 查看週期清單 | 顯示系統中所有曾經存在及進行中的週期 (`GET /hr/performance-cycles`) | 列表依時間排序顯示 |
| HR-CYCL-03 | 修改週期設定 | 在週期尚未結束前，修改起訖時間或名稱 (`PATCH /hr/performance-cycles/{cycle_id}`) | 修改成功且生效 |
| HR-CYCL-04 | 切換週期狀態 | 手動將某週期狀態轉為 `in_progress` / `closed` (`PATCH /hr/performance-cycles/{cycle_id}/status`) | 狀態切換後，系統根據掛載的群組與模板，啟動/關閉相關評估表單 |

### 3.3 稽核紀錄 (Audit Logs)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| HR-AUDT-01 | 查看與篩選稽核紀錄 | 使用 API 查詢操作記錄，透過條件(如日期、動作等)篩選 (`GET /hr/audit-logs`) | 分頁呈現正確的紀錄，且篩選結果吻合條件 |
| HR-AUDT-02 | 匯出稽核紀錄 | 點擊匯出報表按鈕 (`POST /hr/audit-log-exports`) | 觸發下載 csv 或 excel 檔案，包含指定範圍內的稽核紀錄 |

### 3.4 考核進度追蹤 (Assessment Statuses)
| TC ID | 功能 | 測試情境描述 | 預期結果 |
|---|---|---|---|
| HR-STAT-01 | 查看完成狀態 | HR 進入全公司考核狀態總覽 (`GET /hr/assessment-statuses`) | 以圖表或列表呈現各部門的評分完成率 |
| HR-STAT-02 | 狀態篩選與提醒 | 篩選出未完成自評或考核的群組/員工 | 顯示尚未完成的清單，支援後續手動發送提醒 |

---
*備註：以上測試案例為通用功能涵蓋，實際端對端測試 (E2E) 應確保包含邊界條件（例如：欄位字數過長驗證、必填項未填防呆提醒、未授權的 API 存取阻擋等）。*
