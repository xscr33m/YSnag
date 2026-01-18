; YSnag NSIS Custom Installer Script
; Professional installer with multi-language support
; electron-builder handles MUI pages, we use hooks for customization

!include "LogicLib.nsh"
!include "WinVer.nsh"
!include "FileFunc.nsh"

; Language IDs (NSIS standard)
!define LANG_ENGLISH 1033
!define LANG_GERMAN 1031

; ============================================================================
; WELCOME PAGE - Shown after language selection
; ============================================================================
!macro customWelcomePage
    !insertmacro MUI_PAGE_WELCOME
!macroend

; ============================================================================
; INSTFILES PAGE CUSTOMIZATION - Show details panel from the start
; 
; TECHNICAL EXPLANATION:
; electron-builder's common.nsh sets "ShowInstDetails nevershow" at compile time,
; which hides the details panel. We override this at runtime using SetDetailsView.
; 
; Additionally, electron-builder's installSection.nsh sets "SetDetailsPrint none"
; at the START of the section code, before file extraction. This means the
; individual file extraction messages won't be logged, but the panel will be visible.
; 
; In customInstall (called AFTER extraction), we set SetDetailsPrint both,
; so all our dependency checking and installation messages are properly logged.
; ============================================================================

; Only define installer-specific code when not building the uninstaller
!ifndef BUILD_UNINSTALLER
    !macro customPageAfterChangeDir
        ; Define a custom SHOW function for the InstFiles page
        !define MUI_PAGE_CUSTOMFUNCTION_SHOW InstFilesPageShow
    !macroend

    ; Function called when InstFiles page is shown (before section code runs)
    Function InstFilesPageShow
        ; Show the details panel immediately - this makes the log visible
        ; even though electron-builder set ShowInstDetails nevershow at compile time
        SetDetailsView show
        
        ; Enable detail printing and show initial message
        ; This runs BEFORE the section code, so BEFORE electron-builder's SetDetailsPrint none
        SetDetailsPrint both
        DetailPrint "$(INSTALL_EXTRACTING)"
    FunctionEnd
!endif

; ============================================================================
; MULTI-LANGUAGE STRINGS
; ============================================================================

; English strings
LangString DEPS_REQUIRED ${LANG_ENGLISH} "YSnag requires the following software to function:$\r$\n$\r$\n• Node.js (JavaScript runtime)$\r$\n• yt-dlp (video downloader)$\r$\n• ffmpeg (video processor)$\r$\n$\r$\nThese will now be installed automatically.$\r$\n$\r$\n(Requires internet connection)"
LangString DEPS_INSTALLING ${LANG_ENGLISH} "Installing dependencies (Node.js, yt-dlp, ffmpeg)..."
LangString DEPS_COMPLETE ${LANG_ENGLISH} "Dependencies installed successfully!"
LangString DEPS_FAILED ${LANG_ENGLISH} "Some dependencies could not be installed. YSnag may not work correctly.$\r$\n$\r$\nPlease ensure you have an internet connection and try reinstalling, or install the dependencies manually."
LangString DEPS_CHECKING ${LANG_ENGLISH} "Checking for required dependencies..."
LangString DEPS_FOUND ${LANG_ENGLISH} "All required dependencies are already installed."
LangString DEPS_MISSING ${LANG_ENGLISH} "Missing dependencies detected. Installing required software..."

LangString SHORTCUTS_QUESTION ${LANG_ENGLISH} "Would you like to create a desktop shortcut for YSnag?"
LangString SHORTCUTS_DESKTOP ${LANG_ENGLISH} "Creating desktop shortcut..."
LangString SHORTCUTS_STARTMENU ${LANG_ENGLISH} "Creating Start Menu entries..."
LangString SHORTCUTS_DONE ${LANG_ENGLISH} "Shortcuts created successfully."

LangString UNINSTALL_CONFIG ${LANG_ENGLISH} "Do you also want to remove your settings and download history?$\r$\n$\r$\n(This will delete your configuration files from your home directory)"
LangString UNINSTALL_SHORTCUTS ${LANG_ENGLISH} "Removing shortcuts..."
LangString UNINSTALL_FILES ${LANG_ENGLISH} "Removing application files..."
LangString UNINSTALL_CONFIG_FILES ${LANG_ENGLISH} "Removing configuration files..."
LangString UNINSTALL_COMPLETE ${LANG_ENGLISH} "Uninstallation complete."

LangString INSTALL_COMPLETE ${LANG_ENGLISH} "YSnag has been installed successfully!"
LangString INSTALL_EXTRACTING ${LANG_ENGLISH} "Extracting application files..."

; German strings
LangString DEPS_REQUIRED ${LANG_GERMAN} "YSnag benötigt folgende Software zum Funktionieren:$\r$\n$\r$\n• Node.js (JavaScript-Laufzeitumgebung)$\r$\n• yt-dlp (Video-Downloader)$\r$\n• ffmpeg (Video-Prozessor)$\r$\n$\r$\nDiese werden jetzt automatisch installiert.$\r$\n$\r$\n(Erfordert Internetverbindung)"
LangString DEPS_INSTALLING ${LANG_GERMAN} "Installiere Abhängigkeiten (Node.js, yt-dlp, ffmpeg)..."
LangString DEPS_COMPLETE ${LANG_GERMAN} "Abhängigkeiten erfolgreich installiert!"
LangString DEPS_FAILED ${LANG_GERMAN} "Einige Abhängigkeiten konnten nicht installiert werden. YSnag funktioniert möglicherweise nicht korrekt.$\r$\n$\r$\nBitte stellen Sie sicher, dass Sie eine Internetverbindung haben und versuchen Sie es erneut, oder installieren Sie die Abhängigkeiten manuell."
LangString DEPS_CHECKING ${LANG_GERMAN} "Prüfe erforderliche Abhängigkeiten..."
LangString DEPS_FOUND ${LANG_GERMAN} "Alle erforderlichen Abhängigkeiten sind bereits installiert."
LangString DEPS_MISSING ${LANG_GERMAN} "Fehlende Abhängigkeiten erkannt. Installiere erforderliche Software..."

LangString SHORTCUTS_QUESTION ${LANG_GERMAN} "Möchten Sie eine Desktop-Verknüpfung für YSnag erstellen?"
LangString SHORTCUTS_DESKTOP ${LANG_GERMAN} "Erstelle Desktop-Verknüpfung..."
LangString SHORTCUTS_STARTMENU ${LANG_GERMAN} "Erstelle Startmenü-Einträge..."
LangString SHORTCUTS_DONE ${LANG_GERMAN} "Verknüpfungen erfolgreich erstellt."

LangString UNINSTALL_CONFIG ${LANG_GERMAN} "Möchten Sie auch Ihre Einstellungen und den Download-Verlauf entfernen?$\r$\n$\r$\n(Dies löscht Ihre Konfigurationsdateien aus Ihrem Benutzerverzeichnis)"
LangString UNINSTALL_SHORTCUTS ${LANG_GERMAN} "Entferne Verknüpfungen..."
LangString UNINSTALL_FILES ${LANG_GERMAN} "Entferne Anwendungsdateien..."
LangString UNINSTALL_CONFIG_FILES ${LANG_GERMAN} "Entferne Konfigurationsdateien..."
LangString UNINSTALL_COMPLETE ${LANG_GERMAN} "Deinstallation abgeschlossen."

LangString INSTALL_COMPLETE ${LANG_GERMAN} "YSnag wurde erfolgreich installiert!"
LangString INSTALL_EXTRACTING ${LANG_GERMAN} "Extrahiere Anwendungsdateien..."

; ============================================================================
; CUSTOM INSTALL - After files are installed
; ============================================================================
!macro customInstall
    ; ========================================================================
    ; SHOW INSTALLATION DETAILS AND ENABLE LOGGING
    ; 
    ; At this point, file extraction is complete. We now:
    ; 1. Ensure the details panel is visible (SetDetailsView show)
    ; 2. Enable logging output (SetDetailsPrint both)
    ; 3. Show a message that extraction completed
    ; ========================================================================
    SetDetailsView show
    SetDetailsPrint both
    
    ; Show extraction complete message
    DetailPrint "$(INSTALL_EXTRACTING) OK"
    DetailPrint ""
    
    ; Use register variables $0-$9 for dependency checking
    ; $0 = return value from commands
    ; $1 = depsNeeded flag
    
    ; Initialize - assume no deps needed
    StrCpy $1 "0"
    
    DetailPrint "$(DEPS_CHECKING)"
    
    ; Check for Node.js - first check if 'node' is in PATH
    nsExec::ExecToStack 'cmd /c "node --version >nul 2>&1 && echo FOUND || echo MISSING"'
    Pop $0  ; exit code
    Pop $0  ; stdout (FOUND or MISSING)
    StrCpy $0 $0 5  ; Get first 5 chars
    ${If} $0 == "MISSI"
        ; Not in PATH, check local app data
        IfFileExists "$LOCALAPPDATA\ysnag\bin\node.exe" nodeExists nodeMissing
        nodeMissing:
            StrCpy $1 "1"
            DetailPrint "  Node.js: Missing"
            Goto nodeCheckDone
        nodeExists:
            DetailPrint "  Node.js: Found (local)"
        nodeCheckDone:
    ${Else}
        DetailPrint "  Node.js: Found"
    ${EndIf}
    
    ; Check for yt-dlp
    nsExec::ExecToStack 'cmd /c "yt-dlp --version >nul 2>&1 && echo FOUND || echo MISSING"'
    Pop $0
    Pop $0
    StrCpy $0 $0 5
    ${If} $0 == "MISSI"
        IfFileExists "$LOCALAPPDATA\ysnag\bin\yt-dlp.exe" ytdlpExists ytdlpMissing
        ytdlpMissing:
            StrCpy $1 "1"
            DetailPrint "  yt-dlp: Missing"
            Goto ytdlpCheckDone
        ytdlpExists:
            DetailPrint "  yt-dlp: Found (local)"
        ytdlpCheckDone:
    ${Else}
        DetailPrint "  yt-dlp: Found"
    ${EndIf}
    
    ; Check for ffmpeg
    nsExec::ExecToStack 'cmd /c "ffmpeg -version >nul 2>&1 && echo FOUND || echo MISSING"'
    Pop $0
    Pop $0
    StrCpy $0 $0 5
    ${If} $0 == "MISSI"
        IfFileExists "$LOCALAPPDATA\ysnag\bin\ffmpeg.exe" ffmpegExists ffmpegMissing
        ffmpegMissing:
            StrCpy $1 "1"
            DetailPrint "  ffmpeg: Missing"
            Goto ffmpegCheckDone
        ffmpegExists:
            DetailPrint "  ffmpeg: Found (local)"
        ffmpegCheckDone:
    ${Else}
        DetailPrint "  ffmpeg: Found"
    ${EndIf}
    
    ; If any dependencies are missing, install them
    ${If} $1 == "1"
        DetailPrint "$(DEPS_MISSING)"
        
        ; Show info message about required dependencies
        MessageBox MB_OK|MB_ICONINFORMATION "$(DEPS_REQUIRED)"
        
        DetailPrint "$(DEPS_INSTALLING)"
        SetOutPath "$INSTDIR\resources\installer-scripts"
        
        ; Execute dependency installer (output will be shown in details)
        DetailPrint "Running dependency installer script..."
        nsExec::ExecToLog '"$INSTDIR\resources\installer-scripts\install-deps.cmd"'
        Pop $0
        
        ${If} $0 == 0
            DetailPrint "$(DEPS_COMPLETE)"
        ${Else}
            DetailPrint "$(DEPS_FAILED)"
            MessageBox MB_OK|MB_ICONEXCLAMATION "$(DEPS_FAILED)"
        ${EndIf}
    ${Else}
        DetailPrint "$(DEPS_FOUND)"
    ${EndIf}
    
    ; Ask about desktop shortcut
    MessageBox MB_YESNO|MB_ICONQUESTION "$(SHORTCUTS_QUESTION)" IDYES createShortcut IDNO skipShortcut
    
    createShortcut:
        DetailPrint "$(SHORTCUTS_DESKTOP)"
        DetailPrint "  $DESKTOP\YSnag.lnk -> $INSTDIR\YSnag.exe"
        CreateShortcut "$DESKTOP\YSnag.lnk" "$INSTDIR\YSnag.exe" "" "$INSTDIR\YSnag.exe" 0
        Goto shortcutEnd
    
    skipShortcut:
        DetailPrint "Desktop shortcut skipped by user."
    
    shortcutEnd:
    
    ; Always create Start Menu shortcuts (standard Windows behavior)
    DetailPrint "$(SHORTCUTS_STARTMENU)"
    DetailPrint "  Creating directory: $SMPROGRAMS\YSnag"
    CreateDirectory "$SMPROGRAMS\YSnag"
    DetailPrint "  $SMPROGRAMS\YSnag\YSnag.lnk -> $INSTDIR\YSnag.exe"
    CreateShortcut "$SMPROGRAMS\YSnag\YSnag.lnk" "$INSTDIR\YSnag.exe" "" "$INSTDIR\YSnag.exe" 0
    DetailPrint "  $SMPROGRAMS\YSnag\Uninstall YSnag.lnk -> $INSTDIR\Uninstall YSnag.exe"
    CreateShortcut "$SMPROGRAMS\YSnag\Uninstall YSnag.lnk" "$INSTDIR\Uninstall YSnag.exe"
    DetailPrint "$(SHORTCUTS_DONE)"
    
    DetailPrint ""
    DetailPrint "$(INSTALL_COMPLETE)"
!macroend

; ============================================================================
; CUSTOM UNINSTALL - Clean up
; ============================================================================
!macro customUnInstall
    ; Show uninstallation details (electron-builder hides them by default)
    SetDetailsView show
    SetDetailsPrint both
    
    DetailPrint "$(UNINSTALL_SHORTCUTS)"
    ; Remove desktop shortcut
    DetailPrint "  Removing: $DESKTOP\YSnag.lnk"
    Delete "$DESKTOP\YSnag.lnk"
    
    ; Remove start menu shortcuts
    DetailPrint "  Removing: $SMPROGRAMS\YSnag"
    RMDir /r "$SMPROGRAMS\YSnag"
    
    ; Ask user if they want to remove config files
    MessageBox MB_YESNO|MB_ICONQUESTION "$(UNINSTALL_CONFIG)" IDYES removeConfig IDNO skipConfig
    
    removeConfig:
        DetailPrint "$(UNINSTALL_CONFIG_FILES)"
        ; Remove config and history files from user home
        DetailPrint "  Removing: $PROFILE\.ysnag-config.json"
        Delete "$PROFILE\.ysnag-config.json"
        DetailPrint "  Removing: $PROFILE\.ysnag-history.json"
        Delete "$PROFILE\.ysnag-history.json"
        
        ; Remove local app data (downloaded dependencies)
        DetailPrint "  Removing: $LOCALAPPDATA\ysnag"
        RMDir /r "$LOCALAPPDATA\ysnag"
        Goto doneUninstall
    
    skipConfig:
        DetailPrint "Keeping user configuration files."
    
    doneUninstall:
    DetailPrint ""
    DetailPrint "$(UNINSTALL_COMPLETE)"
!macroend
