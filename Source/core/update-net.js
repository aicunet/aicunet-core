/*
 * @project: TERA
 * @version: Development (beta)
 * @license: EMPERA.NETWORK
 * @copyright: Yuriy Ivanov (Vtools) 2017-2020 [progr76@gmail.com]
 * Web: https://terafoundation.org
 * Twitter: https://twitter.com/terafoundation
 * Telegram:  https://t.me/terafoundation
 * Modifications (c) 2026 AIcuNet
 * Base: Tera commit 8d65eb4 (LICENSE: MIT). Upstream notice above kept unchanged. See LICENSE and NOTICE.
*/


var fs = require("fs");

// AIcuNet: UpdateCodeFiles disabled in fork
global.UpdateCodeFiles = function (StartNum)
{
    // No-op: auto-update network logic removed in AIcuNet fork.
    return 0;
}

// AIcuNet: UnpackCodeFile disabled in fork
global.UnpackCodeFile = function (fname,bLog)
{
    // No-op: code-file unpacking disabled in AIcuNet fork.
    return;
}

global.RestartNode = function RestartNode(bForce)
{
    // AIcuNet: RestartNode disabled in fork
    if (true) { ToLog("RestartNode: no-op in AIcuNet fork"); return; }
    global.NeedRestart = 1;
    setTimeout(DoExit, 5000);
    
    if(global.nw || global.NWMODE)
    {
    }
    else
    {
        StopChildProcess();
        ToLog("********************************** FORCE RESTART!!!");
        return;
    }
    
    if(this.ActualNodes)
    {
        var it = this.ActualNodes.iterator(), Node;
        while((Node = it.next()) !== null)
        {
            if(Node.Socket)
                CloseSocket(Node.Socket, "Restart");
        }
    }
    
    SERVER.StopServer();
    SERVER.StopNode();
    StopChildProcess();
    
    ToLog("****************************************** RESTART!!!");
    ToLog("EXIT 1");
}

function DoExit()
{
    ToLog("EXIT 2");
    if(global.nw || global.NWMODE)
    {
        ToLog("RESTART NW");
        
        var StrRun = '"' + process.argv[0] + '" --user-data-dir="..\\DATA\\Local" .\n';
        StrRun += StrRun;
        SaveToFile("run-next.bat", StrRun);
        
        const child_process = require('child_process');
        child_process.exec("run-next.bat", {shell:true});
    }
    
    ToLog("EXIT 3");
    process.exit(0);
}

function GetRunLine()
{
    var StrRun = "";
    for(var i = 0; i < process.argv.length; i++)
        StrRun += '"' + process.argv[i] + '" ';
    return StrRun;
}
