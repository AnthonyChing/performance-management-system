# 系統架構與 Schema 設計

## 模組一：身份與組織架構 (Identity & Organization)
* **包含表**：`users`, `departments`, `roles`, `user_roles`
* **運作邏輯**：
  這是系統的基礎。每位員工（`users`）會歸屬於某個部門（`departments`），並有一位直屬主管（`manager_id`）。透過 `user_roles`，系統可以靈活賦予某個員工 `manager`、`hr` 或是 `admin` 等不同的權限（RBAC 架構），這決定了他們登入系統後能看到什麼畫面。

## 模組二：考核週期與範本 (Cycles & Templates)
* **包含表**：`performance_cycles`, `evaluation_templates`, `template_questions`, `cycle_template_assignments`
* **運作邏輯**：
  HR 會開啟一個「考核週期」（例如：2025 Q4 季考核，存於 `performance_cycles`）。但因為工程師和業務的考核題目不同，HR 會建立不同的「問卷範本」（`evaluation_templates` + `template_questions`）。
  最後透過 `cycle_template_assignments` 把兩者綁起來宣告：「在 2025 Q4 週期，工程部門要用技術評估範本」。

## 模組三：目標與 KPI (Goals & KPIs)
* **包含表**：`goals`, `kpis`, `kpi_assignments`
* **運作邏輯**：
  在考核週期初，主管與員工會設定目標。
  * `goals` 偏向質性或專案型目標（例如：優化系統架構）。
  * `kpis` 偏向量化指標。主管可以定義一個通用 KPI（例如：業績達標），然後透過 `kpi_assignments` 派發給底下的業務，每個業務可以有自己獨立的 `target_value`（例如 A 是 100萬、B 是 500萬）。

## 模組四：績效評估核心 (Performance Reviews)
* **包含表**：`performance_reviews`, `review_responses`, `review_documents`
* **運作邏輯**：
  這是整個系統的資料匯集點。當員工進入填寫時，系統會建立一張 `performance_reviews` 總表，記錄目前的進度（例如：員工自評中、主管評分中）。
  * 員工和主管填寫問卷的每一題答案，都會作為一筆紀錄存進 `review_responses`。
  * 主管如果需要附上 Jira 報表或 Email 截圖作為佐證，就會存進 `review_documents`。
  * 最終，系統會產出一個 `final_rating`（例如：超出預期），並由 HR 確認。

## 模組五：申訴機制 (Appeals)
* **包含表**：`appeals`, `appeal_responses`
* **運作邏輯**：
  如果員工對 `performance_reviews` 的最終結果不滿意，在 `appeal_deadline_days`（例如公佈後 7 天內）可以發起申訴。申訴會被指派給更上層的主管或 HR，並透過 `appeal_responses` 進行雙向的對話與仲裁，直到爭議解決。

## 模組六：系統日誌與通知 (System Mechanics)
* **包含表**：`notifications`, `audit_logs`, `security_violation_logs`
* **運作邏輯**：
  * **日常驅動**：任何狀態改變（例如主管打完分數），都會產生 `notifications` 提醒員工。
  * **法規遵循**：任何對績效的增刪改，都會被 `audit_logs` 永久記錄下來（舊值與新值）。這張表被 PostgreSQL 設定了「不可被修改或刪除」的強硬規則。如果有任何人嘗試竄改 Audit Log，就會觸發機制寫入 `security_violation_logs` 並立刻阻擋。
  * **安全性設計**：`security_violation_logs` 與其他表維持鬆散耦合（`attempted_by` 可為 NULL），確保在任何異常未授權情況下，系統就算無法對應到正確的員工 ID，也能強硬寫入安全日誌，不會因為 Foreign Key 限制而導致日誌丟失。

## 資料流向
**HR 定義規則 (模組二) ➔ 員工與主管訂定目標 (模組三) ➔ 週期結束進行評分 (模組四) ➔ 如有爭議進入仲裁 (模組五) ➔ 所有過程皆被紀錄 (模組六)。**
