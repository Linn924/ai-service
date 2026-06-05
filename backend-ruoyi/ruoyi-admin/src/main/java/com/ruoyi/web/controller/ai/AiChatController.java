package com.ruoyi.web.controller.ai;

import com.ruoyi.common.annotation.Anonymous;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.web.controller.ai.domain.AiChatRequest;
import com.ruoyi.web.controller.ai.service.DifyChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
            return AjaxResult.error("问题不能为空");
        }
        return AjaxResult.success(difyChatService.chat(request));
    }
}
