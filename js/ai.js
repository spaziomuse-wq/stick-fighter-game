/**
 * AI 类 - NPC智能控制
 * 根据难度级别控制NPC行为，支持连招系统
 */

class AI {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.setupDifficulty();
        
        // AI状态
        this.thinkTimer = 0;
        this.thinkInterval = this.reactionDelay;
        this.currentAction = null;
        this.actionTimer = 0;
        
        // 行为记忆
        this.playerLastX = 0;
        this.playerLastState = 'idle';
        this.distanceToPlayer = 0;
        
        // ===== 连招系统 =====
        this.comboState = {
            isInCombo: false,           // 是否在连招中
            currentCombo: null,         // 当前使用的连招
            comboStep: 0,               // 当前连招步骤
            comboTimer: 0,              // 连招计时器
            lastComboTime: 0,           // 上次使用连招时间
            comboCooldown: 2000,        // 连招冷却时间
            comboQueue: []              // 待执行的动作队列
        };
        
        // 连招库（根据角色特性可扩展）
        this.comboLibrary = {
            // 基础连招 - 所有角色通用
            basic: [
                { name: "三连击", moves: ['attack', 'attack', 'attack'], timing: [300, 300, 500] },
                { name: "跳攻连", moves: ['jump', 'attack', 'attack'], timing: [400, 300, 400] },
                { name: "突进技", moves: ['moveRight', 'attack', 'skill'], timing: [200, 200, 800] }
            ],
            // 高级连招 - 中高级AI使用
            advanced: [
                { name: "完美连", moves: ['attack', 'attack', 'jump', 'attack', 'skill'], timing: [250, 250, 300, 200, 800] },
                { name: "压制连", moves: ['moveRight', 'attack', 'moveRight', 'attack', 'attack'], timing: [150, 200, 150, 200, 400] },
                { name: "反击连", moves: ['block', 'attack', 'skill'], timing: [400, 200, 800] }
            ],
            // 难度专属连招 - 仅困难模式
            expert: [
                { name: "极限连", moves: ['jump', 'attack', 'moveRight', 'attack', 'attack', 'skill'], timing: [300, 200, 150, 200, 250, 800] },
                { name: "读心连", moves: ['moveLeft', 'moveRight', 'attack', 'jump', 'attack', 'skill'], timing: [200, 200, 200, 300, 200, 800] }
            ]
        };
        
        // 连招成功率（根据难度）
        this.comboSuccessRate = {
            basic: { easy: 0.3, medium: 0.7, hard: 0.95 },
            advanced: { easy: 0.1, medium: 0.4, hard: 0.8 },
            expert: { easy: 0, medium: 0.2, hard: 0.7 }
        };
    }
    
    // 设置难度参数
    setupDifficulty() {
        switch(this.difficulty) {
            case 'easy':
                this.reactionDelay = 600;      // 反应延迟
                this.attackDesire = 0.25;      // 攻击欲望
                this.defenseChance = 0.5;      // 防御概率
                this.comboChance = 0.2;        // 发起连招概率
                this.skillChance = 0.2;        // 绝技使用概率
                this.prediction = 0;           // 预判能力
                this.mistakeChance = 0.4;      // 失误概率
                this.comboBreakChance = 0.3;   // 连招被打断后失误概率
                break;
                
            case 'medium':
                this.reactionDelay = 300;
                this.attackDesire = 0.55;
                this.defenseChance = 0.35;
                this.comboChance = 0.5;
                this.skillChance = 0.5;
                this.prediction = 0.35;
                this.mistakeChance = 0.15;
                this.comboBreakChance = 0.15;
                break;
                
            case 'hard':
                this.reactionDelay = 120;
                this.attackDesire = 0.9;
                this.defenseChance = 0.25;
                this.comboChance = 0.85;
                this.skillChance = 0.85;
                this.prediction = 0.65;
                this.mistakeChance = 0.05;
                this.comboBreakChance = 0.05;
                break;
                
            default:
                this.setupDifficulty('medium');
        }
    }
    
    // 更新AI
    update(deltaTime, npc, player, stageWidth, stageHeight) {
        if (npc.state === 'dead' || npc.isFrozen) return;
        
        // 更新思考计时器
        this.thinkTimer += deltaTime;
        
        // 计算与玩家的距离
        this.distanceToPlayer = Math.abs(npc.x - player.x);
        const direction = player.x > npc.x ? 1 : -1;
        
        // ===== 连招执行优先 =====
        if (this.comboState.isInCombo) {
            this.executeComboStep(npc, player, direction, deltaTime);
            return; // 连招期间不执行其他决策
        }
        
        // 定期思考
        if (this.thinkTimer >= this.thinkInterval) {
            this.thinkTimer = 0;
            this.makeDecision(npc, player, direction);
        }
        
        // 执行当前行动
        this.executeAction(npc, player, direction, deltaTime);
        
        // 更新记忆
        this.playerLastX = player.x;
        this.playerLastState = player.state;
    }
    
    // 决策
    makeDecision(npc, player, direction) {
        // 连招冷却检查
        const now = Date.now();
        const canUseCombo = now - this.comboState.lastComboTime > this.comboState.comboCooldown;
        
        // 随机失误
        if (Math.random() < this.mistakeChance) {
            this.currentAction = this.getRandomAction();
            return;
        }
        
        // 如果正在攻击或技能中，继续
        if (npc.state === 'attack' || npc.state === 'skill') {
            return;
        }
        
        // ===== 优先级1: 发动连招 =====
        if (canUseCombo && this.shouldUseCombo(npc, player)) {
            this.startCombo(npc, player, direction);
            return;
        }
        
        // ===== 优先级2: 使用绝技 =====
        if (npc.energy >= 100 && Math.random() < this.skillChance) {
            if (this.shouldUseSkill(npc, player)) {
                this.currentAction = 'skill';
                return;
            }
        }
        
        // ===== 优先级3: 防御 =====
        if (this.shouldDefend(npc, player)) {
            this.currentAction = 'block';
            return;
        }
        
        // ===== 优先级4: 普通攻击 =====
        if (this.shouldAttack(npc, player)) {
            this.currentAction = 'attack';
            return;
        }
        
        // ===== 优先级5: 移动 =====
        this.currentAction = this.decideMovement(npc, player, direction);
    }
    
    // ===== 连招系统 =====
    
    // 是否该发动连招
    shouldUseCombo(npc, player) {
        // 距离检查 - 连招需要近距离
        if (this.distanceToPlayer > 100) return false;
        
        // 玩家硬直状态是最佳连招时机
        const playerInHitstun = player.state === 'hurt' || player.state === 'block';
        
        // 根据难度和情况决定是否连招
        let comboProbability = this.comboChance;
        
        // 玩家硬直时更容易连招
        if (playerInHitstun) comboProbability *= 1.5;
        
        // 血量优势时更积极连招
        if (npc.hp > player.hp + 20) comboProbability *= 1.2;
        
        return Math.random() < comboProbability;
    }
    
    // 开始连招
    startCombo(npc, player, direction) {
        // 选择连招难度
        const availableCombos = [];
        
        // 基础连招总是可用
        availableCombos.push(...this.comboLibrary.basic);
        
        // 中高级难度添加高级连招
        if (this.difficulty !== 'easy') {
            availableCombos.push(...this.comboLibrary.advanced);
        }
        
        // 困难难度添加专家连招
        if (this.difficulty === 'hard') {
            availableCombos.push(...this.comboLibrary.expert);
        }
        
        // 随机选择一个连招
        this.comboState.currentCombo = availableCombos[Math.floor(Math.random() * availableCombos.length)];
        this.comboState.isInCombo = true;
        this.comboState.comboStep = 0;
        this.comboState.comboTimer = 0;
        this.comboState.lastComboTime = Date.now();
        
        // 构建动作队列
        this.comboState.comboQueue = [...this.comboState.currentCombo.moves];
        
        console.log(`AI启动连招: ${this.comboState.currentCombo.name}`);
    }
    
    // 执行连招步骤
    executeComboStep(npc, player, direction, deltaTime) {
        const combo = this.comboState.currentCombo;
        const step = this.comboState.comboStep;
        
        // 连招被打断检查
        if (npc.state === 'hurt' || npc.state === 'dead') {
            this.breakCombo(npc, '被打断');
            return;
        }
        
        // 距离过远检查
        if (this.distanceToPlayer > 150) {
            this.breakCombo(npc, '距离过远');
            return;
        }
        
        // 更新连招计时器
        this.comboState.comboTimer += deltaTime;
        
        // 检查当前步骤是否完成
        const stepTiming = combo.timing[step] || 300;
        
        if (this.comboState.comboTimer >= stepTiming) {
            // 执行当前步骤动作
            const action = combo.moves[step];
            this.executeComboAction(action, npc, player, direction);
            
            // 进入下一步
            this.comboState.comboStep++;
            this.comboState.comboTimer = 0;
            
            // 连招结束检查
            if (this.comboState.comboStep >= combo.moves.length) {
                this.endCombo(npc);
            }
        }
    }
    
    // 执行连招中的具体动作
    executeComboAction(action, npc, player, direction) {
        // 连招中的移动要朝向玩家
        const towardPlayer = player.x > npc.x ? 'moveRight' : 'moveLeft';
        
        switch(action) {
            case 'attack':
                // 连招中攻击自动朝向玩家
                npc.facing = direction;
                npc.attack();
                break;
                
            case 'moveRight':
                if (direction === 1) {
                    npc.moveRight();
                } else {
                    npc.moveLeft(); // 如果玩家方向相反，则向左移动（可能是后退或调整）
                }
                break;
                
            case 'moveLeft':
                if (direction === -1) {
                    npc.moveLeft();
                } else {
                    npc.moveRight();
                }
                break;
                
            case 'jump':
                npc.jump();
                break;
                
            case 'skill':
                if (npc.energy >= 100) {
                    npc.useSkill();
                    // 显示连招终结技提示
                    if (window.ui && this.difficulty === 'hard') {
                        window.ui.showBattleMsg(`${this.comboState.currentCombo.name}!`, 1000);
                    }
                }
                break;
                
            case 'block':
                npc.block(true);
                setTimeout(() => npc.block(false), 200);
                break;
        }
    }
    
    // 中断连招
    breakCombo(npc, reason) {
        console.log(`连招中断: ${reason}`);
        this.comboState.isInCombo = false;
        this.comboState.comboStep = 0;
        this.comboState.comboQueue = [];
        
        // 连招被打断后可能失误
        if (Math.random() < this.comboBreakChance) {
            this.currentAction = 'idle'; // 硬直
            setTimeout(() => {
                this.currentAction = null;
            }, 500);
        }
    }
    
    // 结束连招
    endCombo(npc) {
        console.log(`连招完成: ${this.comboState.currentCombo.name}`);
        this.comboState.isInCombo = false;
        this.comboState.comboStep = 0;
        this.comboState.comboQueue = [];
        this.currentAction = null;
        
        // 连招结束后的硬直
        if (this.difficulty === 'easy') {
            setTimeout(() => {
                this.thinkTimer = 0; // 简单AI连招后有较大硬直
            }, 400);
        }
    }
    
    // ===== 原有决策函数优化 =====
    
    // 是否应该使用绝技
    shouldUseSkill(npc, player) {
        // 困难模式：在最佳时机使用
        if (this.difficulty === 'hard') {
            // 玩家无法防御时使用
            if (player.state === 'hurt' || player.state === 'jump') {
                return true;
            }
            // 近距离确保命中
            if (this.distanceToPlayer < 100) {
                return true;
            }
            // 血量危险时保命
            if (npc.hp < 20) return true;
            return false;
        }
        
        // 中等模式：血量低时使用或连招结尾
        if (this.difficulty === 'medium') {
            if (npc.hp < 30 || this.distanceToPlayer < 120) {
                return Math.random() < 0.7;
            }
            return false;
        }
        
        // 简单模式：随机使用
        return Math.random() < 0.4;
    }
    
    // 是否应该防御
    shouldDefend(npc, player) {
        // 连招期间不防御
        if (this.comboState.isInCombo) return false;
        
        // 玩家正在攻击
        if (player.isAttacking && this.distanceToPlayer < 100) {
            const predictionBonus = this.difficulty === 'hard' ? 0.35 : 
                                   this.difficulty === 'medium' ? 0.15 : 0;
            return Math.random() < (this.defenseChance + predictionBonus);
        }
        
        // 玩家绝技
        if (player.state === 'skill' && this.distanceToPlayer < 150) {
            return Math.random() < this.defenseChance;
        }
        
        // 血量低时更倾向于防御
        if (npc.hp < 30) {
            return Math.random() < this.defenseChance * 1.5;
        }
        
        // 连招被打断后的防御
        if (player.comboCount > 1) {
            return Math.random() < this.defenseChance * 1.3;
        }
        
        return false;
    }
    
    // 是否应该攻击
    shouldAttack(npc, player) {
        // 连招期间不单独决策攻击
        if (this.comboState.isInCombo) return false;
        
        // 检查是否在攻击范围内
        const attackRange = 70;
        
        if (this.distanceToPlayer <= attackRange) {
            return Math.random() < this.attackDesire;
        }
        
        return false;
    }
    
    // 决定移动方式
    decideMovement(npc, player, direction) {
        const attackRange = 70;
        const idealRange = 60;
        
        // 连招期间不单独决策移动
        if (this.comboState.isInCombo) return 'idle';
        
        // 困难模式：主动调整距离
        if (this.difficulty === 'hard') {
            if (this.distanceToPlayer > attackRange + 20) {
                return direction === 1 ? 'moveRight' : 'moveLeft';
            } else if (this.distanceToPlayer < idealRange - 10) {
                // 太近时后退（准备连招距离）
                return direction === 1 ? 'moveLeft' : 'moveRight';
            }
        }
        
        // 中等/简单模式：简单靠近
        if (this.distanceToPlayer > attackRange) {
            return direction === 1 ? 'moveRight' : 'moveLeft';
        }
        
        // 随机跳跃躲避
        if (Math.random() < 0.08 && npc.isGrounded) {
            return 'jump';
        }
        
        return 'idle';
    }
    
    // 执行行动
    executeAction(npc, player, direction, deltaTime) {
        // 连招期间不执行普通行动
        if (this.comboState.isInCombo) return;
        
        // 取消防御
        if (this.currentAction !== 'block' && npc.isBlocking) {
            npc.block(false);
        }
        
        switch(this.currentAction) {
            case 'moveLeft':
                npc.moveLeft();
                break;
                
            case 'moveRight':
                npc.moveRight();
                break;
                
            case 'jump':
                if (npc.isGrounded) {
                    npc.jump();
                    this.currentAction = 'idle';
                }
                break;
                
            case 'attack':
                npc.attack();
                this.currentAction = 'idle';
                break;
                
            case 'block':
                npc.block(true);
                this.actionTimer += deltaTime;
                if (this.actionTimer > 400) {
                    npc.block(false);
                    this.currentAction = 'idle';
                    this.actionTimer = 0;
                }
                break;
                
            case 'skill':
                if (npc.useSkill()) {
                    this.currentAction = 'idle';
                }
                break;
                
            case 'idle':
            default:
                // 困难模式：微调位置
                if (this.difficulty === 'hard' && this.distanceToPlayer > 120) {
                    if (direction === 1) {
                        npc.moveRight();
                    } else {
                        npc.moveLeft();
                    }
                }
                break;
        }
    }
    
    // 获取随机行动（失误用）
    getRandomAction() {
        const actions = ['moveLeft', 'moveRight', 'jump', 'idle'];
        return actions[Math.floor(Math.random() * actions.length)];
    }
    
    // 重置
    reset() {
        this.thinkTimer = 0;
        this.currentAction = null;
        this.actionTimer = 0;
        this.comboState = {
            isInCombo: false,
            currentCombo: null,
            comboStep: 0,
            comboTimer: 0,
            lastComboTime: 0,
            comboCooldown: 2000,
            comboQueue: []
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AI };
}
