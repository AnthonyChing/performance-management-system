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

### 1.3 RBAC 實作注意事項 (Known Gaps)

以下四個問題在設計 JWT Filter 與 Controller 權限前必須明確決策：

#### 問題一：主管也是員工（角色重疊）
* **現象**: 資料庫中的 `user_roles` 僅記錄 `manager`，但 `/me/*` 系列 API（查看個人 Profile、提交申訴等）需要 `EMPLOYEE` 角色才能呼叫。若主管只有 `manager` 角色，呼叫 `/me/profile` 將被擋下。
* **解決方案（擇一）**:
  * **方案 A（資料面）**: 在登入建立帳號時，為具有 `manager` 角色的使用者同時寫入 `employee` 角色至 `user_roles`。
  * **方案 B（邏輯面）**: 在 `JwtAuthenticationFilter` 中，若偵測到 `manager` 角色，自動隱式授予 `EMPLOYEE`（角色繼承）。
  * **方案 C（Permission 面）**: 不使用 `hasRole('EMPLOYEE')`，改為 `hasAnyRole('EMPLOYEE', 'MANAGER', 'HR')` 明確列舉所有允許的角色。

#### 問題二：DB 角色名稱 vs Spring Security 命名規範
* **現象**: 資料庫 `user_roles` 存的是小寫字串（`employee`、`manager`、`hr`），而 Spring Security 的 `hasRole('EMPLOYEE')` 實際上比對的是 `ROLE_EMPLOYEE`（自動加上 `ROLE_` 前綴）。若 JWT Payload 直接塞入 `employee`，則 `hasRole('EMPLOYEE')` 永遠不會成立。
* **必要動作**: `JwtAuthenticationFilter` 解析角色時，必須做兩步轉換：
  1. 大寫化：`employee` → `EMPLOYEE`
  2. 加前綴：`EMPLOYEE` → `ROLE_EMPLOYEE`（或使用 `SimpleGrantedAuthority("ROLE_EMPLOYEE")`）

#### 問題三：資源層級授權（Ownership Check）未文件化
* **現象**: 目前 Service 層已實作所有權驗證，例如主管只能評分自己部門的員工，若存取他人資源則拋出 `ForbiddenException`（HTTP 403）。此邏輯散落在各 Service 實作中，但未在安全性文件中說明。
* **建議補充**:
  * 明確定義哪些端點需要 Ownership Check（除了 RBAC 角色外，還需驗證「操作對象是否屬於自己」）。
  * 文件化 ownership 驗證的標準做法：Service 層注入 `SecurityContextHolder` 取出 `user_id`，再比對目標資源的 owner/department，不符合則拋 `ForbiddenException`。

#### 問題四：HR 角色的存取範圍未定義
* **現象**: 文件中僅描述 `EMPLOYEE` 與 `MANAGER` 的典型使用情境，`HR` 角色可以呼叫哪些端點（包含是否能呼叫 `/me/*`、是否能代理員工查詢、能否讀取所有考核結果）完全未說明。
* **建議決策事項**:
  * HR 是否能呼叫 `/me/*` API（作為員工身分）？
  * HR 是否有一個獨立的 `/hr/*` API 群組？其存取範圍？
  * HR 是否能存取任意員工的 Review / Goal 資料（全域讀取權）？

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