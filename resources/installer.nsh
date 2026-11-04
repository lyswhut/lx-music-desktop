; electron-builder 自定义安装脚本（nsis.include）
; 目的：在「选定安装位置」页改动目录时，自动把安装文件夹名补到路径末尾并显示出来，
; 使输入框里看到的就是最终安装目录（与 electron-builder 安装时追加 ${APP_FILENAME} 的行为一致）。
!include "LogicLib.nsh"
!include "WinMessages.nsh"

!ifdef allowToChangeInstallationDirectory

Function .onVerifyInstDir
  StrLen $0 "$INSTDIR"
  ; 长度不足以构成 "C:\x" 的路径（如驱动器根目录）不做处理
  IntCmp $0 4 done done checkTail

  checkTail:
  StrCpy $3 "$INSTDIR"
  StrCpy $4 "$INSTDIR" 1 -1
  StrCmp $4 "\" 0 compare
    ; 已存在目录时目录页会补一个结尾反斜杠，比较前先去掉
    IntOp $5 $0 - 1
    StrCpy $3 "$INSTDIR" $5

  compare:
  StrLen $5 "$3"
  StrLen $1 "${APP_FILENAME}"
  IntCmp $5 $1 append append tail
  tail:
  IntOp $6 $5 - $1
  StrCpy $7 "$3" $1 $6
  StrCmp $7 "${APP_FILENAME}" done

  append:
  ; 只在已存在的目录上追加，避免用户手动输入路径时每敲一个字符就被改写
  ${If} ${FileExists} "$INSTDIR\*.*"
    FindWindow $9 "#32770" "" $HWNDPARENT
    GetDlgItem $8 $9 1019
    StrCpy $INSTDIR "$3\${APP_FILENAME}"
    ; 把追加后的完整路径回写到目录输入框，并把光标留在用户原本的输入位置
    SendMessage $8 ${WM_SETTEXT} 0 "STR:$INSTDIR"
    SendMessage $8 ${EM_SETSEL} $5 $5
    SendMessage $8 ${EM_SCROLLCARET} 0 0
  ${EndIf}

  done:
FunctionEnd

!endif
