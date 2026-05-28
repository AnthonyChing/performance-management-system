# 後端待辦工作

> 最後更新：2026-05-26
> 截至目前：所有 docs (`hr_api.md` / `manager_api.md` / `employee_api.md`) 列出的 51 個 endpoint 已實作完成，測試 145/145 全綠。本文件記錄「endpoint 已存在但實作為 stub」或「合規/完整性層面尚未補足」的剩餘工作。

---

## 1. Stub / 業務邏輯尚未完整

### 1.1 通知派送
- **位置**：`HrNotificationController.sendNotification`（`backend/src/main/java/com/pms/controller/hr/HrNotificationController.java`）
- **現況**：回傳 `{"message": "Notification job queued."}`，沒有實際派送行為。
- **要補**：
  - 收件人解析（依角色 / 部門 / 週期狀態）
  - Email service 整合（SES / SendGrid / SMTP 任一）或站內訊息表
  - 通知模板（標題、內文、變數替換）
  - 失敗重試與紀錄

### 1.2 稽核紀錄匯出
- **位置**：`HrAuditLogController.exportAuditLogs`（`backend/src/main/java/com/pms/controller/hr/HrAuditLogController.java`）
- **現況**：回 `{"message": "Export job queued."}`，未產生實際檔案。
- **要補（兩種方案二擇一）**：
  - **同步**：依 query 條件撈出資料，產 CSV 直接回傳 `text/csv`（含 Content-Disposition）
  - **非同步**：建立匯出任務、回 `job_id`，提供 `GET /hr/audit-log-exports/{id}` 查狀態 + 下載連結

### 1.3 異議檔案上傳
- **現況**：`Appeal` entity 已有 `evidence_urls` 欄位，但缺乏上傳端點；前端只能傳已上傳的外部 URL。
- **要補**：
  - 新端點：`POST /me/appeals/uploads`（multipart/form-data）
  - 儲存後回 `{file_url, file_name, size}`，後續用於 `POST /me/appeals/submit` 的 `evidence_urls`
  - 儲存後端可選：本機磁碟、MinIO、S3

---

## 2. 稽核標註 (@Auditable) 覆蓋不足

依 `docs/backend/security_and_audit_plan.md`，下列 service 動作應自動寫稽核紀錄。
目前僅 `HrTemplateServiceImpl` 與 `HrCycleServiceImpl` 完成。

| Service | 待補方法 | 建議 action 名稱 |
|---|---|---|
| `EmployeeGoalServiceImpl` | `createGoal` / `resubmitGoal` / `addProgressUpdate` | `goal.create` / `goal.resubmit` / `goal.progress_update` |
| `EmployeeKpiServiceImpl` | `confirmResult` | `kpi.confirm_result` |
| `EmployeeAppealServiceImpl` | `submitAppeal` | `appeal.submit` |
| `ManagerGoalServiceImpl` | `createGoal` / `patchGoal` | `goal.manager_create` / `goal.manager_review` |
| `ManagerKpiServiceImpl` | `createKpi` / `updateKpi` | `kpi.create` / `kpi.update` |
| `ManagerEvaluationServiceImpl` | `updateEvaluation`（含 questionnaire / kpis 子路徑）| `evaluation.save` / `evaluation.submit` |
| `ManagerAppealServiceImpl` | `handleAppeal` | `appeal.respond` / `appeal.resolve` |
| `AuthServiceImpl` | `login` / `logout` | `auth.login` / `auth.logout` |

**注意**：`@Auditable` 只需加在 service method 上，AOP 已會處理寫入。要驗證 actor / resource 是否從 `SecurityUtils` 與方法參數正確帶入。

---

## 3. 可確認的周邊項目

- **Swagger / OpenAPI UI**：`me.md` 提到 `http://localhost:8080/swagger-ui.html`，需確認是否已加入 `springdoc-openapi-starter-webmvc-ui` 依賴並可正常瀏覽。
- **前端整合**：`frontend/` 已有 Vite + TS + Playwright 骨架；前後端 contract 對齊狀況另案追蹤。

---

## 4. 建議優先順序

1. **`@Auditable` 補完** — 小工作量、合規性影響大，可一次補完八個 service。
2. **通知派送實作** — 即使先接 console log / DB queue 也好，至少建立 trace。
3. **異議檔案上傳** — 否則附件功能無法端到端運作。
4. **匯出實作** — 同步 CSV 版本最快上線。

---

## 5. 已完成項目（紀錄用）

- HR API：23/23 endpoint 全部實作（template / question / cycle / assessment-status / audit-log / notification）
- Manager API：12/12 endpoint 全部實作（goal / kpi / evaluation / appeal）
- Employee API：16/16 endpoint 全部實作（profile / goal / kpi / appeal）
- JWT auth + Google OAuth2 SSO
- 全域錯誤格式（`GlobalExceptionHandler` + `ErrorResponse`）
- `@Auditable` AOP 基礎建設
- 測試 145/145 通過（含 testcontainers PostgreSQL 整合）
