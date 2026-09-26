/*
 * @project: JINN
 * @version: 1.1
 * @license: Only for the TERA project
 * @copyright: Yuriy Ivanov (Vtools) 2019-2021 [progr76@gmail.com]
 * Telegram:  https://t.me/progr76
 * Modifications (c) 2026 AIcuNet
 * Base: Tera commit 8d65eb4 (LICENSE: MIT). Upstream notice above kept unchanged. See LICENSE and NOTICE.
*/

/**
 *
 * Compression of network traffic
 *
**/
'use strict';
if(global.JINN_MODULES)
    global.JINN_MODULES.push({InitClass:InitClass, Name:"Zip"});

const zlib = require('zlib');
const Writable = require('stream').Writable;

global.glUseZip = 1;

const ZIP_PACKET_SIZE = 32 * 1024;
const ZIP_WINDOW_BITS = 15;

const level = zlib.constants.Z_BEST_SPEED;
var zip_options = {flush:zlib.constants.Z_SYNC_FLUSH, chunkSize:ZIP_PACKET_SIZE, windowBits:ZIP_WINDOW_BITS, level:level};

function InitClass(Engine)
{
    Engine.PrepareOnSendZip = function (Child,Data)
    {
        
        if(!Child.EncodeZip)
        {
            
            Child.EncodeZip = zlib.createGzip(zip_options);
            Child.WriterZip = new Writable({objectMode:true, write:function (chunk,encoding,callback)
                {
                    callback(0);
                    Engine.SendToNetwork(Child, chunk);
                }});
            Child.EncodeZip.pipe(Child.WriterZip);
            Child.EncodeZip.on('error', function (err)
            {
                Child.ToError("EncodeZip: " + err, 3);
            });
            Child.WriterZip.WorkNum = Child.WorkNum;
        }
        Child.EncodeZip.write(Buffer.from(Data));
    };
    Engine.PrepareOnReceiveZip = function (Child,Chunk)
    {
        let DecodeZip = Child.DecodeZip;
        if(!DecodeZip)
        {
            DecodeZip = zlib.createGunzip(zip_options);
            Child.WriterUnZip = new Writable({objectMode:true, write:function (chunk,encoding,callback)
                {
                    callback(0);
                    Engine.PrepareOnReceive(Child, chunk);
                }});
            DecodeZip.pipe(Child.WriterUnZip);
            DecodeZip.on('error', function (err)
            {
                // ---- guard: раньше здесь была ТОЛЬКО запись в лог. ----
                // Child.UseZip ставится в InitChild (jinn-connect-item.js:129) — ДО handshake,
                // а jinn-net.js:77 гонит ЛЮБЫЕ входящие байты в Gunzip. Значит сканер,
                // приславший plain HTTP на порт ноды, попадает прямо в декодер
                // ("incorrect header check"). Стрим не уничтожался, соединение жило —
                // лишняя DoS-поверхность + утечка нативного контекста на каждый пакет.
                Child.ToError("DecodeZip packet=" + Child.ReceivePacketCount + " work=" + Child.WriterUnZip.WorkNum + "/" + Child.WorkNum + " " + err);
                try{ DecodeZip.destroy(); }catch(e){}
                delete Child.DecodeZip;
                Engine.OnDeleteConnect(Child, "BadZipStream");   // не-протокольный пир — отбрасываем
            });
            Child.WriterUnZip.WorkNum = Child.WorkNum;
            Child.DecodeZip = DecodeZip;
        }
        DecodeZip.write(Chunk);
    };
}

function TestZip(windowBits,PacketSize)
{
    const zlib = require('zlib');
    
    var zip_options = {flush:zlib.constants.Z_SYNC_FLUSH, chunkSize:PacketSize, windowBits:windowBits, level:zlib.constants.Z_BEST_SPEED};
    
    var Count = 640 * 1024;
    var buffer = require('crypto').randomBytes(Count);
    var startTime = process.hrtime();
    zlib.gzipSync(buffer, zip_options);
    var Time = process.hrtime(startTime);
    var deltaTime = Time[0] * 1000 + Time[1] / 1e6;
    
    console.log("windowBits:" + windowBits + " PacketSize:" + PacketSize + "  Time=" + deltaTime + "ms");
}

