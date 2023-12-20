; -- BracketBrowser--Web-Install.iss --
;
; This script installs BracketBrowser by downloading the correct installer.

[Setup]
#define AppName 'Bracket Browser'
#define AppGroupName 'BracketProto\BracketBrowser'
#define AppDefGroupName 'BracketProto\BracketBrowser'
#define AppVersion '1.0'

AppName={#AppName}
AppVersion={#AppVersion}
WizardStyle=modern
DisableWelcomePage=yes
DefaultDirName={autopf}\{#AppGroupName}
DefaultGroupName={#AppDefGroupName}
UninstallDisplayIcon={app}\BracketBrowser.exe
SetupIconFile=../renderer/img/BracketBrowser.ico
OutputDir=./
OutputBaseFilename=BracketBrowser-Web-Installer

[Files]
; Include the splash:
Source: "splash.bmp"; DestDir: "{tmp}"; Flags: dontcopy

; These files will be downloaded:
Source: "{tmp}\BracketBrowser-Setup.exe"; DestDir: "{app}"; Flags: external; DestName: "BracketBrowser-Setup.exe"

[Icons]
Name: "{group}\BracketBrowser"; Filename: "{app}\BracketBrowser.exe"

[Code]
var
  SystemArchitecture: string;
  SystemArchitectureFull: string;
  DownloadedFilePath: String;
  CustomPage: TWizardPage;
  DownloadPage: TDownloadWizardPage;
  InstallFailurePage: TWizardPage;
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

procedure ExitProcess(uExitCode: UINT);
  external 'ExitProcess@kernel32.dll stdcall';

function CheckInternetConnection: Boolean;
var
  WinHttpReq: Variant;
begin
  Result := False;
  try
    WinHttpReq := CreateOleObject('WinHttp.WinHttpRequest.5.1');
    WinHttpReq.Open('GET', 'https://www.google.com/', False);
    WinHttpReq.Send('');
    if WinHttpReq.Status = 200 then
      Result := True;
  except
    Result := False;
  end;
end;

function OnDownloadProgress(const Url, FileName: String; const Progress, ProgressMax: Int64): Boolean;
begin
  Result := True;
  if Progress = ProgressMax then
  begin
    Log(Format('Successfully downloaded file to {tmp}: %s', [FileName]));
    DownloadedFilePath := ExpandConstant('{tmp}') + '\' + FileName;
  end;
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
      SystemArchitectureFull := '64-bit (x64)';
      SystemArchitecture := 'x64';
    end;
  end
  else if IsWinIA32 then
  begin
    SystemArchitectureFull := '32-bit (ia32)';
    SystemArchitecture := 'ia32';
  end
  else
  begin
    SystemArchitecture := 'Unknown';
  end;

  //Splash screen
  if not isSilent then
  begin
    Splash := CreateCustomForm;
    Splash.BorderStyle := bsNone;

    BitmapImage1 := TBitmapImage.Create(Splash);
    BitmapImage1.AutoSize := True;
    BitmapImage1.Align := alClient;
    BitmapImage1.Left := 0;
    BitmapImage1.Top := 0;
    BitmapImage1.stretch := True;
    BitmapImage1.Parent := Splash;

    ExtractTemporaryFile('splash.bmp');
    BitmapImage1.Bitmap.LoadFromFile(ExpandConstant('{tmp}') + '\splash.bmp');

    Splash.Width := BitmapImage1.Width;
    Splash.Height := BitmapImage1.Height;

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

  CustomPage := CreateCustomPage(wpWelcome, '{#AppName}', 'Welcome to {#AppName}, This wizard will download the required files for {#AppName} to run.');
  DownloadPage := CreateDownloadPage(SetupMessage(msgWizardPreparing), SetupMessage(msgPreparingDesc), @OnDownloadProgress);
  InstallFailurePage := CreateCustomPage(DownloadPage.ID, 'Installation Failed', 'Sorry, the installation process encountered an error. Please try again later.');
end;

procedure CancelButtonClickFinishedPage(Sender: TObject);
begin
  // display the "Exit Setup ?" message box and if the user selects "Yes",
  // then exit the process; it is currently the only way how to exit setup
  // process manually
  if ExitSetupMsgBox then
    ExitProcess(0);
end;

procedure CurPageChanged(CurPageID: Integer);
begin
  if CurPageID = InstallFailurePage.ID then
    begin
      WizardForm.BackButton.Enabled := False;
      WizardForm.NextButton.Enabled := False;
      WizardForm.CancelButton.Enabled := True;
      WizardForm.CancelButton.Visible := True;
      WizardForm.CancelButton.OnClick := @CancelButtonClickFinishedPage;
    end;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
var
  ErrorCode: Integer;
begin
  if CurPageID = wpReady then
  begin
    if not CheckInternetConnection then
    begin
      MsgBox('No internet connection. Please try again.', mbError, MB_OK);
      Result := False;
      Exit;
    end;

    if SystemArchitecture = 'Unknown' then
    begin
      MsgBox('The installer was not able to detect your system architecture, the installer thinks you have: ' + SystemArchitectureFull, mbError, MB_OK);
      Result := True;
      CurPageID := InstallFailurePage.ID;
      Exit;
    end;

    DownloadPage.Clear;
    DownloadPage.Add('https://oxmc-php.000webhostapp.com/dl/bb.php?arch=' + SystemArchitecture, 'BracketBrowser-Setup.exe', '');
    DownloadPage.Show;

    try
      DownloadPage.Download; // This downloads the file to {tmp}
      Result := True;
    except
      if DownloadPage.AbortedByUser then
        Log('Aborted by user.')
      else
        SuppressibleMsgBox(AddPeriod(GetExceptionMessage), mbCriticalError, MB_OK, IDOK);
      Result := True;
      Exit;
    end;

    // Execute the downloaded installer immediately after download
    if not Exec(ExpandConstant('{tmp}\BracketBrowser-Setup.exe'), '/SILENT', '', SW_SHOWNORMAL, ewWaitUntilTerminated, ErrorCode) then
    begin
      MsgBox('Failed to execute downloaded installer. Error code: ' + IntToStr(ErrorCode), mbError, MB_OK);
      Result := True;
      CurPageID := InstallFailurePage.ID;
      Exit;
    end;

    Result := True;
  end
  else
    Result := True;
end;