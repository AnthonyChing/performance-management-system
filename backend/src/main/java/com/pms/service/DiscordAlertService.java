package com.pms.service;

import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class DiscordAlertService {
    private static final Logger logger = LoggerFactory.getLogger(DiscordAlertService.class);
    private final RestTemplate restTemplate;

    @Value("${DISCORD_WEBHOOK_DEPLOY:}")
    private String deployWebhookUrl;

    @Value("${DISCORD_WEBHOOK_BACKUP:}")
    private String backupWebhookUrl;

    public DiscordAlertService() {
        this.restTemplate = new RestTemplate();
    }

    public void sendCrashAlert(String errorMessage) {
        if (deployWebhookUrl == null || deployWebhookUrl.isEmpty()) {
            logger.warn("Discord deploy webhook URL is not configured. Cannot send crash alert.");
            return;
        }
        String content = "🚨 **[CRASH ALERT]** 伺服器發生未捕捉的異常崩潰！\n```\n" + errorMessage + "\n```";
        sendDiscordMessage(deployWebhookUrl, content);
    }

    public void sendBackupAlert(String message) {
        if (backupWebhookUrl == null || backupWebhookUrl.isEmpty()) {
            logger.warn("Discord backup webhook URL is not configured. Cannot send backup alert.");
            return;
        }
        sendDiscordMessage(backupWebhookUrl, message);
    }

    private void sendDiscordMessage(String webhookUrl, String content) {
        try {
            Map<String, String> payload = new HashMap<>();
            payload.put("content", content);
            restTemplate.postForObject(webhookUrl, payload, String.class);
        } catch (Exception e) {
            logger.error("Failed to send message to Discord webhook", e);
        }
    }
}
