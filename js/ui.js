/**
 * UI 类 - 游戏界面管理
 * 处理所有UI更新和动画
 */

class GameUI {
    constructor() {
        // 缓存DOM元素
        this.elements = {
            screens: {
                mainMenu: document.getElementById('mainMenu'),
                characterSelect: document.getElementById('characterSelect'),
                difficultySelect: document.getElementById('difficultySelect'),
                gameScreen: document.getElementById('gameScreen'),
                resultScreen: document.getElementById('resultScreen')
            },
            buttons: {
                start: document.getElementById('startBtn'),
                help: document.getElementById('helpBtn'),
                confirmChar: document.getElementById('confirmCharBtn'),
                backToMenu: document.getElementById('backToMenuBtn'),
                backToChar: document.getElementById('backToCharBtn'),
                playAgain: document.getElementById('playAgainBtn'),
                returnMenu: document.getElementById('returnMenuBtn'),
                closeHelp: document.getElementById('closeHelpBtn')
            },
            characterGrid: document.getElementById('characterGrid'),
            charInfo: {
                name: document.getElementById('charName'),
                desc: document.getElementById('charDesc'),
                skill: document.getElementById('charSkill'),
                speed: document.getElementById('statSpeed'),
                attack: document.getElementById('statAttack'),
                defense: document.getElementById('statDefense')
            },
            gameUI: {
                p1Health: document.getElementById('p1Health'),
                p1Damage: document.getElementById('p1Damage'),
                p1Energy: document.getElementById('p1Energy'),
                p1Name: document.getElementById('p1Name'),
                p2Health: document.getElementById('p2Health'),
                p2Damage: document.getElementById('p2Damage'),
                p2Energy: document.getElementById('p2Energy'),
                p2Name: document.getElementById('p2Name'),
                timer: document.getElementById('timer'),
                countdown: document.getElementById('countdown'),
                battleMsg: document.getElementById('battleMsg'),
                comboDisplay: document.getElementById('comboDisplay')
            },
            result: {
                title: document.getElementById('resultTitle'),
                damage: document.getElementById('statDamage'),
                skills: document.getElementById('statSkills'),
                time: document.getElementById('statTime')
            },
            helpModal: document.getElementById('helpModal'),
            canvas: document.getElementById('gameCanvas')
        };
        
        // 状态
        this.currentScreen = 'mainMenu';
        this.selectedChar = null;
        this.selectedDifficulty = null;
        
        // 倒计时动画
        this.countdownActive = false;
        
        // 伤害显示缓存
        this.healthCache = { p1: 100, p2: 100 };
    }
    
    // 切换屏幕
    switchScreen(screenName) {
        // 隐藏所有屏幕
        Object.values(this.elements.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // 显示目标屏幕
        if (this.elements.screens[screenName]) {
            this.elements.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
    }
    
    // 初始化角色选择界面
    initCharacterSelect(charactersData) {
        const grid = this.elements.characterGrid;
        grid.innerHTML = '';
        
        charactersData.forEach((char, index) => {
            const card = document.createElement('div');
            card.className = 'charCard';
            card.dataset.id = index;
            
            // 创建简单图标
            const icon = document.createElement('div');
            icon.className = 'charIcon';
            icon.style.background = `linear-gradient(135deg, ${char.color}, ${this.darkenColor(char.color, 30)})`;
            icon.style.borderRadius = '50%';
            icon.style.border = `3px solid ${char.color}`;
            
            const name = document.createElement('div');
            name.className = 'charName';
            name.textContent = char.name;
            
            card.appendChild(icon);
            card.appendChild(name);
            
            // 点击事件
            card.addEventListener('click', () => {
                this.selectCharacter(index, char);
            });
            
            grid.appendChild(card);
        });
    }
    
    // 选择角色
    selectCharacter(id, charData) {
        // 更新选中状态
        document.querySelectorAll('.charCard').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`.charCard[data-id="${id}"]`).classList.add('selected');
        
        this.selectedChar = id;
        
        // 更新信息显示
        this.elements.charInfo.name.textContent = charData.name;
        this.elements.charInfo.desc.textContent = charData.desc;
        this.elements.charInfo.skill.textContent = `绝技: ${charData.skillName}`;
        
        // 更新属性条
        this.elements.charInfo.speed.style.width = `${(charData.speed / 8) * 100}%`;
        this.elements.charInfo.attack.style.width = `${(charData.attack / 15) * 100}%`;
        this.elements.charInfo.defense.style.width = `${(charData.defense / 8) * 100}%`;
        
        // 启用确认按钮
        this.elements.buttons.confirmChar.disabled = false;
    }
    
    // 初始化难度选择
    initDifficultySelect() {
        document.querySelectorAll('.diffBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diffBtn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedDifficulty = btn.dataset.diff;
                
                // 自动开始游戏
                setTimeout(() => {
                    if (window.game) {
                        window.game.startFight(this.selectedChar, this.selectedDifficulty);
                    }
                }, 300);
            });
        });
    }
    
    // 更新游戏UI
    updateGameUI(player, npc, timeLeft) {
        // 更新计时器
        const timerEl = this.elements.gameUI.timer;
        timerEl.textContent = Math.ceil(timeLeft);
        
        if (timeLeft <= 10) {
            timerEl.classList.add('warning');
        } else {
            timerEl.classList.remove('warning');
        }
        
        // 更新玩家1血条
        this.updateHealthBar(
            this.elements.gameUI.p1Health,
            this.elements.gameUI.p1Damage,
            player.hp,
            this.healthCache.p1,
            'p1'
        );
        
        // 更新玩家1能量条
        this.updateEnergyBar(this.elements.gameUI.p1Energy, player.energy);
        
        // 更新玩家2血条
        this.updateHealthBar(
            this.elements.gameUI.p2Health,
            this.elements.gameUI.p2Damage,
            npc.hp,
            this.healthCache.p2,
            'p2'
        );
        
        // 更新玩家2能量条
        this.updateEnergyBar(this.elements.gameUI.p2Energy, npc.energy);
    }
    
    // 更新血条
    updateHealthBar(healthEl, damageEl, currentHp, cachedHp, cacheKey) {
        const healthPercent = (currentHp / 100) * 100;
        healthEl.style.width = `${healthPercent}%`;
        
        // 延迟显示伤害
        if (currentHp < cachedHp) {
            setTimeout(() => {
                damageEl.style.width = `${healthPercent}%`;
            }, 100);
        } else if (currentHp > cachedHp) {
            // 治疗
            damageEl.style.width = `${healthPercent}%`;
        }
        
        this.healthCache[cacheKey] = currentHp;
    }
    
    // 更新能量条
    updateEnergyBar(energyEl, energy) {
        const energyPercent = (energy / 100) * 100;
        energyEl.style.width = `${energyPercent}%`;
        
        if (energy >= 100) {
            energyEl.classList.add('full');
        } else {
            energyEl.classList.remove('full');
        }
    }
    
    // 设置玩家名称
    setPlayerNames(playerChar, npcChar) {
        this.elements.gameUI.p1Name.textContent = playerChar.name;
        this.elements.gameUI.p2Name.textContent = npcChar.name;
    }
    
    // 显示321倒计时
    showCountdown(callback) {
        const countdownEl = this.elements.gameUI.countdown;
        const countNum = countdownEl.querySelector('.countNum');
        
        this.countdownActive = true;
        countdownEl.classList.add('active');
        
        const numbers = ['3', '2', '1', 'FIGHT!'];
        let index = 0;
        
        const showNumber = () => {
            if (index >= numbers.length) {
                countdownEl.classList.remove('active');
                this.countdownActive = false;
                if (callback) callback();
                return;
            }
            
            countNum.textContent = numbers[index];
            countNum.style.animation = 'none';
            countNum.offsetHeight; // 触发重排
            countNum.style.animation = 'countPop 0.8s ease';
            
            index++;
            setTimeout(showNumber, index === numbers.length ? 500 : 1000);
        };
        
        showNumber();
    }
    
    // 显示战斗消息
    showBattleMsg(msg, duration = 1500) {
        const msgEl = this.elements.gameUI.battleMsg;
        msgEl.textContent = msg;
        msgEl.classList.add('show');
        
        setTimeout(() => {
            msgEl.classList.remove('show');
        }, duration);
    }
    
    // 显示连击数
    showCombo(count, isNpc = false) {
        const comboEl = this.elements.gameUI.comboDisplay;
        const numEl = comboEl.querySelector('.comboNum');
        
        if (count < 2) {
            comboEl.classList.remove('show');
            return;
        }
        
        numEl.textContent = count;
        comboEl.classList.remove('show');
        
        // 强制重绘以触发动画
        void comboEl.offsetWidth;
        
        comboEl.classList.add('show');
        
        // 连击数越高颜色越红
        if (count >= 5) {
            numEl.style.color = '#ff4444';
        } else if (count >= 3) {
            numEl.style.color = '#ff8800';
        } else {
            numEl.style.color = '#ffd700';
        }
        
        // 3秒后隐藏
        clearTimeout(this.comboTimer);
        this.comboTimer = setTimeout(() => {
            comboEl.classList.remove('show');
        }, 2000);
    }
    
    // 显示结果
    showResult(winner, player, timeLeft) {
        const titleEl = this.elements.result.title;
        
        if (winner === 'player') {
            titleEl.textContent = '胜利!';
            titleEl.className = 'resultTitle win';
        } else if (winner === 'npc') {
            titleEl.textContent = '失败...';
            titleEl.className = 'resultTitle lose';
        } else {
            titleEl.textContent = '平局';
            titleEl.className = 'resultTitle draw';
        }
        
        this.elements.result.damage.textContent = Math.floor(player.stats.damageDealt);
        this.elements.result.skills.textContent = player.stats.skillsUsed;
        this.elements.result.time.textContent = `${Math.ceil(timeLeft)}s`;
        
        this.switchScreen('resultScreen');
    }
    
    // 显示帮助
    showHelp() {
        this.elements.helpModal.classList.add('active');
    }
    
    // 关闭帮助
    closeHelp() {
        this.elements.helpModal.classList.remove('active');
    }
    
    // 工具函数：加深颜色
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    }
    
    // 获取画布
    getCanvas() {
        return this.elements.canvas;
    }
    
    // 重置UI状态
    reset() {
        this.healthCache = { p1: 100, p2: 100 };
        this.elements.gameUI.p1Health.style.width = '100%';
        this.elements.gameUI.p1Damage.style.width = '100%';
        this.elements.gameUI.p2Health.style.width = '100%';
        this.elements.gameUI.p2Damage.style.width = '100%';
        this.elements.gameUI.timer.classList.remove('warning');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameUI };
}
