; -- BracketBrowser-Setup-arm64.iss --
;
; This script installs BracketBrowser (arm64).

[Setup]
#define AppName 'Bracket Browser'
#define AppGroupName 'BracketProto\BracketBrowser'
#define AppDefGroupName 'BracketProto\BracketBrowser'
#define CanonicalName 'BracketBrowser.exe'
#define RegistryName 'BracketBrowser'
#define ProgId 'BracketBrowserHTML'
#define ProgHash '{{BROWSEREXEHASH}}'
#define AppVersion '1.0'

AppName={#AppName}
AppVersion={#AppVersion}
WizardStyle=modern
DisableWelcomePage=yes
DefaultDirName={autopf}\{#AppGroupName}
DefaultGroupName={#AppDefGroupName}
UninstallDisplayIcon={app}\BracketBrowser.exe
ChangesAssociations = yes
SetupIconFile=../renderer/img/BracketBrowser.ico
OutputDir=./
OutputBaseFilename=BracketBrowser-win32-arm64-Installer

[Registry]
; Register capabilities section, basic info
Root: HKLM; Subkey: "Software\{#RegistryName}\Capabilities"; ValueType: string; ValueName: "ApplicationDescription"; ValueData: "{#RegistryName}"; Flags: uninsdeletekey createvalueifdoesntexist
Root: HKLM; Subkey: "Software\{#RegistryName}\Capabilities"; ValueType: string; ValueName: "ApplicationIcon"; ValueData: "{app}\BracketBrowser.exe,0"; Flags: uninsdeletekey createvalueifdoesntexist
Root: HKLM; Subkey: "Software\{#RegistryName}\Capabilities"; ValueType: string; ValueName: "ApplicationName"; ValueData: "{#RegistryName}"; Flags: uninsdeletekey createvalueifdoesntexist

; Register app file associations
Root: HKLM; Subkey: "Software\{#RegistryName}\Capabilities\FileAssociations"; ValueType: string; ValueName: ".htm"; ValueData: "{#ProgId}"; Flags: uninsdeletevalue createvalueifdoesntexist
Root: HKLM; Subkey: "Software\{#RegistryName}\Capabilities\FileAssociations"; ValueType: string; ValueName: ".html"; ValueData: "{#ProgId}"; Flags: uninsdeletevalue createvalueifdoesntexist
Root: HKLM; Subkey: "Software\{#RegistryName}\Capabilities\FileAssociations"; ValueType: string; ValueName: ".shtml"; ValueData: "{#ProgId}"; Flags: uninsdeletevalue createvalueifdoesntexist
Root: HKLM; Subkey: "Software\{#RegistryName}\Capabilities\FileAssociations"; ValueType: string; ValueName: ".xht"; ValueData: "{#ProgId}"; Flags: uninsdeletevalue createvalueifdoesntexist
Root: HKLM; Subkey: "Software\{#RegistryName}\Capabilities\FileAssociations"; ValueType: string; ValueName: ".xhtml"; ValueData: "{#ProgId}"; Flags: uninsdeletevalue createvalueifdoesntexist

; Register app url associations
Root: HKLM; Subkey: "Software\{#RegistryName}\Capabilities\URLAssociations"; ValueType: string; ValueName: "http"; ValueData: "{#ProgId}"; Flags: uninsdeletevalue createvalueifdoesntexist
Root: HKLM; Subkey: "Software\{#RegistryName}\Capabilities\URLAssociations"; ValueType: string; ValueName: "https"; ValueData: "{#ProgId}"; Flags: uninsdeletevalue createvalueifdoesntexist

; Register to Default Programs
Root: HKLM; Subkey: "Software\RegisteredApplications"; ValueType: string; ValueName: "{#RegistryName}"; ValueData: "Software\{#RegistryName}\Capabilities"; Flags: uninsdeletekey createvalueifdoesntexist

; Register app url handler
Root: HKLM; Subkey: "Software\Classes\{#ProgId}"; ValueType: string; ValueName: ""; ValueData: "{#RegistryName}"; Flags: uninsdeletekey createvalueifdoesntexist
Root: HKLM; Subkey: "Software\Classes\{#ProgId}\FriendlyTypeName"; ValueType: string; ValueName: ""; ValueData: "{#RegistryName} Document"; Flags: uninsdeletekey createvalueifdoesntexist
Root: HKLM; Subkey: "Software\Classes\{#ProgId}\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\BracketBrowser.exe"" ""%1"""; Flags: uninsdeletevalue createvalueifdoesntexist

; Register application under the client type
Root: HKLM; Subkey: "Software\Clients\StartMenuInternet\{#CanonicalName}"; ValueType: string; ValueName: ""; ValueData: "{#CanonicalName}"; Flags: uninsdeletekey createvalueifdoesntexist

; Setting Default Command for Open With Dialog
Root: HKCR; Subkey: "Applications\{#ProgId}\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\BracketBrowser.exe"" ""%1"""; Flags: uninsdeletevalue createvalueifdoesntexist

; Register handler for .html files
Root: HKCR; Subkey: ".html"; ValueType: string; ValueName: ""; ValueData: "{#ProgId}"; Flags: uninsdeletevalue createvalueifdoesntexist
Root: HKCR; Subkey: "{#ProgId}"; ValueType: string; ValueName: ""; ValueData: "HTML Document"; Flags: uninsdeletekey createvalueifdoesntexist
Root: HKCR; Subkey: "{#ProgId}\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\BracketBrowser.exe,0"; Flags: uninsdeletevalue createvalueifdoesntexist
Root: HKCR; Subkey: "{#ProgId}\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\BracketBrowser.exe"" ""%1"""; Flags: uninsdeletevalue createvalueifdoesntexist

; Register handler for .htm files
Root: HKCR; Subkey: ".htm"; ValueType: string; ValueName: ""; ValueData: "{#ProgId}"; Flags: uninsdeletevalue createvalueifdoesntexist
Root: HKCR; Subkey: "{#ProgId}\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\BracketBrowser.exe,0"; Flags: uninsdeletevalue createvalueifdoesntexist
Root: HKCR; Subkey: "{#ProgId}\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\BracketBrowser.exe"" ""%1"""; Flags: uninsdeletevalue createvalueifdoesntexist

; Register handler for http URLs and be set as the default browser
Root: HKCU; Subkey: "Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice"; ValueType: string; ValueName: "Progid"; ValueData: "{#ProgId}"; Flags: uninsdeletekey createvalueifdoesntexist
Root: HKCU; Subkey: "Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice"; ValueType: string; ValueName: "Hash"; ValueData: "{#ProgHash}"; Flags: uninsdeletekey createvalueifdoesntexist

[Files]
; Include ../../dist/BracketBrowser-win32-arm64:
Source: "../../dist/BracketBrowser-win32-arm64\*"; DestDir: "{app}"; Flags: recursesubdirs;
; Include the splash:
Source: "splash.bmp"; DestDir: "{tmp}"; Flags: dontcopy

[Icons]
Name: "{group}\BracketBrowser"; Filename: "{app}\BracketBrowser.exe"

[Code]
var
  SystemArchitecture: string;
  SystemArchitectureFull: string;
  CustomPage: TWizardPage;
  isSilent: Boolean;

function IsWin64: Boolean;
begin
  Result := (ProcessorArchitecture = paX64);
end;

function IsWinIA32: Boolean;
begin
  Result := (ProcessorArchitecture = paX86);
end;

function IsWinARM64: Boolean;
begin
  Result := IsWin64 and (ProcessorArchitecture = paARM64);
end;

procedure AboutButtonOnClick(Sender: TObject);
begin
  MsgBox('Installer made by oxmc, browser made by BracketProto.', mbInformation, mb_Ok);
end;

procedure InitializeWizard;
var
  BitmapImage1 : TBitmapImage;
  Splash  : TSetupForm;
  AboutButton: TNewButton;
  j: Integer;

begin
  isSilent := False;
  for j := 1 to ParamCount do
    if CompareText(ParamStr(j), '/silent') = 0 then
    begin
      isSilent := True;
      Break;
    end
    else if CompareText(ParamStr(j), '/verysilent') = 0 then
    begin
      isSilent := True;
      Break;
    end;

  // Get the actual system architecture
  if IsWin64 then
  begin
    if IsWinARM64 then
    begin
      SystemArchitectureFull := '64-bit arm (arm64)';
      SystemArchitecture := 'arm64';
    end
    else
    begin
      SystemArchitectureFull := '64-bit (arm64)';
      SystemArchitecture := 'arm64';
    end;
  end
  else if IsWinIA32 then
  begin
    SystemArchitectureFull := '32-bit (ia32)';
    SystemArchitecture := 'ia32';
  end
  else
  begin
    SystemArchitectureFull := 'Unknown';
    SystemArchitecture := 'Unknown';
  end;
  
  // Check if the installer is for the expected architecture
  if CompareText(SystemArchitecture, 'arm64') = 1 then
  begin
    MsgBox('This installer (arm64) is not compatible with your system architecture. Your system is ' + SystemArchitectureFull + '.', mbError, MB_OK);
    WizardForm.Close;
    Abort;
  end;

  // Splash screen
  if not isSilent then
  begin
    Splash := CreateCustomForm;
    Splash.BorderStyle := bsNone;

    BitmapImage1 := TBitmapImage.Create(Splash);
    BitmapImage1.AutoSize := True;
    BitmapImage1.Align := alNone;
    BitmapImage1.Left := 0;
    BitmapImage1.Top := 0;
    BitmapImage1.Center := True;
    BitmapImage1.Parent := Splash;

    ExtractTemporaryFile('splash.bmp');
    BitmapImage1.Bitmap.LoadFromFile(ExpandConstant('{tmp}') + '\splash.bmp');

    Splash.Width := Round(BitmapImage1.Bitmap.Width / 1.2);
    Splash.Height := Round(BitmapImage1.Bitmap.Height / 1.2);

    Splash.Position := poScreenCenter;
  
    Splash.Show;

    BitmapImage1.Refresh;
  end;

  AboutButton := TNewButton.Create(WizardForm);
  AboutButton.Parent := WizardForm;
  AboutButton.Caption := '&About';
  AboutButton.OnClick := @AboutButtonOnClick;

  // Positioning the AboutButton relative to the CancelButton
  AboutButton.Left := WizardForm.ClientWidth - AboutButton.Width - ScaleX(400);
  AboutButton.Top := WizardForm.CancelButton.Top + ScaleY(70);

  // Wait for a few seconds (e.g., 3 seconds) before closing the splash screen
  Sleep(3000);

  if not isSilent then
  begin
    Splash.Close;
    Splash.Free;
  end;
  
  CustomPage := CreateCustomPage(wpWelcome, '{#AppName}', 'Welcome to {#AppName}, This wizard will install {#AppName} to your system.');
end;