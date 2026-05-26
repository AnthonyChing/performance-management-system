package com.pms.controller;

import com.pms.service.DiscordAlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo")
public class DemoController {

    private final DiscordAlertService discordAlertService;

    public DemoController(DiscordAlertService discordAlertService) {
        this.discordAlertService = discordAlertService;
    }

    @GetMapping("/crash")
    public ResponseEntity<String> crashApplication() {
        discordAlertService.sendCrashAlert("【DEMO】觸發手動崩潰測試 (System.exit)。Cloud Run 將會自動重啟容器。");

        // 建立一條執行緒在回應後讓系統崩潰，確保前端能收到回傳值
        new Thread(
                        () -> {
                            try {
                                Thread.sleep(1000);
                            } catch (InterruptedException e) {
                                // Ignore
                            }
                            System.exit(1);
                        })
                .start();

        return ResponseEntity.ok("應用程式將在 1 秒後崩潰並觸發 Discord 警報。");
    }

    @GetMapping("/sleep")
    public ResponseEntity<String> sleepApplication() {
        try {
            // 暫停 15 秒，用來展示 Graceful Shutdown 時請求不會中斷
            Thread.sleep(15000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.internalServerError().body("Sleep interrupted");
        }
        return ResponseEntity.ok("成功等待 15 秒，請求處理完畢！");
    }
}
