package com.pms.controller;

import com.pms.service.DiscordAlertService;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class BackupController {

    private static final Logger logger = LoggerFactory.getLogger(BackupController.class);
    private final DiscordAlertService discordAlertService;

    @Value("${spring.datasource.url:}")
    private String dbUrl;

    @Value("${spring.datasource.username:postgres}")
    private String dbUser;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    public BackupController(DiscordAlertService discordAlertService) {
        this.discordAlertService = discordAlertService;
    }

    @GetMapping("/db-backup")
    public ResponseEntity<Map<String, String>> backupDatabase() {
        Map<String, String> response = new HashMap<>();
        String timeStamp =
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String backupFileName = "backup_" + timeStamp + ".sql";

        try {
            // Extract connection string for pg_dump
            String connectionString = dbUrl.replace("jdbc:", "");

            // Build pg_dump command
            String command =
                    "pg_dump -d "
                            + connectionString
                            + " -U "
                            + dbUser
                            + " -F c -f /tmp/"
                            + backupFileName;

            ProcessBuilder processBuilder = new ProcessBuilder("sh", "-c", command);
            Map<String, String> env = processBuilder.environment();
            if (dbPassword != null && !dbPassword.isEmpty()) {
                env.put("PGPASSWORD", dbPassword);
            }

            Process process = processBuilder.start();
            int exitCode = process.waitFor();

            if (exitCode == 0) {
                String successMsg =
                        "✅ **資料庫備份成功！**\n檔案名稱: `"
                                + backupFileName
                                + "`\n時間: `"
                                + timeStamp
                                + "`\n*(備註：檔案儲存於容器 /tmp，正式環境建議上傳至 Cloud Storage)*";
                discordAlertService.sendBackupAlert(successMsg);
                response.put("status", "success");
                response.put("message", "Backup completed successfully");
                return ResponseEntity.ok(response);
            } else {
                BufferedReader errorReader =
                        new BufferedReader(
                                new InputStreamReader(
                                        process.getErrorStream(),
                                        java.nio.charset.StandardCharsets.UTF_8));
                StringBuilder errorOutput = new StringBuilder();
                String line;
                while ((line = errorReader.readLine()) != null) {
                    errorOutput.append(line).append("\n");
                }

                String failMsg = "❌ **資料庫備份失敗！**\n錯誤訊息:\n```\n" + errorOutput.toString() + "\n```";
                discordAlertService.sendBackupAlert(failMsg);
                response.put("status", "error");
                response.put("message", "Backup failed");
                return ResponseEntity.internalServerError().body(response);
            }

        } catch (Exception e) {
            logger.error("Backup process failed", e);
            String failMsg = "❌ **資料庫備份發生例外錯誤！**\n例外:\n```\n" + e.getMessage() + "\n```";
            discordAlertService.sendBackupAlert(failMsg);
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
