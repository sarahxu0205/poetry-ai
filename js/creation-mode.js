/**
 * 创作模式
 * 
 * 功能说明：
 * - 用户选择一位诗人，进入创作对话界面
 * - 用户描述想要的场景或主题
 * - 诗人为用户生成候选诗句（用「」包裹）
 * - 用户点击"采纳"按钮选择喜欢的诗句
 * - 采纳的诗句进入"当前诗作"卡片
 * 
 * 交互流程：
 * 1. 用户输入场景描述（如"上班打工人"）→ 发送
 * 2. 诗人回复包含2-4句候选诗句（用「」包裹）
 * 3. 用户点击诗句旁的"采纳"按钮
 * 4. 采纳的诗句进入"当前诗作"卡片
 */
class CreationMode {
    constructor() {
        this.selectedPoet = null;
        this.selectedForm = '五言绝句';
        this.topic = '';
        this.messages = [];
        this.poemLines = [];       // 当前诗作的诗句列表
        this.isActive = false;
    }

    /**
     * 初始化创作设置界面
     */
    init() {
        this.initPoetSelector();
        this.initFormOptions();
        this.bindEvents();
    }

    /**
     * 初始化诗人选择器
     */
    initPoetSelector() {
        const selector = document.getElementById('creationPoetSelector');
        if (!selector) return;

        const poets = getAllPoets();
        selector.innerHTML = poets.map(poet => `
            <div class="creation-poet-card" data-poet-id="${poet.id}" onclick="creation.selectPoet('${poet.id}')">
                <div class="creation-poet-avatar" style="background:${poet.color}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
                <div class="creation-poet-info">
                    <h4>${poet.name}</h4>
                    <p>${poet.style} · ${poet.styleTag}</p>
                </div>
            </div>
        `).join('');
    }

    /**
     * 初始化体裁选项
     */
    initFormOptions() {
        const options = document.querySelector('.form-options');
        if (!options) return;

        options.querySelectorAll('.form-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                options.querySelectorAll('.form-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedForm = btn.dataset.form;
            });
        });
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        const startBtn = document.getElementById('startCreationBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startCreation());
        }

        const input = document.getElementById('creationInput');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
    }

    /**
     * 选择诗人
     */
    selectPoet(poetId) {
        this.selectedPoet = getPoet(poetId);

        document.querySelectorAll('.creation-poet-card').forEach(el => {
            el.classList.toggle('selected', el.dataset.poetId === poetId);
        });

        this.updateStartButton();
    }

    /**
     * 更新开始按钮
     */
    updateStartButton() {
        const btn = document.getElementById('startCreationBtn');
        if (btn) {
            btn.disabled = !this.selectedPoet;
        }
    }

    /**
     * 开始创作
     * 初始化创作界面，清空对话和诗作卡片
     */
    async startCreation() {
        if (!this.selectedPoet) return;

        this.topic = document.getElementById('creationTopic').value.trim();
        this.messages = [];
        this.poemLines = [];
        this.isActive = true;

        showLoading(`${this.selectedPoet.name}正在赶来...`);

        // 切换界面
        document.getElementById('creationSetup').classList.add('hidden');
        document.getElementById('creationActive').classList.remove('hidden');

        // 设置标题
        document.getElementById('creationTitle').textContent = 
            `与${this.selectedPoet.name}共品诗韵`;
        document.getElementById('creationFormTag').textContent = this.selectedForm;

        // 渲染诗人面板
        this.renderPoetPanel();

        // 清空对话和诗作卡片
        document.getElementById('creationDialogue').innerHTML = '';
        this.updatePoemCard();

        await new Promise(r => setTimeout(r, 1000));
        hideLoading();

        // 诗人打招呼
        await this.poetGreeting();
    }

    /**
     * 渲染诗人面板
     */
    renderPoetPanel() {
        const panel = document.getElementById('creationPoetPanel');
        const poet = this.selectedPoet;

        panel.innerHTML = `
            <div class="panel-avatar" style="background:${poet.color}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
            <div class="panel-name">${poet.name}</div>
            <div class="panel-style">${poet.style} · ${poet.styleTag}</div>
            <div class="panel-status">正在与你共创</div>
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
        
        // 根据是否有主题设置不同的场景描述
        let sceneText;
        if (this.topic) {
            sceneText = `【场景】你正在与一位诗歌爱好者一起创作诗歌。\n【对方想写】关于"${this.topic}"的${this.selectedForm}`;
        } else {
            sceneText = `【场景】一位诗歌爱好者来找你一起创作诗歌，但还没想好写什么主题。`;
        }

        const systemPrompt = `${poet.systemPrompt}

${sceneText}

请以${poet.name}的身份打招呼：
${this.topic ? '• 欢迎对方，询问具体想表达什么情感或场景' : '• 欢迎对方，询问想写什么主题或场景'}
• 可以简单介绍你擅长的诗歌风格
• 给出一些创作建议或启发
控制在80-120字。`;

        const greeting = await aiService.chat([], systemPrompt);
        this.addPoetMessage(poet, greeting);
        this.messages.push({ role: 'assistant', content: greeting });
    }

    /**
     * 发送用户消息
     * 用户描述场景，诗人生成候选诗句
     */
    async sendMessage() {
        const input = document.getElementById('creationInput');
        const text = input.value.trim();
        if (!text || !this.isActive) return;

        input.value = '';

        // 添加用户消息
        this.addUserMessage(text);
        this.messages.push({ role: 'user', content: text });

        // 获取诗人回复（包含候选诗句）
        await this.getPoetReply(text);
    }

    /**
     * 获取诗人回复
     * 根据用户描述的场景，诗人生成候选诗句供用户选择
     * @param {string} userText - 用户输入文本
     */
    async getPoetReply(userText) {
        const poet = this.selectedPoet;
        const currentPoem = this.poemLines.join('\n');

        // 体裁格律说明
        const formRules = {
            '五言绝句': '共4句，每句5个字',
            '七言绝句': '共4句，每句7个字',
            '五言律诗': '共8句，每句5个字',
            '七言律诗': '共8句，每句7个字',
            '自由创作': '不限句数和字数'
        };
        const formRule = formRules[this.selectedForm] || '不限';

        const systemPrompt = `${poet.systemPrompt}

【场景】你正在帮助一位诗歌爱好者创作诗歌。他会描述想要的场景或主题，你来为他创作诗句。
【体裁】${this.selectedForm}（${formRule}）
${this.topic ? `【主题】${this.topic}` : ''}
【当前诗作】
${currentPoem || '（尚未开始写）'}

【用户说】"${userText}"

请以${poet.name}的身份回应：
1. 理解用户描述的场景或主题
2. 为用户创作2-4句贴合场景的诗句，每句用「」包裹
3. 每句诗必须严格符合体裁格律要求（${formRule}）
4. 简要解释诗句的意境或用词
5. 语气亲切鼓励，像一位耐心的老师
6. 控制在100-150字

注意：必须用「」包裹每一句诗，这样用户才能选择采纳。诗句字数必须符合格律！`;

        // 显示输入指示器
        const dialogue = document.getElementById('creationDialogue');
        dialogue.insertAdjacentHTML('beforeend', createTypingHTML(poet));
        scrollToBottom(dialogue);

        const reply = await aiService.chat(
            this.messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            systemPrompt
        );

        // 移除输入指示器
        const typingEl = document.getElementById('typing-indicator');
        if (typingEl) typingEl.remove();

        // 从诗人回复中提取诗句（不自动添加，只返回列表）
        const suggestedLines = this.extractPoemFromReply(reply);

        // 添加回复（带采纳按钮）
        this.addPoetMessage(poet, reply, suggestedLines);
        this.messages.push({ role: 'assistant', content: reply });
    }

    /**
     * 从诗人回复中提取诗句（不自动添加）
     * 返回诗句列表供UI显示"采纳"按钮
     * @param {string} reply - 诗人回复文本
     * @returns {string[]} 提取的诗句列表
     */
    extractPoemFromReply(reply) {
        const allLines = [];

        // 提取「」包裹的诗句
        const bracketMatches = reply.match(/「([^」]+)」/g);
        if (bracketMatches) {
            bracketMatches
                .map(m => m.replace(/[「」]/g, '').trim())
                .filter(l => l.length >= 2 && l.length <= 30)
                .forEach(l => allLines.push(l));
        }

        // 如果没提取到，尝试提取""包裹的诗句（至少5个字）
        if (allLines.length === 0) {
            const quoteMatches = reply.match(/"([^"]{5,})"/g);
            if (quoteMatches) {
                quoteMatches
                    .map(m => m.replace(/"/g, '').trim())
                    .filter(l => l.length >= 5 && l.length <= 30)
                    .forEach(l => allLines.push(l));
            }
        }

        // 如果还没提取到，尝试按换行提取类似诗句的行（5-20字，含标点）
        if (allLines.length === 0) {
            const lines = reply.split('\n');
            lines.forEach(line => {
                const trimmed = line.trim().replace(/^[\d、.]+\s*/, ''); // 去掉序号
                if (trimmed.length >= 5 && trimmed.length <= 30) {
                    // 简单判断是否像诗句：包含中文且有韵律感
                    const chineseChars = trimmed.replace(/[，。？！、；：""''（）《》\s]/g, '');
                    if (chineseChars.length >= 4 && chineseChars.length <= 20) {
                        allLines.push(trimmed);
                    }
                }
            });
        }

        return allLines;
    }

    /**
     * 添加诗句到诗作卡片
     * @param {string[]} lines - 诗句数组
     */
    addPoemLines(lines) {
        this.poemLines.push(...lines);
        this.updatePoemCard();
    }

    /**
     * 采纳诗人建议的诗句
     * @param {string} line - 诗句
     */
    adoptPoemLine(line) {
        // 检查是否已存在
        if (!this.poemLines.includes(line)) {
            this.poemLines.push(line);
            this.updatePoemCard();
        }
    }

    /**
     * 更新诗作卡片显示
     * 根据当前诗句列表更新卡片内容，有诗句时显示内容，无诗句时显示空状态提示
     */
    updatePoemCard() {
        const emptyEl = document.getElementById('poemCardEmpty');
        const contentEl = document.getElementById('poemCardContent');
        const copyBtn = document.getElementById('poemCopyBtn');
        const endBtn = document.getElementById('poemEndBtn');

        if (this.poemLines.length === 0) {
            emptyEl.classList.remove('hidden');
            contentEl.classList.add('hidden');
            if (copyBtn) copyBtn.style.display = 'none';
            if (endBtn) endBtn.style.display = '';
        } else {
            emptyEl.classList.add('hidden');
            contentEl.classList.remove('hidden');
            if (copyBtn) copyBtn.style.display = '';
            if (endBtn) endBtn.style.display = '';
            // 只显示最新添加的诗句（带动画），其余正常显示
            const allLines = this.poemLines;
            const newLinesCount = arguments[0] || 0;
            let html = '';
            allLines.forEach((line, i) => {
                const isNew = i >= allLines.length - (newLinesCount || allLines.length);
                html += `<span class="poem-line ${isNew ? 'poem-line-new' : ''}">${line}</span>`;
            });
            contentEl.innerHTML = html;
        }
    }

    /**
     * 复制当前诗作到剪贴板
     */
    copyPoem() {
        const text = this.poemLines.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('poemCopyBtn');
            const originalText = btn.textContent;
            btn.textContent = '✅ 已复制';
            setTimeout(() => { btn.textContent = originalText; }, 1500);
        }).catch(() => {
            // fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            const btn = document.getElementById('poemCopyBtn');
            const originalText = btn.textContent;
            btn.textContent = '✅ 已复制';
            setTimeout(() => { btn.textContent = originalText; }, 1500);
        });
    }

    /**
     * 添加诗人消息
     * @param {Object} poet - 诗人对象
     * @param {string} text - 消息文本
     * @param {string[]} suggestedLines - 建议采纳的诗句列表
     */
    addPoetMessage(poet, text, suggestedLines = []) {
        const dialogue = document.getElementById('creationDialogue');
        
        // 构建采纳按钮HTML
        let adoptHTML = '';
        if (suggestedLines.length > 0) {
            adoptHTML = suggestedLines.map(line => 
                `<div class="adopt-line">
                    <span class="adopt-line-text">「${line}」</span>
                    <button class="adopt-btn" onclick="creation.adoptPoemLine('${line.replace(/'/g, "\\'")}')">采纳</button>
                </div>`
            ).join('');
        }
        
        // 直接构建HTML，不使用 createMessageHTML（避免 formatPoemText 干扰）
        const messageHTML = `
            <div class="chat-message">
                <div class="msg-avatar" style="background:${poet.color}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
                <div class="msg-body">
                    <div class="msg-name">${poet.name}</div>
                    <div class="msg-text">${text}${adoptHTML}</div>
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
        const dialogue = document.getElementById('creationDialogue');
        dialogue.insertAdjacentHTML('beforeend', createMessageHTML(null, text, true));
        scrollToBottom(dialogue);
    }

    /**
     * 退出创作
     */
    /**
     * 结束创作
     * 显示确认弹窗，确认后退出创作模式
     */
    endCreation() {
        const poemText = this.poemLines.join('\n');
        const confirmed = confirm(
            poemText 
                ? '你的诗作已完成！\n\n' + poemText + '\n\n确认结束创作吗？' 
                : '你还没有采纳任何诗句，确认要结束创作吗？'
        );
        if (confirmed) {
            // 保存诗作到 localStorage
            if (this.poemLines.length > 0) {
                this.savePoem();
            }
            this.exitCreation();
        }
    }

    /**
     * 保存诗作到 localStorage
     */
    savePoem() {
        const poems = JSON.parse(localStorage.getItem('myPoems') || '[]');
        poems.unshift({
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            poetName: this.selectedPoet.name,
            poetAvatar: this.selectedPoet.avatar,
            poetColor: this.selectedPoet.color,
            form: this.selectedForm,
            topic: this.topic || '自由创作',
            lines: [...this.poemLines],
            createdAt: new Date().toLocaleString('zh-CN')
        });
        localStorage.setItem('myPoems', JSON.stringify(poems));
        showToast('诗作已保存到"我的创作"');
    }

    /**
     * 退出创作模式
     */
    exitCreation() {
        this.isActive = false;
        
        document.getElementById('creationSetup').classList.remove('hidden');
        document.getElementById('creationActive').classList.add('hidden');
    }
}

// 全局创作模式实例
const creation = new CreationMode();
