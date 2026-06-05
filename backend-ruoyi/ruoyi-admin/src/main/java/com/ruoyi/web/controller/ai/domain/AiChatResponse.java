package com.ruoyi.web.controller.ai.domain;

public class AiChatResponse
{
    private String answer;

    private String conversationId;

    private String messageId;

    private String source;

    public AiChatResponse()
    {
    }

    public AiChatResponse(String answer, String conversationId, String messageId, String source)
    {
        this.answer = answer;
        this.conversationId = conversationId;
        this.messageId = messageId;
        this.source = source;
    }

    public String getAnswer()
    {
        return answer;
    }

    public void setAnswer(String answer)
    {
        this.answer = answer;
    }

    public String getConversationId()
    {
        return conversationId;
    }

    public void setConversationId(String conversationId)
    {
        this.conversationId = conversationId;
    }

    public String getMessageId()
    {
        return messageId;
    }

    public void setMessageId(String messageId)
    {
        this.messageId = messageId;
    }

    public String getSource()
    {
        return source;
    }

    public void setSource(String source)
    {
        this.source = source;
    }
}
