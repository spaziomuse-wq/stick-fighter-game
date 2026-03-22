/**
 * Main - 游戏入口
 * 初始化游戏并绑定事件
 */

// 等待DOM加载
document.addEventListener('DOMContentLoaded', () => {
    // 创建UI实例
    window.ui = new GameUI();
    
    // 创建游戏实例
    window.game = new Game();
    window.game.init();
    
    // 初始化UI
    initUI();
    
    console.log('火柴人格斗游戏已加载');
});

// 初始化UI事件
function initUI() {
    const ui = window.ui;
    const game = window.game;
    
    // 主菜单按钮
    ui.elements.buttons.start.addEventListener('click', () => {
        ui.switchScreen('characterSelect');
        ui.initCharacterSelect(CHARACTERS_DATA);
    });
    
    ui.elements.buttons.help.addEventListener('click', () => {
        ui.showHelp();
    });
    
    // 帮助弹窗
    ui.elements.buttons.closeHelp.addEventListener('click', () => {
        ui.closeHelp();
    });
    
    ui.elements.helpModal.addEventListener('click', (e) => {
        if (e.target === ui.elements.helpModal) {
            ui.closeHelp();
        }
    });
    
    // 角色选择
    ui.elements.buttons.confirmChar.addEventListener('click', () => {
        if (ui.selectedChar !== null) {
            ui.switchScreen('difficultySelect');
            ui.initDifficultySelect();
        }
    });
    
    ui.elements.buttons.backToMenu.addEventListener('click', () => {
        ui.switchScreen('mainMenu');
        ui.selectedChar = null;
    });
    
    // 难度选择
    ui.elements.buttons.backToChar.addEventListener('click', () => {
        ui.switchScreen('characterSelect');
        ui.selectedDifficulty = null;
        document.querySelectorAll('.diffBtn').forEach(btn => {
            btn.classList.remove('selected');
        });
    });
    
    // 结果画面
    ui.elements.buttons.playAgain.addEventListener('click', () => {
        if (ui.selectedChar !== null && ui.selectedDifficulty !== null) {
            game.startFight(ui.selectedChar, ui.selectedDifficulty);
        } else {
            ui.switchScreen('characterSelect');
            ui.initCharacterSelect(CHARACTERS_DATA);
        }
    });
    
    ui.elements.buttons.returnMenu.addEventListener('click', () => {
        game.reset();
        ui.switchScreen('mainMenu');
        ui.selectedChar = null;
        ui.selectedDifficulty = null;
        document.querySelectorAll('.charCard').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelectorAll('.diffBtn').forEach(btn => {
            btn.classList.remove('selected');
        });
        ui.elements.buttons.confirmChar.disabled = true;
    });
    
    // 键盘控制提示（游戏画面中）
    document.addEventListener('keydown', (e) => {
        // ESC键返回菜单（仅在游戏结束时）
        if (e.key === 'Escape' && game.state === 'result') {
            ui.elements.buttons.returnMenu.click();
        }
        
        // P键暂停
        if (e.key === 'p' || e.key === 'P') {
            if (game.state === 'fighting') {
                game.pause();
                ui.showBattleMsg('暂停 - 按P继续');
            } else if (game.state === 'fighting' && !game.isRunning) {
                game.resume();
            }
        }
    });
}

// 防止页面刷新时丢失状态（可选）
window.addEventListener('beforeunload', (e) => {
    if (window.game && window.game.state === 'fighting') {
        e.preventDefault();
        e.returnValue = '游戏正在进行中，确定要离开吗？';
    }
});
