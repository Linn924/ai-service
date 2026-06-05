package com.ruoyi.web.controller.ai.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.ruoyi.web.controller.ai.domain.AiChatRequest;
import com.ruoyi.web.controller.ai.domain.AiChatResponse;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class DifyChatService
{
    @Value("${ai.dify.api-url:http://localhost/v1}")
    private String apiUrl;

    @Value("${ai.dify.api-key:}")
    private String apiKey;

    @Value("${ai.dify.user:local-dev-user}")
    private String defaultUser;

    @Value("${ai.dify.response-mode:blocking}")
    private String responseMode;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public AiChatResponse chat(AiChatRequest request)
    {
        if (!StringUtils.hasText(apiKey) || apiKey.contains("replace-with"))
        {
            return mockAnswer(request);
        }

        try
        {
            JSONObject difyResponse = sendToDify(request);
            return new AiChatResponse(
                    difyResponse.getString("answer"),
                    difyResponse.getString("conversation_id"),
                    difyResponse.getString("message_id"),
                    "dify");
        }
        catch (IOException e)
        {
            throw new RuntimeException("调用 Dify 失败：" + e.getMessage(), e);
        }
        catch (InterruptedException e)
        {
            Thread.currentThread().interrupt();
            throw new RuntimeException("调用 Dify 被中断", e);
        }
    }

    private JSONObject sendToDify(AiChatRequest request) throws IOException, InterruptedException
    {
        Map<String, Object> body = new HashMap<>();
        body.put("inputs", new HashMap<String, Object>());
        body.put("query", request.getQuery());
        body.put("response_mode", responseMode);
        body.put("conversation_id", emptyToNull(request.getConversationId()));
        body.put("user", StringUtils.hasText(request.getUserId()) ? request.getUserId() : defaultUser);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(normalizeApiUrl() + "/chat-messages"))
                .timeout(Duration.ofSeconds(90))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(JSON.toJSONString(body)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300)
        {
            throw new IOException("HTTP " + response.statusCode() + " " + response.body());
        }
        return JSON.parseObject(response.body());
    }

    private String normalizeApiUrl()
    {
        String value = StringUtils.hasText(apiUrl) ? apiUrl.trim() : "http://localhost/v1";
        while (value.endsWith("/"))
        {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    private String emptyToNull(String value)
    {
        return StringUtils.hasText(value) ? value : null;
    }

    private AiChatResponse mockAnswer(AiChatRequest request)
    {
        String answer = "这是本地开发模式的模拟回复。后端接口已经收到你的问题：“"
                + request.getQuery()
                + "”。下一步在 application.yml 里配置 ai.dify.api-key 后，就会转发到本地 Dify 应用。";
        return new AiChatResponse(answer, request.getConversationId(), "mock-message", "mock");
    }
}
