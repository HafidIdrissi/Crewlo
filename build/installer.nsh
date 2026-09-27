; Crewlo uses the standard Windows wizard, installed for the current user.
; No agent CLI, credentials or project files are installed or changed here.
!include "${BUILD_RESOURCES_DIR}\crewlo-support.nsh"
!ifndef BUILD_UNINSTALLER
Var crewloCoffeeButton
Var crewloCoffeeBitmap
Var crewloCoffeeNote
!endif
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "$(crewloWelcomeTitle)"
  !define MUI_WELCOMEPAGE_TEXT "$(crewloWelcomeText)"
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customHeader
  LangString crewloSupportTitle ${LANG_ENGLISH} "Enjoy Crewlo? Support its development."
  LangString crewloSupportTitle ${LANG_FRENCH} "Crewlo vous plaît ? Soutenez son développement."
  LangString crewloSupportOptional ${LANG_ENGLISH} "Optional. Crewlo works without a donation."
  LangString crewloSupportOptional ${LANG_FRENCH} "Facultatif. Crewlo fonctionne sans don."
  LangString crewloSupportPending ${LANG_ENGLISH} "Support profile not configured yet."
  LangString crewloSupportPending ${LANG_FRENCH} "Le profil de soutien sera disponible bientôt."
  LangString crewloWelcomeTitle ${LANG_ENGLISH} "Welcome to Crewlo"
  LangString crewloWelcomeTitle ${LANG_FRENCH} "Bienvenue dans Crewlo"
  LangString crewloWelcomeText ${LANG_ENGLISH} "Your agents. A studio of their own.$\r$\n$\r$\nThis wizard installs Crewlo for your Windows account. Choose a folder, then open the studio.$\r$\n$\r$\nYou will connect your own agent CLI and choose a project after installation. Provider accounts and usage costs are separate.$\r$\n$\r$\nYour projects and conversations are kept when you uninstall."
  LangString crewloWelcomeText ${LANG_FRENCH} "Vos agents. Leur propre studio.$\r$\n$\r$\nCet assistant installe Crewlo pour votre compte Windows. Choisissez un dossier, puis ouvrez le studio.$\r$\n$\r$\nVous connecterez votre propre CLI et choisirez un projet après l'installation. Les comptes et frais des fournisseurs restent séparés.$\r$\n$\r$\nVos projets et conversations sont conservés lors de la désinstallation."
!macroend

; Keep the normal launch checkbox. Support is a separate, optional click.
!macro customFinishPage
  !ifndef HIDE_RUN_AFTER_FINISH
    Function StartApp
      ${if} ${isUpdated}
        StrCpy $1 "--updated"
      ${else}
        StrCpy $1 ""
      ${endif}
      ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
    FunctionEnd
    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !endif
  !define MUI_PAGE_CUSTOMFUNCTION_SHOW crewloSupportShow
  !define MUI_PAGE_CUSTOMFUNCTION_DESTROYED crewloSupportCleanup
  !insertmacro MUI_PAGE_FINISH

  Function crewloSupportShow
    ; Leave reboot instructions unobstructed if Windows requests a restart.
    IfRebootFlag crewloSupportDone
    InitPluginsDir
    File /oname=$PLUGINSDIR\crewlo-coffee.bmp "${BUILD_RESOURCES_DIR}\buy-me-a-coffee.bmp"
    ${NSD_CreateLabel} 120u 110u 195u 12u "$(crewloSupportTitle)"
    Pop $crewloCoffeeNote
    ${NSD_CreateButton} 120u 126u 170u 48u "Buy me a coffee"
    Pop $crewloCoffeeButton
    ${NSD_AddStyle} $crewloCoffeeButton ${BS_BITMAP}
    ; Resize the supplied brand bitmap to the actual control size, including DPI.
    System::Alloc 16
    Pop $0
    System::Call 'user32::GetClientRect(p$crewloCoffeeButton,p r0)'
    System::Call '*$0(i,i,i .r3,i .r4)'
    System::Free $0
    IntOp $3 $3 - 8
    IntOp $4 $4 - 8
    System::Call 'user32::LoadImageW(p0,w "$PLUGINSDIR\crewlo-coffee.bmp",i0,i r3,i r4,i0x0010)p.s'
    Pop $crewloCoffeeBitmap
    SendMessage $crewloCoffeeButton ${BM_SETIMAGE} ${IMAGE_BITMAP} $crewloCoffeeBitmap
    !ifdef CREWLO_COFFEE_URL
      ${NSD_OnClick} $crewloCoffeeButton crewloSupportClick
      ${NSD_CreateLabel} 120u 178u 195u 12u "$(crewloSupportOptional)"
    !else
      EnableWindow $crewloCoffeeButton 0
      ${NSD_CreateLabel} 120u 178u 195u 12u "$(crewloSupportPending)"
    !endif
    Pop $crewloCoffeeNote
    crewloSupportDone:
  FunctionEnd

  !ifdef CREWLO_COFFEE_URL
    Function crewloSupportClick
      ExecShell open "${CREWLO_COFFEE_URL}"
    FunctionEnd
  !endif

  Function crewloSupportCleanup
    System::Call 'gdi32::DeleteObject(p$crewloCoffeeBitmap)'
  FunctionEnd
!macroend
