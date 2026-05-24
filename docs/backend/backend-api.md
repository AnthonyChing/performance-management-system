# Backend API

目前 backend 已實作的 REST API 列表。Base path: `/api/v1`。

## 目錄

- [Health](#health)
  - [GET /api/v1/health](#get-apiv1health)
- [Departments](#departments)
  - [GET /api/v1/departments](#get-apiv1departments)
  - [GET /api/v1/departments/{id}](#get-apiv1departmentsid)
- [Error format](#error-format)

---

## Health

來源:[HealthController.java](backend/src/main/java/com/pms/controller/HealthController.java)

### `GET /api/v1/health`

回傳服務存活狀態,供監控/健康檢查使用。

**Response 200**

```json
{
  "status": "UP",
  "timestamp": "2026-05-19T10:00:00",
  "service": "Performance Management System",
  "version": "0.0.1-SNAPSHOT",
  "instance": "local-dev"
}
```

| 欄位 | 型別 | 說明 |
|---|---|---|
| `status` | string | 固定為 `UP` |
| `timestamp` | string (`LocalDateTime`) | 伺服器本地時間 |
| `service` | string | 服務名稱 |
| `version` | string | 來自 `spring.application.version` |
| `instance` | string | `HOSTNAME` 環境變數;預設 `local-dev` |

---

## Departments

來源:[DepartmentController.java](backend/src/main/java/com/pms/controller/DepartmentController.java)、[DepartmentService.java](backend/src/main/java/com/pms/service/DepartmentService.java)

> **唯讀**。部門由外部 HR 來源系統提供並 seed 進資料庫,本服務不提供建立 / 編輯 / 關閉 / 刪除部門的端點,只開放查詢。

### Department 物件

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | UUID | 部門 ID |
| `name` | string (≤128) | 部門名稱 |
| `parentId` | UUID \| null | 父部門;`null` 表示根節點 |
| `closedAt` | OffsetDateTime \| null | 關閉時間;`null` 表示仍為 active |
| `closedBy` | UUID \| null | 執行關閉的使用者 ID |
| `createdAt` | OffsetDateTime | 建立時間 |

---

### `GET /api/v1/departments`

列出部門。

**Query**

| 參數 | 型別 | 預設 | 說明 |
|---|---|---|---|
| `includeClosed` | boolean | `false` | `true` 時包含已關閉的部門 |

**Response 200** — `DepartmentResponse[]`

---

### `GET /api/v1/departments/{id}`

取得單一部門。

**Response 200** — `DepartmentResponse`
**Response 404** — `department not found: {id}`

---

## Error format

所有非 2xx 回應由 [GlobalExceptionHandler.java](backend/src/main/java/com/pms/exception/GlobalExceptionHandler.java) 統一輸出:

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "department not found: 1f0c9a2e-...-uuid",
  "errors": [],
  "timestamp": "2026-05-19T10:00:00+08:00"
}
```

| 欄位 | 說明 |
|---|---|
| `status` | HTTP status code |
| `error` | HTTP status reason phrase |
| `message` | 人類可讀錯誤訊息 |
| `errors` | 欄位層級錯誤列表;僅 `400 validation failed` 會有內容,格式為 `"field: message"` |
| `timestamp` | 伺服器時間(`OffsetDateTime`) |

| HTTP | 來源 | 觸發情境 |
|---|---|---|
| 400 | `MethodArgumentNotValidException` | Request body 驗證失敗 |
| 404 | `NotFoundException` | 找不到資源 |
| 409 | `ConflictException` | 業務邏輯衝突;目前唯讀部門端點不會觸發,保留供後續寫入型端點使用 |
