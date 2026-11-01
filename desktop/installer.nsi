; Unsigned cross-build evaluation installer. Native Windows builds use electron-builder's standard installer.
!include "MUI2.nsh"
!include "x64.nsh"
Unicode true
RequestExecutionLevel user
InstallDir "$LOCALAPPDATA\Programs\Zentro - POS"
InstallDirRegKey HKCU "Software\ZentroPOS" "InstallDir"
!define MUI_ABORTWARNING
!define /redef MUI_ICON "${ZENTRO_ICON}"
!define /redef MUI_UNICON "${ZENTRO_ICON}"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP "Zentro requires 64-bit Windows."
    Abort
  ${EndIf}
FunctionEnd
Section "Zentro - POS"
  SetShellVarContext current
  SetOutPath "$INSTDIR"
  File /r "${ZENTRO_APP_DIR}/*"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  CreateShortCut "$DESKTOP\Zentro - POS.lnk" "$INSTDIR\Zentro - POS.exe"
  CreateShortCut "$SMPROGRAMS\Zentro - POS.lnk" "$INSTDIR\Zentro - POS.exe"
  WriteRegStr HKCU "Software\ZentroPOS" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZentroPOS" "DisplayName" "Zentro - POS"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZentroPOS" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZentroPOS" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZentroPOS" "Publisher" "Sajjad Haider"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZentroPOS" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZentroPOS" "NoRepair" 1
SectionEnd
Section "Uninstall"
  SetShellVarContext current
  Delete "$DESKTOP\Zentro - POS.lnk"
  Delete "$SMPROGRAMS\Zentro - POS.lnk"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\ZentroPOS"
  DeleteRegKey HKCU "Software\ZentroPOS"
  ; UserData and local company databases under AppData are deliberately retained.
SectionEnd
