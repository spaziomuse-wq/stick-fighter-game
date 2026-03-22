/**
 * Game 类 - 游戏核心逻辑
 * 管理游戏状态、主循环、碰撞检测
 */

class Game {
    constructor() {
        // 画布
        this.canvas = null;
        this.ctx = null;
        
        // 游戏对象
        this.player = null;
        this.npc = null;
        this.ai = null;
        
        // 游戏状态
        this.state = 'menu'; // menu, select, difficulty, loading, countdown, fighting, result
        this.lastTime = 0;
        this.isRunning = false;
        
        // 战斗参数
        this.timeLimit = 60;
        this.timeLeft = 60;
        this.winner = null;
        
        // 连击追踪
        this.comboTracker = {
            player: { count: 0, lastHitTime: 0 },
            npc: { count: 0, lastHitTime: 0 }
        };
        
        // 输入状态
        this.keys = {};
        
        // 背景
        this.background = {
            bamboo: [],
            clouds: []
        };
        
        // 绑定方法
        this.gameLoop = this.gameLoop.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
    }
    
    // 初始化
    init() {
        // 获取画布
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 自适应屏幕
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 初始化背景
        this.initBackground();
        
        // 绑定输入事件
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        // 防止方向键滚动页面
        window.addEventListener('keydown', (e) => {
            if ([37, 38, 39, 40].includes(e.keyCode)) {
                e.preventDefault();
            }
        });
        
        console.log('Game initialized');
    }
    
    // 画布自适应
    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile && screen.orientation && screen.orientation.type.includes('landscape')) {
            // 移动端横屏：全屏
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight - 100; // 留出控制按钮空间
        } else {
            // 桌面端：固定比例
            this.canvas.width = 960;
            this.canvas.height = 540;
        }
    }
    
    // 初始化背景
    initBackground() {
        // 生成竹子
        for (let i = 0; i < 15; i++) {
            this.background.bamboo.push({
                x: Math.random() * this.canvas.width,
                height: 150 + Math.random() * 200,
                width: 10 + Math.random() * 15,
                offset: Math.random() * Math.PI * 2
            });
        }
        
        // 生成云朵
        for (let i = 0; i < 5; i++) {
            this.background.clouds.push({
                x: Math.random() * this.canvas.width,
                y: 30 + Math.random() * 100,
                size: 30 + Math.random() * 40,
                speed: 0.2 + Math.random() * 0.3
            });
        }
    }
    
    // 开始战斗
    startFight(characterId, difficulty) {
        // 创建角色
        this.player = new Fighter(200, 0, true, characterId);
        
        // NPC随机选择一个不同角色
        let npcId = Math.floor(Math.random() * 10);
        while (npcId === characterId) {
            npcId = Math.floor(Math.random() * 10);
        }
        this.npc = new Fighter(700, 0, false, npcId);
        
        // 创建AI
        this.ai = new AI(difficulty);
        
        // 重置状态
        this.timeLeft = this.timeLimit;
        this.winner = null;
        this.state = 'countdown';
        
        // 更新UI名称
        if (window.ui) {
            window.ui.setPlayerNames(this.player.data, this.npc.data);
            window.ui.reset();
            window.ui.switchScreen('gameScreen');
        }
        
        // 开始游戏循环
        this.isRunning = true;
        this.lastTime = performance.now();
        
        // 显示倒计时
        setTimeout(() => {
            if (window.ui) {
                window.ui.showCountdown(() => {
                    this.state = 'fighting';
                });
            }
        }, 100);
        
        // 启动循环
        requestAnimationFrame(this.gameLoop);
    }
    
    // 游戏主循环
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // 计算delta时间
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 更新游戏
        this.update(deltaTime);
        
        // 渲染
        this.render();
        
        // 下一帧
        requestAnimationFrame(this.gameLoop);
    }
    
    // 更新游戏状态
    update(deltaTime) {
        if (this.state !== 'fighting') return;
        
        // 更新计时器
        this.timeLeft -= deltaTime / 1000;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.endGame();
            return;
        }
        
        // 处理玩家输入
        this.handleInput();
        
        // 更新AI
        if (this.ai && this.npc) {
            this.ai.update(deltaTime, this.npc, this.player, this.canvas.width, this.canvas.height);
        }
        
        // 更新角色
        if (this.player) {
            this.player.update(deltaTime, this.npc, this.canvas.width, this.canvas.height);
        }
        if (this.npc) {
            this.npc.update(deltaTime, this.player, this.canvas.width, this.canvas.height);
        }
        
        // 检查胜负
        this.checkWinCondition();
        
        // 更新UI
        if (window.ui) {
            window.ui.updateGameUI(this.player, this.npc, this.timeLeft);
        }
    }
    
    // 处理输入
    handleInput() {
        if (!this.player || this.player.state === 'dead') return;
        
        // 左右移动
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.player.moveLeft();
        } else if (this.keys['ArrowRight'] || this.keys['d']) {
            this.player.moveRight();
        }
        
        // 跳跃
        if ((this.keys['ArrowUp'] || this.keys['w']) && !this.prevKeys['ArrowUp'] && !this.prevKeys['w']) {
            this.player.jump();
        }
        
        // 攻击
        if (this.keys['z'] && !this.prevKeys['z']) {
            this.player.attack();
        }
        
        // 防御
        this.player.block(this.keys['x']);
        
        // 绝技
        if (this.keys['c'] && !this.prevKeys['c']) {
            if (this.player.useSkill()) {
                if (window.ui) {
                    window.ui.showBattleMsg(this.player.data.skillName);
                }
            }
        }
        
        // 保存按键状态
        this.prevKeys = { ...this.keys };
    }
    
    // 检查胜负
    checkWinCondition() {
        if (this.player.hp <= 0) {
            this.winner = 'npc';
            this.endGame();
        } else if (this.npc.hp <= 0) {
            this.winner = 'player';
            this.endGame();
        }
    }
    
    // 命中处理 - 追踪连击
    onHitLanded(isPlayer) {
        const now = Date.now();
        const tracker = isPlayer ? this.comboTracker.player : this.comboTracker.npc;
        const comboWindow = 1200; // 连击窗口1.2秒
        
        // 检查是否在连击窗口内
        if (now - tracker.lastHitTime < comboWindow) {
            tracker.count++;
        } else {
            tracker.count = 1;
        }
        tracker.lastHitTime = now;
        
        // 显示连击（NPC连击显示给玩家看）
        if (!isPlayer && window.ui && tracker.count >= 2) {
            window.ui.showCombo(tracker.count, true);
        }
    }
    
    // 结束游戏
    endGame() {
        this.state = 'result';
        this.isRunning = false;
        
        // 时间到判定
        if (this.timeLeft <= 0) {
            if (this.player.hp > this.npc.hp) {
                this.winner = 'player';
            } else if (this.npc.hp > this.player.hp) {
                this.winner = 'npc';
            } else {
                this.winner = 'draw';
            }
        }
        
        // 显示结果
        setTimeout(() => {
            if (window.ui) {
                window.ui.showResult(this.winner, this.player, this.timeLeft);
            }
        }, 1000);
    }
    
    // 渲染
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制角色
        if (this.npc) this.npc.draw(this.ctx);
        if (this.player) this.player.draw(this.ctx);
        
        // 绘制KO效果
        if (this.state === 'result' && this.winner) {
            this.drawKOEffect();
        }
    }
    
    // 绘制背景
    drawBackground() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 天空渐变
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#1a3a1a');
        skyGradient.addColorStop(0.5, '#0d1f0d');
        skyGradient.addColorStop(1, '#051005');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);
        
        // 绘制月亮
        ctx.fillStyle = 'rgba(255, 255, 220, 0.3)';
        ctx.beginPath();
        ctx.arc(width - 100, 80, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // 更新和绘制云朵
        this.background.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            if (cloud.x > width + cloud.size) {
                cloud.x = -cloud.size;
            }
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.8, 0, Math.PI * 2);
            ctx.arc(cloud.x - cloud.size * 0.5, cloud.y - cloud.size * 0.1, cloud.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // 绘制远山
        ctx.fillStyle = '#0a1a0a';
        ctx.beginPath();
        ctx.moveTo(0, height - 150);
        for (let x = 0; x <= width; x += 50) {
            ctx.lineTo(x, height - 150 - Math.sin(x * 0.01) * 30 - Math.random() * 10);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.fill();
        
        // 绘制竹子
        this.background.bamboo.forEach((bamboo, index) => {
            // 摇摆动画
            const sway = Math.sin(Date.now() * 0.001 + bamboo.offset) * 5;
            
            // 竹节
            ctx.strokeStyle = `rgba(60, 100, 60, ${0.3 + index * 0.03})`;
            ctx.lineWidth = bamboo.width;
            ctx.lineCap = 'round';
            
            // 主干
            ctx.beginPath();
            ctx.moveTo(bamboo.x, height - 80);
            ctx.quadraticCurveTo(
                bamboo.x + sway * 0.5, 
                height - 80 - bamboo.height * 0.5,
                bamboo.x + sway, 
                height - 80 - bamboo.height
            );
            ctx.stroke();
            
            // 竹节纹理
            ctx.strokeStyle = `rgba(40, 80, 40, ${0.4 + index * 0.03})`;
            ctx.lineWidth = bamboo.width + 2;
            for (let i = 1; i < 5; i++) {
                const y = height - 80 - (bamboo.height * i / 5);
                const x = bamboo.x + sway * (i / 5);
                ctx.beginPath();
                ctx.moveTo(x - bamboo.width/2, y);
                ctx.lineTo(x + bamboo.width/2, y);
                ctx.stroke();
            }
            
            // 竹叶
            ctx.strokeStyle = `rgba(50, 120, 50, ${0.4 + index * 0.03})`;
            ctx.lineWidth = 2;
            const topX = bamboo.x + sway;
            const topY = height - 80 - bamboo.height;
            
            for (let i = 0; i < 3; i++) {
                const leafAngle = (i - 1) * 0.5 + sway * 0.02;
                ctx.beginPath();
                ctx.moveTo(topX, topY);
                ctx.quadraticCurveTo(
                    topX + Math.sin(leafAngle) * 30,
                    topY + Math.cos(leafAngle) * 10,
                    topX + Math.sin(leafAngle) * 50,
                    topY - Math.cos(leafAngle) * 20
                );
                ctx.stroke();
            }
        });
        
        // 地面
        const groundGradient = ctx.createLinearGradient(0, height - 80, 0, height);
        groundGradient.addColorStop(0, '#1a3a1a');
        groundGradient.addColorStop(1, '#0a1a0a');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, height - 80, width, 80);
        
        // 地面纹理
        ctx.strokeStyle = 'rgba(60, 100, 60, 0.2)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, height - 80);
            ctx.lineTo(x + 30, height);
            ctx.stroke();
        }
    }
    
    // 绘制KO效果
    drawKOEffect() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 暗色遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // KO文字
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (this.winner === 'player') {
            ctx.fillStyle = '#44ff44';
            ctx.fillText('YOU WIN!', centerX, centerY);
        } else if (this.winner === 'npc') {
            ctx.fillStyle = '#ff4444';
            ctx.fillText('KO', centerX, centerY);
        } else {
            ctx.fillStyle = '#ffff44';
            ctx.fillText('DRAW', centerX, centerY);
        }
    }
    
    // 键盘按下
    handleKeyDown(e) {
        this.keys[e.key] = true;
    }
    
    // 键盘释放
    handleKeyUp(e) {
        this.keys[e.key] = false;
    }
    
    // 暂停游戏
    pause() {
        this.isRunning = false;
    }
    
    // 恢复游戏
    resume() {
        if (this.state === 'fighting') {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    // 重置游戏
    reset() {
        this.isRunning = false;
        this.state = 'menu';
        this.player = null;
        this.npc = null;
        this.ai = null;
        this.timeLeft = this.timeLimit;
        this.winner = null;
        this.keys = {};
        this.comboTracker = {
            player: { count: 0, lastHitTime: 0 },
            npc: { count: 0, lastHitTime: 0 }
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game };
}
