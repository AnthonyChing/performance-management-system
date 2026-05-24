# 員工端 API 實作規格

## 1. 共用規格

- Content-Type: `application/json`
- 日期格式: `YYYY-MM-DD`
- 時間格式: ISO 8601，例如 `2026-05-21T09:30:00+08:00`
- 目前登入者由後端依 token / session 判斷，`/me/*` API 不需要前端傳 `user_id` 或 `employee_id`。
- UI 顯示文字由前端處理，API 回傳語意資料。
- 空資料不一定是錯誤。使用者有權查看頁面但目前無資料時，優先回傳 `200` 搭配空陣列或 `null`。
- 只有指定資源不存在、資源不屬於登入者、必要資料範圍不存在，或操作狀態不合法時才回傳錯誤。
- 前端按鈕是否可用一律以 `available_actions` 為準，不自行用日期或狀態推導。
- 所有列表分頁頁碼從 `1` 開始。

### 1.1 統一錯誤格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "欄位驗證失敗。",
    "details": [
      {
        "field": "due_date",
        "message": "目標截止日必須落在考核週期內。"
      }
    ]
  }
}
```

常見 HTTP status:

| Status | code | 使用情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | request path / query / body 格式錯誤、必填缺漏、欄位超過限制 |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 403 | `FORBIDDEN` | 資源存在但不屬於目前登入者，或帳號無權存取員工端資料 |
| 404 | `USER_NOT_FOUND` | 查無目前登入者的員工資料 |
| 404 | `CURRENT_CYCLE_NOT_FOUND` | 找不到目前可顯示的考核週期 |
| 404 | `CYCLE_NOT_FOUND` | 找不到本期或指定歷史週期 |
| 500 | `DATA_INCONSISTENCY` | 後端資料不一致，需由資料同步或管理端修正 |

錯誤判斷建議優先順序:

| 優先 | 判斷 | 回應 |
| --- | --- | --- |
| 1 | 未登入或 token 失效 | `401 UNAUTHORIZED` |
| 2 | request path / query / body 格式錯誤 | `400 VALIDATION_ERROR` |
| 3 | 指定資源不存在或已軟刪除 | 對應 `404` |
| 4 | 資源存在但不屬於目前登入者 | `403 FORBIDDEN` |
| 5 | 操作與目前 workflow 狀態衝突 | 對應 `409` |

## 2. API 一覽

| 功能 | Method | URL | 用途 |
| --- | --- | --- | --- |
| 我的資料 | GET | `/me/profile` | 我的資料頁初始載入 |
| 我的資料 | GET | `/me/performance-cycles/current` | 刷新目前考核週期卡片 |
| 個人目標 | GET | `/me/goals` | 本期目標列表 |
| 個人目標 | GET | `/me/goals?status=historical&page={page}` | 歷史目標週期或歷史目標列表 |
| 個人目標 | POST | `/me/goals` | 新增目標並送主管審核 |
| 個人目標 | POST | `/me/goals/{goal_id}` | 修改退回目標並重新送審 |
| 個人目標 | POST | `/me/goals/{goal_id}/progress-updates` | 更新已核准目標進度 |
| 個人目標 | GET | `/me/goals/review-result` | 查看主管審核結果 |
| 個人 KPI | GET | `/me/kpis/standards` | 查看本期 KPI 標準 |
| 個人 KPI | GET | `/me/kpis/result` | 查看本期 KPI 結果 |
| 個人 KPI | POST | `/me/kpis/result-confirmations` | 確認評估結果 |
| 個人 KPI | GET | `/me/kpis/result?status=historical&page={page}` | 歷史 KPI 列表或詳情 |
| 績效異議 | GET | `/me/appeals` | 讀取本期異議頁狀態 |
| 績效異議 | POST | `/me/appeals/submit` | 提交績效異議 |
| 績效異議 | GET | `/me/appeals/result` | 查看本期異議處理結果 |

## 3. 共用狀態與資料模型

### 3.1 Profile

```json
{
  "user_id": "user_001",
  "employee_id": "PP-88293",
  "name": "陳大文",
  "english_name": "David Chen",
  "avatar_url": "/assets/avatar/PP-88293.png",
  "job_title": "資深軟體工程師",
  "job_category": "engineering",
  "department": {
    "department_id": "dept_engineering",
    "name": "技術研發部"
  },
  "location": "台北總部",
  "email": "david.chen@performanceplus.com",
  "employment_status": "active",
  "terminated_at": null,
  "manager": {
    "user_id": "user_manager_001",
    "name": "林美玲",
    "english_name": "Mei Lin",
    "email": "mei.lin@performanceplus.com"
  }
}
```

API 欄位說明:

| API 欄位 | 說明 |
| --- | --- |
| `profile.user_id` | 登入者使用者 ID |
| `profile.employee_id` | 公司員工編號 |
| `profile.name` | 顯示姓名 |
| `profile.english_name` | 英文姓名；無資料時為 `null` |
| `profile.avatar_url` | 頭像 URL；無資料時為 `null` |
| `profile.job_title` | 職稱 |
| `profile.job_category` | 工作類別 |
| `profile.department` | 目前部門 |
| `profile.location` | 工作地點；無資料時為 `null` |
| `profile.email` | 公司信箱 |
| `profile.employment_status` | 員工狀態: `active`, `on_leave`, `terminated` |
| `profile.terminated_at` | 離職時間；非離職狀態時為 `null` |
| `profile.manager` | 直屬主管；無主管時為 `null` |

### 3.2 PerformanceCycleSummary

```json
{
  "cycle_id": "cycle_2024_q3",
  "name": "2024 Q3 年度績效考核",
  "cycle_type": "quarterly",
  "period_label": "2024-07-01~2024-09-30",
  "start_date": "2024-07-01",
  "end_date": "2024-09-30",
  "timezone": "Asia/Taipei",
  "status": "in_progress",
  "is_locked": false,
  "results_published_at": null,
  "updated_at": "2024-09-20T10:30:00+08:00"
}
```

`cycle.status` 是我的資料頁顯示週期狀態的唯一來源。

```json
{
  "not_started": "尚未開始",
  "in_progress": "進行中",
  "locked": "已鎖定",
  "results_published": "已公佈考核結果",
  "completed": "已完成",
  "closed": "已關閉"
}
```

狀態語意:

| API `cycle.status` | 說明 |
| --- | --- |
| `not_started` | 週期已建立但尚未開始 |
| `in_progress` | 週期進行中 |
| `locked` | 已進入鎖定或審核收斂期間 |
| `results_published` | 考核結果已公佈，但尚未正式完成入檔 |
| `completed` | 週期已完成並入檔 |
| `closed` | 週期已關閉或封存，不再作為目前可操作週期 |

### 3.3 ReviewSummary

```json
{
  "review_id": "review_2024_q3_user_001",
  "status": "pending_manager_eval",
  "manager": {
    "user_id": "user_manager_001",
    "name": "林美玲",
    "english_name": "Mei Lin"
  },
  "co_manager": null,
  "submitted_at": "2024-08-30T18:20:00+08:00",
  "completed_at": null,
  "updated_at": "2024-08-30T18:20:00+08:00"
}
```

`review.status` 表示登入者在目前週期中的個人考核進度，只供我的資料頁顯示摘要，不代表 KPI 結果 workflow。

```json
{
  "pending_self_eval": "等待員工自評",
  "self_eval_in_progress": "員工自評中",
  "pending_manager_eval": "等待主管評核",
  "manager_eval_in_progress": "主管評核中",
  "pending_hr_review": "等待 HR 審核",
  "completed": "考核已完成",
  "terminated": "考核已終止"
}
```

## 4. 我的資料 API

### 4.1 GET `/me/profile`

用途:

- 我的資料頁面初始載入。
- 同時取得個人基本資料、目前考核週期摘要與登入者本期考核進度。

Query parameters: 無。

Response 200:

```json
{
  "profile": {
    "user_id": "user_001",
    "employee_id": "PP-88293",
    "name": "陳大文",
    "english_name": "David Chen",
    "avatar_url": "/assets/avatar/PP-88293.png",
    "job_title": "資深軟體工程師",
    "job_category": "engineering",
    "department": {
      "department_id": "dept_engineering",
      "name": "技術研發部"
    },
    "location": "台北總部",
    "email": "david.chen@performanceplus.com",
    "employment_status": "active",
    "terminated_at": null,
    "manager": {
      "user_id": "user_manager_001",
      "name": "林美玲",
      "english_name": "Mei Lin",
      "email": "mei.lin@performanceplus.com"
    }
  },
  "cycle": {
    "cycle_id": "cycle_2024_q3",
    "name": "2024 Q3 年度績效考核",
    "cycle_type": "quarterly",
    "period_label": "2024-07-01~2024-09-30",
    "start_date": "2024-07-01",
    "end_date": "2024-09-30",
    "timezone": "Asia/Taipei",
    "status": "in_progress",
    "is_locked": false,
    "results_published_at": null,
    "updated_at": "2024-09-20T10:30:00+08:00"
  },
  "review": {
    "review_id": "review_2024_q3_user_001",
    "status": "pending_manager_eval",
    "manager": {
      "user_id": "user_manager_001",
      "name": "林美玲",
      "english_name": "Mei Lin"
    },
    "co_manager": null,
    "submitted_at": "2024-08-30T18:20:00+08:00",
    "completed_at": null,
    "updated_at": "2024-08-30T18:20:00+08:00"
  }
}
```

空資料:

| 情境 | HTTP status | 回傳方式 |
| --- | --- | --- |
| 登入者存在，目前沒有可顯示考核週期 | 200 | `cycle: null`, `review: null` |
| 有目前考核週期，但登入者不在本週期 roster | 200 | `cycle` 正常回傳，`review: null` |
| 登入者不存在或未完成 HR provision | 404 | `USER_NOT_FOUND` |

### 4.2 GET `/me/performance-cycles/current`

用途:

- 只刷新目前考核週期卡片。
- 不回傳個人基本資料與 review 詳情。

Response 200:

```json
{
  "cycle": {
    "cycle_id": "cycle_2024_q3",
    "name": "2024 Q3 年度績效考核",
    "cycle_type": "quarterly",
    "period_label": "2024-07-01~2024-09-30",
    "start_date": "2024-07-01",
    "end_date": "2024-09-30",
    "timezone": "Asia/Taipei",
    "status": "results_published",
    "is_locked": true,
    "results_published_at": "2024-10-15T17:00:00+08:00",
    "updated_at": "2024-10-15T17:00:00+08:00"
  }
}
```

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 404 | `CURRENT_CYCLE_NOT_FOUND` | 目前沒有可顯示考核週期 |

## 5. 個人目標 API

### 5.1 目標共用規則

- `/me/goals` 系列 API 僅處理目前登入者自己的個人目標。
- 一個考核週期允許有多個個人目標。
- 目標 `due_date` 必須落在所屬考核週期的 `start_date` 與 `end_date` 之間。
- 個人目標不支援「只儲存草稿」。建立或修改目標後，皆直接送主管審核。
- 前端不顯示完整進度更新歷史，API 只 expose 目前進度與最新一次更新資訊 `latest_progress_update`。
- `status` 是目標工作流狀態的唯一來源，不另外提供 `review_status`。
- 週期進入 review lock 後，不可新增、編輯、更新進度；後端操作需回 `409 REVIEW_LOCKED`。
- API 回傳的目標狀態只使用 `pending_review`, `in_progress`, `revision_requested`, `completed`, `cancelled`。

SQL enum:

```sql
CREATE TYPE goal_status_enum AS ENUM (
  'pending_review',
  'in_progress',
  'revision_requested',
  'completed',
  'cancelled'
);
```

### 5.2 Goal 資料模型

```json
{
  "goal_id": "goal_20260520_001",
  "cycle_id": "cycle_2026_q3",
  "goal_type": "individual",
  "title": "提升 Q3 季度客戶滿意度至 92%",
  "description": "透過優化售後服務流程及縮短工單處理時間，計畫在第三季度將 CSAT 分數從 88% 提升至 92%。",
  "due_date": "2026-09-30",
  "status": "in_progress",
  "progress_percent": 75,
  "owner": {
    "user_id": "user_001",
    "name": "Alex Chen",
    "department": "System Management"
  },
  "reviewer": {
    "user_id": "user_100",
    "name": "李曉芳",
    "title": "Director"
  },
  "latest_progress_update": {
    "progress_update_id": "progress_001",
    "progress_percent": 75,
    "note": "初步數據顯示滿意度已有回升。",
    "created_at": "2026-08-15T10:20:00+08:00",
    "created_by": {
      "user_id": "user_001",
      "name": "Alex Chen"
    }
  },
  "latest_review": {
    "review_id": "goal_review_001",
    "decision": "approved",
    "comment": "目前進度非常理想。在優化客戶服務流程後，初步數據顯示滿意度已有回升。",
    "reviewed_at": "2026-08-10T15:00:00+08:00",
    "reviewer": {
      "user_id": "user_100",
      "name": "李曉芳",
      "title": "Director"
    }
  },
  "available_actions": {
    "can_edit": false,
    "edit_unavailable_reason": "invalid_goal_status",
    "can_update_progress": true,
    "update_progress_unavailable_reason": null
  },
  "published_at": "2026-08-10T15:00:00+08:00",
  "created_at": "2026-05-20T09:00:00+08:00",
  "updated_at": "2026-08-15T10:20:00+08:00"
}
```

API 欄位說明:

| API 欄位 | 說明 |
| --- | --- |
| `goal_id` | 目標 ID |
| `cycle_id` | 目標所屬考核週期 ID |
| `goal_type` | 個人目標固定為 `individual` |
| `title` | 目標名稱，API 限制 1 到 100 字 |
| `description` | 目標描述，必填 |
| `due_date` | 目標截止日，必須在週期內 |
| `status` | 目標 workflow 狀態 |
| `progress_percent` | 目前進度百分比，整數 `0` 到 `100` |
| `owner` | 目標擁有者，必須是目前登入者 |
| `reviewer` | 本目標的審核主管；無法解析時可為 `null` |
| `latest_progress_update` | 最新一次進度更新；尚未更新時為 `null` |
| `latest_review` | 最新一次主管審核結果；尚未審核時為 `null` |
| `available_actions` | 前端操作按鈕可用狀態 |
| `published_at` | 主管核准並進入 `in_progress` 的時間；尚未核准時為 `null` |
| `created_at` / `updated_at` | 建立與最後更新時間 |

`latest_review.decision`:

| decision | 說明 | 對應狀態結果 |
| --- | --- | --- |
| `approved` | 主管核准 | `in_progress` |
| `revision_requested` | 主管要求修改 | `revision_requested` |
| `cancelled` | 主管或系統取消 | `cancelled` |

### 5.3 Goal 狀態與操作

```json
{
  "pending_review": "待主管審核",
  "in_progress": "主管核准後進行中",
  "revision_requested": "主管要求修改",
  "completed": "已完成",
  "cancelled": "已取消"
}
```

| status | 是否可編輯目標 | 是否可更新進度 |
| --- | --- | --- |
| `pending_review` | 否 | 否 |
| `in_progress` | 否 | 是 |
| `revision_requested` | 是 | 否 |
| `completed` | 否 | 否 |
| `cancelled` | 否 | 否 |

狀態流轉:

| 觸發事件 | 前狀態 | 後狀態 | URL / 來源 |
| --- | --- | --- | --- |
| 建立目標 | 無 | `pending_review` | `POST /me/goals` |
| 主管核准 | `pending_review` | `in_progress` | 主管流程 |
| 主管要求修改 | `pending_review` | `revision_requested` | 主管流程 |
| 使用者修改並送審 | `revision_requested` | `pending_review` | `POST /me/goals/{goal_id}` |
| 更新進度未達 100 | `in_progress` | `in_progress` | `POST /me/goals/{goal_id}/progress-updates` |
| 更新進度達 100 | `in_progress` | `completed` | `POST /me/goals/{goal_id}/progress-updates` |
| 週期結算 | `in_progress` | `completed` | 後端排程或 HR 流程 |
| 取消目標 | `pending_review`, `revision_requested`, `in_progress` | `cancelled` | 管理端或系統流程 |

不可操作情境:

| 不允許情境 | 後端回應 |
| --- | --- |
| `pending_review` 更新進度 | `409 INVALID_GOAL_STATUS` |
| `revision_requested` 更新進度 | `409 INVALID_GOAL_STATUS` |
| `in_progress` 修改目標內容 | `409 INVALID_GOAL_STATUS` |
| `completed` 或 `cancelled` 修改目標內容 | `409 INVALID_GOAL_STATUS` |
| `completed` 或 `cancelled` 更新進度 | `409 INVALID_GOAL_STATUS` |
| 非本人操作目標 | `403 FORBIDDEN` |
| 鎖定期間新增、修改或更新進度 | `409 REVIEW_LOCKED` |

### 5.4 GET `/me/goals`

用途:

- 本期目標列表頁。
- 目標詳情頁可直接使用列表回傳的完整 `goals[]`，不新增 `GET /me/goals/{goal_id}`。

Query parameters:

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `status` | string | 否 | `pending_review`, `in_progress`, `revision_requested`, `completed`, `cancelled`；若為 `historical` 則查歷史 |
| `q` | string | 否 | 搜尋目標名稱或描述 |

Response 200:

```json
{
  "cycle": {
    "cycle_id": "cycle_2026_q3",
    "name": "2026 Q3",
    "start_date": "2026-07-01",
    "end_date": "2026-09-30",
    "timezone": "Asia/Taipei",
    "status": "active",
    "is_review_locked": false,
    "review_locked_at": null
  },
  "available_actions": {
    "can_create_goal": true,
    "create_goal_unavailable_reason": null
  },
  "summary": {
    "total_count": 5,
    "pending_review_count": 1,
    "in_progress_count": 2,
    "revision_requested_count": 1,
    "completed_count": 1,
    "cancelled_count": 0
  },
  "goals": [
    {
      "goal_id": "goal_001",
      "cycle_id": "cycle_2026_q3",
      "goal_type": "individual",
      "title": "提升 Q3 季度客戶滿意度至 92%",
      "description": "透過優化售後服務流程及縮短工單處理時間，計畫在第三季度將 CSAT 分數從 88% 提升至 92%。",
      "due_date": "2026-09-30",
      "status": "in_progress",
      "progress_percent": 75,
      "owner": {
        "user_id": "user_001",
        "name": "Alex Chen",
        "department": "System Management"
      },
      "reviewer": {
        "user_id": "user_100",
        "name": "李曉芳",
        "title": "Director"
      },
      "latest_progress_update": {
        "progress_update_id": "progress_001",
        "progress_percent": 75,
        "note": "初步數據顯示滿意度已有回升。",
        "created_at": "2026-08-15T10:20:00+08:00",
        "created_by": {
          "user_id": "user_001",
          "name": "Alex Chen"
        }
      },
      "latest_review": {
        "review_id": "goal_review_001",
        "decision": "approved",
        "comment": "目前進度非常理想。",
        "reviewed_at": "2026-08-10T15:00:00+08:00",
        "reviewer": {
          "user_id": "user_100",
          "name": "李曉芳",
          "title": "Director"
        }
      },
      "available_actions": {
        "can_edit": false,
        "edit_unavailable_reason": "invalid_goal_status",
        "can_update_progress": true,
        "update_progress_unavailable_reason": null
      },
      "published_at": "2026-08-10T15:00:00+08:00",
      "created_at": "2026-05-20T09:00:00+08:00",
      "updated_at": "2026-08-15T10:20:00+08:00"
    }
  ]
}
```

空資料:

| 情境 | 回傳方式 |
| --- | --- |
| 本期週期存在，但尚未建立任何目標 | `200 goals: []`，所有 summary count 為 `0` |
| 套用 `status` 或 `q` 後無符合資料 | `200 goals: []`，summary 仍回傳本期整體統計 |

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | `status` 不是允許值，或 `q` 長度超過限制 |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 404 | `CYCLE_NOT_FOUND` | 找不到目前登入者可用的本期考核週期 |

### 5.5 GET `/me/goals?status=historical&page={page}`

用途:

- 歷史目標列表頁。
- 加上 `cycle_id` 時，回傳某一歷史週期底下的目標。

Query parameters:

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `status` | string | 是 | 固定 `historical` |
| `page` | number | 是 | 從 `1` 開始 |
| `page_size` | number | 否 | 預設 `10` |
| `q` | string | 否 | 搜尋週期名稱、目標名稱或描述 |
| `cycle_id` | string | 否 | 指定歷史考核週期 |

未傳 `cycle_id` 時 Response 200:

```json
{
  "mode": "historical_cycles",
  "pagination": {
    "page": 1,
    "page_size": 4,
    "total_pages": 5,
    "total_count": 20,
    "has_previous": false,
    "has_next": true
  },
  "historical_cycles": [
    {
      "cycle_id": "cycle_2023_q4",
      "name": "2023 第四季度 (Q4) 年度終考",
      "period_label": "2023 第四季度 (Q4)",
      "review_type": "年度終考",
      "start_date": "2023-10-01",
      "end_date": "2023-12-31",
      "timezone": "Asia/Taipei",
      "average_completion_percent": 94.5,
      "goal_count": 10
    }
  ]
}
```

傳入 `cycle_id` 時 Response 200:

```json
{
  "mode": "historical_goals",
  "cycle": {
    "cycle_id": "cycle_2025_annual",
    "name": "2025年度考核",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "timezone": "Asia/Taipei",
    "status": "completed"
  },
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total_pages": 1,
    "total_count": 1,
    "has_previous": false,
    "has_next": false
  },
  "summary": {
    "average_completion_percent": 75,
    "goal_count": 1,
    "completed_count": 1,
    "cancelled_count": 0
  },
  "goals": [
    {
      "goal_id": "goal_h_001",
      "cycle_id": "cycle_2025_annual",
      "goal_type": "individual",
      "title": "雲端架構遷移專案",
      "description": "完成核心服務雲端遷移與部署流程優化。",
      "due_date": "2025-10-14",
      "status": "completed",
      "progress_percent": 75,
      "owner": {
        "user_id": "user_001",
        "name": "Alex Chen",
        "department": "System Management"
      },
      "reviewer": {
        "user_id": "user_100",
        "name": "李曉芳",
        "title": "Director"
      },
      "latest_progress_update": {
        "progress_update_id": "progress_h_001",
        "progress_percent": 75,
        "note": "核心服務已完成遷移，後續進行監控與效能調校。",
        "created_at": "2025-10-14T16:20:00+08:00",
        "created_by": {
          "user_id": "user_001",
          "name": "Alex Chen"
        }
      },
      "latest_review": {
        "review_id": "goal_review_h_001",
        "decision": "approved",
        "comment": "完成主要遷移工作，請持續追蹤穩定性與成本指標。",
        "reviewed_at": "2025-10-20T11:00:00+08:00",
        "reviewer": {
          "user_id": "user_100",
          "name": "李曉芳",
          "title": "Director"
        }
      },
      "available_actions": {
        "can_edit": false,
        "edit_unavailable_reason": "invalid_goal_status",
        "can_update_progress": false,
        "update_progress_unavailable_reason": "invalid_goal_status"
      },
      "published_at": "2025-02-01T10:00:00+08:00",
      "created_at": "2025-01-10T09:00:00+08:00",
      "updated_at": "2025-10-20T11:00:00+08:00"
    }
  ]
}
```

若指定的歷史週期存在且屬於登入者，但該週期沒有任何目標，才回傳空陣列:

```json
{
  "mode": "historical_goals",
  "cycle": {
    "cycle_id": "cycle_2025_annual",
    "name": "2025年度考核",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "timezone": "Asia/Taipei",
    "status": "completed"
  },
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total_pages": 0,
    "total_count": 0,
    "has_previous": false,
    "has_next": false
  },
  "summary": {
    "average_completion_percent": 0,
    "goal_count": 0,
    "completed_count": 0,
    "cancelled_count": 0
  },
  "goals": []
}
```

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | `status` 未傳 `historical`、`page < 1`、`page_size` 超過限制 |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 404 | `CYCLE_NOT_FOUND` | 指定 `cycle_id` 不存在、不是歷史週期，或無權查看 |

### 5.6 POST `/me/goals`

用途:

- 新增個人目標。
- 建立後直接送主管審核，沒有草稿狀態。

Request:

```json
{
  "title": "提升產品技術文件完整度",
  "due_date": "2026-09-30",
  "description": "補齊核心模組 API 文件、部署步驟與常見問題，讓跨部門協作時能更快取得正確資訊。"
}
```

欄位規則:

| 欄位 | 型別 | 必填 | 規則 |
| --- | --- | --- | --- |
| `title` | string | 是 | 1 到 100 字 |
| `due_date` | string | 是 | `YYYY-MM-DD`，必須在本期目標週期內 |
| `description` | string | 是 | 1 到 2000 字 |

建立後回傳規則:

- `goal_type = individual`
- `owner` 為目前登入者。
- `status = pending_review`
- `progress_percent = 0`
- `published_at = null`
- `latest_progress_update = null`

Response 201:

```json
{
  "goal": {
    "goal_id": "goal_002",
    "cycle_id": "cycle_2026_q3",
    "goal_type": "individual",
    "title": "提升產品技術文件完整度",
    "description": "補齊核心模組 API 文件、部署步驟與常見問題，讓跨部門協作時能更快取得正確資訊。",
    "due_date": "2026-09-30",
    "status": "pending_review",
    "progress_percent": 0,
    "latest_progress_update": null,
    "latest_review": null,
    "available_actions": {
      "can_edit": false,
      "edit_unavailable_reason": "invalid_goal_status",
      "can_update_progress": false,
      "update_progress_unavailable_reason": "invalid_goal_status"
    },
    "published_at": null,
    "created_at": "2026-05-20T17:50:00+08:00",
    "updated_at": "2026-05-20T17:50:00+08:00"
  }
}
```

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | 欄位缺漏、長度超限、日期格式錯誤、`due_date` 不在週期內 |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 403 | `FORBIDDEN` | 使用者不在本期 roster，或不允許建立個人目標 |
| 404 | `CYCLE_NOT_FOUND` | 找不到目前登入者可用的本期考核週期 |
| 409 | `REVIEW_LOCKED` | 本期已進入考核鎖定期間 |

### 5.7 POST `/me/goals/{goal_id}`

用途:

- 修改主管退回修改的目標。
- 修改後再次送主管審核。

Path parameters:

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `goal_id` | string | 是 | 要修改的目標 ID |

Request:

```json
{
  "title": "提升產品技術文件完整度",
  "due_date": "2026-09-30",
  "description": "完成核心 API 文件、部署文件、維運手冊與常見問題整理，降低新成員與跨部門溝通成本。"
}
```

規則:

- 只允許 `status = revision_requested` 的目標呼叫。
- 成功後 `status` 回到 `pending_review`。
- 修改內容不會改變 `progress_percent`。
- 鎖定期間回 `409 REVIEW_LOCKED`。

Response 200:

```json
{
  "goal": {
    "goal_id": "goal_002",
    "status": "pending_review",
    "progress_percent": 0,
    "latest_progress_update": null,
    "available_actions": {
      "can_edit": false,
      "edit_unavailable_reason": "invalid_goal_status",
      "can_update_progress": false,
      "update_progress_unavailable_reason": "invalid_goal_status"
    },
    "updated_at": "2026-05-20T18:10:00+08:00"
  }
}
```

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | `goal_id` 格式錯誤或欄位驗證失敗 |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 403 | `FORBIDDEN` | 目標不屬於目前登入者 |
| 404 | `GOAL_NOT_FOUND` | 找不到指定目標，或目標已軟刪除 |
| 409 | `INVALID_GOAL_STATUS` | 目標不是 `revision_requested` |
| 409 | `REVIEW_LOCKED` | 目標所屬週期已鎖定 |

### 5.8 POST `/me/goals/{goal_id}/progress-updates`

用途:

- 更新已核准且進行中的目標進度。
- 只回傳最新一次更新，不提供完整歷史列表。

Request:

```json
{
  "progress_percent": 80,
  "note": "已完成新版客服流程試行，CSAT 回收樣本增加，預計下週整理完整分析結果。"
}
```

欄位規則:

| 欄位 | 型別 | 必填 | 規則 |
| --- | --- | --- | --- |
| `progress_percent` | number | 是 | 整數 `0` 到 `100` |
| `note` | string | 是 | 1 到 2000 字 |

狀態規則:

- 只允許 `status = in_progress` 的目標呼叫。
- 成功後回傳本次 `progress_update`。
- 成功後同步更新 `goal.progress_percent` 與 `goal.latest_progress_update`。
- `progress_percent < 100` 時目標維持 `in_progress`。
- `progress_percent = 100` 時目標改為 `completed`，之後不可再更新進度。

Response 201:

```json
{
  "progress_update": {
    "progress_update_id": "progress_002",
    "goal_id": "goal_001",
    "progress_percent": 80,
    "note": "已完成新版客服流程試行，CSAT 回收樣本增加，預計下週整理完整分析結果。",
    "created_at": "2026-08-20T14:30:00+08:00",
    "created_by": {
      "user_id": "user_001",
      "name": "Alex Chen"
    }
  },
  "goal": {
    "goal_id": "goal_001",
    "status": "in_progress",
    "progress_percent": 80,
    "latest_progress_update": {
      "progress_update_id": "progress_002",
      "progress_percent": 80,
      "note": "已完成新版客服流程試行，CSAT 回收樣本增加，預計下週整理完整分析結果。",
      "created_at": "2026-08-20T14:30:00+08:00",
      "created_by": {
        "user_id": "user_001",
        "name": "Alex Chen"
      }
    },
    "available_actions": {
      "can_edit": false,
      "edit_unavailable_reason": "invalid_goal_status",
      "can_update_progress": true,
      "update_progress_unavailable_reason": null
    },
    "updated_at": "2026-08-20T14:30:00+08:00"
  }
}
```

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | `goal_id`、`progress_percent` 或 `note` 驗證失敗 |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 403 | `FORBIDDEN` | 目標不屬於目前登入者 |
| 404 | `GOAL_NOT_FOUND` | 找不到指定目標，或目標已軟刪除 |
| 409 | `INVALID_GOAL_STATUS` | 目標不是 `in_progress` |
| 409 | `REVIEW_LOCKED` | 目標所屬週期已鎖定 |

### 5.9 GET `/me/goals/review-result`

用途:

- 查看目前登入者本期個人目標的主管審核結果。
- 支援整體目標狀態摘要，以及各目標最新一次審核意見。

Query parameters:

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `goal_id` | string | 否 | 若指定，僅回傳單一目標審核結果 |

Response 200:

```json
{
  "cycle": {
    "cycle_id": "cycle_2026_q3",
    "name": "2026 Q3",
    "status": "active",
    "is_review_locked": false
  },
  "overall_status": "in_progress",
  "summary": {
    "total_count": 3,
    "pending_review_count": 0,
    "in_progress_count": 2,
    "revision_requested_count": 1,
    "completed_count": 0,
    "cancelled_count": 0
  },
  "reviewed_at": "2026-08-10T15:00:00+08:00",
  "reviewer": {
    "user_id": "user_100",
    "name": "李曉芳",
    "title": "Director"
  },
  "results": [
    {
      "goal_id": "goal_001",
      "title": "提升 Q3 季度客戶滿意度至 92%",
      "status": "in_progress",
      "decision": "approved",
      "comment": "目前進度非常理想。",
      "reviewed_at": "2026-08-10T15:00:00+08:00",
      "reviewer": {
        "user_id": "user_100",
        "name": "李曉芳",
        "title": "Director"
      }
    }
  ]
}
```

`overall_status` 計算:

| 條件 | overall_status |
| --- | --- |
| 本期沒有任何目標 | `no_goals` |
| 任一目標為 `revision_requested` | `revision_requested` |
| 否則任一目標為 `pending_review` | `pending_review` |
| 否則任一目標為 `in_progress` | `in_progress` |
| 所有目標皆為 `completed` | `completed` |
| 所有目標皆為 `cancelled` | `cancelled` |
| 目標同時包含 `completed` 與 `cancelled`，且沒有待處理狀態 | `completed` |

空資料:

```json
{
  "cycle": {
    "cycle_id": "cycle_2026_q3",
    "name": "2026 Q3",
    "status": "active",
    "is_review_locked": false
  },
  "overall_status": "no_goals",
  "summary": {
    "total_count": 0,
    "pending_review_count": 0,
    "in_progress_count": 0,
    "revision_requested_count": 0,
    "completed_count": 0,
    "cancelled_count": 0
  },
  "reviewed_at": null,
  "reviewer": null,
  "results": []
}
```

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | `goal_id` 格式錯誤 |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 403 | `FORBIDDEN` | 指定目標不屬於目前登入者 |
| 404 | `CYCLE_NOT_FOUND` | 找不到目前登入者可用的本期考核週期 |
| 404 | `GOAL_NOT_FOUND` | 指定 `goal_id` 不存在或已軟刪除 |

## 6. 個人 KPI API

### 6.1 KPI 共用規則

- KPI 權重百分比為整數 `0` 到 `100`，後端保證同一員工在同一考核週期加總為 `100`。
- KPI 達成率百分比使用 number，可大於 `100`。
- 分數使用 number，最多一位小數。
- KPI 達成率與分數由後端依線性計分模型計算，前端只顯示 `achievement_percent` 與 `score`。
- 目前不支援員工自評流程，KPI 結果不回傳 `self_evaluation`。
- KPI 結果頁只顯示目前登入者在指定考核週期的結果，不回傳其他員工資料。
- `result.status` 是 KPI 結果 workflow 狀態的唯一來源，不新增獨立 review status。
- KPI 結果狀態必須包含 `not_published`，表示「尚未公佈考核結果」。
- KPI 異議可用性以 `dispute_period.status` 與 `available_actions.can_dispute` 表示，`not_open` 表示「尚未開放異議」。
- KPI 頁面的「提出績效異議」按鈕只依 `available_actions` 顯示或導頁；KPI 文件本身不新增 KPI 專用異議送出 URL。

計算公式:

```text
achievement_percent = current_value / target_value * 100
score = current_value / target_value * weight_percent
weighted_score = SUM(score)
kpi_achievement_percent = weighted_score
```

若 KPI 是「越低越好」，後端資料應轉換為「越高越好」的反向指標後再計算。

### 6.2 KPI 狀態

```json
{
  "not_published": "尚未公佈考核結果",
  "pending_confirmation": "已公佈，等待員工確認",
  "confirmed": "員工已確認",
  "disputed": "員工已提出異議",
  "finalized": "已正式入檔"
}
```

| API `result.status` | 說明 |
| --- | --- |
| `not_published` | 考核結果尚未公佈，員工端不可看分數 |
| `pending_confirmation` | 結果已公佈，等待員工確認或提出異議 |
| `confirmed` | 員工已確認結果，尚未正式入檔 |
| `disputed` | 員工已提出本期異議，異議詳情由績效異議頁處理 |
| `finalized` | 結果已正式入檔，不可再確認或提出異議 |

補充:

- 自評、主管評核、HR 審核中狀態不可直接暴露為 KPI 結果狀態；結果公佈前一律回傳 `not_published`。
- 終止考核的員工端顯示策略待確認，不新增 KPI 狀態。
- `POST /me/kpis/result-confirmations` 成功後，後端需能在後續查詢回傳 `confirmation` 物件。

KPI 異議期間:

```json
{
  "not_open": "尚未開放異議",
  "open": "異議期間開放中",
  "closed": "異議期間已結束"
}
```

| `dispute_period.status` | 條件 |
| --- | --- |
| `not_open` | 結果已公佈但尚未到可異議開始日，或 HR 尚未開放異議入口 |
| `open` | 當前日期落在 `start_date` 到 `end_date`，且 `result.status = pending_confirmation` |
| `closed` | 已超過 `end_date`，或結果已確認 / 已異議 / 已入檔 |

按鈕狀態:

| KPI 結果狀態 | 異議狀態 | 確認評估結果 | 提出績效異議 |
| --- | --- | --- | --- |
| `not_published` | `null` | 禁用，`result_not_published` | 禁用，`result_not_published` |
| `pending_confirmation` | `not_open` | 可用 | 禁用，`not_open` |
| `pending_confirmation` | `open` | 可用 | 可用 |
| `pending_confirmation` | `closed` | 可用 | 禁用，`closed` |
| `confirmed` | 任意 | 禁用，`already_confirmed` | 禁用，`already_confirmed` |
| `disputed` | 任意 | 禁用，`already_disputed` | 禁用，`already_disputed` |
| `finalized` | 任意 | 禁用，`finalized` | 禁用，`finalized` |

### 6.3 KPI Standard

```json
{
  "kpi_id": "kpi_core_product_quality",
  "name": "核心產品開發進度",
  "description": "準時完成 Q3 路線圖中的 A、B 模組，代碼審核通過率需達 95% 以上。",
  "weight_percent": 40,
  "target": {
    "operator": "gte",
    "value": 95,
    "unit": "percent",
    "display_text": "通過率 >= 95%"
  }
}
```

### 6.4 KPI Result

```json
{
  "result_id": "kpi_result_2024_q3_user_001",
  "cycle": {
    "cycle_id": "cycle_2024_q3",
    "name": "2024 年度 Q3 績效指標與評估",
    "period_label": "2024 年度 Q3",
    "review_type": "績效考核",
    "start_date": "2024-07-01",
    "end_date": "2024-09-30"
  },
  "employee": {
    "user_id": "user_001",
    "name": "王大明",
    "department": "System Management"
  },
  "status": "pending_confirmation",
  "published_at": "2025-10-15T17:00:00+08:00",
  "score_summary": {
    "performance_score": 94.5,
    "kpi_achievement_percent": 103.6,
    "manager_review_score": 88.0
  },
  "weighted_score": 103.6,
  "review_score": 88.0,
  "final_grade": null,
  "manager_evaluation": {
    "score": 88.0,
    "comment": "技術執行力強，唯在文件撰寫的完整度上仍有提升空間。"
  },
  "kpi_results": [
    {
      "kpi_id": "kpi_core_product_quality",
      "name": "核心產品開發進度",
      "weight_percent": 40,
      "actual": {
        "value": 5,
        "unit": "module",
        "display_text": "5"
      },
      "target": {
        "value": 4,
        "unit": "module",
        "display_text": "4"
      },
      "achievement_percent": 125,
      "score": 50.0,
      "latest_snapshot": {
        "snapshot_id": "kpi_snapshot_001",
        "value": 5,
        "note": "Q3 已完成 5 個模組並完成驗收。",
        "recorded_at": "2025-10-10T18:00:00+08:00"
      }
    }
  ],
  "available_actions": {
    "can_confirm": true,
    "confirm_unavailable_reason": null,
    "can_dispute": false,
    "dispute_unavailable_reason": "not_open"
  },
  "confirmation": null,
  "dispute_period": {
    "status": "not_open",
    "start_date": "2025-10-16",
    "end_date": "2025-10-20"
  },
  "reviewed_at": "2025-10-15T17:00:00+08:00",
  "updated_at": "2025-10-15T17:00:00+08:00"
}
```

API 欄位說明:

| API 欄位 | 說明 |
| --- | --- |
| `cycle` | 考核週期摘要 |
| `employee` | 目前登入者在本期 KPI 結果中的員工摘要 |
| `standards[]` | KPI 標準列表；未設定時可為空陣列 |
| `standards[].kpi_id` | KPI 指標 ID |
| `standards[].weight_percent` | 該 KPI 權重百分比 |
| `standards[].target` | 目標條件、目標值、單位與顯示文字 |
| `result.result_id` | KPI 結果 ID；尚未公佈或無結果時可為 `null` |
| `result.status` | KPI 結果 workflow 唯一來源 |
| `result.published_at` | 結果公佈時間；尚未公佈時為 `null` |
| `score_summary.performance_score` | 績效總分 |
| `score_summary.kpi_achievement_percent` | KPI 達成率 |
| `score_summary.manager_review_score` | 主管評核分數 |
| `weighted_score` | KPI 加權分數 |
| `review_score` | 主管評核分數 |
| `final_grade` | 最終績效等級；尚未產生時為 `null` |
| `manager_evaluation` | 主管評分與評語；尚未可見時為 `null` |
| `kpi_results[]` | 各 KPI 實際值、目標值、達成率與分數 |
| `kpi_results[].latest_snapshot` | 最新 KPI 更新摘要；無資料時可為 `null` |
| `confirmation` | 員工確認紀錄；尚未確認時為 `null` |
| `dispute_period` | 異議期間資訊；結果尚未公佈時為 `null` |

### 6.5 GET `/me/kpis/standards`

用途:

- 本期 KPI 頁面的「KPI 標準」分頁。
- 顯示本期週期、員工部門，以及各 KPI 指標名稱、說明、權重與目標值。

Response 200:

```json
{
  "cycle": {
    "cycle_id": "cycle_2024_q3",
    "name": "2024 年度 Q3 績效指標與評估",
    "period_label": "2024 年度 Q3",
    "review_type": "績效考核",
    "start_date": "2024-07-01",
    "end_date": "2024-09-30"
  },
  "employee": {
    "user_id": "user_001",
    "name": "王大明",
    "department": "System Management"
  },
  "standards": [
    {
      "kpi_id": "kpi_core_product_quality",
      "name": "核心產品開發進度",
      "description": "準時完成 Q3 路線圖中的 A、B 模組。",
      "weight_percent": 40,
      "target": {
        "operator": "gte",
        "value": 95,
        "unit": "percent",
        "display_text": "通過率 >= 95%"
      }
    }
  ]
}
```

空資料:

- 本期考核週期存在，但尚未設定 KPI 標準時，回傳 `200 standards: []`。

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 404 | `CURRENT_KPI_CYCLE_NOT_FOUND` | 找不到目前應顯示的 KPI 週期 |
| 404 | `KPI_REVIEW_NOT_FOUND` | 登入者不在本期考核名單內 |

### 6.6 GET `/me/kpis/result`

用途:

- 本期 KPI 頁面的「考核結果」分頁。
- 尚未公佈結果時，仍回傳 `200` 與 `result.status = not_published`。

Response 200:

```json
{
  "result": {
    "result_id": "kpi_result_2024_q3_user_001",
    "cycle": {
      "cycle_id": "cycle_2024_q3",
      "name": "2024 年度 Q3 績效指標與評估",
      "period_label": "2024 年度 Q3",
      "review_type": "績效考核",
      "start_date": "2024-07-01",
      "end_date": "2024-09-30"
    },
    "employee": {
      "user_id": "user_001",
      "name": "王大明",
      "department": "System Management"
    },
    "status": "pending_confirmation",
    "published_at": "2025-10-15T17:00:00+08:00",
    "score_summary": {
      "performance_score": 94.5,
      "kpi_achievement_percent": 103.6,
      "manager_review_score": 88.0
    },
    "weighted_score": 103.6,
    "review_score": 88.0,
    "final_grade": null,
    "manager_evaluation": {
      "score": 88.0,
      "comment": "技術執行力強，唯在文件撰寫的完整度上仍有提升空間。"
    },
    "kpi_results": [
      {
        "kpi_id": "kpi_core_product_quality",
        "name": "核心產品開發進度",
        "weight_percent": 40,
        "actual": {
          "value": 5,
          "unit": "module",
          "display_text": "5"
        },
        "target": {
          "value": 4,
          "unit": "module",
          "display_text": "4"
        },
        "achievement_percent": 125,
        "score": 50.0,
        "latest_snapshot": {
          "snapshot_id": "kpi_snapshot_001",
          "value": 5,
          "note": "Q3 已完成 5 個模組並完成驗收。",
          "recorded_at": "2025-10-10T18:00:00+08:00"
        }
      }
    ],
    "available_actions": {
      "can_confirm": true,
      "confirm_unavailable_reason": null,
      "can_dispute": false,
      "dispute_unavailable_reason": "not_open"
    },
    "confirmation": null,
    "dispute_period": {
      "status": "not_open",
      "start_date": "2025-10-16",
      "end_date": "2025-10-20"
    },
    "reviewed_at": "2025-10-15T17:00:00+08:00",
    "updated_at": "2025-10-15T17:00:00+08:00"
  }
}
```

尚未公佈 Response 200:

```json
{
  "result": {
    "result_id": null,
    "cycle": {
      "cycle_id": "cycle_2024_q3",
      "name": "2024 年度 Q3 績效指標與評估",
      "period_label": "2024 年度 Q3",
      "review_type": "績效考核",
      "start_date": "2024-07-01",
      "end_date": "2024-09-30"
    },
    "employee": {
      "user_id": "user_001",
      "name": "王大明",
      "department": "System Management"
    },
    "status": "not_published",
    "published_at": null,
    "score_summary": {
      "performance_score": null,
      "kpi_achievement_percent": null,
      "manager_review_score": null
    },
    "weighted_score": null,
    "review_score": null,
    "final_grade": null,
    "manager_evaluation": null,
    "kpi_results": [],
    "available_actions": {
      "can_confirm": false,
      "confirm_unavailable_reason": "result_not_published",
      "can_dispute": false,
      "dispute_unavailable_reason": "result_not_published"
    },
    "confirmation": {
      "confirmation_id": "kpi_confirmation_h_001",
      "confirmed_at": "2024-01-05T10:00:00+08:00",
      "confirmed_by": {
        "user_id": "user_001",
        "name": "王大明"
      }
    },
    "dispute_period": null,
    "reviewed_at": null,
    "updated_at": null
  }
}
```

若結果已公佈但 KPI 分數尚未計算完成，回傳 `200`，但分數為 `null`、`kpi_results: []`，並禁用確認與異議，reason 使用 `result_incomplete`。若 KPI 標準尚未配置，reason 可使用 `kpi_not_configured`。

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 404 | `CURRENT_KPI_CYCLE_NOT_FOUND` | 找不到目前應顯示的 KPI 週期 |
| 404 | `KPI_REVIEW_NOT_FOUND` | 登入者不在本期考核名單內 |

### 6.7 POST `/me/kpis/result-confirmations`

用途:

- 本期 KPI 考核結果頁面的「確認評估結果」按鈕。
- 只有 `result.status = pending_confirmation` 且尚未提出異議、尚未正式入檔時可以確認。

Request:

```json
{
  "result_id": "kpi_result_2024_q3_user_001",
  "confirmed": true
}
```

欄位規則:

| 欄位 | 型別 | 必填 | 規則 |
| --- | --- | --- | --- |
| `result_id` | string | 是 | 要確認的本期 KPI 結果 ID |
| `confirmed` | boolean | 是 | 固定 `true` |

Response 201:

```json
{
  "confirmation": {
    "confirmation_id": "kpi_confirmation_001",
    "result_id": "kpi_result_2024_q3_user_001",
    "confirmed_at": "2025-10-16T09:30:00+08:00",
    "confirmed_by": {
      "user_id": "user_001",
      "name": "王大明"
    }
  },
  "result": {
    "result_id": "kpi_result_2024_q3_user_001",
    "status": "confirmed",
    "score_summary": {
      "performance_score": 94.5,
      "kpi_achievement_percent": 103.6,
      "manager_review_score": 88.0
    },
    "weighted_score": 103.6,
    "review_score": 88.0,
    "final_grade": null,
    "available_actions": {
      "can_confirm": false,
      "confirm_unavailable_reason": "already_confirmed",
      "can_dispute": false,
      "dispute_unavailable_reason": "already_confirmed"
    },
    "updated_at": "2025-10-16T09:30:00+08:00"
  }
}
```

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | `result_id` 缺漏 / 格式錯誤，或 `confirmed` 不是 `true` |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 403 | `FORBIDDEN` | `result_id` 不屬於登入者 |
| 404 | `KPI_RESULT_NOT_FOUND` | 找不到指定結果 |
| 409 | `INVALID_KPI_RESULT_STATUS` | 尚未公佈或目前狀態不允許確認 |
| 409 | `KPI_NOT_CONFIGURED` | KPI 標準尚未設定 |
| 409 | `KPI_RESULT_INCOMPLETE` | KPI 結果尚未計算完成 |
| 409 | `KPI_RESULT_ALREADY_CONFIRMED` | 已確認 |
| 409 | `KPI_RESULT_ALREADY_DISPUTED` | 已提出異議 |
| 409 | `KPI_RESULT_FINALIZED` | 已正式入檔 |

### 6.8 GET `/me/kpis/result?status=historical&page={page}`

用途:

- 歷史 KPI 列表頁。
- 加上 `cycle_id` 時，回傳單一歷史週期的 KPI 標準與結果。

Query parameters:

| 欄位 | 型別 | 必填 | 說明 |
| --- | --- | --- | --- |
| `status` | string | 是 | 固定 `historical` |
| `page` | number | 是 | 從 `1` 開始 |
| `page_size` | number | 否 | 預設 `10` |
| `q` | string | 否 | 搜尋考核週期名稱或考核類型 |
| `cycle_id` | string | 否 | 指定歷史考核週期 |

未傳 `cycle_id` 時 Response 200:

```json
{
  "mode": "historical_results",
  "pagination": {
    "page": 1,
    "page_size": 4,
    "total_pages": 5,
    "total_count": 20,
    "has_previous": false,
    "has_next": true
  },
  "results": [
    {
      "result_id": "kpi_result_2023_q4_user_001",
      "cycle": {
        "cycle_id": "cycle_2023_q4",
        "name": "2023 第四季度 (Q4) 年度終考",
        "period_label": "2023 第四季度 (Q4)",
        "review_type": "年度終考",
        "start_date": "2023-10-01",
        "end_date": "2023-12-31"
      },
      "performance_score": 94.5,
      "weighted_score": 104.3,
      "final_grade": "A"
    }
  ]
}
```

傳入 `cycle_id` 時 Response 200:

```json
{
  "mode": "historical_result_detail",
  "standards": [
    {
      "kpi_id": "kpi_core_product_quality",
      "name": "核心產品開發進度",
      "description": "準時完成 Q4 路線圖中的核心模組，代碼審核通過率需達 95% 以上。",
      "weight_percent": 60,
      "target": {
        "operator": "gte",
        "value": 95,
        "unit": "percent",
        "display_text": "通過率 >= 95%"
      }
    }
  ],
  "result": {
    "result_id": "kpi_result_2023_q4_user_001",
    "cycle": {
      "cycle_id": "cycle_2023_q4",
      "name": "2023 第四季度 (Q4) 年度終考",
      "period_label": "2023 第四季度 (Q4)",
      "review_type": "年度終考",
      "start_date": "2023-10-01",
      "end_date": "2023-12-31"
    },
    "employee": {
      "user_id": "user_001",
      "name": "王大明",
      "department": "System Management"
    },
    "status": "finalized",
    "score_summary": {
      "performance_score": 94.5,
      "kpi_achievement_percent": 104.3,
      "manager_review_score": 92.0
    },
    "weighted_score": 104.3,
    "review_score": 92.0,
    "final_grade": "A",
    "manager_evaluation": {
      "score": 92.0,
      "comment": "整體表現優異。"
    },
    "kpi_results": [
      {
        "kpi_id": "kpi_core_product_quality",
        "name": "核心產品開發進度",
        "weight_percent": 60,
        "actual": {
          "value": 98,
          "unit": "percent",
          "display_text": "98%"
        },
        "target": {
          "value": 95,
          "unit": "percent",
          "display_text": "95%"
        },
        "achievement_percent": 103.2,
        "score": 61.9
      }
    ],
    "confirmation": {
      "confirmation_id": "kpi_confirmation_h_001",
      "confirmed_at": "2024-01-05T10:00:00+08:00",
      "confirmed_by": {
        "user_id": "user_001",
        "name": "王大明"
      }
    },
    "reviewed_at": "2024-01-03T17:00:00+08:00",
    "finalized_at": "2024-01-08T09:00:00+08:00"
  }
}
```

空資料:

| 情境 | 回傳方式 |
| --- | --- |
| 沒有任何歷史 KPI 或搜尋無結果 | `200 results: []`, `pagination.total_count: 0` |
| 歷史週期存在且屬於登入者，但當時沒有 KPI 指標 | `200 standards: []`, `result.kpi_results: []` |

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | `status` 不是 `historical`、`page < 1`、`cycle_id` 格式錯誤 |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 404 | `KPI_RESULT_NOT_FOUND` | 指定歷史 `cycle_id` 不存在、不屬於登入者，或無可顯示 KPI 結果 |

## 7. 績效異議 API

### 7.1 異議共用規則

- `/me/appeals` 系列 API 僅處理目前登入者自己的本期績效異議。
- 一名員工在同一個考核週期 / review 只能有一筆績效異議。
- 本頁只支援正式提交異議，不支援只儲存不提交。
- 不定義附件上傳、附件刪除、HR 後台更新處理結果、員工補件、員工取消異議或完整處理歷程 API。
- 員工端只顯示本期案件與最新一筆員工端可見處理意見。
- API 回傳的異議狀態只使用 `submitted`, `under_review`, `need_more_info`, `approved`, `rejected`, `cancelled`。

SQL enum:

```sql
CREATE TYPE appeal_status_enum AS ENUM (
  'submitted',
  'under_review',
  'need_more_info',
  'approved',
  'rejected',
  'cancelled'
);
```

### 7.2 AppealPeriod

```json
{
  "status": "open",
  "start_date": "2025-10-15",
  "end_date": "2025-10-22",
  "timezone": "Asia/Taipei"
}
```

`appeal_period.status`:

```json
{
  "not_open": "尚未開放異議",
  "open": "異議期間開放中",
  "closed": "異議期間已結束"
}
```

| status | 條件 |
| --- | --- |
| `not_open` | 結果尚未公佈，或 HR 尚未開放異議入口 |
| `open` | 目前時間落在結果公佈日到異議截止日，且尚未提交本期異議 |
| `closed` | 已超過異議截止日，或本期已有異議案件，或結果已正式入檔 |

若結果尚未公佈，`start_date`、`end_date` 可為 `null`，`status = not_open`。

### 7.3 Appeal 資料模型

```json
{
  "appeal_id": "appeal_20251016_004",
  "case_no": "DP-20251016-004",
  "review_id": "review_2025_q3_user_001",
  "period": {
    "period_id": "cycle_2025_q3",
    "name": "2025 年度 Q3 績效考核",
    "start_date": "2025-07-01",
    "end_date": "2025-09-30"
  },
  "reason": "本人對於 Q3 考核中「專案領導力」項目的評分持有異議。",
  "status": "under_review",
  "submitted_at": "2025-10-16T09:42:00+08:00",
  "resolved_at": null,
  "handler": {
    "user_id": "hr_001",
    "type": "hr",
    "name": "陳美玲",
    "english_name": "Lin Chen",
    "department": "HR 部門"
  },
  "processing_comment": "您的異議申請已進入人力資源部初步審查。",
  "processing_comment_updated_at": "2025-10-17T15:20:00+08:00",
  "is_final_response": false,
  "updated_at": "2025-10-17T15:20:00+08:00"
}
```

API 欄位說明:

| API 欄位 | 說明 |
| --- | --- |
| `period` | 本期考核週期摘要 |
| `appeal_period` | 異議期間狀態、開始日、截止日與時區 |
| `appeal.appeal_id` | 異議案件 ID |
| `appeal.case_no` | 前端顯示用異議編號；需由後端保證穩定 |
| `appeal.review_id` | 被異議的考核結果 ID |
| `appeal.reason` | 員工提交的正式異議理由 |
| `appeal.status` | 異議案件 workflow 狀態 |
| `appeal.submitted_at` | 提交時間 |
| `appeal.resolved_at` | 結案時間；未結案時為 `null` |
| `appeal.handler` | 員工端可見處理人 |
| `processing_comment` | 最新一筆員工端可見處理意見；無回覆時為 `null` |
| `processing_comment_updated_at` | 處理意見最後更新時間；無回覆時為 `null` |
| `is_final_response` | 最新處理意見是否為最終回覆 |

### 7.4 Appeal 狀態

```json
{
  "submitted": "已提交",
  "under_review": "審核中",
  "need_more_info": "需補充資料",
  "approved": "異議通過",
  "rejected": "異議未通過",
  "cancelled": "已取消"
}
```

| status | 說明 | 是否終態 |
| --- | --- | --- |
| `submitted` | 員工已送出異議，等待接收或指派 | 否 |
| `under_review` | HR 或高階主管審核中 | 否 |
| `need_more_info` | 處理方認為資料不足，目前等待補充資料或人工聯繫 | 否 |
| `approved` | 異議成立 | 是 |
| `rejected` | 異議不成立 | 是 |
| `cancelled` | 案件由後台或系統流程取消 | 是 |

狀態流轉:

| 觸發事件 | 前狀態 | 後狀態 | 來源 |
| --- | --- | --- | --- |
| 員工提交異議 | 無 | `submitted` | `POST /me/appeals/submit` |
| 處理方開始審核 | `submitted` | `under_review` | HR / 主管後台 |
| 處理方要求補充資料 | `submitted`, `under_review` | `need_more_info` | HR / 主管後台 |
| 補件或人工確認完成 | `need_more_info` | `under_review` | HR / 主管後台 |
| 異議成立 | `under_review`, `need_more_info` | `approved` | HR / 主管後台 |
| 異議不成立 | `under_review`, `need_more_info` | `rejected` | HR / 主管後台 |
| 後台取消案件 | `submitted`, `under_review`, `need_more_info` | `cancelled` | HR / 系統 |

不可操作情境:

| 不允許情境 | 後端回應 |
| --- | --- |
| 本期已有任一狀態的異議案件仍再次提交 | `409 APPEAL_ALREADY_SUBMITTED` |
| 結果尚未公佈時提交 | `403 RESULT_NOT_PUBLISHED` |
| 異議期間尚未開放時提交 | `403 APPEAL_PERIOD_NOT_OPEN` |
| 異議期間已結束時提交 | `403 APPEAL_PERIOD_CLOSED` |
| 終態後由員工端再次操作 | `409 INVALID_APPEAL_STATUS` |
| 指定 `period_id` 找不到目前登入者的 review | `404 REVIEW_NOT_FOUND` |
| 指定 review 不屬於目前登入者 | `403 FORBIDDEN` |

### 7.5 GET `/me/appeals`

用途:

- 進入「績效異議處理」頁面時使用。
- 若尚未提交異議，前端顯示填寫表單；按鈕是否可用以 `available_actions` 為準。
- 若已有案件，前端顯示案件結果區。

Response 200：尚未提交且可提出異議:

```json
{
  "mode": "compose",
  "period": {
    "period_id": "cycle_2025_q3",
    "name": "2025 年度 Q3 績效考核",
    "start_date": "2025-07-01",
    "end_date": "2025-09-30"
  },
  "appeal_period": {
    "status": "open",
    "start_date": "2025-10-15",
    "end_date": "2025-10-22",
    "timezone": "Asia/Taipei"
  },
  "review_result": {
    "review_id": "review_2025_q3_user_001",
    "final_rating": "meets_expectations",
    "kpi_score": 86.5,
    "review_score": 82.0,
    "manager_comment": "整體表現穩定，專案推進能力良好。"
  },
  "current_appeal": null,
  "available_actions": {
    "can_start_appeal": true,
    "start_appeal_unavailable_reason": null,
    "can_submit": true,
    "submit_unavailable_reason": null
  }
}
```

Response 200：已有本期異議:

```json
{
  "mode": "result",
  "period": {
    "period_id": "cycle_2025_q3",
    "name": "2025 年度 Q3 績效考核",
    "start_date": "2025-07-01",
    "end_date": "2025-09-30"
  },
  "appeal_period": {
    "status": "closed",
    "start_date": "2025-10-15",
    "end_date": "2025-10-22",
    "timezone": "Asia/Taipei"
  },
  "review_result": {
    "review_id": "review_2025_q3_user_001",
    "final_rating": "meets_expectations",
    "kpi_score": 86.5,
    "review_score": 82.0,
    "manager_comment": "整體表現穩定，專案推進能力良好。"
  },
  "current_appeal": {
    "appeal_id": "appeal_20251016_004",
    "case_no": "DP-20251016-004",
    "review_id": "review_2025_q3_user_001",
    "reason": "本人對於 Q3 考核中「專案領導力」項目的評分持有異議。",
    "status": "under_review",
    "submitted_at": "2025-10-16T09:42:00+08:00",
    "resolved_at": null,
    "handler": {
      "user_id": "hr_001",
      "type": "hr",
      "name": "陳美玲",
      "english_name": "Lin Chen",
      "department": "HR 部門"
    },
    "processing_comment": null,
    "processing_comment_updated_at": null,
    "is_final_response": false,
    "updated_at": "2025-10-16T09:42:00+08:00"
  },
  "available_actions": {
    "can_start_appeal": false,
    "start_appeal_unavailable_reason": "already_submitted",
    "can_submit": false,
    "submit_unavailable_reason": "already_submitted"
  }
}
```

空資料:

| 情境 | 回傳方式 |
| --- | --- |
| 本期尚未提交異議 | `200 mode: "compose"`, `current_appeal: null` |
| 結果尚未公佈 | `200 review_result: null`, `appeal_period.status: "not_open"` |
| 異議期間尚未開放或已結束 | `200` 搭配 `available_actions` 禁用 |
| 本期已有異議但無處理意見 | `200 processing_comment: null` |

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 404 | `CURRENT_APPEAL_PERIOD_NOT_FOUND` | 目前沒有可判定的考核週期 |
| 404 | `REVIEW_NOT_FOUND` | 登入者不在本期考核名單內 |

### 7.6 POST `/me/appeals/submit`

用途:

- 提交正式績效異議案件。
- 提交後前端切換顯示案件結果區。

Request:

```json
{
  "period_id": "cycle_2025_q3",
  "reason": "本人對於 Q3 考核中「專案領導力」項目的評分持有異議。在 Project Phoenix 期間，我成功帶領跨部門團隊提前完成系統上線，且客戶滿意度得分達 4.8/5.0，但考核反饋中提到溝通效率不足，與實際數據及客戶反饋存在落差。"
}
```

欄位規則:

| 欄位 | 型別 | 必填 | 規則 |
| --- | --- | --- | --- |
| `period_id` | string | 是 | 考核週期 ID；後端用它判斷本期可異議的考核結果 |
| `reason` | string | 是 | 1 到 2000 字，提交後即正式異議理由 |

建立案件規則:

- `period_id` 必須對應目前登入者可查看且可提出異議的本期考核結果。
- 同一個考核結果只能存在一筆異議案件。
- 建立案件時後端必須同步套用預設處理人或指派規則。
- 結果尚未公佈、異議期間未開放、已結束、已正式入檔時不可提交。

Response 201:

```json
{
  "appeal": {
    "appeal_id": "appeal_20251016_004",
    "case_no": "DP-20251016-004",
    "review_id": "review_2025_q3_user_001",
    "period": {
      "period_id": "cycle_2025_q3",
      "name": "2025 年度 Q3 績效考核",
      "start_date": "2025-07-01",
      "end_date": "2025-09-30"
    },
    "reason": "本人對於 Q3 考核中「專案領導力」項目的評分持有異議。",
    "status": "submitted",
    "submitted_at": "2025-10-16T09:42:00+08:00",
    "resolved_at": null,
    "handler": {
      "user_id": "hr_001",
      "type": "hr",
      "name": "陳美玲",
      "english_name": "Lin Chen",
      "department": "HR 部門"
    },
    "processing_comment": null,
    "processing_comment_updated_at": null,
    "is_final_response": false,
    "updated_at": "2025-10-16T09:42:00+08:00"
  },
  "available_actions": {
    "can_start_appeal": false,
    "start_appeal_unavailable_reason": "already_submitted",
    "can_submit": false,
    "submit_unavailable_reason": "already_submitted"
  }
}
```

錯誤:

| HTTP status | code | 情境 |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | JSON、`period_id` 或 `reason` 驗證失敗 |
| 401 | `UNAUTHORIZED` | 尚未登入或 token 失效 |
| 403 | `FORBIDDEN` | 指定 review 不屬於目前登入者 |
| 403 | `RESULT_NOT_PUBLISHED` | 考核結果尚未公佈 |
| 403 | `APPEAL_PERIOD_NOT_OPEN` | 異議期間尚未開放 |
| 403 | `APPEAL_PERIOD_CLOSED` | 異議期間已結束 |
| 404 | `CURRENT_APPEAL_PERIOD_NOT_FOUND` | 找不到指定週期或目前無可提出異議週期 |
| 404 | `REVIEW_NOT_FOUND` | 找不到目前登入者在指定週期的 review |
| 409 | `APPEAL_ALREADY_SUBMITTED` | 本期已存在異議案件 |
| 409 | `INVALID_REVIEW_STATUS` | review 狀態不允許提出異議 |
| 409 | `APPEAL_RESULT_FINALIZED` | 考核結果已正式入檔 |

### 7.7 GET `/me/appeals/result`

用途:

- 查看本期已提交的績效異議處理狀態。
- 沒有本期異議案件時回 `404 APPEAL_NOT_FOUND`。

Response 200:

```json
{
  "appeal": {
    "appeal_id": "appeal_20251016_004",
    "case_no": "DP-20251016-004",
    "review_id": "review_2025_q3_user_001",
    "period": {
      "period_id": "cycle_2025_q3",
      "name": "2025 年度 Q3 績效考核",
      "start_date": "2025-07-01",
      "end_date": "2025-09-30"
    },
    "reason": "本人對於 Q3 考核中「專案領導力」項目的評分持有異議。",
    "status": "approved",
    "submitted_at": "2025-10-16T09:42:00+08:00",
    "resolved_at": "2025-10-20T15:20:00+08:00",
    "handler": {
      "user_id": "hr_001",
      "type": "hr",
      "name": "陳美玲",
      "english_name": "Lin Chen",
      "department": "HR 部門"
    },
    "processing_comment": "經複核專案資料與主管回覆後，本次異議成立，HR 將同步更新本期考核結果。",
    "processing_comment_updated_at": "2025-10-20T15:20:00+08:00",
    "is_final_response": true,
    "updated_at": "2025-10-20T15:20:00+08:00"
  },
  "review_result": {
    "review_id": "review_2025_q3_user_001",
    "final_rating": "meets_expectations",
    "kpi_score": 86.5,
    "review_score": 82.0,
    "manager_comment": "整體表現穩定，專案推進能力良好。"
  }
}
```

空資料與錯誤:

| 情境 | HTTP status | 回傳方式 / code |
| --- | --- | --- |
| 本期已有異議，但尚無處理回覆 | 200 | `processing_comment: null` |
| 本期已有異議，仍在審核中 | 200 | `status: submitted / under_review / need_more_info`, `resolved_at: null` |
| 本期已有異議，已結案 | 200 | `status: approved / rejected / cancelled`, `resolved_at` 有值 |
| 尚未登入或 token 失效 | 401 | `UNAUTHORIZED` |
| 目前沒有可判定的考核週期 | 404 | `CURRENT_APPEAL_PERIOD_NOT_FOUND` |
| 找不到目前登入者本期 review | 404 | `REVIEW_NOT_FOUND` |
| 本期尚未提交異議 | 404 | `APPEAL_NOT_FOUND` |

## 8. 後端查詢與推導建議

### 8.1 目前考核週期選取

所有頁面需共用同一套目前週期選取規則，避免各 API 推導不一致。

建議優先順序:

1. `in_progress`
2. `locked`
3. `results_published`
4. 最近的 `completed`
5. 即將開始的 `not_started`

`GET /me/profile` 若查無週期，回傳 `cycle: null`, `review: null`。`GET /me/performance-cycles/current` 若查無週期，回 `404 CURRENT_CYCLE_NOT_FOUND`。

### 8.2 空資料處理總表

| API | 空資料處理 |
| --- | --- |
| `GET /me/profile` | 使用者存在但無週期時 `cycle: null`, `review: null` |
| `GET /me/goals` | 本期無目標時 `goals: []`，summary count 為 `0` |
| `GET /me/goals/review-result` | 本期無目標時 `overall_status: "no_goals"`, `results: []` |
| `GET /me/kpis/standards` | 尚未設定 KPI 標準時 `standards: []` |
| `GET /me/kpis/result` | 尚未公佈時 `result.status: "not_published"` |
| `GET /me/kpis/result?status=historical&page={page}` | 無歷史資料時 `results: []` |
| `GET /me/appeals` | 尚未提交異議時 `mode: "compose"`, `current_appeal: null` |
| `GET /me/appeals/result` | 尚未提交異議時 `404 APPEAL_NOT_FOUND` |

### 8.3 待確認問題

1. `new-schema.md` 目前沒有 `users.english_name`、`users.avatar_url`、`users.location` 欄位；需確認來源是 IdP、前端資產規則、HR 系統同步，或補 DB 欄位。
2. `closed` 是產品語意需要的週期狀態，但 `new-schema.md` 尚未定義。若需要明確區分 `completed` 與 `closed`，建議後端新增 enum 或封存欄位。
3. `GET /me/performance-cycles/current` 的「目前週期」選取規則需由後端統一實作。
4. `new-schema.md` 目前沒有獨立 goal review table。若要保存完整審核歷史，需確認沿用 `goal_comments` 投影 `latest_review`，或補審核紀錄表。
5. `new-schema.md` 尚未定義 KPI 結果確認紀錄表。`POST /me/kpis/result-confirmations` 需要保存確認者與確認時間。
6. KPI `finalized` 的精確入檔條件需由 HR 流程確認；本文件暫定為 `performance_cycles.status = completed`，或 HR 後台完成正式入檔。
7. `performance_reviews.status = terminated` 的 KPI 員工端顯示策略需確認；本文件不新增狀態，建議依是否已公佈與是否已入檔映射為 `not_published` 或 `finalized`。
8. `new-schema.md` 尚未定義 `appeals.case_no`。若前端需要固定顯示異議編號，建議後端新增唯一欄位；若不新增，需確認穩定產生規則。
19. `new-schema.md` 目前只有 `appeal_status_enum.resolved`，無法區分 `approved` / `rejected`。本文件建議擴充 enum，或補足最終決議欄位。
10. `need_more_info` 狀態目前只表示案件需要補充資料，但本文件沒有定義員工補件 API；若前端要支援補件，需另行確認欄位與路由。
11. `appeal_responses` 尚未定義可見範圍欄位。本文件假設所有回覆皆可被員工端查看；若後台需要內部留言，建議補 visibility 欄位或另外保存內部紀錄。
12. `new-schema.md` 尚未定義 `appeals.review_id` 唯一約束；若維持同一 review 只能一筆異議，建議補唯一約束或明確應用層防重策略。