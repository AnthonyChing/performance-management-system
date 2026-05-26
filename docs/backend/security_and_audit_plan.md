# Backend Security & Audit Implementation Plan

本文件記錄 Performance Management System (PMS) 後端關於 **身分驗證 (Authentication)**、**角色權限控管 (RBAC)** 以及 **系統稽核日誌 (Audit Log)** 的實作計畫與技術選擇。

---

## 1. 身分驗證與授權 (Authentication & RBAC)

目前後端的 API 皆為開放或採用寫死的 Mock User (`00000000-0000-0000-0000-0000000000c1`)。未來將全面導入 **Spring Security + JWT (JSON Web Token)** 來完成無狀態 (Stateless) 的權限控管。

### 1.1 核心流程 (Flow)
1. **登入 / SSO**: 
   前端透過外部 IdP (例如 Google Workspace) 取得登入憑證後發送至後端。
2. **身分解析**: 
   後端比對 `user_identities` 資料表，將 IdP 的 `subject` 映射至內部的 `users` 表取得對應的 `user_id`。
3. **核發 JWT**: 
   後端查詢 `user_roles` 表，將該名員工擁有的角色 (例如 `EMPLOYEE`, `MANAGER`, `HR`) 寫入 JWT Payload，簽署後發放給前端。
4. **API 請求與攔截**: 
   後續前端每次呼叫 API 時，會在 HTTP Header 帶上 `Authorization: Bearer <JWT>`。由 Spring Security 的 `JwtAuthenticationFilter` 負責攔截、驗證簽名真偽，並解析出角色寫入 `SecurityContext`。

### 1.2 權限實作計畫 (RBAC)
我們採用「基於角色」的權限保護。Controller 上的每個 API 端點都會明確標示所需的角色門檻。

* **技術選擇**: 啟用 Spring Security 的 `@EnableMethodSecurity`。
* **開發示範**:
  ```java
  // 只有擁有 'EMPLOYEE' 角色的使用者可以呼叫
  @PreAuthorize("hasRole('EMPLOYEE')")
  @GetMapping("/me/profile")
  public ResponseEntity<ProfileResponseDTO> getProfile() { ... }

  // 只有 'MANAGER' 可以進行主管評分
  @PreAuthorize("hasRole('MANAGER')")
  @PostMapping("/reviews/{reviewId}/evaluate")
  public ResponseEntity<Void> evaluate() { ... }
  ```

---

## 2. 系統稽核日誌 (Audit Log)

本專案對資料的變更具備高度的合規要求。任何對目標 (Goals)、考核 (Reviews)、KPI 的增刪改，都必須留下不可竄改的足跡。

### 2.1 資料庫底層防護 (已在 Schema 中完成)
* **Append-only (只進不出)**: `audit_logs` 表被設定了 PostgreSQL Triggers。任何 `UPDATE` 或 `DELETE` 的操作都會被資料庫層級直接阻擋，並將這次違法嘗試寫入 `security_violation_logs`。
* **分區 (Partitioning)**: `audit_logs` 採用 Range Partitioning，依據月份切分資料表，解決日後資料過載的問題。

### 2.2 後端應用層實作計畫
資料庫防護已經就位，後端需要做的是「在發生異動時，主動寫入 Audit Log」，並正確傳遞「是誰 (Actor)」做了這件事。我們預計分兩步實作：

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

## 3. 分階段開發步驟 (Execution Steps)

1. **Phase 1: 基礎設施就位**
   - 在 `pom.xml` 加入 `spring-boot-starter-security` 與 `jjwt` 依賴。
   - 建立 `JwtUtil` (負責建構與解碼 JWT)。
   - 建立 `JwtAuthenticationFilter` 並配置 `SecurityFilterChain` 使目前開發中 API 暫時放行。
2. **Phase 2: 打通登入與授權**
   - 實作登入 API (Auth Controller)。
   - 將所有 Controller 加上對應的 `@PreAuthorize` 權限。
   - 移除原先防呆用的 `getCurrentUserId()` 硬編碼，改由 `SecurityContextHolder` 取得真正身分。
3. **Phase 3: 稽核日誌落地**
   - 建立 `AuditLogService`。
   - 針對關鍵 API (如送出 Review、修改 Goal)，在 Service 寫入邏輯旁補上 `auditLogService.logAction(...)` 來紀錄新舊值 JSON 變化。