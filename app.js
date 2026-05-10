/**
 * 诗中天地 - 主应用入口
 */

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化各模块
    initParticles();
    initPoetsCarousel();
    initPoetsPage();
    initSettings();
    
    // 初始化诗会模式
    meeting.init();
    
    // 初始化创作模式
    creation.init();

    // 初始化与诗人聊天模式
    chatWithPoet.init();

    // 检查是否有已保存的诗作，显示首页入口
    const savedPoems = JSON.parse(localStorage.getItem('myPoems') || '[]');
    const myWorksBtn = document.getElementById('myWorksBtn');
    if (myWorksBtn && savedPoems.length > 0) {
        myWorksBtn.style.display = '';
    }
    
    // 绑定导航事件
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page) {
                navigateTo(page);
            }
        });
    });

    // 绑定弹窗关闭（点击遮罩关闭）
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });

    // 键盘事件
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(overlay => {
                closeModal(overlay.id);
            });
        }
    });

    // 全局函数绑定
    window.navigateTo = navigateTo;
    window.showPoetDetail = showPoetDetail;
    window.closeModal = closeModal;
    window.saveSettings = saveSettings;
    window.testApiKey = testApiKey;
    window.exitMeeting = () => meeting.exitMeeting();
    window.sendMeetingMessage = () => meeting.sendUserMessage();
    window.exitCreation = () => creation.exitCreation();
    window.sendCreationMessage = () => creation.sendMessage();
    window.deletePoem = deletePoem;
    window.startChatWithPoet = (poetId) => {
        closeModal('poetModal');
        chatWithPoet.start(poetId);
    };

    console.log('📜 诗中天地：与诗人共品唐诗 - 已启动');
});
