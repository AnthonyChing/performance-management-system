package com.pms.exception;

import com.pms.dto.ErrorResponse;
import com.pms.service.DiscordAlertService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Renders every error as the contract envelope: {@code
 * {"error":{"code":"...","message":"...","details":[{"field","message"}]}}}.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private DiscordAlertService discordAlertService;

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException ex) {
        return build(ex.status(), ex.code(), ex.getMessage(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<ErrorResponse.FieldError> details =
                ex.getBindingResult().getFieldErrors().stream()
                        .map(
                                f ->
                                        ErrorResponse.FieldError.builder()
                                                .field(f.getField())
                                                .message(f.getDefaultMessage())
                                                .build())
                        .toList();
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "欄位驗證失敗。", details);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllExceptions(Exception ex) throws Exception {
        // 讓 Spring Security 自行處理權限相關的例外 (避免 403 變成 500)
        if (ex.getClass().getName().startsWith("org.springframework.security.")) {
            throw ex;
        }

        // Send alert to Discord
        if (discordAlertService != null) {
            discordAlertService.sendCrashAlert(
                    ex.getMessage() != null ? ex.getMessage() : ex.getClass().getName());
        }
        return build(
                HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", ex.getMessage(), null);
    }

    private static ResponseEntity<ErrorResponse> build(
            HttpStatus status,
            String code,
            String message,
            List<ErrorResponse.FieldError> details) {
        ErrorResponse body =
                ErrorResponse.builder()
                        .error(
                                ErrorResponse.ErrorDetail.builder()
                                        .code(code)
                                        .message(message)
                                        .details(details)
                                        .build())
                        .build();
        return ResponseEntity.status(status).body(body);
    }
}
