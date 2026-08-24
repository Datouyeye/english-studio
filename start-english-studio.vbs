Option Explicit
' English Studio one-click launcher
' Double-click to auto-detect & install Node deps / Prisma client / database, then start server (hidden) and open browser.
' Place this file in the project root. It auto-locates the project by its own path, no absolute path needed.
Dim sh, fso, appDir, q
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
q = Chr(34)

' === 1. Check Node.js ===
Dim nodeOk, nodeExec
nodeOk = False
On Error Resume Next
Set nodeExec = sh.Exec("node --version")
Do While Not nodeExec.StdOut.AtEndOfStream
  nodeExec.StdOut.ReadLine
Loop
If Err.Number = 0 Then nodeOk = True
On Error GoTo 0
If Not nodeOk Then
  MsgBox "Node.js is not installed." & vbCrLf & vbCrLf & _
    "Please install it from https://nodejs.org (LTS version)." & vbCrLf & _
    "After installation, double-click this file again.", vbExclamation, "English Studio"
  WScript.Quit
End If

' === 2. Install dependencies if missing ===
If Not fso.FolderExists(appDir & "\node_modules") Then
  If MsgBox("First run will install dependencies (a few minutes). Continue?", vbOKCancel, "English Studio") <> vbOK Then
    WScript.Quit
  End If
  sh.Run "cmd /c set npm_config_registry=https://registry.npmmirror.com && cd /d " & q & appDir & q & " && npx pnpm@10 install", 0, True
  If Not fso.FolderExists(appDir & "\node_modules") Then
    MsgBox "Failed to install dependencies. Please check your network and try again.", vbExclamation, "English Studio"
    WScript.Quit
  End If
End If

' === 3. Generate Prisma client if missing ===
If Not fso.FolderExists(appDir & "\generated\prisma") Then
  sh.Run "cmd /c cd /d " & q & appDir & q & " && npx pnpm@10 db:generate", 0, True
End If

' === 4. Initialize database if missing ===
If Not fso.FileExists(appDir & "\dev.db") Then
  sh.Run "cmd /c cd /d " & q & appDir & q & " && npx pnpm@10 db:migrate", 0, True
End If

' === 5. Port check: if already running, just open browser ===
Dim portExec, output
Set portExec = sh.Exec("cmd /c netstat -ano | findstr LISTENING | findstr :3000")
output = ""
Do While Not portExec.StdOut.AtEndOfStream
  output = output & portExec.StdOut.ReadLine
Loop
If InStr(output, ":3000") > 0 Then
  sh.Run "cmd /c start http://localhost:3000", 0, False
  WScript.Quit
End If

' === 6. Start dev server in background (hidden window) ===
sh.CurrentDirectory = appDir
sh.Run "cmd /c cd /d " & q & appDir & q & " && node " & q & appDir & "\node_modules\next\dist\bin\next" & q & " dev -p 3000", 0, False

' === 7. Open browser after warmup ===
WScript.Sleep 10000
sh.Run "cmd /c start http://localhost:3000", 0, False
