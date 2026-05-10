/**
 * UI 工具函数
 */

/**
 * 显示Toast通知
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * 页面导航
 */
function navigateTo(pageId) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 进入"我的创作"时渲染列表
    if (pageId === 'my-works') {
        renderMyWorks();
    }
    
    // 更新导航按钮状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.page === pageId) {
            btn.classList.add('active');
        }
    });

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 打开弹窗
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * 关闭弹窗
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * 显示加载遮罩
 */
function showLoading(text = '研墨提笔中...') {
    const overlay = document.getElementById('loadingOverlay');
    overlay.querySelector('.loading-text').textContent = text;
    overlay.classList.add('active');
}

/**
 * 隐藏加载遮罩
 */
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('active');
}

/**
 * 创建诗人头像HTML
 */
function createAvatarHTML(poet, size = 'normal') {
    const sizeClass = size === 'small' ? 'width:32px;height:32px;font-size:0.8rem' : 
                       size === 'large' ? 'width:72px;height:72px;font-size:1.8rem' : 
                       'width:48px;height:48px;font-size:1.1rem';
    return `<div class="poet-avatar" style="background:${poet.color};${sizeClass}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>`;
}

/**
 * 创建对话消息HTML
 */
function createMessageHTML(poet, text, isSelf = false) {
    if (isSelf) {
        return `
            <div class="chat-message self">
                <div class="msg-body">
                    <div class="msg-text">${formatPoemText(text)}</div>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="chat-message">
            <div class="msg-avatar" style="background:${poet.color}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
            <div class="msg-body">
                <div class="msg-name">${poet.name}</div>
                <div class="msg-text">${formatPoemText(text)}</div>
            </div>
        </div>
    `;
}

/**
 * 创建正在输入的指示器
 */
function createTypingHTML(poet) {
    return `
        <div class="chat-message" id="typing-indicator">
            <div class="msg-avatar" style="background:${poet.color}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
            <div class="msg-body">
                <div class="msg-name">${poet.name}</div>
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        </div>
    `;
}

/**
 * 格式化诗歌文本（将诗句用特殊样式包裹）
 */
function formatPoemText(text) {
    // 检测是否包含诗句（被「」包裹的文本）
    text = text.replace(/「([^」]+)」/g, '<b>$1</b>');
    return text;
}

/**
 * 初始化浮动粒子
 */
function initParticles() {
    const container = document.getElementById('particles');
    const count = 15;
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (15 + Math.random() * 20) + 's';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.width = (2 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;
        particle.style.opacity = 0.2 + Math.random() * 0.4;
        container.appendChild(particle);
    }
}

/**
 * 虚拟滚动配置
 */
const VIRTUAL_SCROLL_CONFIG = {
    itemHeight: 220,      // 每个卡片高度（包含间距）
    bufferSize: 2,        // 上下缓冲数量
    containerId: 'poetsCarousel'
};

/**
 * 生成诗人卡片HTML
 */
function createPoetCardHTML(poet) {
    return `
        <div class="poet-card" onclick="showPoetDetail('${poet.id}')">
            <div class="poet-avatar" style="background:${poet.color}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
            <h4>${poet.name}</h4>
            <div class="poet-dynasty">${poet.dynasty} · ${poet.styleTag}</div>
            <div class="poet-style">${poet.style}</div>
        </div>
    `;
}

/**
 * 初始化虚拟滚动
 */
function initVirtualScroll(container, poets) {
    const totalHeight = poets.length * VIRTUAL_SCROLL_CONFIG.itemHeight;
    container.style.height = '400px';
    container.style.overflowY = 'auto';
    container.style.position = 'relative';
    container.innerHTML = `<div class="virtual-scroll-content" style="height: ${totalHeight}px; position: relative;"></div>`;

    const contentEl = container.querySelector('.virtual-scroll-content');
    let renderedItems = new Map(); // 缓存已渲染的项

    function updateVisibleItems() {
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;

        const startIndex = Math.max(0, Math.floor(scrollTop / VIRTUAL_SCROLL_CONFIG.itemHeight) - VIRTUAL_SCROLL_CONFIG.bufferSize);
        const endIndex = Math.min(poets.length, Math.ceil((scrollTop + containerHeight) / VIRTUAL_SCROLL_CONFIG.itemHeight) + VIRTUAL_SCROLL_CONFIG.bufferSize);

        // 清理不在可视区域的项
        renderedItems.forEach((el, index) => {
            if (index < startIndex || index >= endIndex) {
                el.remove();
                renderedItems.delete(index);
            }
        });

        // 渲染新的可视项
        for (let i = startIndex; i < endIndex; i++) {
            if (!renderedItems.has(i)) {
                const poet = poets[i];
                const el = document.createElement('div');
                el.className = 'virtual-item';
                el.style.cssText = `position: absolute; top: ${i * VIRTUAL_SCROLL_CONFIG.itemHeight}px; left: 0; right: 0; padding: 0 12px; box-sizing: border-box;`;
                el.innerHTML = createPoetCardHTML(poet);
                contentEl.appendChild(el);
                renderedItems.set(i, el);
            }
        }
    }

    // 使用 requestAnimationFrame 优化滚动性能
    let ticking = false;
    container.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateVisibleItems();
                ticking = false;
            });
            ticking = true;
        }
    });

    // 初始渲染
    updateVisibleItems();

    // 返回清理函数
    return () => {
        container.removeEventListener('scroll', updateVisibleItems);
    };
}

/**
 * 初始化首页诗人轮播
 */
function initPoetsCarousel() {
    const carousel = document.getElementById(VIRTUAL_SCROLL_CONFIG.containerId);
    if (!carousel) return;

    const poets = getAllPoets();

    // 检测是否为移动端
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        // 移动端：改为纵向grid布局，不用虚拟滚动
        carousel.style.display = 'grid';
        carousel.style.gridTemplateColumns = 'repeat(2, 1fr)';
        carousel.style.gap = '12px';
        carousel.style.padding = '0';
        carousel.style.overflowX = 'visible';
        carousel.innerHTML = poets.map(poet => createPoetCardHTML(poet)).join('');
    } else {
        // 桌面端：横向轮播
        carousel.innerHTML = poets.map(poet => createPoetCardHTML(poet)).join('');
    }
}

/**
 * 初始化诗人详情页
 */
function initPoetsPage() {
    const grid = document.getElementById('poetsGrid');
    if (!grid) return;
    
    const poets = getAllPoets();
    grid.innerHTML = poets.map(poet => `
        <div class="poet-card" onclick="showPoetDetail('${poet.id}')">
            <div class="poet-avatar" style="background:${poet.color}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
            <h4>${poet.name}</h4>
            <div class="poet-dynasty">${poet.dynasty} · ${poet.era}</div>
            <div class="poet-style">${poet.style} · ${poet.styleTag}</div>
            <div class="poet-bio">${poet.bio.substring(0, 80)}...</div>
            <div class="poet-works">
                <h5>代表作品：</h5>
                ${poet.famousWorks.slice(0, 3).map(w => `<span>《${w.title}》</span>`).join('')}
            </div>
        </div>
    `).join('');
}

/**
 * 显示诗人详情
 */
function showPoetDetail(poetId) {
    const poet = getPoet(poetId);
    if (!poet) return;
    
    const detail = document.getElementById('poetDetail');
    detail.innerHTML = `
        <div class="detail-avatar" style="background:${poet.color}"><img src="${poet.avatar}" alt="${poet.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>
        <h2 class="detail-name">${poet.name}</h2>
        <p class="detail-dynasty">${poet.dynasty} · ${poet.era} · 字${poet.courtesyName}</p>
        <p class="detail-style">${poet.style} · "${poet.styleTag}"</p>
        <div class="detail-bio">${poet.bio}</div>
        <div class="detail-works">
            <h4>代表作品</h4>
            ${poet.famousWorks.map(w => `
                <div class="detail-work-item">
                    <div class="work-title">《${w.title}》</div>
                    <div class="work-preview">${w.preview}</div>
                </div>
            `).join('')}
        </div>
        <div class="detail-actions" style="text-align:center; padding:var(--space-md) 0;">
            <button class="btn btn-primary" onclick="startChatWithPoet('${poet.id}')">💬 与${poet.name}聊天</button>
        </div>
    `;
    
    // 重置弹窗滚动位置
    const modalContent = document.querySelector('#poetModal .modal-content');
    if (modalContent) modalContent.scrollTop = 0;

    openModal('poetModal');
}

/**
 * 初始化设置
 */
function initSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    settingsBtn.addEventListener('click', () => {
        openModal('settingsModal');
    });

    // 加载已保存的设置
    const saved = localStorage.getItem('poetry-ai-settings');
    if (saved) {
        const config = JSON.parse(saved);
        document.getElementById('aiService').value = config.serviceType || 'mock';
        document.getElementById('apiKeyInput').value = config.apiKey || '';
        aiService.configure(config);
    }

    // AI服务切换
    document.getElementById('aiService').addEventListener('change', (e) => {
        const apiKeySetting = document.getElementById('apiKeySetting');
        apiKeySetting.style.display = e.target.value === 'mock' ? 'none' : 'block';
    });

    // 初始状态
    if (document.getElementById('aiService').value === 'mock') {
        document.getElementById('apiKeySetting').style.display = 'none';
    }
}

/**
 * 保存设置
 */
function saveSettings() {
    const config = {
        serviceType: document.getElementById('aiService').value,
        apiKey: document.getElementById('apiKeyInput').value
    };
    
    aiService.configure(config);
    localStorage.setItem('poetry-ai-settings', JSON.stringify(config));
    
    closeModal('settingsModal');
    showToast('设置已保存', 'success');
}

/**
 * 测试API Key
 */
async function testApiKey() {
    const apiKey = document.getElementById('apiKeyInput').value;
    if (!apiKey) {
        showToast('请输入API Key', 'error');
        return;
    }
    
    showToast('正在测试连接...', 'info');
    const success = await aiService.testConnection(apiKey);
    
    if (success) {
        showToast('连接成功！', 'success');
    } else {
        showToast('连接失败，请检查API Key', 'error');
    }
}

/**
 * 滚动到底部
 */
function scrollToBottom(element) {
    if (element) {
        element.scrollTop = element.scrollHeight;
    }
}

/**
 * 渲染"我的创作"页面
 */
function renderMyWorks() {
    const container = document.getElementById('worksContent');
    const poems = JSON.parse(localStorage.getItem('myPoems') || '[]');

    // 更新首页入口按钮显示状态
    const myWorksBtn = document.getElementById('myWorksBtn');
    if (myWorksBtn) {
        myWorksBtn.style.display = poems.length > 0 ? '' : 'none';
    }

    if (poems.length === 0) {
        container.innerHTML = `
            <div class="work-empty">
                <div class="work-empty-icon">📜</div>
                <p>还没有创作，去和诗人一起写诗吧</p>
                <button class="btn btn-primary" onclick="navigateTo('creation')">开始创作</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="works-list">
            ${poems.map(poem => `
                <div class="work-card">
                    <div class="work-card-header">
                        <div class="work-card-poet">
                            <img class="mini-avatar" src="${poem.poetAvatar}" alt="${poem.poetName}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1px solid var(--paper-aged);">
                            <span>${poem.poetName}</span>
                            <span class="work-card-tag">${poem.form}</span>
                        </div>
                        <button class="work-delete-btn" onclick="deletePoem('${poem.id}')" title="删除">🗑</button>
                    </div>
                    <div class="work-card-topic">${poem.topic}</div>
                    <div class="work-card-content">
                        ${poem.lines.map(line => `<p class="work-line">${line}</p>`).join('')}
                    </div>
                    <div class="work-card-footer">${poem.createdAt}</div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * 删除诗作
 */
function deletePoem(id) {
    if (!confirm('确认删除这首诗吗？')) return;
    const poems = JSON.parse(localStorage.getItem('myPoems') || '[]');
    const filtered = poems.filter(p => p.id !== id);
    localStorage.setItem('myPoems', JSON.stringify(filtered));
    renderMyWorks();
    showToast('已删除');
}
