/**
 * 与诗人聊天模式
 * 从诗人详情弹窗进入，与选中的诗人进行自由聊天
 * 复用创作模式的对话基础设施，移除诗作相关功能
 */
class ChatWithPoet {
    constructor() {
        this.selectedPoet = null;
        this.messages = [];
        this.isActive = false;
    }

    init() {
        // 绑定输入框回车事件
        const chatInput = document.getElementById('chatPoetInput');
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    /**
     * 开始聊天
     * @param {string} poetId - 诗人ID
     */
    async start(poetId) {
        const poet = getPoet(poetId);
        if (!poet) return;

        this.selectedPoet = poet;
        this.messages = [];
        this.isActive = true;

        // 切换到聊天页面
        navigateTo('chat-poet');

        // 设置标题
        document.getElementById('chatPoetTitle').textContent =
            `与${poet.name}聊天`;

        // 渲染诗人面板
        this.renderPanel();

        // 清空对话
        document.getElementById('chatPoetDialogue').innerHTML = '';

        // 诗人打招呼
        await this.poetGreeting();
    }

    /**
     * 渲染诗人面板
     */
    renderPanel() {
        const panel = document.getElementById('chatPoetPanel');
        const poet = this.selectedPoet;

        panel.innerHTML = `
            <div class="panel-avatar" style="background:${poet.color}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
            <div class="panel-name">${poet.name}</div>
            <div class="panel-style">${poet.style} · ${poet.styleTag}</div>
            <div class="panel-status">在线聊天中</div>
            <div style="width:100%; margin-top:8px; padding:12px; background:rgba(237,228,211,0.5); border-radius:8px;">
                <div style="font-size:0.8rem; color:var(--ink-light); margin-bottom:4px;">擅长：</div>
                ${poet.specialties.map(s => `<span style="display:inline-block; font-size:0.75rem; color:var(--celadon); background:rgba(107,142,123,0.1); padding:2px 8px; border-radius:4px; margin:2px;">${s}</span>`).join('')}
            </div>
        `;
    }

    /**
     * 诗人打招呼
     */
    async poetGreeting() {
        const poet = this.selectedPoet;

        const systemPrompt = `${poet.systemPrompt}

【场景】一位诗词爱好者慕名而来，想和你聊聊天。他可以问你关于诗歌、人生、理想、自然等任何话题。

请以${poet.name}的身份打招呼：
• 热情欢迎对方
• 简单介绍自己
• 问问对方想聊些什么
控制在60-100字。`;

        const greeting = await aiService.chat([], systemPrompt);
        this.addPoetMessage(poet, greeting);
        this.messages.push({ role: 'assistant', content: greeting });
    }

    /**
     * 发送用户消息
     */
    async sendMessage() {
        const input = document.getElementById('chatPoetInput');
        const text = input.value.trim();
        if (!text || !this.isActive) return;

        input.value = '';

        // 添加用户消息
        this.addUserMessage(text);
        this.messages.push({ role: 'user', content: text });

        // 获取诗人回复
        await this.getPoetReply(text);
    }

    /**
     * 获取诗人回复
     * @param {string} userText - 用户输入文本
     */
    async getPoetReply(userText) {
        const poet = this.selectedPoet;

        const systemPrompt = `${poet.systemPrompt}

【场景】你正在与一位诗词爱好者聊天。对方可以问你关于诗歌、人生、理想、自然等任何话题。

【对方说】"${userText}"

请以${poet.name}的身份回应：
1. 自然地回应对方的话题
2. 可以结合自己的诗歌或经历来回答
3. 语气亲切自然，像朋友聊天一样
4. 如果对方问的是诗歌相关，可以引用自己的作品
5. 控制在80-150字`;

        // 显示输入指示器
        const dialogue = document.getElementById('chatPoetDialogue');
        dialogue.insertAdjacentHTML('beforeend', createTypingHTML(poet));
        scrollToBottom(dialogue);

        const reply = await aiService.chat(
            this.messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            systemPrompt
        );

        // 移除输入指示器
        const typingEl = document.getElementById('typing-indicator');
        if (typingEl) typingEl.remove();

        this.addPoetMessage(poet, reply);
        this.messages.push({ role: 'assistant', content: reply });
    }

    /**
     * 添加诗人消息
     */
    addPoetMessage(poet, text) {
        const dialogue = document.getElementById('chatPoetDialogue');

        const messageHTML = `
            <div class="chat-message">
                <div class="msg-avatar" style="background:${poet.color}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
                <div class="msg-body">
                    <div class="msg-name">${poet.name}</div>
                    <div class="msg-text">${text}</div>
                </div>
            </div>
        `;

        dialogue.insertAdjacentHTML('beforeend', messageHTML);
        scrollToBottom(dialogue);
    }

    /**
     * 添加用户消息
     */
    addUserMessage(text) {
        const dialogue = document.getElementById('chatPoetDialogue');
        dialogue.insertAdjacentHTML('beforeend', createMessageHTML(null, text, true));
        scrollToBottom(dialogue);
    }

    /**
     * 退出聊天
     */
    exitChat() {
        this.isActive = false;
        this.selectedPoet = null;
        this.messages = [];
        navigateTo('poets');
    }
}

// 创建全局实例
const chatWithPoet = new ChatWithPoet();
