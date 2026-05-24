# 主管端 API 實作規格

## 1. 共用規格

- Content-Type: `application/json`
- 日期格式: `YYYY-MM-DD`
- 時間格式: ISO 8601，例如 `2026-05-21T09:30:00+08:00`
- API 路徑中的 `{user_id}` 為部屬（員工）的識別碼，`{team_id}` 則為主管道理團隊的識別碼。
- 登入者身分由後端依 token / session 判斷，用以驗證該主管是否具備對目標 `{user_id}` 或 `{team_id}` 的管理或存取權限。
- 歷史考核結果存取權限：需判斷存取資源時，Requesting User 是否為該 Subordinate 當時週期或現任的合法檢視者（主管），若無權限則回傳 `403`。
- 空資料不一定是錯誤。若檢視列表資源但尚無內容時，優先回傳 `200` 搭配空陣列 `[]`。
- 所有列表分頁頁碼從 `1` 開始。

### 1.1 統一錯誤格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "欄位驗證失敗。",
    "details": [
      {
        "field": "weight",
        "message": "KPI 權重總和需為 100%。"
      }
    ]
  }
}
```

常見 HTTP status:

| Status | code | 使用情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | request path / query / body 格式錯誤、必填缺漏、欄位錯誤 |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 403 | `FORBIDDEN` | 權限不足，例如：非該員工所屬主管、無權檢視歷史考核，或無權操作異議處理 |
| 404 | `SUBORDINATE_NOT_FOUND` | 查無指定的部屬資料 |
| 404 | `RESOURCE_NOT_FOUND` | 找不到指定的目標、KPI、評分表或異議申請 |
| 409 | `STATE_CONFLICT` | 當前狀態不可執行此操作（如：週期已鎖定、異議已結案） |

## 2. API 一覽

| 功能模組 | Method | URL | 用途 |
| --- | --- | --- | --- |
| 目標管理 | POST | `/users/{user_id}/goals` | 新增本期個人 SMART 目標 |
| 目標管理 | PATCH | `/users/{user_id}/goals/{goal_id}` | 編輯或審核個人目標 |
| 目標管理 | GET | `/users/{user_id}/goals` | 查看個別部屬目標列表 |
| KPI 管理 | POST | `/users/{user_id}/kpis` | 為部屬設定或審核 KPI |
| KPI 管理 | PATCH | `/users/{user_id}/kpis/{kpi_id}` | 調整 KPI 評分規則與權重 |
| KPI 管理 | GET | `/users/{user_id}/kpis` | 查看個別部屬 KPI 列表 |
| 績效評估 | PATCH | `/users/{user_id}/evaluations/{evaluation_id}` | 填寫主管的個人績效評分表 |
| 歷史查詢 | GET | `/users/{user_id}/evaluations` | 查看部屬個人歷史考核結果 |
| 異議處理 | GET | `/teams/{team_id}/appeals` | 查看團隊中所有待處理/已處理的異議申請 |
| 異議處理 | GET | `/teams/{team_id}/appeals/{appeal_id}` | 查看部屬單筆異議申請詳情及佐證文件 |
| 異議處理 | PATCH | `/teams/{team_id}/appeals/{appeal_id}` | 處理異議（填寫意見、駁回或調整評分） |

## 3. 共用狀態與資料模型

### 3.1 SubordinateGoal (部屬目標模型)

```json
{
  "goal_id": "goal_20260520_001",
  "cycle_id": "cycle_2026_q3",
  "title": "提升 Q3 季度客戶滿意度",
  "description": "計畫在第三季度將 CSAT 分數從 88% 提升至 92%。",
  "due_date": "2026-09-30",
  "status": "pending_review",
  "progress_percent": 0,
  "creator_role": "employee",
  "reviewer_id": "manager_001"
}
```
* 主管審核或編輯部屬目標時，操作的狀態常為 `approved`, `revision_requested` 等。

### 3.2 SubordinateKPI (部屬KPI模型)

```json
{
  "kpi_id": "kpi_20260520_001",
  "cycle_id": "cycle_2026_q3",
  "name": "季營收達成率",
  "description": "達成個人季營收 100 萬的業績目標",
  "weight": 40,
  "scoring_rule": "達成 100% 得 5 分，80-99% 得 4 分",
  "status": "active"
}
```

### 3.3 Appeal (異議申請模型)

```json
{
  "appeal_id": "appeal_202605_001",
  "employee": {
    "user_id": "user_021",
    "name": "李小明"
  },
  "evaluation_id": "eval_01",
  "reason": "評分範圍未考量 Q2 中途加入的臨時專案",
  "attachments": [
    {
      "file_id": "file_123456",
      "url": "/assets/docs/appeal1.pdf",
      "name": "補件說明.pdf"
    }
  ],
  "status": "pending",
  "manager_decision": null,
  "manager_comment": null,
  "submitted_at": "2026-10-01T10:00:00+08:00"
}
```

狀態語意：`pending` (待處理)、`adjusted` (已調整評分)、`rejected` (駁回)。

## 4. 目標與 KPI 管理

### 4.1 新增本期個人目標
- **Method**: POST
- **URL**: `/users/{user_id}/goals`
- **用途**: 主管直接為該部屬指派新的個人 SMART 目標。
- **欄位說明**:
  - Request: `title` (String, 目標名稱，必填), `description` (String, 內容說明，必填), `due_date` (String, YYYY-MM-DD，必須落在週期內，必填).
  - Response: 回傳新建建立的目標資料包含了 `goal_id`, `status` (`in_progress`), `progress_percent` 等預設資料。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 必填欄位缺失（如 `title`, `description`）或 `due_date` 格式不合 / 落在考核週期外。
  - `403 FORBIDDEN`: 登入主管沒有權限為該名 `{user_id}` 建立目標（非點陣或直屬部屬）。
  - `404 SUBORDINATE_NOT_FOUND`: 查無此 `{user_id}` 的員工資料。
  - `409 STATE_CONFLICT`: 目前考核週期狀態不是設定目標的階段。
- **Response 201**: 回傳新建的目標資料。
  ```json
  {
    "goal_id": "goal_20260520_002",
    "cycle_id": "cycle_2026_q3",
    "title": "降低系統延遲時間",
    "description": "於 Q3 結束前優化資料庫查詢，降低 API 平均回應時間至 200ms 以內。",
    "due_date": "2026-09-30",
    "status": "in_progress",
    "progress_percent": 0,
    "creator_role": "manager",
    "reviewer_id": "manager_001"
  }
  ```

### 4.2 編輯或審核個人目標
- **Method**: PATCH
- **URL**: `/users/{user_id}/goals/{goal_id}`
- **用途**: 調整已建立的目標內容，或審核員工提出的目標。針對員工提出的目標，可更新其 `status` (例如：`in_progress` 表示核准，`revision_requested` 表示退回修改)。
- **欄位說明**:
  - Request: 可選欄位 `status` (String, 目標狀態 `in_progress`, `revision_requested` 等), `title` (String), `description` (String), `due_date` (String), `comment` (String, 審核意見)。
  - Response: 更新後的目標詳情資源。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: `status` 狀態不合法，或者變更後的目標內容格式錯誤。
  - `403 FORBIDDEN`: 登入主管無權限審核。
  - `404 RESOURCE_NOT_FOUND`: 找不到該 `goal_id` 目標。
  - `409 STATE_CONFLICT`: 當前目標狀態不可再審核或修改（例如：目標狀態已完成/已取消）。
- **Request Body 範例**:
  ```json
  {
    "status": "in_progress",
    "title": "調整後的目標名稱",
    "comment": "目標清楚，同意執行。"
  }
  ```
- **Response 200**: 回傳編輯後的目標資料。
  ```json
  {
    "goal_id": "goal_20260520_001",
    "cycle_id": "cycle_2026_q3",
    "title": "調整後的目標名稱",
    "description": "計畫在第三季度將 CSAT 分數從 88% 提升至 92%。",
    "due_date": "2026-09-30",
    "status": "in_progress",
    "progress_percent": 0,
    "creator_role": "employee",
    "reviewer_id": "manager_001",
    "reviewer_comment": "目標清楚，同意執行。"
  }
  ```

### 4.3 查看個別部屬目標
- **Method**: GET
- **URL**: `/users/{user_id}/goals`
- **用途**: 條列該員工 (user_id) 本期或歷史的目標清單。
- **欄位說明**:
  - Request: Query params `cycle_id` (取得特定考核週期), `status` (狀態篩選)。預設為目前週期。
  - Response: 該員工所擁有的 `SubordinateGoal` 物件陣列。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: query parameter 格式不合法。
  - `403 FORBIDDEN`: 無權限查看該名員工。
  - `404 SUBORDINATE_NOT_FOUND`: 找不到特定員工。
- **Query Params**: `?cycle_id=xxx` 或 `?status=historical`
- **Response 200**:
  ```json
  {
    "data": [
      {
        "goal_id": "goal_20260520_001",
        "cycle_id": "cycle_2026_q3",
        "title": "提升 Q3 季度客戶滿意度",
        "description": "計畫在第三季度將 CSAT 分數從 88% 提升至 92%。",
        "due_date": "2026-09-30",
        "status": "in_progress",
        "progress_percent": 25,
        "creator_role": "employee",
        "reviewer_id": "manager_001"
      }
    ]
  }
  ```

### 4.4 為部屬設定或審核 KPI
- **Method**: POST
- **URL**: `/users/{user_id}/kpis`
- **用途**: 建立部屬的核心績效指標，可批次或單筆設定。
- **欄位說明**:
  - Request: `name` (String, KPI 名稱，必填), `description` (String, KPI 描述，必填), `weight` (Number, 權重，必填), `scoring_rule` (String, 評分規則)。可接受物件或陣列。
  - Response: 成功建立的一筆或多筆 `SubordinateKPI`。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 必填資料遺漏、權值不是數字，或者新增後總權重超過 100%。
  - `403 FORBIDDEN`: 登入主管並無權限（不直屬該員工）。
  - `404 SUBORDINATE_NOT_FOUND`: 查無 `{user_id}` 員工。
  - `409 STATE_CONFLICT`: 現階段考核不開放設定 KPI（例如：週期已進入鎖定打分階段）。
- **Response 201**: 回傳成功建立的 KPI 資料。
  ```json
  {
    "data": [
      {
        "kpi_id": "kpi_20260520_001",
        "cycle_id": "cycle_2026_q3",
        "name": "季營收達成率",
        "description": "達成個人季營收 100 萬的業績目標",
        "weight": 40,
        "scoring_rule": "達成 100% 得 5 分，80-99% 得 4 分",
        "status": "active"
      }
    ]
  }
  ```

### 4.5 調整 KPI 評分規則與權重
- **Method**: PATCH
- **URL**: `/users/{user_id}/kpis/{kpi_id}`
- **用途**: 調整 KPI 工作佔比權重或具體的評分標準規則（應於週期評核鎖定前完成）。
- **欄位說明**:
  - Request: `weight` (Number, 權重，選填), `scoring_rule` (String, 評分規則，選填), `description` (String, 職責描述，選填)。
  - Response: 更新後的 `SubordinateKPI`。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 權重不合規(小於 0 或是造成總權重超過 100%)。
  - `403 FORBIDDEN`: 登入者無此權限調整該員工。
  - `404 RESOURCE_NOT_FOUND`: 查無目標 `kpi_id`。
  - `409 STATE_CONFLICT`: 考核週期已進入評核階段，不可修改。
- **Request Body 範例**:
  ```json
  {
    "weight": 50,
    "scoring_rule": "優化後的計分方式"
  }
  ```
- **Response 200**:
  ```json
  {
    "kpi_id": "kpi_20260520_001",
    "cycle_id": "cycle_2026_q3",
    "name": "季營收達成率",
    "description": "達成個人季營收 100 萬的業績目標",
    "weight": 50,
    "scoring_rule": "優化後的計分方式",
    "status": "active"
  }
  ```

### 4.6 查看個別部屬 KPI
- **Method**: GET
- **URL**: `/users/{user_id}/kpis`
- **用途**: 檢視特定員工的 KPI 清單與權重分佈，前端藉此檢核權重加總是否為 100%。
- **欄位說明**:
  - Request: Query params `cycle_id` 等篩選條件。
  - Response: 該名員工在此週期內的 `SubordinateKPI` 物件清單。
- **可能錯誤 (HTTP Status)**:
  - `403 FORBIDDEN`: 非權責主管訪問。
  - `404 SUBORDINATE_NOT_FOUND`: 查無員工。
- **Response 200**:
  ```json
  {
    "data": [
      {
        "kpi_id": "kpi_20260520_001",
        "cycle_id": "cycle_2026_q3",
        "name": "季營收達成率",
        "description": "達成個人季營收 100 萬的業績目標",
        "weight": 50,
        "scoring_rule": "優化後的計分方式",
        "status": "active"
      },
      {
        "kpi_id": "kpi_20260520_002",
        "cycle_id": "cycle_2026_q3",
        "name": "新客開發數",
        "description": "本季新增 5 名經銷商",
        "weight": 50,
        "scoring_rule": "5 名得滿分",
        "status": "active"
      }
    ]
  }
  ```

## 5. 團隊績效評估與執行

### 5.1 填寫個人績效評分表
- **Method**: PATCH
- **URL**: `/users/{user_id}/evaluations/{evaluation_id}`
- **用途**: 針對進入評分階段的評估單，主管填寫個人 KPI 及行為指標的主管分數與評語。
- **欄位說明**:
  - Request: `status` (String, 主管評核結果狀態，例如 `manager_eval_completed`), `manager_score` (Number, 量化後的主管總分), `manager_comments` (String, 主管對該期績效的總評語), `item_scores` (Array, 各細項 KPI 或行為指標的評分細節，包含 `kpi_id`, `score`, `comment`)。
  - Response: 該名員工更新過後的評量詳情物件。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 分數超出合理範圍 (如小於 0 大於 100) 或遺漏必要評語。
  - `403 FORBIDDEN`: 非直屬主管或無評核權限。
  - `404 RESOURCE_NOT_FOUND`: 表單不存在。
  - `409 STATE_CONFLICT`: 現階段不在主管評核期（如：尚在自評中或已發布成績）。
- **Request Body 範例**:
  ```json
  {
    "status": "manager_eval_completed",
    "manager_score": 85,
    "manager_comments": "該員工本期表現優異...",
    "item_scores": [
      {
        "kpi_id": "kpi_20260520_001",
        "score": 4,
        "comment": "業績達標"
      }
    ]
  }
  ```
- **Response 200**:
  ```json
  {
    "evaluation_id": "eval_01",
    "user_id": "user_021",
    "cycle_id": "cycle_2026_q3",
    "status": "manager_eval_completed",
    "self_score": 80,
    "self_comments": "我認為本季表現良好。",
    "manager_score": 85,
    "manager_comments": "該員工本期表現優異...",
    "item_scores": [
      {
        "kpi_id": "kpi_20260520_001",
        "score": 4,
        "comment": "業績達標"
      }
    ],
    "updated_at": "2026-06-01T15:30:00+08:00"
  }
  ```

### 5.2 查看個人歷史考核結果
- **Method**: GET
- **URL**: `/users/{user_id}/evaluations`
- **用途**: 查詢部屬過往的考核紀錄。
- **欄位說明**:
  - Request: 無或者藉由 query params `?cycle_id=xxx` 塞選歷史點。
  - Response: 對應員工歷史以來的最終評估物件陣列。
- **權限判斷**: 若部屬轉調部門，後端將判斷 Requesting User 是否為該部屬「當時參與考核」或「現任主管」。若符合關聯權限才予以回傳，否則回 `403 FORBIDDEN`。
- **可能錯誤 (HTTP Status)**:
  - `403 FORBIDDEN`: 現任或當時主管驗證失敗（非合規之檢視者）。
  - `404 SUBORDINATE_NOT_FOUND`: 查無員工。
- **Response 200**:
  ```json
  {
    "data": [
      {
        "evaluation_id": "eval_00",
        "user_id": "user_021",
        "cycle_id": "cycle_2026_q2",
        "status": "completed",
        "final_grade": "A",
        "manager_score": 90,
        "manager_comments": "上一季表現傑出，專案全數達標。",
        "completed_at": "2026-07-05T10:00:00+08:00"
      }
    ]
  }
  ```

## 6. 部屬績效異議處理

### 6.1 查看部屬提交的異議申請列表
- **Method**: GET
- **URL**: `/teams/{team_id}/appeals`
- **用途**: 顯示該主管負責團隊下所有的異議申請案件（包含待處理與已完成）。
- **欄位說明**:
  - Request: 無或篩選 `status`。
  - Response: 團隊中的所有 `Appeal` 申請與關聯基本資料列表。
- **可能錯誤 (HTTP Status)**:
  - `403 FORBIDDEN`: 登入主管並非此 `{team_id}` 團隊負責人。
  - `404 RESOURCE_NOT_FOUND`: 查無該團隊。
- **Response 200**:
  ```json
  {
    "data": [
      {
        "appeal_id": "appeal_202605_001",
        "employee": {
          "user_id": "user_021",
          "name": "李小明"
        },
        "evaluation_id": "eval_01",
        "reason": "評分範圍未考量 Q2 中途加入的臨時專案",
        "status": "pending",
        "submitted_at": "2026-10-01T10:00:00+08:00"
      }
    ]
  }
  ```

### 6.2 查看異議申請資訊與佐證文件
- **Method**: GET
- **URL**: `/teams/{team_id}/appeals/{appeal_id}`
- **用途**: 載入單一異議案件的詳細說明及員工上傳的相關佐證附檔。
- **欄位說明**:
  - Request: 無。
  - Response: 單一異議的完整紀錄（包含所有包含佐證圖檔 `attachments` 相關連結）。
- **可能錯誤 (HTTP Status)**:
  - `403 FORBIDDEN`: 無權限查看該物件。
  - `404 RESOURCE_NOT_FOUND`: 查無該異議點。
- **Response 200**:
  ```json
  {
    "appeal_id": "appeal_202605_001",
    "employee": {
      "user_id": "user_021",
      "name": "李小明"
    },
    "evaluation_id": "eval_01",
    "reason": "評分範圍未考量 Q2 中途加入的臨時專案",
    "attachments": [
      {
        "file_id": "file_123456",
        "url": "/assets/docs/appeal1.pdf",
        "name": "補件說明.pdf"
      }
    ],
    "status": "pending",
    "manager_decision": null,
    "manager_comment": null,
    "submitted_at": "2026-10-01T10:00:00+08:00"
  }
  ```

### 6.3 處理異議申請
- **Method**: PATCH
- **URL**: `/teams/{team_id}/appeals/{appeal_id}`
- **用途**: 主管填寫異議處理意見，執行「駁回」(Reject) 或「調整評分」(Adjust Evaluate)，處理完畢後系統自動發送通知告知該員工處理結果。
- **欄位說明**:
  - Request: `manager_decision` (String, 主管決策結果 `adjusted` 或 `rejected`), `manager_comment` (String, 主管對此案件的審核文字回覆必填), `adjusted_score` (Number, 若決定調整所需修改之最終分數，選擇調整時必填)。
  - Response: 更新後的異議 `Appeal` 物件，包含了 `resolved_at` 新的時間戳。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 未給予處理意見、或選擇「調整評分」但卻未帶上 `adjusted_score`。
  - `403 FORBIDDEN`: 登入主管無權限處理。
  - `404 RESOURCE_NOT_FOUND`: 找不到特定考核異議單。
  - `409 STATE_CONFLICT`: 此異議早已處理並結案，無法再次發佈。
- **Request Body 範例**:
  ```json
  {
    "manager_decision": "adjusted",
    "manager_comment": "經核對附檔確認，Q2 專案表現確有貢獻，予以微調計分。",
    "adjusted_score": 88 
  }
  ```
- **Response 200**: 回傳更新後的異議資料狀態。
  ```json
  {
    "appeal_id": "appeal_202605_001",
    "employee": {
      "user_id": "user_021",
      "name": "李小明"
    },
    "evaluation_id": "eval_01",
    "status": "adjusted",
    "manager_decision": "adjusted",
    "manager_comment": "經核對附檔確認，Q2 專案表現確有貢獻，予以微調計分。",
    "submitted_at": "2026-10-01T10:00:00+08:00",
    "resolved_at": "2026-10-05T14:20:00+08:00"
  }
  ```
