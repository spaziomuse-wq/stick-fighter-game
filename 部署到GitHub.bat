@echo off
chcp 65001
echo ===================================
echo  火柴人格斗游戏 - GitHub部署工具
echo ===================================
echo.
echo 正在检查Git状态...

git status

echo.
echo 添加新文件...
git add -A

echo.
echo 提交更改...
git commit -m "添加GitHub Actions自动部署"

echo.
echo 推送到GitHub...
git push -u origin main

echo.
echo ===================================
echo 推送完成！
echo.
echo 接下来：
echo 1. 访问 https://github.com/spaziomuse-wq/stick-fighter-game
echo 2. 点击 Settings -> Pages
echo 3. Source 选择 "GitHub Actions"
echo 4. 等待1分钟，游戏将自动部署！
echo.
echo 游戏链接将是：
echo https://spaziomuse-wq.github.io/stick-fighter-game
echo ===================================
pause
