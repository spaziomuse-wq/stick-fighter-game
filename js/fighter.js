/**
 * Fighter 类 - 火柴人角色基类
 * 处理角色状态、动画、攻击逻辑
 */

// 10个角色数据配置
const CHARACTERS_DATA = [
    {
        id: 0,
        name: "疾风",
        color: "#00FF00",
        desc: "速度型战士，如风般迅捷",
        speed: 7,
        attack: 11,
        defense: 4,
        skillName: "旋风腿",
        skillDesc: "高速旋转踢击，造成多段伤害",
        accessory: "scarf" // 围巾
    },
    {
        id: 1,
        name: "铁壁",
        color: "#888888",
        desc: "防御型战士，坚不可摧",
        speed: 3,
        attack: 10,
        defense: 8,
        skillName: "金刚护体",
        skillDesc: "短暂无敌并反弹伤害",
        accessory: "shield" // 盾牌
    },
    {
        id: 2,
        name: "烈焰",
        color: "#FF4500",
        desc: "攻击型战士，火焰之力",
        speed: 5,
        attack: 14,
        defense: 4,
        skillName: "烈焰风暴",
        skillDesc: "召唤火焰风暴，大范围伤害",
        accessory: "flame" // 火焰纹
    },
    {
        id: 3,
        name: "寒冰",
        color: "#00BFFF",
        desc: "控制型战士，冰封万物",
        speed: 4,
        attack: 10,
        defense: 6,
        skillName: "绝对零度",
        skillDesc: "冻结对手，使其无法行动",
        accessory: "ice" // 冰晶
    },
    {
        id: 4,
        name: "雷电",
        color: "#FFD700",
        desc: "爆发型战士，雷霆万钧",
        speed: 6,
        attack: 13,
        defense: 3,
        skillName: "雷神之怒",
        skillDesc: "召唤雷电，瞬间爆发伤害",
        accessory: "thunder" // 雷电纹
    },
    {
        id: 5,
        name: "暗影",
        color: "#8B00FF",
        desc: "敏捷型战士，来无影去无踪",
        speed: 8,
        attack: 10,
        defense: 3,
        skillName: "暗影分身",
        skillDesc: "召唤分身同时攻击",
        accessory: "mask" // 面具
    },
    {
        id: 6,
        name: "狂战",
        color: "#DC143C",
        desc: "狂暴型战士，越战越勇",
        speed: 5,
        attack: 15,
        defense: 2,
        skillName: "狂暴模式",
        skillDesc: "攻击力翻倍，持续狂暴",
        accessory: "axe" // 斧纹
    },
    {
        id: 7,
        name: "神射",
        color: "#00CED1",
        desc: "远程型战士，百步穿杨",
        speed: 5,
        attack: 12,
        defense: 4,
        skillName: "万箭齐发",
        skillDesc: "发射多支能量箭",
        accessory: "bow" // 弓
    },
    {
        id: 8,
        name: "治愈",
        color: "#FFB6C1",
        desc: "恢复型战士，生生不息",
        speed: 4,
        attack: 8,
        defense: 5,
        skillName: "圣光复苏",
        skillDesc: "恢复大量生命值",
        accessory: "halo" // 光环
    },
    {
        id: 9,
        name: "武士",
        color: "#C0C0C0",
        desc: "平衡型战士，武艺超群",
        speed: 5,
        attack: 11,
        defense: 5,
        skillName: "奥义·一闪",
        skillDesc: "瞬间拔刀，一击必杀",
        accessory: "katana" // 刀
    }
];

class Fighter {
    constructor(x, y, isPlayer = true, characterId = 0) {
        // 基础属性
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 80;
        this.isPlayer = isPlayer;
        this.characterId = characterId;
        
        // 角色数据
        this.data = CHARACTERS_DATA[characterId];
        
        // 战斗属性
        this.maxHp = 100;
        this.hp = 100;
        this.maxEnergy = 100;
        this.energy = 0;
        this.speed = this.data.speed;
        this.attackPower = this.data.attack;
        this.defensePower = this.data.defense;
        
        // 物理属性
        this.vx = 0;
        this.vy = 0;
        this.gravity = 0.8;
        this.jumpPower = -15;
        this.friction = 0.85;
        this.isGrounded = false;
        this.canDoubleJump = true;
        
        // 方向 (1 = 右, -1 = 左)
        this.facing = isPlayer ? 1 : -1;
        
        // 状态
        this.state = 'idle'; // idle, walk, jump, attack, hurt, block, skill, dead
        this.stateTimer = 0;
        
        // 战斗状态
        this.isAttacking = false;
        this.isBlocking = false;
        this.isInvincible = false;
        this.isFrozen = false;
        this.comboCount = 0;
        this.lastAttackTime = 0;
        
        // 攻击判定
        this.attackHitbox = null;
        this.attackCooldown = 0;
        this.skillCooldown = 0;
        
        // 动画
        this.animFrame = 0;
        this.animTimer = 0;
        
        // 特效
        this.effects = [];
        
        // 统计
        this.stats = {
            damageDealt: 0,
            skillsUsed: 0
        };
    }
    
    // 更新方法
    update(deltaTime, opponent, stageWidth, stageHeight) {
        if (this.state === 'dead') return;
        
        // 冻结状态
        if (this.isFrozen) {
            this.stateTimer -= deltaTime;
            if (this.stateTimer <= 0) {
                this.isFrozen = false;
                this.state = 'idle';
            }
            return;
        }
        
        // 状态计时器
        if (this.stateTimer > 0) {
            this.stateTimer -= deltaTime;
            if (this.stateTimer <= 0) {
                if (this.state === 'attack' || this.state === 'skill') {
                    this.state = 'idle';
                    this.isAttacking = false;
                } else if (this.state === 'hurt') {
                    this.state = 'idle';
                }
            }
        }
        
        // 冷却更新
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.skillCooldown > 0) this.skillCooldown -= deltaTime;
        
        // 自动朝向对手
        if (opponent && !this.isAttacking && this.state !== 'skill') {
            this.facing = opponent.x > this.x ? 1 : -1;
        }
        
        // 物理更新
        this.updatePhysics(deltaTime, stageWidth, stageHeight);
        
        // 更新攻击判定
        this.updateAttackHitbox();
        
        // 检查与对手的碰撞
        if (opponent) {
            this.checkOpponentCollision(opponent);
        }
        
        // 能量恢复
        if (this.energy < this.maxEnergy) {
            this.energy = Math.min(this.maxEnergy, this.energy + 0.05);
        }
        
        // 动画更新
        this.animTimer += deltaTime;
        if (this.animTimer > 100) {
            this.animTimer = 0;
            this.animFrame++;
        }
        
        // 更新特效
        this.updateEffects(deltaTime);
    }
    
    // 物理更新
    updatePhysics(deltaTime, stageWidth, stageHeight) {
        // 应用重力
        if (!this.isGrounded) {
            this.vy += this.gravity;
        }
        
        // 应用速度
        if (!this.isAttacking && this.state !== 'skill' && this.state !== 'hurt') {
            this.x += this.vx;
        }
        this.y += this.vy;
        
        // 摩擦力
        this.vx *= this.friction;
        
        // 地面检测
        const groundY = stageHeight - 80;
        if (this.y >= groundY) {
            this.y = groundY;
            this.vy = 0;
            this.isGrounded = true;
            this.canDoubleJump = true;
            if (this.state === 'jump') {
                this.state = 'idle';
            }
        } else {
            this.isGrounded = false;
        }
        
        // 边界限制
        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
        }
        if (this.x > stageWidth - this.width) {
            this.x = stageWidth - this.width;
            this.vx = 0;
        }
    }
    
    // 移动
    moveLeft() {
        if (this.canAct()) {
            this.vx = -this.speed;
            if (this.isGrounded) this.state = 'walk';
        }
    }
    
    moveRight() {
        if (this.canAct()) {
            this.vx = this.speed;
            if (this.isGrounded) this.state = 'walk';
        }
    }
    
    jump() {
        if (this.canAct()) {
            if (this.isGrounded) {
                this.vy = this.jumpPower;
                this.isGrounded = false;
                this.state = 'jump';
            } else if (this.canDoubleJump) {
                this.vy = this.jumpPower * 0.8;
                this.canDoubleJump = false;
                this.addEffect('jump', this.x + this.width/2, this.y + this.height);
            }
        }
    }
    
    // 普通攻击
    attack() {
        if (!this.canAct() || this.attackCooldown > 0) return false;
        
        const now = Date.now();
        if (now - this.lastAttackTime < 800) {
            this.comboCount = Math.min(this.comboCount + 1, 2);
        } else {
            this.comboCount = 0;
        }
        this.lastAttackTime = now;
        
        this.state = 'attack';
        this.isAttacking = true;
        this.stateTimer = 300; // 攻击持续300ms
        this.attackCooldown = 500;
        
        // 攻击伤害
        const damage = this.attackPower + (this.comboCount * 3);
        const range = 70;
        
        this.attackHitbox = {
            x: this.facing === 1 ? this.x + this.width : this.x - range,
            y: this.y + 20,
            width: range,
            height: 50,
            damage: damage,
            knockback: 5 * this.facing,
            hit: false
        };
        
        return true;
    }
    
    // 防御
    block(active) {
        if (!this.canAct() && active) return;
        
        this.isBlocking = active;
        if (active && this.isGrounded) {
            this.state = 'block';
            this.vx *= 0.5;
        } else if (!active && this.state === 'block') {
            this.state = 'idle';
        }
    }
    
    // 使用绝技
    useSkill() {
        if (!this.canAct() || this.energy < 100 || this.skillCooldown > 0) {
            return false;
        }
        
        this.energy = 0;
        this.state = 'skill';
        this.isAttacking = true;
        this.stateTimer = 800;
        this.skillCooldown = 3000;
        this.stats.skillsUsed++;
        
        // 根据角色执行不同绝技
        this.executeSkill();
        
        return true;
    }
    
    // 执行绝技效果
    executeSkill() {
        const skill = this.data.skillName;
        
        switch(this.characterId) {
            case 0: // 疾风 - 旋风腿
                this.attackHitbox = {
                    x: this.x - 60,
                    y: this.y,
                    width: 160,
                    height: 80,
                    damage: this.attackPower * 2.5,
                    knockback: 10 * this.facing,
                    hit: false,
                    multiHit: true
                };
                break;
                
            case 1: // 铁壁 - 金刚护体
                this.isInvincible = true;
                setTimeout(() => this.isInvincible = false, 3000);
                break;
                
            case 2: // 烈焰 - 烈焰风暴
                this.attackHitbox = {
                    x: this.facing === 1 ? this.x + this.width : this.x - 120,
                    y: this.y - 20,
                    width: 120,
                    height: 120,
                    damage: this.attackPower * 3,
                    knockback: 15 * this.facing,
                    hit: false
                };
                break;
                
            case 3: // 寒冰 - 绝对零度
                this.attackHitbox = {
                    x: this.x - 80,
                    y: this.y - 20,
                    width: 200,
                    height: 120,
                    damage: this.attackPower * 1.5,
                    freeze: true,
                    hit: false
                };
                break;
                
            case 4: // 雷电 - 雷神之怒
                this.attackHitbox = {
                    x: this.facing === 1 ? this.x + this.width : this.x - 100,
                    y: this.y - 50,
                    width: 100,
                    height: 150,
                    damage: this.attackPower * 3.5,
                    knockback: 20 * this.facing,
                    hit: false
                };
                break;
                
            case 5: // 暗影 - 暗影分身
                this.attackHitbox = {
                    x: this.x - 100,
                    y: this.y,
                    width: 240,
                    height: 80,
                    damage: this.attackPower * 2,
                    knockback: 8 * this.facing,
                    hit: false,
                    multiHit: true
                };
                break;
                
            case 6: // 狂战 - 狂暴模式
                this.attackPower *= 2;
                setTimeout(() => this.attackPower = this.data.attack, 5000);
                break;
                
            case 7: // 神射 - 万箭齐发
                this.attackHitbox = {
                    x: this.facing === 1 ? this.x + this.width : this.x - 200,
                    y: this.y + 10,
                    width: 200,
                    height: 60,
                    damage: this.attackPower * 2.2,
                    knockback: 12 * this.facing,
                    hit: false,
                    multiHit: true
                };
                break;
                
            case 8: // 治愈 - 圣光复苏
                this.hp = Math.min(this.maxHp, this.hp + 40);
                this.addEffect('heal', this.x + this.width/2, this.y);
                break;
                
            case 9: // 武士 - 奥义·一闪
                this.attackHitbox = {
                    x: this.facing === 1 ? this.x + this.width : this.x - 180,
                    y: this.y,
                    width: 180,
                    height: 80,
                    damage: this.attackPower * 4,
                    knockback: 25 * this.facing,
                    hit: false
                };
                // 瞬移效果
                this.x += 100 * this.facing;
                break;
        }
        
        this.addEffect('skill', this.x + this.width/2, this.y + this.height/2);
    }
    
    // 更新攻击判定
    updateAttackHitbox() {
        if (!this.attackHitbox || !this.isAttacking) {
            this.attackHitbox = null;
            return;
        }
        
        // 攻击判定随角色移动
        if (this.state === 'attack') {
            const range = 70;
            this.attackHitbox.x = this.facing === 1 ? this.x + this.width : this.x - range;
        }
    }
    
    // 检查与对手碰撞
    checkOpponentCollision(opponent) {
        if (!this.attackHitbox || this.attackHitbox.hit) return;
        
        const hitbox = this.attackHitbox;
        const opponentBox = {
            x: opponent.x,
            y: opponent.y,
            width: opponent.width,
            height: opponent.height
        };
        
        // AABB碰撞检测
        if (hitbox.x < opponentBox.x + opponentBox.width &&
            hitbox.x + hitbox.width > opponentBox.x &&
            hitbox.y < opponentBox.y + opponentBox.height &&
            hitbox.y + hitbox.height > opponentBox.y) {
            
            // 击中对手
            this.onHitOpponent(opponent, hitbox);
            if (!hitbox.multiHit) {
                hitbox.hit = true;
            }
        }
    }
    
    // 击中对手处理
    onHitOpponent(opponent, hitbox) {
        if (opponent.isInvincible) return;
        
        let damage = hitbox.damage;
        let hitLanded = false;
        
        // 对手防御
        if (opponent.isBlocking && opponent.isGrounded) {
            damage *= 0.4; // 防御减少60%伤害
            opponent.addEffect('block', opponent.x + opponent.width/2, opponent.y + opponent.height/2);
        } else {
            hitLanded = true;
            // 击退
            opponent.vx = hitbox.knockback || 5;
            opponent.vy = -5;
            opponent.state = 'hurt';
            opponent.stateTimer = 300;
            opponent.addEffect('hit', opponent.x + opponent.width/2, opponent.y + opponent.height/2);
            
            // 冰冻效果
            if (hitbox.freeze) {
                opponent.isFrozen = true;
                opponent.stateTimer = 2000;
            }
        }
        
        // 造成伤害
        opponent.takeDamage(damage);
        this.stats.damageDealt += damage;
        
        // 积累能量
        this.energy = Math.min(this.maxEnergy, this.energy + 10);
        
        // 通知游戏连击命中
        if (hitLanded && window.game) {
            window.game.onHitLanded(this.isPlayer);
        }
    }
    
    // 受伤
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defensePower * 0.5);
        this.hp = Math.max(0, this.hp - actualDamage);
        
        // 积累能量（被攻击也积累）
        this.energy = Math.min(this.maxEnergy, this.energy + 5);
        
        if (this.hp <= 0) {
            this.state = 'dead';
        }
    }
    
    // 检查是否可以行动
    canAct() {
        return this.state !== 'attack' && 
               this.state !== 'hurt' && 
               this.state !== 'skill' && 
               this.state !== 'dead' &&
               !this.isFrozen;
    }
    
    // 添加特效
    addEffect(type, x, y) {
        this.effects.push({
            type: type,
            x: x,
            y: y,
            timer: 500,
            maxTimer: 500
        });
    }
    
    // 更新特效
    updateEffects(deltaTime) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            this.effects[i].timer -= deltaTime;
            if (this.effects[i].timer <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }
    
    // 绘制
    draw(ctx) {
        ctx.save();
        
        // 无敌闪烁
        if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        // 冰冻效果
        if (this.isFrozen) {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
            ctx.fillRect(this.x - 10, this.y - 10, this.width + 20, this.height + 20);
        }
        
        // 绘制火柴人
        this.drawStickman(ctx);
        
        // 绘制特效
        this.drawEffects(ctx);
        
        ctx.restore();
    }
    
    // 绘制火柴人
    drawStickman(ctx) {
        const x = this.x + this.width / 2;
        const y = this.y;
        const color = this.data.color;
        const facing = this.facing;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 状态动画偏移
        let animOffset = 0;
        if (this.state === 'walk') {
            animOffset = Math.sin(this.animFrame * 0.5) * 5;
        } else if (this.state === 'attack') {
            animOffset = this.stateTimer > 150 ? 10 * facing : 0;
        }
        
        // 头部
        ctx.beginPath();
        ctx.arc(x, y + 15, 12, 0, Math.PI * 2);
        ctx.stroke();
        
        // 身体
        ctx.beginPath();
        ctx.moveTo(x, y + 27);
        ctx.lineTo(x, y + 55);
        ctx.stroke();
        
        // 手臂
        ctx.beginPath();
        const armOffset = this.state === 'attack' ? 20 * facing : animOffset;
        ctx.moveTo(x, y + 35);
        ctx.lineTo(x - 15 + armOffset * 0.5, y + 45);
        ctx.moveTo(x, y + 35);
        ctx.lineTo(x + 15 + armOffset, y + 40);
        ctx.stroke();
        
        // 腿部
        ctx.beginPath();
        const legOffset = this.state === 'walk' ? Math.sin(this.animFrame * 0.5) * 10 : 0;
        ctx.moveTo(x, y + 55);
        ctx.lineTo(x - 12 + legOffset, y + 80);
        ctx.moveTo(x, y + 55);
        ctx.lineTo(x + 12 - legOffset, y + 80);
        ctx.stroke();
        
        // 绘制角色装饰
        this.drawAccessory(ctx, x, y);
        
        // 防御姿态
        if (this.isBlocking) {
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y + 40, 30, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 攻击判定可视化 (调试用，可注释)
        // if (this.attackHitbox && !this.attackHitbox.hit) {
        //     ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        //     ctx.fillRect(this.attackHitbox.x, this.attackHitbox.y, 
        //                  this.attackHitbox.width, this.attackHitbox.height);
        // }
    }
    
    // 绘制角色装饰
    drawAccessory(ctx, x, y) {
        ctx.fillStyle = this.data.color;
        
        switch(this.data.accessory) {
            case 'scarf': // 围巾
                ctx.beginPath();
                ctx.moveTo(x, y + 27);
                ctx.lineTo(x - 20, y + 35);
                ctx.lineTo(x - 15, y + 40);
                ctx.fill();
                break;
                
            case 'shield': // 盾牌
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x - 15, y + 40, 10, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'flame': // 火焰纹
                ctx.fillStyle = '#FF4500';
                ctx.beginPath();
                ctx.moveTo(x + 8, y + 30);
                ctx.lineTo(x + 12, y + 20);
                ctx.lineTo(x + 16, y + 30);
                ctx.fill();
                break;
                
            case 'ice': // 冰晶
                ctx.fillStyle = '#00BFFF';
                ctx.beginPath();
                ctx.arc(x + 12, y + 25, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'thunder': // 雷电纹
                ctx.strokeStyle = '#FFD700';
                ctx.beginPath();
                ctx.moveTo(x + 10, y + 20);
                ctx.lineTo(x + 15, y + 28);
                ctx.lineTo(x + 10, y + 28);
                ctx.lineTo(x + 15, y + 36);
                ctx.stroke();
                break;
                
            case 'mask': // 面具
                ctx.fillStyle = '#8B00FF';
                ctx.fillRect(x - 8, y + 10, 16, 8);
                break;
                
            case 'axe': // 斧纹
                ctx.fillStyle = '#DC143C';
                ctx.fillRect(x + 10, y + 30, 6, 15);
                break;
                
            case 'bow': // 弓
                ctx.strokeStyle = '#00CED1';
                ctx.beginPath();
                ctx.arc(x + 15, y + 35, 12, -Math.PI/2, Math.PI/2);
                ctx.stroke();
                break;
                
            case 'halo': // 光环
                ctx.strokeStyle = '#FFB6C1';
                ctx.beginPath();
                ctx.ellipse(x, y - 5, 15, 5, 0, 0, Math.PI * 2);
                ctx.stroke();
                break;
                
            case 'katana': // 刀
                ctx.strokeStyle = '#C0C0C0';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 10, y + 50);
                ctx.lineTo(x + 25, y + 30);
                ctx.stroke();
                break;
        }
    }
    
    // 绘制特效
    drawEffects(ctx) {
        for (const effect of this.effects) {
            const progress = 1 - (effect.timer / effect.maxTimer);
            
            switch(effect.type) {
                case 'hit':
                    ctx.strokeStyle = `rgba(255, 255, 0, ${1 - progress})`;
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2 + progress * Math.PI;
                        const dist = 20 * progress;
                        ctx.beginPath();
                        ctx.moveTo(effect.x, effect.y);
                        ctx.lineTo(
                            effect.x + Math.cos(angle) * dist,
                            effect.y + Math.sin(angle) * dist
                        );
                        ctx.stroke();
                    }
                    break;
                    
                case 'block':
                    ctx.strokeStyle = `rgba(100, 200, 255, ${1 - progress})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, 30 + progress * 20, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                    
                case 'skill':
                    ctx.fillStyle = `rgba(255, 215, 0, ${0.5 - progress * 0.5})`;
                    ctx.beginPath();
                    ctx.arc(effect.x, effect.y, 50 + progress * 100, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'heal':
                    ctx.fillStyle = `rgba(100, 255, 100, ${1 - progress})`;
                    ctx.font = '20px Arial';
                    ctx.fillText('+', effect.x, effect.y - progress * 30);
                    break;
                    
                case 'jump':
                    ctx.fillStyle = `rgba(200, 200, 200, ${0.5 - progress * 0.5})`;
                    ctx.beginPath();
                    ctx.ellipse(effect.x, effect.y, 20 + progress * 20, 5 + progress * 5, 0, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
        }
    }
    
    // 重置
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.hp = this.maxHp;
        this.energy = 0;
        this.vx = 0;
        this.vy = 0;
        this.state = 'idle';
        this.isAttacking = false;
        this.isBlocking = false;
        this.isInvincible = false;
        this.isFrozen = false;
        this.attackHitbox = null;
        this.effects = [];
        this.stats = { damageDealt: 0, skillsUsed: 0 };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Fighter, CHARACTERS_DATA };
}
