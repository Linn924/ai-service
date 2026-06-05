package com.ruoyi.web.controller.ai;

import com.ruoyi.common.annotation.Anonymous;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.web.controller.ai.domain.DevLoginRequest;
import java.util.HashMap;
import java.util.Map;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Anonymous
@RestController
@RequestMapping("/api/auth")
public class DevLoginController
{
    @PostMapping("/login")
    public AjaxResult login(@RequestBody DevLoginRequest request)
    {
        String username = request == null ? "" : request.getUsername();
        if (!StringUtils.hasText(username))
        {
            username = "dev-user";
        }

        Map<String, Object> data = new HashMap<>();
        data.put("token", "dev-token-" + System.currentTimeMillis());
        data.put("username", username);
        data.put("displayName", "本地开发用户");
        return AjaxResult.success(data);
    }
}
