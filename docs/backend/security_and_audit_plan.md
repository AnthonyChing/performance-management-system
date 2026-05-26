# 系統稽核日誌實作計畫 (Audit Log)

本文件記錄 Performance Management System (PMS) 後端關於 **系統稽核日誌 (Audit Log)** 的實作計畫。

> 身分驗證與 JWT 授權已於 `backend/feature/security-jwt-aut` 完成實作，不在本文件範圍內。

---

## 1. 資料庫底層防護 (已在 Schema 中完成)

* **Append-only (只進不出)**: `audit_logs` 表被設定了 PostgreSQL Triggers。任何 `UPDATE` 或 `DELETE` 的操作都會被資料庫層級直接阻擋，並將這次違法嘗試寫入 `security_violation_logs`。
* **分區 (Partitioning)**: `audit_logs` 採用 Range Partitioning，依據月份切分資料表，解決日後資料過載的問題。

---

## 2. 後端應用層實作計畫

資料庫防護已經就位，後端需要做的是「在發生異動時，主動寫入 Audit Log」，並正確傳遞「是誰 (Actor)」做了這件事。預計分兩步實作：

**方案一：透過 AOP (Aspect-Oriented Programming)**
* 在修改資料的 Service 方法上加上自訂的 `@AuditLog` 標記。
* AOP 切面攔截該方法執行，從 `SecurityContext` 取出目前使用者的 `user_id` 與 `email`，並自動比對前後資料 (old_value, new_value) 後，透過 `AuditLogRepository` 呼叫 INSERT。

**方案二：將使用者上下文傳入 PostgreSQL (進階防護)**
如果我們依賴資料庫 Trigger 生成某些紀錄，後端可以在執行異動 SQL 前，利用 Database Session 設定變數：
```java
// 將目前使用者的 ID 綁定到 DB 的連線 Session 中
jdbcTemplate.execute("SET LOCAL app.actor_id = '" + currentUserId + "'");
```
這能讓 PostgreSQL 層級的 Log 也能正確拿到操作者 ID。

---

## 3. 開發步驟

1. 建立 `AuditLogService`。
2. 針對關鍵 API（如送出 Review、修改 Goal），在 Service 寫入邏輯旁補上 `auditLogService.logAction(...)` 來紀錄新舊值 JSON 變化。
