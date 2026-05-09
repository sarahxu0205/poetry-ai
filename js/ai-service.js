/**
 * AI 服务模块
 * 支持 DeepSeek API 和模拟模式
 */
class AIService {
    constructor() {
        this.serviceType = 'mock'; // 'deepseek' 或 'mock'
        this.apiKey = '';
        this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        this.model = 'deepseek-chat';
    }

    /**
     * 配置AI服务
     */
    configure(config) {
        this.serviceType = config.serviceType || 'mock';
        this.apiKey = config.apiKey || '';
    }

    /**
     * 测试API连接
     */
    async testConnection(apiKey) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: '你好' }],
                    max_tokens: 10
                })
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    /**
     * 发送对话消息
     * @param {Array} messages - 对话历史 [{role, content}]
     * @param {string} systemPrompt - 系统提示词
     * @returns {Promise<string>} AI回复内容
     */
    async chat(messages, systemPrompt) {
        if (this.serviceType === 'mock') {
            return this.mockResponse(messages, systemPrompt);
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages
                    ],
                    max_tokens: 500,
                    temperature: 0.85,
                    top_p: 0.9
                })
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI API错误:', error);
            showToast('AI服务暂时不可用，已切换到模拟模式', 'error');
            this.serviceType = 'mock';
            return this.mockResponse(messages, systemPrompt);
        }
    }

    /**
     * 模拟AI回复（无需API的回退方案）
     */
    mockResponse(messages, systemPrompt) {
        return new Promise((resolve) => {
            const lastMsg = messages[messages.length - 1]?.content || '';
            const poetName = this.extractPoetName(systemPrompt);
            const response = this.generateMockReply(poetName, lastMsg, systemPrompt);
            
            const delay = 800 + Math.random() * 1200;
            setTimeout(() => resolve(response), delay);
        });
    }

    /**
     * 从系统提示词中提取诗人名字
     */
    extractPoetName(systemPrompt) {
        if (systemPrompt.includes('李白')) return 'libai';
        if (systemPrompt.includes('杜甫')) return 'dufu';
        if (systemPrompt.includes('王维')) return 'wangwei';
        if (systemPrompt.includes('白居易')) return 'baijuyi';
        if (systemPrompt.includes('李商隐')) return 'lishangyin';
        if (systemPrompt.includes('张若虚')) return 'zhangruoxu';
        // 新增4位诗人
        if (systemPrompt.includes('孟浩然')) return 'menghaoran';
        if (systemPrompt.includes('王昌龄')) return 'wangchangling';
        if (systemPrompt.includes('高适')) return 'gaoshi';
        if (systemPrompt.includes('杜牧')) return 'dumu';
        return 'libai';
    }

    /**
     * 生成模拟回复 - 为用户创作候选诗句
     * 根据用户描述的场景，生成包含「」包裹诗句的回复
     */
    generateMockReply(poetId, userMsg, systemPrompt) {
        // 判断是否是打招呼场景（systemPrompt包含"打招呼"但不包含"创作"）
        const isGreeting = systemPrompt.includes('打招呼') && !systemPrompt.includes('创作2-4句');
        
        // 诗人打招呼回复库
        const greetingReplies = {
            libai: [
                '哈哈哈！朋友，欢迎来到诗的世界！太白我最爱结交志同道合之人。你想写什么主题的诗呢？山水？饮酒？还是边塞风光？说来听听！',
                '妙哉！今日能与君论诗，太白甚感快慰！我擅长写山水诗和饮酒诗，你想从哪个主题开始呢？',
                '朋友，你来了！来来来，先说说你想写什么？是想要豪迈奔放的，还是清新飘逸的？'
            ],
            dufu: [
                '阁下远道而来，老杜有失远迎。你想写什么主题的诗呢？我可以帮你写反映现实的诗，也可以写忧国忧民的诗。',
                '能与君论诗，老杜甚感欣慰。你想写什么主题呢？不妨说说你的想法。',
                '阁下请讲，老杜洗耳恭听。你想写什么主题的诗？我可以给你一些建议。'
            ],
            wangwei: [
                '阿弥陀佛，施主远道而来，请坐。你想写什么主题的诗呢？我擅长写山水田园诗，可以帮你描绘自然之美。',
                '善哉，能与君论诗，也是一场缘分。你想写什么主题呢？不妨说说。',
                '施主请讲，摩诘洗耳恭听。你想写什么主题的诗？我可以帮你写禅意盎然的诗。'
            ],
            baijuyi: [
                '哎呀，朋友来了！老白最喜与人论诗！你想写什么主题呢？我擅长写通俗易懂的诗，保证让大家都能看懂！',
                '朋友，你来了！来来来，说说你想写什么主题的诗？我可以帮你写反映民生疾苦的诗！',
                '老白觉得吧，写诗要让人看得懂！你想写什么主题呢？说来听听！'
            ],
            lishangyin: [
                '（微微一笑）你来了。你想写什么主题的诗呢？我擅长写朦胧唯美的诗，可以帮你表达那些说不清道不明的情感。',
                '（轻声）能与君论诗，也是一场缘分。你想写什么主题呢？',
                '你想写什么主题的诗？我可以帮你写那种意境深远、耐人寻味的诗。'
            ],
            zhangruoxu: [
                '阁下远道而来，若虚有失远迎。你想写什么主题的诗呢？我可以帮你写清丽婉约的诗。',
                '能与君论诗，若虚甚感欣慰。你想写什么主题呢？不妨说说。',
                '阁下请讲，若虚洗耳恭听。你想写什么主题的诗？'
            ],
            menghaoran: [
                '山居清静，难得有客来访。你想写什么主题的诗呢？我擅长写山水田园诗，可以帮你描绘田园风光。',
                '故人来访，浩然甚感欣慰。你想写什么主题呢？不妨说说。',
                '你想写什么主题的诗？我可以帮你写那种清新自然的诗。'
            ],
            wangchangling: [
                '好！有客来访！你想写什么主题的诗呢？我擅长写边塞诗，可以帮你写出豪迈奔放的诗篇！',
                '痛快！难得有人来论诗！你想写什么主题呢？说来听听！',
                '你想写什么主题的诗？我可以帮你写那种气势磅礴的诗！'
            ],
            gaoshi: [
                '哈哈，有客来访！你想写什么主题的诗呢？我擅长写边塞诗，可以帮你写出苍凉悲壮的诗篇！',
                '痛快！难得有人来论诗！你想写什么主题呢？说来听听！',
                '你想写什么主题的诗？我可以帮你写那种雄浑有力的诗！'
            ],
            dumu: [
                '有客来访，杜牧有礼了。你想写什么主题的诗呢？我擅长写咏史怀古诗，可以帮你借古讽今。',
                '能与君论诗，杜牧甚感欣慰。你想写什么主题呢？不妨说说。',
                '你想写什么主题的诗？我可以帮你写那种见解独到的诗。'
            ]
        };
        
        // 如果是打招呼场景，直接返回打招呼回复
        if (isGreeting) {
            const replies = greetingReplies[poetId] || greetingReplies.libai;
            return replies[Math.floor(Math.random() * replies.length)];
        }
        
        // 判断是否是诗会场景（systemPrompt包含"诗会"或"讨论诗歌"）
        const isMeeting = systemPrompt.includes('诗会') || systemPrompt.includes('讨论诗歌');
        
        if (isMeeting) {
            // 从systemPrompt中提取当前讨论的诗名
            const poemMatch = systemPrompt.match(/诗词：《(.+?)》/);
            const poemName = poemMatch ? poemMatch[1] : '这首诗';
            
            // 诗会讨论回复库——按诗人分类，围绕诗歌讨论
            const meetingReplies = {
                libai: [
                    `哈哈哈！说到${poemName}，此诗气象万千！尤其是其中写景的句子，读来令人心旷神怡。诸位觉得呢？`,
                    `妙哉！${poemName}的意境深远，让我想起当年游历山水的日子。好诗就是能让人身临其境！`,
                    `这首${poemName}，妙在它的气势！读来令人心胸开阔，仿佛看到了壮丽的山河。不知诸位有何感想？`,
                    `好诗！${poemName}用词精妙，尤其是炼字功夫了得。一个字用得好，整句诗都活了！`,
                    `说到${poemName}，我觉得此诗最妙之处在于它的节奏感。读起来朗朗上口，如行云流水！`,
                    `此诗让我想起自己的一些创作经历。写诗嘛，最重要的是真情实感，${poemName}就是最好的例子！`,
                    `诸位说得都有道理。不过我觉得${poemName}还有一个妙处——它的留白。言有尽而意无穷，这才是诗的最高境界！`
                ],
                dufu: [
                    `说到${poemName}，老杜以为此诗格律工整，对仗精妙，可见诗人在炼字上下了很大功夫。`,
                    `此诗读来令人动容。${poemName}的妙处，在于它以小见大，从个人的悲欢中折射出时代的变迁。`,
                    `阁下说得对。${poemName}的韵律也值得注意，平仄安排与情感节奏完美契合。这才是好诗！`,
                    `老杜以为，${poemName}最可贵之处在于它的社会责任感。"文章合为时而著，歌诗合为事而作"，此诗当之无愧。`,
                    `嗯，${poemName}让我深有感触。想当年安史之乱，我颠沛流离，所见所闻皆入诗中。好诗就是要记录真实的人生。`,
                    `此诗结构严谨，起承转合环环相扣。诸位注意到了吗？${poemName}的布局堪称典范。`,
                    `说到${poemName}，老杜想补充一点——此诗的情感真挚，不矫揉造作。诗者，志之所之也，在心为志，发言为诗。`
                ],
                wangwei: [
                    `阿弥陀佛。${poemName}的意境深远，让我想起在辋川别业的日子。最好的诗，往往是最简单的景物中蕴含的深意。`,
                    `善哉。${poemName}如一幅山水画，寥寥数笔，却意境全出。诗中有画，画中有诗，不过如此。`,
                    `施主说得对。${poemName}最妙之处在于"空"字。空山不是没有山，而是心无挂碍。诗歌的至高境界便是如此。`,
                    `嗯，${poemName}让我想起当年在终南山隐居时，常独坐溪边，看云起云落。那些诗不是"写"出来的，而是"看"出来的。`,
                    `此诗如禅。读${poemName}，需静心体会。浮躁之人恐怕难以领悟其中的妙处。施主以为然否？`,
                    `说到${poemName}，摩诘以为其妙在自然。不事雕琢而自有韵味，这才是诗家上品。`,
                    `${poemName}让我想到一句佛语："一切有为法，如梦幻泡影"。诗亦是如此，妙在不可言说处。`
                ],
                baijuyi: [
                    `哎呀，说到${poemName}！老白觉得这首诗最大的优点就是通俗易懂！好诗就应该让人一看就懂，一想就深。`,
                    `嗯嗯，${poemName}让我想起自己写《琵琶行》的时候。诗就是要反映真实的生活和情感，让读者能产生共鸣。`,
                    `说到${poemName}，老白觉得吧，它的情感表达特别到位。你看那些用词，多简单，可就是能打动人心！`,
                    `朋友说得对！${poemName}就是"文章合为时而著，歌诗合为事而作"的最好体现。诗就应该反映民生，反映真实！`,
                    `老白觉得${poemName}还有一个妙处——它的节奏感特别好。读起来像在说话一样自然，这才是最高明的写法！`,
                    `说到${poemName}，我想起当年被贬江州的日子。虽然艰苦，但那段经历让我写出了最好的诗。苦难出诗人啊！`,
                    `这首${poemName}，老白给满分！通俗易懂，情感真挚，韵律优美。这才是老百姓爱读的好诗！`
                ],
                lishangyin: [
                    `（轻叹）${poemName}……有些诗，读的时候并不知道它好在哪里，只是心里有一种说不清的感觉。也许这就是诗的魅力吧。`,
                    `说到${poemName}，我觉得它最美的地方在于它的朦胧。有些东西，当你明白的时候，已经来不及了。诗歌记录的就是那些来不及说出口的话。`,
                    `（微微一笑）${poemName}让我想起很多往事。有些诗是写给特定的人的，只是不方便写出来罢了。`,
                    `嗯……${poemName}的妙处在于它的不确定性。一旦说破了，反而失去了那种朦胧的美。诸位觉得呢？`,
                    `说到${poemName}，我想起了自己那些"无题"诗。不是没有题目，而是题目本身就是那个人的名字。有些名字，不方便写出来。`,
                    `（沉默片刻）${poemName}读来令人心碎。最好的诗都是这样，不说痛，却让人感受到最深的痛。`,
                    `此诗如一场梦，美得不真实，却又让人沉醉。${poemName}的作者一定是个深情之人。`
                ],
                zhangruoxu: [
                    `说到${poemName}，若虚以为此诗意境深远。一首好诗，不在于辞藻华丽，而在于能引起读者的共鸣。`,
                    `嗯，${poemName}让我想起写《春江花月夜》时的感受。人生短暂，而江月永恒，我们不过是这永恒中的一个瞬间。`,
                    `阁下说得对。${poemName}以月为线索，从月升写到月落，其实也是在写人的一生。月有升落，人有聚散。`,
                    `（望向远方）${poemName}让我感慨万千。有些东西，不在于多，而在于精。一首好诗，足以让一个人被记住千年。`,
                    `说到${poemName}，若虚以为其妙处在于留白。言有尽而意无穷，给读者留下了无限的想象空间。`,
                    `此诗读来令人心旷神怡。${poemName}的韵律优美，如江水般流畅，一气呵成。`
                ],
                menghaoran: [
                    `说到${poemName}，浩然觉得此诗清新自然，不事雕琢。写诗嘛，不必刻意追求华丽，自然流露才是最好的。`,
                    `嗯，${poemName}让我想起在鹿门山隐居的日子。山居生活虽然清苦，但与自然亲近的感觉是功名利禄换不来的。`,
                    `此诗如山间清泉，不事雕琢而自有韵味。${poemName}的作者一定是个淡泊之人。`,
                    `说到${poemName}，浩然以为其妙在"真"字。真情实感，不矫揉造作，这才是诗家本色。`,
                    `朋友说得对！${poemName}让我想起《春晓》——不过是清晨醒来听到鸟鸣，随手写下的感受。诗就在身边，只需一双安静的眼睛。`,
                    `此诗读来如饮清茶，回味悠长。${poemName}的作者深得自然之趣。`
                ],
                wangchangling: [
                    `好！说到${poemName}，此诗气势磅礴！二十八个字，要写出气势、意境、情感，这可不是容易的事。`,
                    `痛快！${poemName}的妙处，在于它以简洁的语言表达了最深沉的情感。这才是七绝的最高境界！`,
                    `说到${poemName}，少伯以为此诗用词精炼，一字千金。好诗就是要字字珠玑，没有一个废字。`,
                    `此诗读来令人热血沸腾！${poemName}的作者一定是个豪迈之人。少伯佩服！`,
                    `说到${poemName}，我想起在边塞的日子。那里的风沙、寒冷、将士们的思乡之情——只有亲身体验过，才能写出这样的好诗。`,
                    `嗯，${poemName}的起承转合堪称完美。尤其是结句，余味无穷，让人回味再三。`
                ],
                gaoshi: [
                    `哈哈！说到${poemName}，此诗雄浑苍凉！读来令人仿佛置身于边塞大漠之中。这才是有血有肉的诗！`,
                    `痛快！${poemName}的妙处在于它的真实。没有亲身经历过，写不出这样的诗。纸上得来终觉浅，绝知此事要躬行！`,
                    `说到${poemName}，达夫以为此诗以苍凉的景色衬托出深沉的情感。景中有情，情中有景，浑然天成！`,
                    `此诗如边塞的号角，铿锵有力！${poemName}的作者一定是个有故事的人。`,
                    `说到${poemName}，让我想起与李白、杜甫漫游梁宋的日子。人生得一知己，足矣。好诗也是，能引起共鸣的就是好诗。`,
                    `嗯，${poemName}的格局宏大，不拘泥于儿女情长。这才是大丈夫的诗！`
                ],
                dumu: [
                    `说到${poemName}，杜牧以为此诗以小见大，借古讽今，正是"文以意为主"的典范。`,
                    `嗯，${poemName}让我想起写《赤壁》的时候。"东风不与周郎便，铜雀春深锁二乔"，写的就是历史的偶然性。`,
                    `此诗见解独到！${poemName}不人云亦云，有自己的思考和立场。这才是真正有价值的诗。`,
                    `说到${poemName}，杜牧以为其妙处在于立意。意为主，辞为辅。那些只有华丽辞藻而无深意的诗，不过是文字游戏罢了。`,
                    `（轻叹）${poemName}让我感慨万千。晚唐时局令人忧心，我写诗常常是借古讽今，希望当政者能以史为鉴。`,
                    `说到${poemName}，此诗如一面镜子，照见历史兴衰。读这样的诗，让人不禁反思当下。`
                ]
            };
            
            const replies = meetingReplies[poetId] || meetingReplies.libai;
            return replies[Math.floor(Math.random() * replies.length)];
        }
        
        // 场景-诗句映射库
        const scenePoems = {
            '春天': ['「春风又绿江南岸」', '「桃花依旧笑春风」', '「春眠不觉晓」', '「好雨知时节」', '「草长莺飞二月天」'],
            '春天': ['「春风又绿江南岸」', '「桃花依旧笑春风」', '「春眠不觉晓」', '「好雨知时节」', '「草长莺飞二月天」'],
            '秋': ['「秋风萧瑟天气凉」', '「停车坐爱枫林晚」', '「月落乌啼霜满天」', '「空山新雨后」', '「自古逢秋悲寂寥」'],
            '月': ['「举头望明月」', '「月落乌啼霜满天」', '「海上生明月」', '「明月几时有」', '「床前明月光」'],
            '送别': ['「劝君更尽一杯酒」', '「桃花潭水深千尺」', '「莫愁前路无知己」', '「海内存知己」', '「孤帆远影碧空尽」'],
            '思乡': ['「举头望明月，低头思故乡」', '「独在异乡为异客」', '「露从今夜白，月是故乡明」', '「春风又绿江南岸，明月何时照我还」'],
            '酒': ['「举杯邀明月」', '「人生得意须尽欢」', '「葡萄美酒夜光杯」', '「劝君更尽一杯酒」', '「对酒当歌，人生几何」'],
            '山水': ['「空山新雨后」', '「行到水穷处」', '「两岸猿声啼不住」', '「飞流直下三千尺」', '「会当凌绝顶」'],
            '爱情': ['「此情可待成追忆」', '「在天愿作比翼鸟」', '「两情若是久长时」', '「曾经沧海难为水」', '「红豆生南国」'],
            '打工': ['「采得百花成蜜后，为谁辛苦为谁甜」', '「谁知盘中餐，粒粒皆辛苦」', '「晨兴理荒秽，带月荷锄归」', '「遍身罗绮者，不是养蚕人」'],
            '工作': ['「采得百花成蜜后，为谁辛苦为谁甜」', '「谁知盘中餐，粒粒皆辛苦」', '「晨兴理荒秽，带月荷锄归」', '「遍身罗绮者，不是养蚕人」'],
            '友情': ['「海内存知己，天涯若比邻」', '「桃花潭水深千尺，不及汪伦送我情」', '「劝君更尽一杯酒，西出阳关无故人」'],
            '战争': ['「黄沙百战穿金甲」', '「醉卧沙场君莫笑」', '「但使龙城飞将在」', '「烽火连三月」', '「大漠孤烟直」'],
            '边塞': ['「黄沙百战穿金甲」', '「醉卧沙场君莫笑」', '「但使龙城飞将在」', '「大漠孤烟直」', '「羌笛何须怨杨柳」'],
            '夜晚': ['「床前明月光」', '「月落乌啼霜满天」', '「举杯邀明月」', '「夜来风雨声」', '「月黑雁飞高」'],
            '雨': ['「好雨知时节」', '「夜来风雨声」', '「清明时节雨纷纷」', '「空山新雨后」', '「渭城朝雨浥轻尘」'],
            '雪': ['「忽如一夜春风来，千树万树梨花开」', '「孤舟蓑笠翁，独钓寒江雪」', '「柴门闻犬吠，风雪夜归人」', '「白雪却嫌春色晚」'],
            '花': ['「桃花依旧笑春风」', '「人面桃花相映红」', '「采菊东篱下」', '「接天莲叶无穷碧」', '「乱花渐欲迷人眼」'],
            'default': ['「人生得意须尽欢」', '「长风破浪会有时」', '「会当凌绝顶，一览众山小」', '「海内存知己，天涯若比邻」', '「山重水复疑无路，柳暗花明又一村」']
        };

        // 诗人风格前缀
        const poetStyles = {
            libai: ['哈哈哈！朋友，', '妙哉！', '好！让我为你创作几句：', '来来来，听太白一言：'],
            dufu: ['阁下所言甚是。', '老杜以为，', '嗯，让我为你写几句：', '阁下请看：'],
            wangwei: ['阿弥陀佛。', '善哉。', '让我为你写下几句：', '施主请看：'],
            baijuyi: ['哎呀，朋友！', '老白觉得吧，', '来来来，让我为你写几句：', '朋友请看：'],
            lishangyin: ['（微微一笑）', '（轻声）', '让我为你写下几句：', '你听：'],
            zhangruoxu: ['阁下所言甚是。', '若虚以为，', '让我为你写几句：', '阁下请看：'],
            menghaoran: ['朋友来了！', '让我为你写几句：', '春眠不觉晓，哈哈，开个玩笑。', '请看：'],
            wangchangling: ['好！', '让我为你创作几句：', '边塞诗我最擅长：', '请看：'],
            gaoshi: ['朋友！', '让我为你写几句：', '边塞风雪，我最熟悉：', '请看：'],
            dumu: ['阁下所言甚是。', '让我为你写几句：', '历史兴衰，诗中可见：', '请看：']
        };

        // 匹配场景
        const msg = userMsg.toLowerCase();
        let matchedScene = 'default';
        
        for (const scene of Object.keys(scenePoems)) {
            if (scene !== 'default' && msg.includes(scene)) {
                matchedScene = scene;
                break;
            }
        }

        // 获取诗句
        const poems = scenePoems[matchedScene];
        const selectedPoems = this.shuffleArray([...poems]).slice(0, 3);
        
        // 获取诗人风格前缀
        const styles = poetStyles[poetId] || poetStyles.libai;
        const prefix = styles[Math.floor(Math.random() * styles.length)];
        
        // 生成回复
        const poetNames = {
            libai: '太白',
            dufu: '老杜',
            wangwei: '摩诘',
            baijuyi: '老白',
            lishangyin: '义山',
            zhangruoxu: '若虚',
            menghaoran: '浩然',
            wangchangling: '少伯',
            gaoshi: '达夫',
            dumu: '牧之'
        };
        
        const poetName = poetNames[poetId] || '太白';
        
        return `${prefix}你想要写关于${matchedScene === 'default' ? '这个主题' : matchedScene}的诗？让我为你创作几句：

${selectedPoems.join('\n')}

这些诗句你觉得如何？喜欢哪句就点采纳吧！`;
    }

    /**
     * 数组随机排序
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * 带打字效果的流式输出
     */
    typeText(element, text, callback) {
        const speed = 30; // 固定速度
        let index = 0;
        element.innerHTML = '';
        
        // HTML转义函数
        const escapeHTML = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        const timer = setInterval(() => {
            if (index < text.length) {
                // 处理HTML标签
                if (text[index] === '<') {
                    const closeIndex = text.indexOf('>', index);
                    if (closeIndex !== -1) {
                        element.innerHTML += text.substring(index, closeIndex + 1);
                        index = closeIndex + 1;
                    } else {
                        element.innerHTML += escapeHTML(text[index]);
                        index++;
                    }
                } else {
                    element.innerHTML += escapeHTML(text[index]);
                    index++;
                }
            } else {
                clearInterval(timer);
                if (callback) callback();
            }
        }, speed);

        return timer;
    }
}

// 全局AI服务实例
const aiService = new AIService();
