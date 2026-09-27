; Crewlo uses the standard Windows wizard, installed for the current user.
; No agent CLI, credentials or project files are installed or changed here.
!macro customInstallMode
  StrCpy $isForceCurrentInstall "1"
!macroend

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "$(crewloWelcomeTitle)"
  !define MUI_WELCOMEPAGE_TEXT "$(crewloWelcomeText)"
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customHeader
  LangString crewloWelcomeTitle ${LANG_ENGLISH} "Welcome to Crewlo"
  LangString crewloWelcomeTitle ${LANG_FRENCH} "Bienvenue dans Crewlo"
  LangString crewloWelcomeText ${LANG_ENGLISH} "Your agents. A studio of their own.$\r$\n$\r$\nThis wizard installs Crewlo for your Windows account. Choose a folder, then open the studio.$\r$\n$\r$\nYou will connect your own agent CLI and choose a project after installation. Provider accounts and usage costs are separate.$\r$\n$\r$\nYour projects and conversations are kept when you uninstall."
  LangString crewloWelcomeText ${LANG_FRENCH} "Vos agents. Leur propre studio.$\r$\n$\r$\nCet assistant installe Crewlo pour votre compte Windows. Choisissez un dossier, puis ouvrez le studio.$\r$\n$\r$\nVous connecterez votre propre CLI et choisirez un projet après l'installation. Les comptes et frais des fournisseurs restent séparés.$\r$\n$\r$\nVos projets et conversations sont conservés lors de la désinstallation."
!macroend
