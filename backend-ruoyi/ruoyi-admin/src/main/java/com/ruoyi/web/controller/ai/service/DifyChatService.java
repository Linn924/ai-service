package com.ruoyi.web.controller.ai.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.ruoyi.web.controller.ai.domain.AiChatRequest;
import com.ruoyi.web.controller.ai.domain.AiChatResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

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
            throw new RuntimeException("Failed to call Dify: " + e.getMessage(), e);
        }
        catch (InterruptedException e)
        {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Dify request interrupted", e);
        }
    }

    public SseEmitter streamChat(AiChatRequest request)
    {
        SseEmitter emitter = new SseEmitter(0L);
        CompletableFuture.runAsync(() -> doStreamChat(request, emitter));
        return emitter;
    }

    private JSONObject sendToDify(AiChatRequest request) throws IOException, InterruptedException
    {
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(normalizeApiUrl() + "/chat-messages"))
                .timeout(Duration.ofSeconds(90))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(JSON.toJSONString(buildRequestBody(request, responseMode))))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300)
        {
            throw new IOException("HTTP " + response.statusCode() + " " + response.body());
        }
        return JSON.parseObject(response.body());
    }

    private void doStreamChat(AiChatRequest request, SseEmitter emitter)
    {
        if (!StringUtils.hasText(apiKey) || apiKey.contains("replace-with"))
        {
            streamMockAnswer(request, emitter);
            return;
        }

        try
        {
            HttpURLConnection connection = openStreamConnection(request);
            int statusCode = connection.getResponseCode();
            InputStream stream = statusCode >= 200 && statusCode < 300
                    ? connection.getInputStream()
                    : connection.getErrorStream();
            if (statusCode < 200 || statusCode >= 300)
            {
                String body = stream == null ? "" : new String(stream.readAllBytes(), StandardCharsets.UTF_8);
                throw new IOException("HTTP " + statusCode + " " + body);
            }

            try (InputStream inputStream = stream)
            {
                streamDifyResponse(inputStream, emitter);
            }
            finally
            {
                connection.disconnect();
            }
        }
        catch (Exception e)
        {
            emit(emitter, payload("error").with("message", "Failed to call Dify: " + e.getMessage()).toMap());
            emitter.complete();
        }
    }

    private HttpURLConnection openStreamConnection(AiChatRequest request) throws IOException
    {
        URL url = new URL(normalizeApiUrl() + "/chat-messages");
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(0);
        connection.setDoOutput(true);
        connection.setRequestProperty("Authorization", "Bearer " + apiKey);
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setRequestProperty("Accept", "text/event-stream");

        byte[] bytes = JSON.toJSONString(buildRequestBody(request, "streaming")).getBytes(StandardCharsets.UTF_8);
        try (OutputStream outputStream = connection.getOutputStream())
        {
            outputStream.write(bytes);
            outputStream.flush();
        }

        return connection;
    }

    private void streamDifyResponse(InputStream stream, SseEmitter emitter) throws IOException
    {
        Map<String, Object> state = new ConcurrentHashMap<>();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8)))
        {
            String line;
            List<String> eventLines = new ArrayList<>();
            while ((line = reader.readLine()) != null)
            {
                if (!StringUtils.hasText(line))
                {
                    forwardEventBlock(eventLines, state, emitter);
                    eventLines.clear();
                    continue;
                }

                eventLines.add(line);
            }

            forwardEventBlock(eventLines, state, emitter);
        }

        emit(emitter, payload("done")
                .with("conversationId", state.get("conversationId"))
                .with("messageId", state.get("messageId"))
                .with("taskId", state.get("taskId"))
                .with("source", "dify")
                .toMap());
        emitter.complete();
    }

    private void forwardEventBlock(List<String> eventLines, Map<String, Object> state, SseEmitter emitter)
    {
        if (eventLines.isEmpty())
        {
            return;
        }

        String content = extractDataBlock(eventLines);
        if (!StringUtils.hasText(content))
        {
            return;
        }

        JSONObject json = JSON.parseObject(content);
        String event = json.getString("event");
        if (!StringUtils.hasText(event))
        {
            return;
        }

        cacheMeta(json, state);

        if ("message".equals(event) || "agent_message".equals(event))
        {
            String delta = json.getString("answer");
            if (StringUtils.hasText(delta))
            {
                emit(emitter, payload("delta")
                        .with("delta", delta)
                        .with("conversationId", state.get("conversationId"))
                        .with("messageId", state.get("messageId"))
                        .with("taskId", state.get("taskId"))
                        .with("source", "dify")
                        .toMap());
            }
            return;
        }

        if ("error".equals(event))
        {
            emit(emitter, payload("error")
                    .with("message", json.getString("message"))
                    .with("source", "dify")
                    .toMap());
        }
    }

    private String extractDataBlock(List<String> eventLines)
    {
        StringBuilder builder = new StringBuilder();
        for (String eventLine : eventLines)
        {
            if (!eventLine.startsWith("data:"))
            {
                continue;
            }

            if (!builder.isEmpty())
            {
                builder.append('\n');
            }
            builder.append(eventLine.substring(5).trim());
        }
        return builder.toString();
    }

    private void cacheMeta(JSONObject json, Map<String, Object> state)
    {
        if (StringUtils.hasText(json.getString("conversation_id")))
        {
            state.put("conversationId", json.getString("conversation_id"));
        }
        if (StringUtils.hasText(json.getString("message_id")))
        {
            state.put("messageId", json.getString("message_id"));
        }
        if (StringUtils.hasText(json.getString("task_id")))
        {
            state.put("taskId", json.getString("task_id"));
        }
    }

    private Map<String, Object> buildRequestBody(AiChatRequest request, String currentResponseMode)
    {
        Map<String, Object> body = new HashMap<>();
        body.put("inputs", new HashMap<String, Object>());
        body.put("query", request.getQuery());
        body.put("response_mode", currentResponseMode);
        body.put("conversation_id", emptyToNull(request.getConversationId()));
        body.put("user", StringUtils.hasText(request.getUserId()) ? request.getUserId() : defaultUser);
        return body;
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

    private void streamMockAnswer(AiChatRequest request, SseEmitter emitter)
    {
        try
        {
            String answer = mockAnswer(request).getAnswer();
            for (int i = 0; i < answer.length(); i++)
            {
                emit(emitter, payload("delta")
                        .with("delta", String.valueOf(answer.charAt(i)))
                        .with("conversationId", request.getConversationId())
                        .with("messageId", "mock-message")
                        .with("source", "mock")
                        .toMap());
                Thread.sleep(24L);
            }

            emit(emitter, payload("done")
                    .with("conversationId", request.getConversationId())
                    .with("messageId", "mock-message")
                    .with("source", "mock")
                    .toMap());
            emitter.complete();
        }
        catch (Exception e)
        {
            emit(emitter, payload("error").with("message", e.getMessage()).toMap());
            emitter.complete();
        }
    }

    private void emit(SseEmitter emitter, Map<String, Object> payload)
    {
        try
        {
            emitter.send(SseEmitter.event().data(JSON.toJSONString(payload)));
        }
        catch (IOException e)
        {
            throw new RuntimeException(e);
        }
    }

    private PayloadBuilder payload(String type)
    {
        return new PayloadBuilder(type);
    }

    private AiChatResponse mockAnswer(AiChatRequest request)
    {
        String answer = "This is a local mock reply. The backend has received your question: \""
                + request.getQuery()
                + "\". Configure ai.dify.api-key to forward the request to Dify.";
        return new AiChatResponse(answer, request.getConversationId(), "mock-message", "mock");
    }

    private static class PayloadBuilder
    {
        private final Map<String, Object> payload = new LinkedHashMap<>();

        private PayloadBuilder(String type)
        {
            payload.put("type", type);
        }

        private PayloadBuilder with(String key, Object value)
        {
            if (value != null)
            {
                payload.put(key, value);
            }
            return this;
        }

        private Map<String, Object> toMap()
        {
            return payload;
        }
    }
}
