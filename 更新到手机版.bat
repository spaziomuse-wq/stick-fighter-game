@echo off
chcp 65001
echo ===================================
echo  更新火柴人游戏到手机版
echo ===================================
echo.
echo 正在添加新文件...
git add -A
echo.
echo 提交更改...
git commit -m "添加手机端触摸控制支持"
echo.
echo 推送到GitHub...
git push origin main
echo.
echo ===================================
echo 更新完成！
echo.
echo 等待1分钟后，访问：
echo https://spaziomuse-wq.github.io/stick-fighter-game
echo.
echo 手机访问时请横屏游玩！
echo ===================================
pause
