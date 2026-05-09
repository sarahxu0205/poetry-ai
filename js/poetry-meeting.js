/**
 * 诗会模式
 */
class PoetryMeeting {
    constructor() {
        this.selectedPoem = null;
        this.selectedPoets = [];
        this.selectedTopic = '综合赏析';
        this.meetingMessages = [];
        this.isRunning = false;
        this.isPaused = false;
        this.currentSpeakerIndex = 0;
        this.speakTimer = null;
        this.speakGeneration = 0; // 用于防止竞态条件
    }

    /**
     * 初始化诗会设置界面
     */
    init() {
        this.initPoemSelector();
        this.initPoetSelector();
        this.initTopicOptions();
        this.bindEvents();
    }

    /**
     * 初始化诗词选择器
     */
    initPoemSelector() {
        const selector = document.getElementById('poemSelector');
        if (!selector) return;

        const poems = getAllPoems();
        selector.innerHTML = poems.map(poem => `
            <div class="poem-option" data-poem-id="${poem.id}" onclick="meeting.selectPoem('${poem.id}')">
                <div class="poem-title-text">《${poem.title}》</div>
                <div class="poem-author-text">${poem.dynasty} · ${poem.author}</div>
                <div class="poem-preview">${poem.fullText.split('\n').slice(0, 2).join(' / ')}</div>
            </div>
        `).join('');
    }

    /**
     * 初始化诗人选择器
     */
    initPoetSelector() {
        const selector = document.getElementById('poetSelector');
        if (!selector) return;

        const poets = getAllPoets();
        selector.innerHTML = poets.map(poet => `
            <div class="poet-select-card" data-poet-id="${poet.id}" onclick="meeting.togglePoet('${poet.id}')">
                <div class="poet-select-avatar" style="background:${poet.color}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
                <span class="poet-select-name">${poet.name}</span>
            </div>
        `).join('');
    }

    /**
     * 初始化主题选项
     */
    initTopicOptions() {
        const options = document.getElementById('topicOptions');
        if (!options) return;

        options.querySelectorAll('.topic-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                options.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTopic = btn.dataset.topic;
            });
        });
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        const startBtn = document.getElementById('startMeetingBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startMeeting());
        }

        const input = document.getElementById('meetingInput');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.sendUserMessage();
                }
            });
        }
    }

    /**
     * 选择诗词
     */
    selectPoem(poemId) {
        this.selectedPoem = getPoem(poemId);
        
        document.querySelectorAll('.poem-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.poemId === poemId);
        });

        this.updateStartButton();
    }

    /**
     * 切换诗人选择
     */
    togglePoet(poetId) {
        const index = this.selectedPoets.indexOf(poetId);
        if (index > -1) {
            this.selectedPoets.splice(index, 1);
        } else {
            if (this.selectedPoets.length >= 4) {
                showToast('最多选择4位诗人', 'error');
                return;
            }
            this.selectedPoets.push(poetId);
        }

        document.querySelectorAll('.poet-select-card').forEach(el => {
            el.classList.toggle('selected', this.selectedPoets.includes(el.dataset.poetId));
        });

        this.updateStartButton();
    }

    /**
     * 更新开始按钮状态
     */
    updateStartButton() {
        const btn = document.getElementById('startMeetingBtn');
        if (btn) {
            btn.disabled = !(this.selectedPoem && this.selectedPoets.length >= 2);
        }
    }

    /**
     * 开始诗会
     */
    async startMeeting() {
        if (!this.selectedPoem || this.selectedPoets.length < 2) return;

        showLoading('诗人们正在赶来...');

        // 切换界面
        document.getElementById('meetingSetup').classList.add('hidden');
        document.getElementById('meetingActive').classList.remove('hidden');

        // 设置标题
        document.getElementById('meetingPoemTitle').textContent = 
            `《${this.selectedPoem.title}》· ${this.selectedPoem.author}`;

        // 渲染座位
        this.renderSeats();

        // 初始化对话
        this.meetingMessages = [];
        document.getElementById('meetingChat').innerHTML = '';

        // 构建系统提示词
        this.buildSystemPrompt();

        await new Promise(r => setTimeout(r, 1000));
        hideLoading();

        // 开始诗会对话
        this.isRunning = true;
        this.isPaused = false;
        this.currentSpeakerIndex = 0;

        // 主持人开场
        this.addSystemMessage(`🏮 诗会开始！今日讨论：《${this.selectedPoem.title}》\n${this.selectedPoem.fullText.split('\n').slice(0, 4).join('\n')}...`);
        
        // 等待一下再开始诗会循环
        await this.delay(1500);
        this.runMeetingLoop();
    }

    /**
     * 渲染座位
     */
    renderSeats() {
        const seats = document.getElementById('meetingSeats');
        const poets = this.selectedPoets.map(id => getPoet(id));
        
        seats.innerHTML = poets.map(poet => `
            <div class="meeting-seat" id="seat-${poet.id}">
                <div class="seat-avatar" style="background:${poet.color}" id="avatar-${poet.id}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
                <div class="seat-name">${poet.name}</div>
            </div>
        `).join('');
    }

    /**
     * 构建诗会系统提示词
     */
    buildSystemPrompt() {
        const poets = this.selectedPoets.map(id => getPoet(id));
        const poem = this.selectedPoem;

        this.systemPrompt = `你正在参与一场唐代诗会。场景：几位唐代诗人围坐在一起，讨论一首唐诗。

【讨论诗词】
《${poem.title}》 ${poem.author}
${poem.fullText}

【讨论主题】${this.selectedTopic}

【参与诗人】
${poets.map(p => `- ${p.name}（${p.styleTag}，${p.style}）`).join('\n')}

【规则】
1. 你现在是${poets[0].name}，请以他的身份和风格发言
2. 围绕《${poem.title}》展开讨论，主题是"${this.selectedTopic}"
3. 可以评论诗歌的意境、用词、结构、情感等方面
4. 可以引用自己或其他诗人的作品来佐证观点
5. 可以对其他诗人的观点表示赞同或提出不同看法
6. 语言要生动自然，像真正的诗人在交流
7. 每次发言控制在80-150字
8. 偶尔使用"「」"来引用诗句

请开始你的发言。`;
    }

    /**
     * 辅助函数：延迟
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 诗会主循环 - 改为回合制
     * 开场讨论：每位诗人发言1轮后停止，等待用户参与
     */
    async runMeetingLoop() {
        // 开场讨论：每位诗人发言1次
        for (let round = 0; round < 1; round++) {
            for (let i = 0; i < this.selectedPoets.length; i++) {
                if (!this.isRunning) return;
                this.currentSpeakerIndex = i;
                await this.nextSpeaker();
                if (this.isRunning) {
                    await this.delay(1000 + Math.random() * 1000);
                }
            }
        }

        // 开场结束，提示用户
        if (this.isRunning) {
            this.addSystemMessage('💬 诗人们的开场讨论结束了，你想说些什么？或者点击"继续讨论"听他们聊。');
            this.updateStatus('idle');
        }
    }

    /**
     * 继续讨论 - 诗人再聊一轮
     */
    async continueDiscussion() {
        if (!this.isRunning) return;
        this.updateStatus('discussing');
        this.addSystemMessage('🏮 诗人们继续讨论...');

        for (let i = 0; i < this.selectedPoets.length; i++) {
            if (!this.isRunning) return;
            this.currentSpeakerIndex = i;
            await this.nextSpeaker();
            if (this.isRunning) {
                await this.delay(1000 + Math.random() * 1000);
            }
        }

        if (this.isRunning) {
            this.addSystemMessage('💬 讨论暂歇，你想说些什么？');
            this.updateStatus('idle');
        }
    }

    /**
     * 更新讨论状态显示
     */
    updateStatus(status) {
        const statusEl = document.getElementById('meetingStatus');
        const continueBtn = document.getElementById('continueBtn');
        if (!statusEl) return;

        if (status === 'discussing') {
            statusEl.textContent = '🏮 讨论中...';
            if (continueBtn) continueBtn.disabled = true;
        } else {
            statusEl.textContent = '💬 等待你的发言';
            if (continueBtn) continueBtn.disabled = false;
        }
    }

    /**
     * 下一位诗人发言（单次发言）
     */
    async nextSpeaker() {
        if (!this.isRunning || this.isPaused) return;

        const poetId = this.selectedPoets[this.currentSpeakerIndex];
        const poet = getPoet(poetId);

        // 高亮当前发言者
        this.highlightSpeaker(poetId);

        // 显示输入指示器
        const chat = document.getElementById('meetingChat');
        chat.insertAdjacentHTML('beforeend', createTypingHTML(poet));
        scrollToBottom(chat);

        // 更新系统提示词为当前诗人
        const currentPoet = getPoet(poetId);
        const poets = this.selectedPoets.map(id => getPoet(id));
        const poem = this.selectedPoem;

        const systemPrompt = `你正在参与一场唐代诗会，与${poets.filter(p => p.id !== poetId).map(p => p.name).join('、')}一起讨论诗歌。

【你】${currentPoet.name}（${currentPoet.styleTag}，${currentPoet.style}）
${currentPoet.systemPrompt}

【当前讨论】
诗词：《${poem.title}》${poem.author}
${poem.fullText}
主题：${this.selectedTopic}

【之前的讨论】
${this.meetingMessages.slice(-6).map(m => `${m.name || '你'}：${m.content}`).join('\n')}

请以${currentPoet.name}的身份继续讨论，回应之前的话题或提出新的观点。控制在80-150字。`;

        // 获取AI回复
        const reply = await aiService.chat(
            this.meetingMessages.slice(-6).map(m => ({ role: m.role, content: m.content })),
            systemPrompt
        );

        // 移除输入指示器
        const typingEl = document.getElementById('typing-indicator');
        if (typingEl) typingEl.remove();

        // 添加消息
        this.addPoetMessage(poet, reply);

        // 取消高亮
        this.unhighlightSpeaker(poetId);

        // 记录消息
        this.meetingMessages.push({
            role: 'assistant',
            content: reply,
            name: poet.name,
            poetId: poet.id
        });

        // 更新到下一位诗人
        this.currentSpeakerIndex = (this.currentSpeakerIndex + 1) % this.selectedPoets.length;
    }

    /**
     * 高亮发言者
     */
    highlightSpeaker(poetId) {
        const avatar = document.getElementById(`avatar-${poetId}`);
        if (avatar) {
            avatar.classList.add('speaking');
        }
    }

    /**
     * 取消高亮
     */
    unhighlightSpeaker(poetId) {
        const avatar = document.getElementById(`avatar-${poetId}`);
        if (avatar) {
            avatar.classList.remove('speaking');
        }
    }

    /**
     * 添加诗人消息
     */
    addPoetMessage(poet, text) {
        const chat = document.getElementById('meetingChat');
        chat.insertAdjacentHTML('beforeend', createMessageHTML(poet, text));
        scrollToBottom(chat);
    }

    /**
     * 添加系统消息
     */
    addSystemMessage(text) {
        const chat = document.getElementById('meetingChat');
        chat.insertAdjacentHTML('beforeend', `
            <div class="chat-message" style="justify-content: center;">
                <div class="msg-body" style="background: rgba(201,169,110,0.1); border-color: rgba(201,169,110,0.3); text-align: center;">
                    <div class="msg-text" style="color: var(--ink-medium); font-size: 0.85rem; white-space: pre-line;">${text}</div>
                </div>
            </div>
        `);
        scrollToBottom(chat);
    }

    /**
     * 发送用户消息 - 所有诗人依次回应
     */
    async sendUserMessage() {
        const input = document.getElementById('meetingInput');
        const text = input.value.trim();
        if (!text || !this.isRunning) return;

        input.value = '';

        // 添加用户消息
        const chat = document.getElementById('meetingChat');
        chat.insertAdjacentHTML('beforeend', createMessageHTML(null, text, true));
        scrollToBottom(chat);

        // 记录消息
        this.meetingMessages.push({
            role: 'user',
            content: text,
            name: '你'
        });

        // 所有诗人依次回应
        this.updateStatus('discussing');

        for (let i = 0; i < this.selectedPoets.length; i++) {
            if (!this.isRunning) return;
            const poetId = this.selectedPoets[i];
            const poet = getPoet(poetId);

            this.highlightSpeaker(poetId);
            chat.insertAdjacentHTML('beforeend', createTypingHTML(poet));
            scrollToBottom(chat);

            const currentPoet = getPoet(poetId);
            const poets = this.selectedPoets.map(id => getPoet(id));
            const poem = this.selectedPoem;

            const systemPrompt = `你正在参与一场唐代诗会。

【你】${currentPoet.name}（${currentPoet.styleTag}，${currentPoet.style}）
${currentPoet.systemPrompt}

【讨论诗词】《${poem.title}》${poem.author}
主题：${this.selectedTopic}

【对话者说】"${text}"

【之前的讨论】
${this.meetingMessages.slice(-8).map(m => `${m.name || '你'}：${m.content}`).join('\n')}

请以${currentPoet.name}的身份回应对话者的话，结合正在讨论的诗歌，表达你的独特见解。控制在60-120字。`;

            const reply = await aiService.chat(
                this.meetingMessages.slice(-8).map(m => ({ role: m.role, content: m.content })),
                systemPrompt
            );

            const typingEl = document.getElementById('typing-indicator');
            if (typingEl) typingEl.remove();

            this.addPoetMessage(poet, reply);
            this.unhighlightSpeaker(poetId);

            this.meetingMessages.push({
                role: 'assistant',
                content: reply,
                name: poet.name,
                poetId: poet.id
            });

            if (this.isRunning && i < this.selectedPoets.length - 1) {
                await this.delay(800 + Math.random() * 800);
            }
        }

        if (this.isRunning) {
            this.updateStatus('idle');
        }
    }

    /**
     * 退出诗会
     */
    exitMeeting() {
        this.isRunning = false;
        this.isPaused = false;

        document.getElementById('meetingSetup').classList.remove('hidden');
        document.getElementById('meetingActive').classList.add('hidden');
    }
}

// 全局诗会实例
const meeting = new PoetryMeeting();
