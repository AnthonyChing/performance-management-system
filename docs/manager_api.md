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
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "cycle_id": "123e4567-e89b-12d3-a456-426614174001",
  "owner_id": "123e4567-e89b-12d3-a456-426614174010",
  "set_by": "123e4567-e89b-12d3-a456-426614174020",
  "goal_type": "individual",
  "title": "提升 Q3 季度客戶滿意度",
  "description": "計畫在第三季度將 CSAT 分數從 88% 提升至 92%。",
  "weight": 20.00,
  "target_value": "92%",
  "current_value": "88%",
  "due_date": "2026-09-30",
  "status": "active",
  "published_at": "2026-06-01T10:00:00+08:00"
}
```
* `status` 對應資料庫 `goal_status_enum` (例如：`active`, `completed`, `cancelled`)。

### 3.2 SubordinateKPI (部屬KPI模型)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174030",
  "cycle_id": "123e4567-e89b-12d3-a456-426614174001",
  "created_by": "123e4567-e89b-12d3-a456-426614174020",
  "kpi_type": "individual",
  "title": "季營收達成率",
  "description": "達成個人季營收 100 萬的業績目標",
  "unit": "NTD",
  "assignment": {
    "target_value": 1000000.0000,
    "current_value": 850000.0000,
    "last_updated_at": "2026-08-15T15:00:00+08:00"
  },
  "published_at": "2026-06-01T10:00:00+08:00"
}
```

### 3.3 Appeal (異議申請模型)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174050",
  "review_id": "123e4567-e89b-12d3-a456-426614174060",
  "filed_by": "123e4567-e89b-12d3-a456-426614174010",
  "assigned_to_type": "senior_manager",
  "assigned_to": "123e4567-e89b-12d3-a456-426614174070",
  "reason": "評分範圍未考量 Q2 中途加入的臨時專案",
  "status": "submitted",
  "filed_at": "2026-10-01T10:00:00+08:00",
  "resolved_at": null,
  "responses": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174080",
      "responded_by": "123e4567-e89b-12d3-a456-426614174070",
      "response_text": "經核對附檔確認，Q2 專案表現確有貢獻。",
      "is_final": true,
      "responded_at": "2026-10-05T14:20:00+08:00"
    }
  ]
}
```

狀態語意：`submitted` (已提交)、`under_review` (審核中)、`resolved` (已結案)。

## 4. 目標與 KPI 管理

### 4.1 新增本期個人目標
- **Method**: POST
- **URL**: `/users/{user_id}/goals`
- **用途**: 主管直接為該部屬指派新的個人 SMART 目標。
- **欄位說明**:
  - Request: `title` (String, 目標名稱，必填), `description` (String, 內容說明), `goal_type` (String, `individual` 判斷), `weight` (Number, 權重), `target_value` (String, 預期目標), `due_date` (String, YYYY-MM-DD，必須落在週期內).
  - Response: 回傳建立的目標資料包含了 `id`, `status` (`active`) 等預設資料。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 必填欄位缺失（如 `title`）或 `due_date` 格式不合 / 落在考核週期外。
  - `403 FORBIDDEN`: 登入主管沒有權限為該名 `{user_id}` 建立目標（非直屬部屬）。
  - `404 SUBORDINATE_NOT_FOUND`: 查無此 `{user_id}` 的員工資料。
  - `409 STATE_CONFLICT`: 目前考核週期狀態 (`is_locked = true`) 不是設定目標的階段。
- **Response 201**: 回傳新建的目標資料。
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "cycle_id": "123e4567-e89b-12d3-a456-426614174001",
    "owner_id": "123e4567-e89b-12d3-a456-426614174010",
    "set_by": "123e4567-e89b-12d3-a456-426614174020",
    "goal_type": "individual",
    "title": "降低系統延遲時間",
    "description": "於 Q3 結束前優化資料庫查詢，降低 API 平均回應時間至 200ms 以內。",
    "weight": 20.00,
    "target_value": "200ms",
    "current_value": null,
    "due_date": "2026-09-30",
    "status": "active",
    "published_at": "2026-06-01T10:00:00+08:00"
  }
  ```

### 4.2 編輯或審核個人目標
- **Method**: PATCH
- **URL**: `/users/{user_id}/goals/{goal_id}`
- **用途**: 調整已建立的目標內容，或審核員工提出的目標。針對員工提出的目標，可更新其 `status`。
- **欄位說明**:
  - Request: 可選欄位 `status` (String, 目標狀態 `active`, `completed`, `cancelled`), `title` (String), `description` (String), `weight` (Number), `target_value` (String), `due_date` (String)。
  - Response: 更新後的目標詳情資源。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: `status` 狀態不合法，或者變更後的目標內容格式錯誤。
  - `403 FORBIDDEN`: 登入主管無權限審核。
  - `404 RESOURCE_NOT_FOUND`: 找不到該目標。
  - `409 STATE_CONFLICT`: 當前週期 `is_locked = true` 不可再審核或修改。
- **Request Body 範例**:
  ```json
  {
    "status": "active",
    "title": "調整後的目標名稱",
    "weight": 25.00
  }
  ```
- **Response 200**: 回傳編輯後的目標資料。
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "cycle_id": "123e4567-e89b-12d3-a456-426614174001",
    "owner_id": "123e4567-e89b-12d3-a456-426614174010",
    "set_by": "123e4567-e89b-12d3-a456-426614174020",
    "goal_type": "individual",
    "title": "調整後的目標名稱",
    "description": "於 Q3 結束前優化資料庫查詢，降低 API 平均回應時間至 200ms 以內。",
    "weight": 25.00,
    "target_value": "200ms",
    "current_value": null,
    "due_date": "2026-09-30",
    "status": "active",
    "published_at": "2026-06-05T10:00:00+08:00"
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
- **Query Params**: `?cycle_id=xxx` 或 `?status=completed`
- **Response 200**:
  ```json
  {
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "cycle_id": "123e4567-e89b-12d3-a456-426614174001",
        "owner_id": "123e4567-e89b-12d3-a456-426614174010",
        "set_by": "123e4567-e89b-12d3-a456-426614174020",
        "goal_type": "individual",
        "title": "提升 Q3 季度客戶滿意度",
        "description": "計畫在第三季度將 CSAT 分數從 88% 提升至 92%。",
        "weight": 20.00,
        "target_value": "92%",
        "current_value": "88%",
        "due_date": "2026-09-30",
        "status": "active",
        "published_at": "2026-06-01T10:00:00+08:00"
      }
    ]
  }
  ```

### 4.4 為部屬設定或審核 KPI
- **Method**: POST
- **URL**: `/users/{user_id}/kpis`
- **用途**: 建立部屬的核心績效指標，也可同時產生 `kpi_assignments` 資料。
- **欄位說明**:
  - Request: `title` (String, KPI 名稱，必填), `description` (String, KPI 描述), `kpi_type` (String, `individual` 或 `team`), `unit` (String, 測量單位), `target_value` (Number, 寫入 `kpi_assignments` 表格，必填). 
  - Response: 成功建立的一筆或多筆 `SubordinateKPI`。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 必填資料遺漏、權值不是數字等。
  - `403 FORBIDDEN`: 登入主管並無權限（不直屬該員工）。
  - `404 SUBORDINATE_NOT_FOUND`: 查無 `{user_id}` 員工。
  - `409 STATE_CONFLICT`: 現階段考核不開放設定 KPI（`is_locked = true`）。
- **Response 201**: 回傳成功建立的 KPI 資料。
  ```json
  {
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174030",
        "cycle_id": "123e4567-e89b-12d3-a456-426614174001",
        "created_by": "123e4567-e89b-12d3-a456-426614174020",
        "kpi_type": "individual",
        "title": "季營收達成率",
        "description": "達成個人季營收 100 萬的業績目標",
        "unit": "NTD",
        "assignment": {
          "target_value": 1000000.0000,
          "current_value": null,
          "last_updated_at": null
        },
        "published_at": "2026-06-01T10:00:00+08:00"
      }
    ]
  }
  ```

### 4.5 調整 KPI 目標值或內容
- **Method**: PATCH
- **URL**: `/users/{user_id}/kpis/{kpi_id}`
- **用途**: 調整 KPI 指定員工的 `target_value` 目標值或職責描述（應於週期評核鎖定前完成）。
- **欄位說明**:
  - Request: `target_value` (Number, 目標值，選填), `title` (String, 選填), `description` (String, 職責描述，選填)。
  - Response: 更新後的 `SubordinateKPI`。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 資料驗證錯誤。
  - `403 FORBIDDEN`: 登入者無此權限調整該員工。
  - `404 RESOURCE_NOT_FOUND`: 查無此 KPI 或指派關係。
  - `409 STATE_CONFLICT`: 考核週期已 `locked`，不可修改。
- **Request Body 範例**:
  ```json
  {
    "target_value": 1200000.0000,
    "description": "追加業績目標調升"
  }
  ```
- **Response 200**:
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174030",
    "cycle_id": "123e4567-e89b-12d3-a456-426614174001",
    "created_by": "123e4567-e89b-12d3-a456-426614174020",
    "kpi_type": "individual",
    "title": "季營收達成率",
    "description": "追加業績目標調升",
    "unit": "NTD",
    "assignment": {
      "target_value": 1200000.0000,
      "current_value": null,
      "last_updated_at": null
    },
    "published_at": "2026-06-01T10:00:00+08:00"
  }
  ```

### 4.6 查看個別部屬 KPI
- **Method**: GET
- **URL**: `/users/{user_id}/kpis`
- **用途**: 檢視特定員工的 KPI 清單設計，包含他們自身的 `kpi_assignments` 目標與進度。
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
        "id": "123e4567-e89b-12d3-a456-426614174030",
        "cycle_id": "123e4567-e89b-12d3-a456-426614174001",
        "created_by": "123e4567-e89b-12d3-a456-426614174020",
        "kpi_type": "individual",
        "title": "季營收達成率",
        "description": "達成個人季營收 100 萬的業績目標",
        "unit": "NTD",
        "assignment": {
          "target_value": 1200000.0000,
          "current_value": 850000.0000,
          "last_updated_at": "2026-08-15T15:00:00+08:00"
        },
        "published_at": "2026-06-01T10:00:00+08:00"
      }
    ]
  }
  ```

## 5. 團隊績效評估與執行

### 5.1 填寫個人績效評分表
- **Method**: PATCH
- **URL**: `/users/{user_id}/evaluations/{review_id}`
- **用途**: 針對進入評分階段的評估單，主管填寫各項問題的評分及總結語。
- **欄位說明**:
  - Request: `status` (String, `manager_eval_in_progress` 或 `completed`), `final_rating` (String, 對應 `rating_scale_enum` 如 `meets_expectations`), `manager_comment` (String, 主管對該期績效的總評語), `responses` (Array, 對各 `question_id` 的回答，包含 `question_id`, `rating_value`, `text_value`)。
  - Response: 更新過後的評量詳情物件。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 回答必填問題缺失或格式錯誤。
  - `403 FORBIDDEN`: 非直屬或指定評核主管。
  - `404 RESOURCE_NOT_FOUND`: 表單 `review_id` 不存在。
  - `409 STATE_CONFLICT`: 現階段不在主管評核期（如：員工仍在自評階段，或是早已發布成績）。
- **Request Body 範例**:
  ```json
  {
    "status": "completed",
    "final_rating": "exceeds_expectations",
    "manager_comment": "該員工本期表現優異，超乎預期。",
    "responses": [
      {
        "question_id": "123e4567-e89b-12d3-a456-426614174090",
        "rating_value": 4,
        "text_value": "業績達標且超出預期"
      }
    ]
  }
  ```
- **Response 200**:
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174060",
    "cycle_id": "123e4567-e89b-12d3-a456-426614174001",
    "employee_id": "123e4567-e89b-12d3-a456-426614174010",
    "manager_id": "123e4567-e89b-12d3-a456-426614174020",
    "status": "completed",
    "final_rating": "exceeds_expectations",
    "manager_comment": "該員工本期表現優異，超乎預期。",
    "responses": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174095",
        "question_id": "123e4567-e89b-12d3-a456-426614174090",
        "respondent_type": "manager",
        "rating_value": 4,
        "text_value": "業績達標且超出預期",
        "responded_at": "2026-06-01T15:30:00+08:00"
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
  - Request: 無或者藉由 query params `?cycle_id=xxx` 篩選歷史點。
  - Response: 對應員工歷史以來的最終 `PerformanceReview` 物件陣列。
- **權限判斷**: 若部屬轉調部門，後端將判斷 Requesting User 是否為該部屬「當時參與考核」或「現任主管」。若符合關聯權限才予以回傳，否則回 `403 FORBIDDEN`。
- **可能錯誤 (HTTP Status)**:
  - `403 FORBIDDEN`: 現任或當時主管驗證失敗（非合規之檢視者）。
  - `404 SUBORDINATE_NOT_FOUND`: 查無員工。
- **Response 200**:
  ```json
  {
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174061",
        "cycle_id": "123e4567-e89b-12d3-a456-426614174000",
        "employee_id": "123e4567-e89b-12d3-a456-426614174010",
        "manager_id": "123e4567-e89b-12d3-a456-426614174020",
        "status": "completed",
        "final_rating": "meets_expectations",
        "manager_comment": "上一季表現傑出，專案全數達標。",
        "manager_submitted_at": "2026-07-05T10:00:00+08:00"
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
        "id": "123e4567-e89b-12d3-a456-426614174050",
        "review_id": "123e4567-e89b-12d3-a456-426614174060",
        "filed_by": "123e4567-e89b-12d3-a456-426614174010",
        "assigned_to_type": "senior_manager",
        "assigned_to": "123e4567-e89b-12d3-a456-426614174070",
        "reason": "評分範圍未考量 Q2 中途加入的臨時專案",
        "status": "submitted",
        "filed_at": "2026-10-01T10:00:00+08:00"
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
  - Response: 單一異議 `Appeal` 的完整紀錄（若有結合其他文檔表格或評核記錄一併帶出）。
- **可能錯誤 (HTTP Status)**:
  - `403 FORBIDDEN`: 登入主管無權限查看該物件。
  - `404 RESOURCE_NOT_FOUND`: 查無該異議案件 `appeal_id`。
- **Response 200**:
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174050",
    "review_id": "123e4567-e89b-12d3-a456-426614174060",
    "filed_by": "123e4567-e89b-12d3-a456-426614174010",
    "assigned_to_type": "senior_manager",
    "assigned_to": "123e4567-e89b-12d3-a456-426614174070",
    "reason": "評分範圍未考量 Q2 中途加入的臨時專案",
    "status": "submitted",
    "filed_at": "2026-10-01T10:00:00+08:00",
    "resolved_at": null,
    "responses": []
  }
  ```

### 6.3 處理異議申請
- **Method**: PATCH
- **URL**: `/teams/{team_id}/appeals/{appeal_id}`
- **用途**: 主管回覆處理異議案件，填寫回覆意見（可多次溝通），若 `is_final` 為 `true` 則代表結案。
- **欄位說明**:
  - Request: `response_text` (String, 主管對此案件的詳細回覆，必填), `is_final` (Boolean, 是否為最終回覆結案動作)。若確定調整分數，需額外透過評價 PATCH API 更新分數，此紀錄專注處理回覆流程。
  - Response: 更新後的異議 `Appeal` 物件，包含了新增的回應紀錄及可能的 `resolved_at` 新的時間戳。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 未給予處置意見 `response_text`。
  - `403 FORBIDDEN`: 登入主管無權限處理此異議。
  - `404 RESOURCE_NOT_FOUND`: 找不到特定考核異議單 `appeal_id`。
  - `409 STATE_CONFLICT`: 此異議早已處理完畢結案 (`resolved_at != null`)，無法再次添加回覆。
- **Request Body 範例**:
  ```json
  {
    "response_text": "經核對附檔確認，Q2 專案表現確有貢獻。已同步更新評分表內容。",
    "is_final": true
  }
  ```
- **Response 200**: 回傳更新後的異議資料狀態。
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174050",
    "review_id": "123e4567-e89b-12d3-a456-426614174060",
    "filed_by": "123e4567-e89b-12d3-a456-426614174010",
    "assigned_to_type": "senior_manager",
    "assigned_to": "123e4567-e89b-12d3-a456-426614174070",
    "reason": "評分範圍未考量 Q2 中途加入的臨時專案",
    "status": "resolved",
    "filed_at": "2026-10-01T10:00:00+08:00",
    "resolved_at": "2026-10-05T14:20:00+08:00",
    "responses": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174080",
        "responded_by": "123e4567-e89b-12d3-a456-426614174070",
        "response_text": "經核對附檔確認，Q2 專案表現確有貢獻。已同步更新評分表內容。",
        "is_final": true,
        "responded_at": "2026-10-05T14:20:00+08:00"
      }
    ]
  }
  ```
