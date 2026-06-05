package com.ruoyi.web.controller.ai;

import com.ruoyi.common.annotation.Anonymous;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.web.controller.ai.domain.AiChatRequest;
import com.ruoyi.web.controller.ai.service.DifyChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Anonymous
@RestController
@RequestMapping("/api/ai")
public class AiChatController
{
    @Autowired
    private DifyChatService difyChatService;

    @PostMapping("/chat")
    public AjaxResult chat(@RequestBody AiChatRequest request)
    {
        if (request == null || !StringUtils.hasText(request.getQuery()))
        {
            return AjaxResult.error("Question is required");
        }
        return AjaxResult.success(difyChatService.chat(request));
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(@RequestBody AiChatRequest request)
    {
        if (request == null || !StringUtils.hasText(request.getQuery()))
        {
            throw new IllegalArgumentException("Question is required");
        }
        return difyChatService.streamChat(request);
    }
}
