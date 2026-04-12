; NSIS 安装/卸载钩子脚本
; 用于在卸载时清理 logs、config 和 data 目录

!macro customUnInstall
  ; 先清空日志文件内容
  Delete "$INSTDIR\logs\*.log"
  Delete "$INSTDIR\logs\*.log.*"
  
  ; 删除 logs 目录及其所有内容
  RMDir /r "$INSTDIR\logs"
  
  ; 删除 config 目录及其所有内容
  RMDir /r "$INSTDIR\config"
  
  ; 删除 data 目录及其所有内容
  RMDir /r "$INSTDIR\data"
!macroend
