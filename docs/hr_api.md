# HR 端 API 實作規格

## 1. 共用規格

- Content-Type: `application/json`
- 日期格式: `YYYY-MM-DD`
- 時間格式: ISO 8601，例如 `2026-05-21T09:30:00+08:00`
- 登入者身分由後端依 token / session 判斷，必須具備 `hr` 角色權限。
- 列表 API 支援分頁（`page` 從 1 開始），空資料時回傳 `200` 搭配空陣列 `[]`。
- API 路徑中的 `{template_id}` 和 `{question_id}` 為對應資源的 UUID。

### 1.1 統一錯誤格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "欄位驗證失敗。",
    "details": [
      {
        "field": "name",
        "message": "模板名稱為必填欄位。"
      }
    ]
  }
}
```

常見 HTTP status:

| Status | code | 使用情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Request 格式錯誤、必填缺漏、欄位型別或數值錯誤 |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 403 | `FORBIDDEN` | 登入者無 HR 權限 |
| 404 | `RESOURCE_NOT_FOUND` | 查無指定的模板或問題 |
| 409 | `STATE_CONFLICT` | 狀態衝突（例如：嘗試直接編輯已發布鎖定、或者有週期參用的模板） |

## 2. API 一覽

| 功能模組 | Method | URL | 用途 |
| --- | --- | --- | --- |
| 模板管理 | POST | `/hr/questionnaire-templates` | 建立問卷模板 |
| 模板管理 | PATCH | `/hr/questionnaire-templates/{template_id}` | 編輯/暫存問卷模板 |
| 模板管理 | DELETE | `/hr/questionnaire-templates/{template_id}` | 刪除問卷模板 |
| 模板管理 | GET | `/hr/questionnaire-templates/{template_id}` | 瀏覽特定問卷模板 |
| 模板管理 | GET | `/hr/questionnaire-templates` | 瀏覽所有問卷模板 |
| 模板管理 | POST | `/hr/questionnaire-templates/{template_id}/duplicate` | 複製問卷模板 |
| 模板管理 | POST | `/hr/questionnaire-templates/{template_id}/publish` | 發布/啟用問卷模板 |
| 問題管理 | POST | `/hr/questionnaire-templates/{template_id}/questions` | 新增問題至模板 |
| 問題管理 | PATCH | `/hr/questionnaire-templates/{template_id}/questions/{question_id}` | 編輯特定問題 |
| 問題管理 | DELETE | `/hr/questionnaire-templates/{template_id}/questions/{question_id}` | 刪除特定問題 |
| 問題管理 | GET | `/hr/questionnaire-templates/{template_id}/questions/{question_id}` | 瀏覽特定問題細節 |
| 問題管理 | GET | `/hr/questionnaire-templates/{template_id}/questions` | 瀏覽該模板下所有問題 |
| 問題管理 | PATCH | `/hr/questionnaire-templates/{template_id}/questions/reorder` | 批次重新排序模板問題 |

## 3. 共用狀態與資料模型

### 3.1 EvaluationTemplate (問卷模板模型)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "工程部門 2026 評估模板",
  "description": "適用於所有工程團隊的半年度及年度評核。",
  "job_function": "engineering",
  "is_active": true,
  "status": "published",
  "created_by": "123e4567-e89b-12d3-a456-426614174010",
  "updated_by": "123e4567-e89b-12d3-a456-426614174010",
  "created_at": "2026-05-01T10:00:00+08:00",
  "updated_at": "2026-05-15T14:30:00+08:00",
  "deleted_at": null,
  "usage_count": 2
}
```

* `status` 在實務流程上分為 `draft`（草稿）與 `published`（已發布可供週期綁定）。
* `usage_count` 代表本模板被多少個 `performance_cycles` 使用中，前端可藉此判斷是否允許刪除或大幅度修改。
* `updated_by` 代表最後一次修改該資源的使用者 ID。
* 刪除操作為實作 Soft Delete，刪除後 `deleted_at` 寫入時間截記，且 `is_active` 設為 `false`。

### 3.2 TemplateQuestion (模板問題模型)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174100",
  "template_id": "123e4567-e89b-12d3-a456-426614174000",
  "question_text": "在過去一季中，該員工的程式碼品質符合團隊標準的程度？",
  "question_type": "rating",
  "rating_scale_max": 5,
  "is_required": true,
  "sort_order": 1,
  "created_by": "123e4567-e89b-12d3-a456-426614174010",
  "updated_by": "123e4567-e89b-12d3-a456-426614174010",
  "created_at": "2026-05-01T10:05:00+08:00",
  "updated_at": "2026-05-01T10:05:00+08:00",
  "deleted_at": null
}
```

* `question_type` 可為 `rating`, `text`, `boolean`。當為 `rating` 時，`rating_scale_max` 必須有值（例如 5 或 10）。

---

## 4. 問卷模板操作 (Questionnaire Templates)

### 4.1 建立問卷模板
- **Method**: POST
- **URL**: `/hr/questionnaire-templates`
- **用途**: 新增一個全新的模板草稿。
- **欄位說明**:
  - Request: `name` (String, 模板名稱，必填), `description` (String, 描述), `job_function` (String, 適用的職能類別)。
  - Response: 回傳新建的模板資料，預設狀態為 `draft`，且 `is_active` 為 `true`。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: `name` 缺失或超長。
- **Request Body 範例**:
  ```json
  {
    "name": "2026 業務部年度考核問卷",
    "description": "業務與銷售相關同仁適用",
    "job_function": "sales"
  }
  ```
- **Response 201**:
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "2026 業務部年度考核問卷",
    "description": "業務與銷售相關同仁適用",
    "job_function": "sales",
    "status": "draft",
    "is_active": true,
    "created_by": "123e4567-e89b-12d3-a456-426614174010",
    "updated_by": "123e4567-e89b-12d3-a456-426614174010",
    "created_at": "2026-05-25T10:00:00+08:00",
    "updated_at": "2026-05-25T10:00:00+08:00",
    "deleted_at": null
  }
  ```

### 4.2 編輯/暫存問卷模板
- **Method**: PATCH
- **URL**: `/hr/questionnaire-templates/{template_id}`
- **用途**: 變更問卷的基本資訊（名稱、描述、職能分類）。
- **欄位說明**:
  - Request: `name` (String), `description` (String), `job_function` (String)。皆為選填。
  - Response: 回傳更新後的模板。
- **可能錯誤 (HTTP Status)**:
  - `404 RESOURCE_NOT_FOUND`: 找不到特定的 `template_id`。
  - `409 STATE_CONFLICT`: 若模板已有人使用(`usage_count > 0`)且嘗試變更會影響結果的欄位時。
- **Request Body 範例**:
  ```json
  {
    "description": "業務與銷售相關同仁適用 (更新版)"
  }
  ```
- **Response 200**:
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "2026 業務部年度考核問卷",
    "description": "業務與銷售相關同仁適用 (更新版)",
    "job_function": "sales",
    "status": "draft",
    "is_active": true,
    "updated_by": "123e4567-e89b-12d3-a456-426614174010",
    "updated_at": "2026-05-26T11:00:00+08:00"
  }
  ```

### 4.3 刪除問卷模板
- **Method**: DELETE
- **URL**: `/hr/questionnaire-templates/{template_id}`
- **用途**: 刪除草稿或未使用過的模板。實作上請將其 `is_active` 設為 `false` (Soft Delete)。
- **可能錯誤 (HTTP Status)**:
  - `404 RESOURCE_NOT_FOUND`: 找不到特定模板。
  - `409 STATE_CONFLICT`: 此模板有被任何一個 `cycle_template_assignments` 引用（`usage_count > 0`），後端必須拒絕刪除操作，避免歷史紀錄無法查詢。
- **Response 204**: 
  (No Content)

### 4.4 瀏覽特定問卷模板
- **Method**: GET
- **URL**: `/hr/questionnaire-templates/{template_id}`
- **用途**: 取得單一模板的詳細資訊，通常搭配取得底下所有 questions 來渲染問卷預覽畫面。
- **Response 200**:
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "2026 業務部年度考核問卷",
    "description": "業務與銷售相關同仁適用",
    "job_function": "sales",
    "status": "published",
    "is_active": true,
    "usage_count": 1,
    "created_at": "2026-05-25T10:00:00+08:00",
    "updated_at": "2026-05-26T10:00:00+08:00"
  }
  ```

### 4.5 瀏覽所有問卷模板
- **Method**: GET
- **URL**: `/hr/questionnaire-templates`
- **用途**: 列出所有模板，提供分頁與條件篩選。
- **欄位說明**:
  - Request: Query params `page` (Integer), `status` (`draft` or `published`), `job_function` (String)。
- **Response 200**:
  ```json
  {
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "2026 業務部年度考核問卷",
        "job_function": "sales",
        "status": "draft",
        "is_active": true
      }
    ],
    "meta": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 48
    }
  }
  ```

### 4.6 複製問卷模板
- **Method**: POST
- **URL**: `/hr/questionnaire-templates/{template_id}/duplicate`
- **用途**: HR 常見需求：沿用舊模板修改。會複製原模板基本設定與所有問題，產出一個全新的 `draft` 狀態的模板。
- **Response 201**:
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "name": "2026 業務部年度考核問卷 (複製)",
    "status": "draft",
    "is_active": true
  }
  ```

### 4.7 發布/啟用問卷模板
- **Method**: POST
- **URL**: `/hr/questionnaire-templates/{template_id}/publish`
- **用途**: 將 `draft` 狀態的模板正式轉為 `published`，只有 published 狀態的模板才可以被指派到考核週期中使用。若已發布，原則上不得隨意修改問題結構。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 模板之下沒有任何問題（Questions count = 0），無法發布。
  - `404 RESOURCE_NOT_FOUND`: 找不到模板。
  - `409 STATE_CONFLICT`: 模板已經是發布狀態。
- **Response 200**:
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "status": "published",
    "updated_at": "2026-05-27T09:00:00+08:00"
  }
  ```

---

## 5. 單一問卷問題操作 (Questions)

### 5.1 新增問題至模板
- **Method**: POST
- **URL**: `/hr/questionnaire-templates/{template_id}/questions`
- **用途**: 在特定模板下增加一個評量題目。新題目的 `sort_order` 可由後端預設排在最後。
- **欄位說明**:
  - Request: `question_text` (String, 必填), `question_type` (Enum: `rating`, `text`, `boolean`, 必填), `rating_scale_max` (Integer, 若為 rating 則必填), `is_required` (Boolean, 預設 true)。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: `question_type` 是 `rating` 但是沒有提供 `rating_scale_max`。
  - `409 STATE_CONFLICT`: 若模板狀態已發布或者正在被使用，限制新增題目。
- **Request Body 範例**:
  ```json
  {
    "question_text": "在過去一季中，該員工的程式碼品質符合團隊標準的程度？",
    "question_type": "rating",
    "rating_scale_max": 5,
    "is_required": true
  }
  ```
- **Response 201**:
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174100",
    "template_id": "123e4567-e89b-12d3-a456-426614174000",
    "question_text": "在過去一季中，該員工的程式碼品質符合團隊標準的程度？",
    "question_type": "rating",
    "rating_scale_max": 5,
    "is_required": true,
    "sort_order": 1
  }
  ```

### 5.2 編輯特定問題
- **Method**: PATCH
- **URL**: `/hr/questionnaire-templates/{template_id}/questions/{question_id}`
- **用途**: 修改題目的文字、類型或必填屬性。
- **可能錯誤 (HTTP Status)**:
  - `404 RESOURCE_NOT_FOUND`: 找不到特定題目。
  - `409 STATE_CONFLICT`: 若模板已被週期使用中，建議阻擋改變題型等破壞性操作。
- **Request Body 範例**:
  ```json
  {
    "question_text": "該員工具備良好的跨部門溝通能力嗎？"
  }
  ```
- **Response 200**: 更新後的題目物件

### 5.3 刪除特定問題
- **Method**: DELETE
- **URL**: `/hr/questionnaire-templates/{template_id}/questions/{question_id}`
- **用途**: 刪除單一題目。若該模板還沒發布，可以直接移除並連帶在後端重算排序；若已發布或使用，請評估實作軟刪除或回傳 409。 
- **Response 204**: 
  (No Content)

### 5.4 瀏覽特定問題細節
- **Method**: GET
- **URL**: `/hr/questionnaire-templates/{template_id}/questions/{question_id}`
- **用途**: 取得單一題目資料。
- **Response 200**:
  ```json
  {
    "id": "123e4567-e89b-12d3-a456-426614174100",
    "template_id": "123e4567-e89b-12d3-a456-426614174000",
    "question_text": "該員工具備良好的跨部門溝通能力嗎？",
    "question_type": "boolean",
    "rating_scale_max": null,
    "is_required": true,
    "sort_order": 1
  }
  ```

### 5.5 瀏覽該模板下所有問題
- **Method**: GET
- **URL**: `/hr/questionnaire-templates/{template_id}/questions`
- **用途**: 依 `sort_order` 排序，回傳該模板所有建立的問題。
- **Response 200**:
  ```json
  {
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174100",
        "question_text": "...",
        "question_type": "rating",
        "sort_order": 1
      },
      {
        "id": "123e4567-e89b-12d3-a456-426614174101",
        "question_text": "...",
        "question_type": "text",
        "sort_order": 2
      }
    ]
  }
  ```

### 5.6 批次重新排序模板問題
- **Method**: PATCH
- **URL**: `/hr/questionnaire-templates/{template_id}/questions/reorder`
- **用途**: 當使用者在前端拖拉調整順序時，將新的題號順序 ID 陣列送出，更新資料庫的 `sort_order`。
- **欄位說明**:
  - Request: `ordered_question_ids` (Array of UUIDs，必填)，陣列的 Index 將成為新的 `sort_order`。
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 傳入的 ID 清單數量與當前模板不符，或是包含無效的 UUID。
  - `409 STATE_CONFLICT`: 發布後不得重排。
- **Request Body 範例**:
  ```json
  {
    "ordered_question_ids": [
      "123e4567-e89b-12d3-a456-426614174101",
      "123e4567-e89b-12d3-a456-426614174100"
    ]
  }
  ```
- **Response 200**:
  ```json
  {
    "message": "Questions reordered successfully."
  }
  ```
