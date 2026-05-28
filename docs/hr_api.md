# HR 端 API 實作規格

## 1. 共用規格

- Content-Type: `application/json`
- 日期格式: `YYYY-MM-DD`
- 時間格式: ISO 8601，例如 `2026-05-21T09:30:00+08:00`
- 登入者身分由後端依 token / session 判斷，必須具備 `hr` 角色權限。
- 列表 API 支援分頁（`page` 從 1 開始），空資料時回傳 `200` 搭配空陣列 `[]`。
- API 路徑中的 `{template_id}` 和 `{question_id}` 為對應資源的 UUID。
- `assessment-templates` 指問卷模板；`evaluation-templates` 指考核模板。考核模板會綁定一個考核週期、員工群組，並引用一到多個已發布的問卷模板。

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
| 模板管理 | POST | `/hr/assessment-templates` | 建立問卷模板 |
| 模板管理 | PATCH | `/hr/assessment-templates/{template_id}` | 編輯/暫存問卷模板 |
| 模板管理 | DELETE | `/hr/assessment-templates/{template_id}` | 刪除問卷模板 |
| 模板管理 | GET | `/hr/assessment-templates/{template_id}` | 瀏覽特定問卷模板 |
| 模板管理 | GET | `/hr/assessment-templates` | 瀏覽所有問卷模板 |
| 模板管理 | POST | `/hr/assessment-templates/{template_id}/duplicate` | 複製問卷模板 |
| 模板管理 | POST | `/hr/assessment-templates/{template_id}/publish` | 發布/啟用問卷模板 |
| 問題管理 | POST | `/hr/assessment-templates/{template_id}/questions` | 新增問題至模板 |
| 問題管理 | PATCH | `/hr/assessment-templates/{template_id}/questions/{question_id}` | 編輯特定問題 |
| 問題管理 | DELETE | `/hr/assessment-templates/{template_id}/questions/{question_id}` | 刪除特定問題 |
| 問題管理 | GET | `/hr/assessment-templates/{template_id}/questions/{question_id}` | 瀏覽特定問題細節 |
| 問題管理 | GET | `/hr/assessment-templates/{template_id}/questions` | 瀏覽該模板下所有問題 |
| 問題管理 | PATCH | `/hr/assessment-templates/{template_id}/questions/reorder` | 批次重新排序模板問題 |
| 問卷模板套用（Legacy） | POST | `/hr/assessment-templates/{template_id}/applications` | 舊版問卷模板套用，不建議新功能使用 |
| 考核模板 | POST | `/hr/evaluation-templates` | 建立考核模板 |
| 考核模板 | PATCH | `/hr/evaluation-templates/{template_id}` | 編輯考核模板 |
| 考核模板 | GET | `/hr/evaluation-templates/{template_id}` | 瀏覽特定考核模板 |
| 考核模板 | GET | `/hr/evaluation-templates` | 瀏覽所有考核模板 |
| 員工群組 | GET | `/hr/employee-groups` | 取得考核模板可選用的員工群組 |
| 評估週期 | POST | `/hr/performance-cycles` | 設定評估週期 |
| 評估週期 | GET | `/hr/performance-cycles` | 查看所有週期清單 |
| 評估週期 | GET | `/hr/performance-cycles/{cycle_id}` | 查看單一週期設定細節 |
| 評估週期 | PATCH | `/hr/performance-cycles/{cycle_id}` | 修改特定週期 |
| 評估週期 | PATCH | `/hr/performance-cycles/{cycle_id}/status` | 手動切換週期狀態 |
| 考核進度 | GET | `/hr/assessment-statuses` | 查看與篩選考核進度 |
| 稽核紀錄 | GET | `/hr/audit-logs` | 查看與篩選稽核紀錄 |
| 稽核紀錄 | POST | `/hr/audit-log-exports` | 匯出稽核紀錄 |
| 通知設定 | POST | `/hr/notifications` | 設定與發送通知 |

## 3. 共用狀態與資料模型

### 3.1 AssessmentTemplate (問卷模板模型)

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
* **版本控制 (Template Versions)**：為確保歷史考核紀錄不受未來模板修改影響，實際的「題目」綁定於 `template_versions`。API 層隱藏了版本切換細節，但當編輯一個已發布的模板時，後端會自動產生新版本，舊的歷史紀錄仍會鎖定在原版本。

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
* **計分邏輯**：在考核計分中，只有 `rating` 類型的問題會被納入總分計算。`text` 類型用於純文字回饋，`boolean` 類型用於「是/否」確認，兩者皆不計分。

### 3.3 EvaluationTemplate (考核模板模型)

考核模板是 HR 在建立考核週期設定時使用的配置：它綁定一個 `performance_cycle`、一個員工群組，並引用一到多個已發布的問卷模板 `assessment_templates`。

```json
{
  "template_id": "123e4567-e89b-12d3-a456-426614174000",
  "cycle": {
    "cycle_id": "00000000-0000-0000-0000-000000010001",
    "name": "2024 年度績效考核",
    "cycle_type": "annual",
    "status": "not_started"
  },
  "name": "2024 年度研發部門績效考核",
  "description": "用於研發部門年度績效追蹤。",
  "status": "published",
  "employee_group": {
    "group_id": "department:00000000-0000-0000-0000-000000000111",
    "group_type": "department",
    "name": "技術研發部",
    "description": "目前隸屬技術研發部的員工"
  },
  "assessment_templates": [
    {
      "assessment_template_id": "123e4567-e89b-12d3-a456-426614174100",
      "assessment_template_version_id": "123e4567-e89b-12d3-a456-426614174101",
      "name": "核心勝任力評估",
      "question_count": 15,
      "weight_percent": 40
    }
  ],
  "total_weight_percent": 100,
  "available_actions": {
    "can_edit": true,
    "can_archive": true,
    "edit_blocked_reason": null
  },
  "created_by": "00000000-0000-0000-0000-0000000000a1",
  "updated_by": "00000000-0000-0000-0000-0000000000a1",
  "created_at": "2026-05-27T10:00:00+08:00",
  "updated_at": "2026-05-27T10:00:00+08:00"
}
```

* `status` 可為 `published`, `archived`。
* 考核模板不提供草稿狀態；建立成功即為 `published`，代表可被該考核週期正式使用。`archived` 代表封存，不可再用於新流程但歷史仍可查。
* `assessment_templates` 僅可引用已發布的問卷模板。
* `assessment_templates[].weight_percent` 總和必須為 `100`。
* 正式考核開始前可編輯考核模板；正式考核開始後不可編輯或封存，後端應回傳 `409 STATE_CONFLICT`。
* `available_actions` 由後端根據考核週期狀態與是否已產生正式考核資料計算，前端應依此控制編輯、封存等按鈕。

---

## 4. 問卷模板操作 (Assessment Templates)

### 4.1 建立問卷模板
- **Method**: POST
- **URL**: `/hr/assessment-templates`
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
- **URL**: `/hr/assessment-templates/{template_id}`
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
- **URL**: `/hr/assessment-templates/{template_id}`
- **用途**: 刪除草稿或未使用過的模板。實作上請將其 `is_active` 設為 `false` (Soft Delete)。
- **可能錯誤 (HTTP Status)**:
  - `404 RESOURCE_NOT_FOUND`: 找不到特定模板。
  - `409 STATE_CONFLICT`: 此模板有被任何一個 `cycle_template_assignments` 引用（`usage_count > 0`），後端必須拒絕刪除操作，避免歷史紀錄無法查詢。
- **Response 204**: 
  (No Content)

### 4.4 瀏覽特定問卷模板
- **Method**: GET
- **URL**: `/hr/assessment-templates/{template_id}`
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
- **URL**: `/hr/assessment-templates`
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
- **URL**: `/hr/assessment-templates/{template_id}/duplicate`
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
- **URL**: `/hr/assessment-templates/{template_id}/publish`
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
- **URL**: `/hr/assessment-templates/{template_id}/questions`
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
- **URL**: `/hr/assessment-templates/{template_id}/questions/{question_id}`
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
- **URL**: `/hr/assessment-templates/{template_id}/questions/{question_id}`
- **用途**: 刪除單一題目。若該模板還沒發布，可以直接移除並連帶在後端重算排序；若已發布或使用，請評估實作軟刪除或回傳 409。 
- **Response 204**: 
  (No Content)

### 5.4 瀏覽特定問題細節
- **Method**: GET
- **URL**: `/hr/assessment-templates/{template_id}/questions/{question_id}`
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
- **URL**: `/hr/assessment-templates/{template_id}/questions`
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
- **URL**: `/hr/assessment-templates/{template_id}/questions/reorder`
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

## 6. 問卷模板套用 (Legacy Application)

### 6.1 套用模版至指定員工群組
- **Method**: POST
- **URL**: `/hr/assessment-templates/{template_id}/applications`
- **用途**: 將建立的模板應用至特定部門或員工群組。
- **Request Body 範例**:
  ```json
  {
    "target_departments": ["123e4567-e89b-12d3-a456-426614174000"],
    "target_job_levels": ["L3", "L4"]
  }
  ```
- **Response 200**:
  ```json
  {
    "message": "Template applied successfully to selected groups."
  }
  ```

> 新版考核模板流程中，問卷模板不直接套用員工群組。HR 應透過 `/hr/evaluation-templates` 建立考核模板，並在考核模板中指定考核週期、員工群組與多個 `assessment_templates` 的配分。

---

## 7. 考核模板操作 (Evaluation Templates)

考核模板用於定義某個考核週期下，特定員工群組要使用哪些問卷模板，以及各問卷模板在總評分中的配分比例。

建立考核模板頁面的前端呼叫順序建議:

1. `GET /hr/performance-cycles`：取得可綁定的考核週期。
2. `GET /hr/employee-groups`：取得員工群組下拉選單資料。
3. `GET /hr/assessment-templates?status=published`：取得可選用的問卷模板。
4. `POST /hr/evaluation-templates`：送出考核模板設定。

### 7.0 後端 DB 與狀態調整建議

**重要結論：以本文件定義的「考核模板」來看，目前 `new-schema.md` 尚未完整儲存考核模板所需資料。**

目前 `new-schema.md` 的 `evaluation_templates` / `template_versions` / `template_questions` 比較像「問卷模板」資料結構，也就是本文件中的 `assessment_templates`。它們可以描述一份問卷有哪些題目、問卷版本如何保存，但無法完整描述 HR 建立考核模板時需要的設定。

本章的「考核模板」是另一層業務設定：HR 會在一個考核週期內，替某個員工群組選擇一到多個問卷模板，並設定各問卷模板的配分比例。因此，後端需要補一組能表達「考核模板」的資料表，或調整現有命名，避免 `evaluation_templates` 同時代表兩種不同概念。

目前 `new-schema.md` 缺少的重點如下:

| 缺少項目 | 影響 |
| --- | --- |
| 考核模板主表 | 無法儲存「2024 年度研發部門績效考核」這種 HR 可管理的考核模板 |
| 考核模板自己的狀態 | 無法表達 `published`, `archived` 等考核模板生命週期 |
| 員工群組欄位 | 無法表達此考核模板套用到全體員工、某部門或某職類 |
| 多份問卷模板組合 | 無法表達一個考核模板包含多份 `assessment_templates` |
| 問卷模板配分 | 無法儲存每份問卷模板的 `weight_percent`，也無法檢查總和是否為 `100` |
| 考核模板版本快照 | 考核開始後若 HR 修改模板，可能影響歷史考核資料 |

建議命名:

| 業務概念 | 建議 DB 名稱 | 說明 |
| --- | --- | --- |
| 問卷模板 | `assessment_templates` | 題目集合的邏輯模板，例如「核心勝任力評估」 |
| 問卷模板版本 | `assessment_template_versions` | 問卷模板的不可變版本，考核流程應綁定版本 |
| 問卷題目 | `assessment_template_questions` | 屬於特定問卷模板版本的題目 |
| 考核模板 | `evaluation_templates` | 綁定考核週期、員工群組、多個問卷模板與配分 |
| 考核模板版本 | `evaluation_template_versions` | 考核模板發布後的不可變快照 |
| 考核模板組成 | `evaluation_template_components` | 記錄某考核模板版本引用哪些問卷模板版本及其權重 |

若後端短期內不想改名，也至少要在程式與文件中明確約定：現有 `evaluation_templates` 是問卷模板，新的考核模板不可再共用同一張表，否則會造成 API、Service 與資料關聯語意混亂。

#### 7.0.1 `evaluation_templates` 建議欄位

此表代表考核模板的邏輯身份，供列表、詳情、編輯入口使用。

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | 考核模板 ID，API 回傳為 `template_id` |
| `cycle_id` | `UUID` | `FK -> performance_cycles.id, NOT NULL` | 綁定的考核週期 |
| `name` | `VARCHAR(128)` | `NOT NULL` | 考核模板名稱 |
| `description` | `TEXT` | `NULLABLE` | 說明文字 |
| `status` | `evaluation_template_status_enum` | `NOT NULL, DEFAULT 'published'` | `published`, `archived` |
| `employee_group_type` | `VARCHAR(32)` | `NOT NULL` | `all`, `department`, `job_category` |
| `employee_group_ref` | `VARCHAR(128)` | `NULLABLE` | `all` 可為 `NULL` 或固定字串；department 存 department UUID；job_category 存分類代碼 |
| `published_version_id` | `UUID` | `FK -> evaluation_template_versions.id, NULLABLE` | 目前正式發布版本 |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT true` | Soft delete / 封存查詢用 |
| `created_by` | `UUID` | `FK -> users.id, NOT NULL` | 建立者 |
| `updated_by` | `UUID` | `FK -> users.id, NULLABLE` | 最後更新者 |
| `published_by` | `UUID` | `FK -> users.id, NULLABLE` | 發布者 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | 建立時間 |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | 更新時間 |
| `published_at` | `TIMESTAMPTZ` | `NULLABLE` | 首次或最近一次發布時間 |
| `archived_at` | `TIMESTAMPTZ` | `NULLABLE` | 封存時間 |
| `deleted_at` | `TIMESTAMPTZ` | `NULLABLE` | Soft delete 時間 |

建議約束:

| Constraint | 說明 |
| --- | --- |
| `UNIQUE (cycle_id, employee_group_type, employee_group_ref) WHERE deleted_at IS NULL AND status <> 'archived'` | 同一考核週期與員工群組不可同時有多個有效考核模板 |
| `CHECK (employee_group_type IN ('all', 'department', 'job_category'))` | 限制群組類型 |
| `CHECK ((employee_group_type = 'all' AND employee_group_ref IS NULL) OR (employee_group_type <> 'all' AND employee_group_ref IS NOT NULL))` | 避免 group_type 和 group_ref 不一致 |
| `CHECK (status IN ('published', 'archived'))` | 若不用 enum，也要限制狀態值 |

#### 7.0.2 `evaluation_template_versions` 建議欄位

考核模板一旦被發布或被考核流程使用，不能直接覆寫原資料，否則歷史考核會失真。因此建議用版本表保存快照。

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | 考核模板版本 ID |
| `evaluation_template_id` | `UUID` | `FK -> evaluation_templates.id, NOT NULL` | 所屬考核模板 |
| `version_number` | `INTEGER` | `NOT NULL` | 從 1 開始遞增 |
| `cycle_id` | `UUID` | `FK -> performance_cycles.id, NOT NULL` | 發布時綁定的考核週期快照 |
| `name` | `VARCHAR(128)` | `NOT NULL` | 發布時名稱快照 |
| `description` | `TEXT` | `NULLABLE` | 發布時說明快照 |
| `employee_group_type` | `VARCHAR(32)` | `NOT NULL` | 發布時員工群組類型 |
| `employee_group_ref` | `VARCHAR(128)` | `NULLABLE` | 發布時員工群組識別值 |
| `total_weight_percent` | `NUMERIC(5,2)` | `NOT NULL, DEFAULT 0` | 組成權重總和 |
| `is_current` | `BOOLEAN` | `NOT NULL, DEFAULT false` | 是否為目前版本 |
| `created_by` | `UUID` | `FK -> users.id, NOT NULL` | 建立版本者 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | 版本建立時間 |
| `published_at` | `TIMESTAMPTZ` | `NULLABLE` | 版本發布時間 |

建議約束:

| Constraint | 說明 |
| --- | --- |
| `UNIQUE (evaluation_template_id, version_number)` | 同一考核模板版本號不可重複 |
| `UNIQUE (evaluation_template_id) WHERE is_current = true` | 同一考核模板只能有一個目前版本 |

若專案時程不允許做完整版本化，最低限度也要在 `evaluation_templates` 本表加上 `locked_at` 或 `used_at`，並在已產生 `performance_reviews` 後拒絕破壞性修改。但正式建議仍是版本化，避免後續產生大量歷史資料補救成本。

#### 7.0.3 `evaluation_template_components` 建議欄位

此表記錄一個考核模板版本由哪些問卷模板版本組成，以及各自配分。

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `UUID` | `PK, NOT NULL, DEFAULT gen_random_uuid()` | 組成項目 ID |
| `evaluation_template_version_id` | `UUID` | `FK -> evaluation_template_versions.id, NOT NULL` | 所屬考核模板版本 |
| `assessment_template_id` | `UUID` | `FK -> assessment_templates.id, NOT NULL` | 問卷模板邏輯 ID |
| `assessment_template_version_id` | `UUID` | `FK -> assessment_template_versions.id, NOT NULL` | 實際鎖定的問卷模板版本 |
| `weight_percent` | `NUMERIC(5,2)` | `NOT NULL` | 此問卷模板在總分中的權重 |
| `sort_order` | `INTEGER` | `NOT NULL, DEFAULT 0` | 前端顯示順序 |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | 建立時間 |

建議約束:

| Constraint | 說明 |
| --- | --- |
| `UNIQUE (evaluation_template_version_id, assessment_template_id)` | 同一考核模板版本不可重複引用同一問卷模板 |
| `UNIQUE (evaluation_template_version_id, sort_order)` | 同一版本內排序不可重複 |
| `CHECK (weight_percent > 0 AND weight_percent <= 100)` | 單一配分必須合理 |
| 建立或更新時檢查 `SUM(weight_percent) = 100` | 可用 Service transaction 檢查；若使用 PostgreSQL，也可用 constraint trigger |

`assessment_template_version_id` 必須在建立或更新考核模板時由後端決定。前端只需要送 `assessment_template_id`，後端應鎖定當下可用的 published/current version，並在 Response 回傳實際鎖定的版本 ID。

#### 7.0.4 狀態定義與轉換規則

建議新增 `evaluation_template_status_enum`:

| Status | 說明 | 前端可做動作 |
| --- | --- | --- |
| `published` | 已建立並可被考核週期正式使用 | 正式考核開始前可編輯、封存；正式考核開始後不可編輯、封存 |
| `archived` | 封存，不可再用於新考核流程 | 只能查看歷史 |

建議狀態轉換:

| From | To | 是否允許 | 規則 |
| --- | --- | --- | --- |
| `published` | `archived` | 允許 | 僅限正式考核開始前 |
| `archived` | `published` | 不建議 | 若要再次使用，建議複製成新考核模板 |

「是否已正式考核」不建議做成考核模板狀態，建議由資料推導。判斷條件如下：

| 條件 | 是否視為正式考核已開始 |
| --- | --- |
| 綁定的 `performance_cycles.status = not_started`，且尚未產生對應 `performance_reviews` | 否 |
| 綁定的 `performance_cycles.status` 為 `in_progress`, `locked`, `results_published`, `completed`, `closed` | 是 |
| 已產生任何引用此考核模板版本的 `performance_reviews` 或正式指派紀錄 | 是 |

API 必須回傳 `available_actions` 讓前端判斷按鈕狀態。正式考核開始前 `can_edit = true`；正式考核開始後 `can_edit = false`。

#### 7.0.5 和考核週期的關係

考核模板會綁定一個 `performance_cycles.id`。建議後端限制:

| Cycle status | 建立考核模板 | 編輯考核模板 | 說明 |
| --- | --- | --- | --- |
| `not_started` | 允許 | 允許 | 最主要設定階段 |
| `in_progress` | 不允許 | 不允許 | 正式考核已開始，不可再修改考核模板 |
| `locked` | 不允許 | 不允許 | 考核資料已鎖定 |
| `results_published` | 不允許 | 不允許 | 結果已發布 |
| `completed` | 不允許 | 不允許 | 歷史週期 |
| `closed` | 不允許 | 不允許 | 已關閉 |

若考核週期進入 `in_progress` 時會產生 `performance_reviews`，建議 review row 應保存 `evaluation_template_version_id`，而不是只保存 `evaluation_template_id`。正式考核開始後若 HR 發現模板設定錯誤，後端不應允許修改原考核模板；應由 HR 建立新的考核模板並用於尚未開始的週期。

#### 7.0.6 `employee-groups` 資料來源建議

`GET /hr/employee-groups` 是給 HR 下拉選單用，建議由後端即時計算或從主資料表組合:

| group_type | group_id 格式 | 來源 |
| --- | --- | --- |
| `all` | `all` | 固定選項 |
| `department` | `department:{department_id}` | `departments` |
| `job_category` | `job_category:{job_category}` | `users.job_category` 或後端定義的職類主檔 |

此 API 不需要分頁，也不需要回傳人數。建立或編輯考核模板時，後端仍必須驗證 `employee_group_id` 是否有效，不能只相信前端下拉選項。

#### 7.0.7 與現有 `new-schema.md` 的落差

目前 `new-schema.md` 並不是完全沒有「週期與模板的關聯」，但它存的是另一種較簡化的關係。`cycle_template_assignments` 只有 `cycle_id`, `template_version_id`, `job_category`，它只能表達「某週期某職類使用一份模板版本」。

這和本章 API 需要的「考核模板」不同。本章需要儲存的是「某一個可命名、可編輯、可發布的考核模板」，且此考核模板必須同時包含:

| 必要資料 | 目前 `new-schema.md` 是否完整支援 |
| --- | --- |
| 綁定一個 `performance_cycle` | 部分支援，`cycle_template_assignments.cycle_id` 有週期關聯 |
| 綁定一個員工群組 | 不完整，目前只有 `job_category`，沒有 `all` / `department` / 通用群組格式 |
| 引用多個問卷模板 | 不完整，現有結構偏向一筆 assignment 對一份 template version |
| 每個問卷模板有自己的權重 | 不支援，目前沒有 `weight_percent` |
| 考核模板名稱與描述 | 不支援，assignment 本身沒有可管理的模板名稱 |
| 考核模板發布/封存狀態 | 不支援，目前沒有考核模板層級的 status |
| 考核模板版本快照 | 不完整，目前只有問卷模板版本，沒有考核模板組合版本 |

因此只靠現有 `cycle_template_assignments` 不足以支援本章 API。若直接沿用現有 schema 實作，後端大概只能做到「把某週期某職類綁到某份問卷」，但做不到前端頁面需要的「考核模板列表、考核模板詳情、選多份問卷並設定權重、封存、保留歷史版本」。

建議二選一:

| 方案 | 說明 | 建議程度 |
| --- | --- | --- |
| 新增 `evaluation_templates` + `evaluation_template_versions` + `evaluation_template_components` | 最符合目前前端業務邏輯，可保留歷史版本 | 推薦 |
| 擴充 `cycle_template_assignments` | 加上 `employee_group_type`, `employee_group_ref`, `weight_percent`，並允許同週期同群組多筆 | 可行但語意較弱 |

若選擇擴充 `cycle_template_assignments`，建議至少調整為:

| Column | Type | Description |
| --- | --- | --- |
| `cycle_id` | `UUID` | 考核週期 |
| `employee_group_type` | `VARCHAR(32)` | `all`, `department`, `job_category` |
| `employee_group_ref` | `VARCHAR(128)` | 群組識別值 |
| `assessment_template_version_id` | `UUID` | 問卷模板版本 |
| `weight_percent` | `NUMERIC(5,2)` | 權重 |
| `sort_order` | `INTEGER` | 顯示順序 |

但此方案會少掉「考核模板名稱、描述、複製、封存」等能力，所以若 HR 真的需要管理考核模板列表，仍建議使用獨立的 `evaluation_templates`。

### 7.1 取得員工群組
- **Method**: GET
- **URL**: `/hr/employee-groups`
- **用途**: 提供建立考核模板時的員工群組下拉選單。此 API 一次回傳全部資料，不分頁，不計算人數。
- **Response 200**:
  ```json
  {
    "data": [
      {
        "group_id": "all",
        "group_type": "all",
        "name": "全體員工",
        "description": "所有 active 員工"
      },
      {
        "group_id": "department:00000000-0000-0000-0000-000000000111",
        "group_type": "department",
        "name": "技術研發部",
        "description": "目前隸屬技術研發部的員工"
      },
      {
        "group_id": "job_category:engineering",
        "group_type": "job_category",
        "name": "Engineering",
        "description": "job_category = engineering 的員工"
      }
    ]
  }
  ```

欄位說明:

| 欄位 | 說明 |
| --- | --- |
| `group_id` | 前端送回建立考核模板用的群組 ID |
| `group_type` | `all`, `department`, `job_category` |
| `name` | 下拉選單顯示名稱 |
| `description` | 補充說明，可為 `null` |

### 7.2 建立考核模板
- **Method**: POST
- **URL**: `/hr/evaluation-templates`
- **用途**: 建立考核模板。考核模板必須綁定一個考核週期、一個員工群組，並引用一到多個已發布的問卷模板；建立成功後狀態即為 `published`。
- **欄位說明**:
  - Request: `cycle_id` (UUID，必填), `name` (String，必填), `description` (String), `employee_group_id` (String，必填), `assessment_templates` (Array，至少 1 筆)。
  - `cycle_id` 對應的考核週期必須尚未正式開始，也就是 `performance_cycles.status = not_started` 且尚未產生正式考核資料。
  - `assessment_templates[].assessment_template_id` 必須是已發布問卷模板。
  - `assessment_templates[].weight_percent` 總和必須為 `100`。
- **Request Body 範例**:
  ```json
  {
    "cycle_id": "00000000-0000-0000-0000-000000010001",
    "name": "2024 年度研發部門績效考核",
    "description": "用於研發部門年度績效追蹤。",
    "employee_group_id": "department:00000000-0000-0000-0000-000000000111",
    "assessment_templates": [
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174100",
        "weight_percent": 40
      },
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174200",
        "weight_percent": 50
      },
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174300",
        "weight_percent": 10
      }
    ]
  }
  ```
- **Response 201**:
  ```json
  {
    "template_id": "123e4567-e89b-12d3-a456-426614174000",
    "cycle": {
      "cycle_id": "00000000-0000-0000-0000-000000010001",
      "name": "2024 年度績效考核",
      "status": "not_started"
    },
    "name": "2024 年度研發部門績效考核",
    "description": "用於研發部門年度績效追蹤。",
    "status": "published",
    "employee_group": {
      "group_id": "department:00000000-0000-0000-0000-000000000111",
      "group_type": "department",
      "name": "技術研發部"
    },
    "assessment_templates": [
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174100",
        "assessment_template_version_id": "123e4567-e89b-12d3-a456-426614174101",
        "name": "核心勝任力評估",
        "question_count": 15,
        "weight_percent": 40
      },
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174200",
        "assessment_template_version_id": "123e4567-e89b-12d3-a456-426614174201",
        "name": "業務目標達成狀況",
        "question_count": 10,
        "weight_percent": 50
      },
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174300",
        "assessment_template_version_id": "123e4567-e89b-12d3-a456-426614174301",
        "name": "個人發展計劃",
        "question_count": 5,
        "weight_percent": 10
      }
    ],
    "total_weight_percent": 100,
    "available_actions": {
      "can_edit": true,
      "can_archive": true,
      "edit_blocked_reason": null
    },
    "created_by": "00000000-0000-0000-0000-0000000000a1",
    "updated_by": "00000000-0000-0000-0000-0000000000a1",
    "created_at": "2026-05-27T10:00:00+08:00",
    "updated_at": "2026-05-27T10:00:00+08:00"
  }
  ```
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 欄位缺漏或格式錯誤。
  - `400 WEIGHT_SUM_INVALID`: 配分總和不是 `100`。
  - `404 CYCLE_NOT_FOUND`: 找不到考核週期。
  - `404 EMPLOYEE_GROUP_NOT_FOUND`: 找不到員工群組。
  - `404 ASSESSMENT_TEMPLATE_NOT_FOUND`: 找不到問卷模板。
  - `409 ASSESSMENT_TEMPLATE_NOT_PUBLISHED`: 問卷模板尚未發布。
  - `409 STATE_CONFLICT`: 綁定的考核週期已正式開始，不允許新增或更換考核模板。
  - `409 CYCLE_TEMPLATE_CONFLICT`: 同一週期與群組已有考核模板。

### 7.3 編輯考核模板
- **Method**: PATCH
- **URL**: `/hr/evaluation-templates/{template_id}`
- **用途**: 在正式考核開始前，編輯考核模板基本資料、綁定週期、員工群組、問卷模板與配分。正式考核開始後不可編輯。
- **欄位說明**:
  - Request 欄位皆為選填。
  - 僅當 `available_actions.can_edit = true` 時可呼叫此 API。
  - 若要封存考核模板，可傳入 `status: "archived"`；僅當 `available_actions.can_archive = true` 時允許。
  - 除了封存以外，不允許透過此 API 將 `status` 改成其他值。
  - 若傳入 `assessment_templates`，視為取代整份問卷模板清單，不是局部新增。
  - 若傳入 `assessment_templates`，必須檢查配分總和為 `100`。
  - 若綁定的考核週期已進入 `in_progress` 或之後狀態，或已產生任何正式考核資料，後端必須拒絕修改。
- **Request Body 範例**:
  ```json
  {
    "cycle_id": "00000000-0000-0000-0000-000000010001",
    "name": "2024 年度研發部門績效考核 - 修正版",
    "description": "修正後的模板說明。",
    "employee_group_id": "job_category:engineering",
    "assessment_templates": [
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174100",
        "weight_percent": 50
      },
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174200",
        "weight_percent": 50
      }
    ]
  }
  ```
- **Response 200**:
  ```json
  {
    "template_id": "123e4567-e89b-12d3-a456-426614174000",
    "cycle": {
      "cycle_id": "00000000-0000-0000-0000-000000010001",
      "name": "2024 年度績效考核",
      "status": "not_started"
    },
    "name": "2024 年度研發部門績效考核 - 修正版",
    "description": "修正後的模板說明。",
    "status": "published",
    "employee_group": {
      "group_id": "job_category:engineering",
      "group_type": "job_category",
      "name": "Engineering"
    },
    "assessment_templates": [
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174100",
        "assessment_template_version_id": "123e4567-e89b-12d3-a456-426614174101",
        "name": "核心勝任力評估",
        "question_count": 15,
        "weight_percent": 50
      },
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174200",
        "assessment_template_version_id": "123e4567-e89b-12d3-a456-426614174201",
        "name": "業務目標達成狀況",
        "question_count": 10,
        "weight_percent": 50
      }
    ],
    "total_weight_percent": 100,
    "available_actions": {
      "can_edit": true,
      "can_archive": true,
      "edit_blocked_reason": null
    },
    "updated_by": "00000000-0000-0000-0000-0000000000a1",
    "updated_at": "2026-05-27T11:00:00+08:00"
  }
  ```
- **可能錯誤 (HTTP Status)**:
  - `400 VALIDATION_ERROR`: 欄位格式錯誤。
  - `400 WEIGHT_SUM_INVALID`: 配分總和不是 `100`。
  - `404 RESOURCE_NOT_FOUND`: 找不到考核模板。
  - `404 CYCLE_NOT_FOUND`: 找不到考核週期。
  - `404 EMPLOYEE_GROUP_NOT_FOUND`: 找不到員工群組。
  - `404 ASSESSMENT_TEMPLATE_NOT_FOUND`: 找不到問卷模板。
  - `409 STATE_CONFLICT`: 正式考核已開始，或目前狀態不允許修改。此時前端應重新取得詳情並依 `available_actions.can_edit = false` 關閉編輯入口。
  - `409 ASSESSMENT_TEMPLATE_NOT_PUBLISHED`: 問卷模板尚未發布。
  - `409 CYCLE_TEMPLATE_CONFLICT`: 同一週期與群組已有其他考核模板。

### 7.4 瀏覽特定考核模板
- **Method**: GET
- **URL**: `/hr/evaluation-templates/{template_id}`
- **用途**: 取得考核模板詳情頁資料。
- **Response 200**:
  ```json
  {
    "template_id": "123e4567-e89b-12d3-a456-426614174000",
    "cycle": {
      "cycle_id": "00000000-0000-0000-0000-000000010001",
      "name": "2024 年度績效考核",
      "cycle_type": "annual",
      "status": "not_started"
    },
    "name": "2023年度績效考核範本",
    "description": "用於公司全體員工 2023 年度之績效評估，包含核心勝任力與業務目標達成度之綜合考核。",
    "status": "published",
    "employee_group": {
      "group_id": "all",
      "group_type": "all",
      "name": "全體員工",
      "description": "所有 active 員工"
    },
    "assessment_templates": [
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174100",
        "assessment_template_version_id": "123e4567-e89b-12d3-a456-426614174101",
        "name": "核心勝任力評估",
        "question_count": 15,
        "weight_percent": 40
      },
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174200",
        "assessment_template_version_id": "123e4567-e89b-12d3-a456-426614174201",
        "name": "業務目標達成狀況",
        "question_count": 10,
        "weight_percent": 50
      },
      {
        "assessment_template_id": "123e4567-e89b-12d3-a456-426614174300",
        "assessment_template_version_id": "123e4567-e89b-12d3-a456-426614174301",
        "name": "個人發展計劃",
        "question_count": 5,
        "weight_percent": 10
      }
    ],
    "total_weight_percent": 100,
    "available_actions": {
      "can_edit": true,
      "can_archive": true,
      "edit_blocked_reason": null
    },
    "created_by": "00000000-0000-0000-0000-0000000000a1",
    "updated_by": "00000000-0000-0000-0000-0000000000a1",
    "created_at": "2026-05-01T10:00:00+08:00",
    "updated_at": "2026-05-15T14:30:00+08:00"
  }
  ```
- **可能錯誤 (HTTP Status)**:
  - `404 RESOURCE_NOT_FOUND`: 找不到考核模板。

`available_actions` 說明:

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `can_edit` | Boolean | 正式考核開始前為 `true`；正式考核開始後或模板已封存時為 `false` |
| `can_archive` | Boolean | 正式考核開始前且模板尚未封存時為 `true` |
| `edit_blocked_reason` | String / null | `null`, `FORMAL_REVIEW_STARTED`, `TEMPLATE_ARCHIVED` |

正式考核開始後，後端仍可回傳考核模板詳情，但 `available_actions` 必須反映不可修改:

```json
{
  "available_actions": {
    "can_edit": false,
    "can_archive": false,
    "edit_blocked_reason": "FORMAL_REVIEW_STARTED"
  }
}
```

### 7.5 瀏覽所有考核模板
- **Method**: GET
- **URL**: `/hr/evaluation-templates`
- **用途**: 取得考核模板列表頁資料。
- **欄位說明**:
  - Query params: `page` (Integer, 預設 `1`), `page_size` (Integer, 預設 `20`), `status` (`published`, `archived`), `cycle_id` (UUID), `q` (String, 搜尋模板名稱)。
- **Response 200**:
  ```json
  {
    "data": [
      {
        "template_id": "123e4567-e89b-12d3-a456-426614174000",
        "cycle": {
          "cycle_id": "00000000-0000-0000-0000-000000010001",
          "name": "2024 年度績效考核",
          "status": "not_started"
        },
        "name": "2023年度績效考核範本",
        "description": "用於公司全體員工 2023 年度之績效評估。",
        "status": "published",
        "employee_group": {
          "group_id": "all",
          "group_type": "all",
          "name": "全體員工"
        },
        "assessment_template_count": 3,
        "total_weight_percent": 100,
        "available_actions": {
          "can_edit": true,
          "can_archive": true,
          "edit_blocked_reason": null
        },
        "updated_at": "2026-05-15T14:30:00+08:00"
      }
    ],
    "meta": {
      "current_page": 1,
      "total_pages": 3,
      "total_count": 48
    }
  }
  ```

---

## 8. 評估週期管理 (Performance Cycles)

### 8.1 設定評估週期
- **Method**: POST
- **URL**: `/hr/performance-cycles`
- **用途**: 建立新的考核週期 (含名稱、起訖時間、涵蓋群組)。
- **Request Body 範例**:
  ```json
  {
    "name": "2026 總部員工績效考核",
    "start_date": "2026-07-01",
    "end_date": "2026-09-30",
    "timezone": "Asia/Taipei",
    "target_groups": []
  }
  ```
- **Response 201**: 回傳新建週期，初始狀態通常為 `draft` 或 `not_started`。

### 8.2 查看所有週期清單
- **Method**: GET
- **URL**: `/hr/performance-cycles`
- **用途**: 顯示系統中所有曾經存在及進行中的週期，支援分頁與狀態篩選。
- **Response 200**: 包含 `data` 與 `meta` 分頁資訊。

### 8.3 查看單一週期設定細節
- **Method**: GET
- **URL**: `/hr/performance-cycles/{cycle_id}`
- **用途**: 取得單一週期的詳細資訊。

### 8.4 修改特定週期
- **Method**: PATCH
- **URL**: `/hr/performance-cycles/{cycle_id}`
- **用途**: 在週期尚未結束前，修改起訖時間或名稱。

### 8.5 手動切換週期狀態
- **Method**: PATCH
- **URL**: `/hr/performance-cycles/{cycle_id}/status`
- **用途**: 手動將某週期狀態轉為 `in_progress` 或 `closed`。
- **Request Body 範例**:
  ```json
  {
    "status": "in_progress"
  }
  ```

---

## 9. 其他人資功能

### 9.1 查看考核進度狀態
- **Method**: GET
- **URL**: `/hr/assessment-statuses`
- **用途**: 查詢與篩選全公司的考核進度狀態。

### 9.2 查詢與篩選稽核紀錄
- **Method**: GET
- **URL**: `/hr/audit-logs`
- **用途**: 使用 API 查詢操作記錄，透過條件 (如日期、動作等) 篩選。

### 9.3 匯出稽核紀錄
- **Method**: POST
- **URL**: `/hr/audit-log-exports`
- **用途**: 觸發下載 csv 或 excel 檔案，包含指定範圍內的稽核紀錄。

### 9.4 發送通知
- **Method**: POST
- **URL**: `/hr/notifications`
- **用途**: 針對特定考核階段或員工群組發布系統或信件通知。
