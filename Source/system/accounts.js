/*
 * @project: TERA
 * @version: 2
 * @license: EMPERA.NETWORK
 * @copyright: Yuriy Ivanov (Vtools) 2017-2021 [progr76@gmail.com]
 * Web: https://terafoundation.org
 * Twitter: https://twitter.com/terafoundation
 * Telegram:  https://t.me/terafoundation
 * Modifications (c) 2026 AIcuNet
 * Base: Tera commit 8d65eb4 (LICENSE: MIT). Upstream notice above kept unchanged. See LICENSE and NOTICE.
*/


"use strict";

const MULTI_COIN_FORMAT={MaxCount:"uint32", Arr:[{Token:"str", Arr:[{ID:"str", SumCOIN:"uint", SumCENT:"uint32", Flag:"uint"}], Flag:"uint"}], Flag:"uint"};

//Accounts  and states engine

const MerkleDBRow = require("./accounts-merkle-dbrow");

global.OLD_BLOCK_CREATE_INTERVAL = 10;

global.TYPE_TRANSACTION_CREATE = 100;
global.TYPE_TRANSACTION_ACC_CHANGE = 102;

const TYPE_DEPRECATED_TRANSFER1 = 105;
const TYPE_DEPRECATED_TRANSFER2 = 110;
global.TYPE_TRANSACTION_TRANSFER3 = 111;
global.TYPE_TRANSACTION_TRANSFER5 = 112;

global.TYPE_TRANSACTION_ACC_HASH_OLD = 119;
global.TYPE_TRANSACTION_ACC_HASH = 210;

global.FORMAT_ACC_CREATE = "{\
    Type:byte,\
    Currency:uint,\
    PubKey:arr33,\
    Name:str40,\
    Adviser:uint,\
    Smart:uint32,\
    Reserve:arr3,\
    }";

global.FORMAT_MONEY_TRANSFER1 = '{\
    Type:byte,\
    Currency:uint,\
    FromID:uint,\
    To:[{ID:uint,SumCOIN:uint,SumCENT:uint32}],\
    Description:str,\
    OperationID:uint,\
    Sign:arr64,\
    }';
const WorkStructTransfer = {};
global.FORMAT_MONEY_TRANSFER_BODY1 = FORMAT_MONEY_TRANSFER1.replace("Sign:arr64,", "");

const FORMAT_MONEY_TRANSFER2 = "{\
    Type:byte,\
    Version:byte,\
    Currency:uint,\
    FromID:uint,\
    To:[{ID:uint,SumCOIN:uint,SumCENT:uint32}],\
    Description:str,\
    OperationID:uint,\
    Sign:arr64,\
    }";
const WorkStructTransfer2 = {};
global.FORMAT_MONEY_TRANSFER_BODY2 = FORMAT_MONEY_TRANSFER2.replace("Sign:arr64,", "");

global.FORMAT_MONEY_TRANSFER3 = "{\
    Type:byte,\
    Version:byte,\
    OperationID:uint,\
    FromID:uint,\
    To:[{PubKey:tr,ID:uint,SumCOIN:uint,SumCENT:uint32}],\
    Description:str,\
    DeprecatedOperationID:uint,\
    Body:tr,\
    Sign:arr64,\
    }";
const WorkStructTransfer3 = {};
global.FORMAT_MONEY_TRANSFER_BODY3 = FORMAT_MONEY_TRANSFER3.replace("Sign:arr64,", "");


//new
global.FORMAT_MONEY_TRANSFER5 = "{\
    Type:byte,\
    Version:byte,\
    OperationID:uint,\
    FromID:uint,\
    TxMaxBlock:uint,\
    TxTicks:uint32,\
    ToID:uint,\
    Amount:{SumCOIN:uint,SumCENT:uint32},\
    Currency:uint32,\
    TokenID:str,\
    Description:str,\
    CodeVer:uint16,\
    Reserve:uint32,\
    Body:tr,\
    Sign:arr64,\
    }";
const WorkStructTransfer5 = {};
global.FORMAT_MONEY_TRANSFER_BODY5 = FORMAT_MONEY_TRANSFER5.replace("Sign:arr64,", "");


global.FORMAT_ACCOUNT_HASH = "{\
    Type:byte,\
    BlockNum:uint,\
    AccHash:hash,\
    AccountMax:uint,\
    SmartHash:hash,\
    SmartCount:uint\
    }";
global.WorkStructAccHash = {};

global.FORMAT_ACC_CHANGE = {Type:"byte", OperationID:"uint", Account:"uint", PubKey:"arr33", Name:"str40", Reserve:"arr10",
    Sign:"arr64", };


class AccountApp extends require("./accounts-hash")
{
    constructor()
    {
        var bReadOnly = (global.PROCESS_NAME !== "TX");
        super(bReadOnly)
        this.FORMAT_ACCOUNT_ROW = "{\
            Currency:uint,\
            PubKey:arr33,\
            Name:str40,\
            Value:{SumCOIN:uint,SumCENT:uint32, OperationID:uint,Smart:uint32,Data:arr80},\
            BlockNumCreate:uint,\
            Adviser:uint,\
            KeyValueSize:uint,\
            Reserve:arr3,\
            }";


        this.SIZE_ACCOUNT_ROW = 6 + 33 + 40 + (6 + 4 + 6 + 84) + 6 + 6 + 9;
        
        this.DBState = new MerkleDBRow("accounts-state", this.FORMAT_ACCOUNT_ROW, bReadOnly, "Num", 0, this.SIZE_ACCOUNT_ROW);
        REGISTER_TR_DB(this.DBState, 10);




        if(global.READ_ONLY_DB || global.START_SERVER)
            return;
        
        if(!bReadOnly)
            this.Start()
    }
    
    Name()
    {
        return "Account";
    }
    
    Start(bClean)
    {
        this.DBState.InitMerkleTree()
        this.CalcMerkleTree(1)
        
        // tx-process var
        this.BadBlockNum = 0
        this.BadBlockNumChecked = 0
        this.BadBlockNumHash = 0
        
        this.InitAMIDTab()
        
        ToLog("ACCOUNTS MAX_NUM:" + this.DBState.GetMaxNum())
    }
    
    Close()
    {
        
        this.DBState.Close()
        
        this.CloseAccountsHash()
        this.CloseRest()
        this.CloseHistory()
        
        this.CloseKeyValue()
    }
    
    ClearDataBase()
    {
        
        this.DBState.MerkleTree = undefined
        this.DBState.Clear()
        
        this.ClearAccountsHash()
        this.ClearRest()
        
        this.ClearHistory()
        this.ClearKeyValue()
        if(SHARD_PARAMS.GenesisAccountCreate)
            SHARD_PARAMS.GenesisAccountCreate()
        else
            this.GenesisAccountCreate()
        
        var MaxNum = this.DBState.GetMaxNum();
        if(MaxNum >= 0)
            this.DBStateHistory.Write({Num:MaxNum})
        
        this.Start()
    }
    GenesisAccountCreate()
    {
        // AIcuNet genesis layout:
        //   acc 0    = keyless protocol-faucet, PubKey:[], 1.0 * TOTAL_SUPPLY_TERA = 1e12 AXNT.
        //              Чеканит через DoCoinBaseTR (сплит задан константами ниже).
        //   acc 1–8  = служебные аккаунты проекта (pubkeys ниже), баланс 0 на genesis:
        //                1 Fond One (5%-receiver)  2 dev (3%-receiver)  3 Team fund
        //                4 Reserv 1                5 Reserv 2           6 Reserv 3
        //                7 Airdrops                8 Governance
        //   acc 9    = пустой.
        //   acc 10+  НЕ засевается — майнинг-аккаунты создаются штатно через TRCreateAccount.
        //              ARR_PUB_KEY остаётся как dev-test stub в crypto-library.js (LOCAL_RUN only).
        this.DBStateWriteInner({Num:0, PubKey:[], Value:{BlockNum:1, SumCOIN:1.0 * TOTAL_SUPPLY_TERA}, Name:"AINET system account (keyless protocol-faucet, unspendable, PubKey:[], cap 1e12 AICU)"}, 1)
        this.DBStateWriteInner({Num:1, PubKey:GetArrFromHex("02C3EED876CC107E52842BA104F0CABF1DD6F86419ACC4B046735A028E4B154CD0"), Value:{BlockNum:1, SumCOIN:0}, Name:"Fond One (5% split receiver)"})
        this.DBStateWriteInner({Num:2, PubKey:GetArrFromHex("0296557A5FE9CD2B643544B5B3189CBC696665A666EF370CEB60FD4C2C74EC3A52"), Value:{BlockNum:1, SumCOIN:0}, Name:"Dev (3% split receiver)"})
        this.DBStateWriteInner({Num:3, PubKey:GetArrFromHex("022783BC9667AC32E7C25A02EEA32021DB7CC663B42072BF493C748A2BFE6976B7"), Value:{BlockNum:1, SumCOIN:0}, Name:"Team fund"})
        this.DBStateWriteInner({Num:4, PubKey:GetArrFromHex("03E4E6B1A416946A1A4B721D12E24AD326B03FC3CE3500BD3AA950D6B4A663EE7E"), Value:{BlockNum:1, SumCOIN:0}, Name:"Reserv 1"})
        this.DBStateWriteInner({Num:5, PubKey:GetArrFromHex("02943DA6DCCE8DF34694FF6500E338186E50E9F4CC7F36F553D6394EA0143F5522"), Value:{BlockNum:1, SumCOIN:0}, Name:"Reserv 2"})
        this.DBStateWriteInner({Num:6, PubKey:GetArrFromHex("02B4F263CB8C6B2B087C1F14CD44BCBA83751B2FE09C7C203F5AB30B19E54B4FDB"), Value:{BlockNum:1, SumCOIN:0}, Name:"Reserv 3"})
        this.DBStateWriteInner({Num:7, PubKey:GetArrFromHex("03FFE5D4CD4D15542032C44088AB8AD4CD4B8C6186E695985A22E54F2424EE89BB"), Value:{BlockNum:1, SumCOIN:0}, Name:"Airdrops"})
        this.DBStateWriteInner({Num:8, PubKey:GetArrFromHex("03D5274482AC55F6D3ED46A2544163B8BBF8124B3710C5B0E3AF6AA98EAC0D6CBD"), Value:{BlockNum:1, SumCOIN:0}, Name:"Governance"})
        this.DBStateWriteInner({Num:9, PubKey:[], Value:{BlockNum:1, SumCOIN:0}, Name:"Reserved (empty)"})
    }
    
    DBStateTruncateInner(Num)
    {
        this.DBState.Truncate(Num)
        
        this.TruncateRest(Num)
        this.TruncateAMIDTab(Num)
    }
    
    OnDeleteBlock(BlockNum)
    {
        if(BlockNum < 1)
            return;
        
        this.DeleteAccountHashFromBlock(BlockNum)
        
        var Item = this.DBState.FindItemFromMax(BlockNum, "BlockNumCreate");
        if(!Item || !Item.Num)
            return;
        var LastNum = Item.Num - 1;
        this.DBStateTruncateInner(LastNum)
        this.DBStateHistory.Truncate(LastNum)
    }
    
    OnProcessBlockStart(Block)
    {
        this.CreateTrCount = 0
        if(Block.BlockNum < 1)
            return;
    }
    
    OnProcessBlockFinish(Block)
    {
        var bErr = 0;
        try
        {
            BEGIN_TRANSACTION()
            
            if(SHARD_PARAMS.DoCoinBaseTR)
                SHARD_PARAMS.DoCoinBaseTR(Block)
            else
                this.DoCoinBaseTR(Block)
            
            COMMIT_TRANSACTION(Block.BlockNum, 0xFFFF)
        }
        catch(e)
        {
            bErr = 1
            ToLogTx("BlockNum:" + Block.BlockNum + " - DoCoinBaseTR: " + e)
        }
        
        if(bErr)
        {
            ROLLBACK_TRANSACTION()
        }
        
        this.WriteHash100(Block)
    }
    
    OnProcessTransaction(Block, Body, BlockNum, TrNum, ContextFrom)
    {
        var Type = Body[0];
        
        var Result = false;
        switch(Type)
        {
            case TYPE_TRANSACTION_CREATE:
                {
                    Result = this.TRCreateAccount(Block, Body, BlockNum, TrNum, ContextFrom);
                    break;
                }
                
            case TYPE_DEPRECATED_TRANSFER1:
                {
                    Result = this.TRTransferMoney(Block, Body, BlockNum, TrNum, FORMAT_MONEY_TRANSFER1, WorkStructTransfer);
                    break;
                }
            case TYPE_DEPRECATED_TRANSFER2:
                {
                    Result = this.TRTransferMoney(Block, Body, BlockNum, TrNum, FORMAT_MONEY_TRANSFER2, WorkStructTransfer2);
                    break;
                }
            case TYPE_TRANSACTION_TRANSFER3:
                {
                    Result = this.TRTransferMoney(Block, Body, BlockNum, TrNum, FORMAT_MONEY_TRANSFER3, WorkStructTransfer3);
                    break;
                }
            case TYPE_TRANSACTION_TRANSFER5:
            {
                Result = this.TRTransferMoney5(Block, Body, BlockNum, TrNum, FORMAT_MONEY_TRANSFER5, WorkStructTransfer5);
                break;
            }
            case TYPE_TRANSACTION_ACC_HASH_OLD:
            case TYPE_TRANSACTION_ACC_HASH:
                Result = this.TRCheckAccountHash(Block, Body, BlockNum, TrNum, ContextFrom);
                break;
            case TYPE_TRANSACTION_ACC_CHANGE:
                Result = this.TRChangeAccount(Block, Body, BlockNum, TrNum, ContextFrom);
                break;
        }
        
        return Result;
    }
    
    DoCoinBaseTR(Block)
    {
        if(Block.BlockNum < global.START_MINING)
            return;

        var AccountID = this.GetMinerFromBlock(Block);
        
        if(AccountID < 8)
            return;
        
        var Data = this.ReadStateTR(AccountID);
        
        var KTERA = global.NEW_FORMULA_KTERA;
        if(Block.BlockNum >= global.UPDATE_CODE_JINN_KTERA)
            KTERA = global.NEW_FORMULA_JINN_KTERA
        
        if(Data && Data.Currency === 0 && Data.BlockNumCreate < Block.BlockNum)
        {
            // AIcuNet flat reward: награда ФИКСИРОВАНА = AINET_BLOCK_REWARD КАЖДЫЙ блок, одинаково.
            // M_boot (×Power/POWER_TARGET) УБРАН — он давал вариацию ниже/выше AINET_BLOCK_REWARD.
            // База = global.AINET_BLOCK_REWARD (Source/core/constant.js). Эмиссия идёт через SendMoneyTR
            // из acc 0 (keyless protocol-faucet), см. GenesisAccountCreate.
            // Остаток округления идёт в Fond One (acc 1) — SUB(CoinFond, CoinMiner); SUB(CoinFond, CoinDev).
            var Sum = global.AINET_BLOCK_REWARD;

            // Сплит (miner / dev acc 2 / Fond One acc 1) — три SendMoneyTR из acc 0.
            var OperationNum = 0;
            var CoinSum = COIN_FROM_FLOAT(Sum);
            if(!ISZERO(CoinSum))
            {
                var CoinMiner = COIN_FROM_FLOAT(Sum * 0.92);            // майнер 92%
                var CoinDev   = COIN_FROM_FLOAT(Sum * 0.03);            // dev 3% → acc 2
                var CoinFond  = {SumCOIN:CoinSum.SumCOIN, SumCENT:CoinSum.SumCENT};
                SUB(CoinFond, CoinMiner);                                // Fond One = остаток (округление + 5%) → acc 1
                SUB(CoinFond, CoinDev);

                OperationNum++; this.SendMoneyTR(Block, 0, AccountID, CoinMiner, Block.BlockNum, 0xFFFF, "", "Coin base miner", 1, 0, OperationNum);
                OperationNum++; this.SendMoneyTR(Block, 0, 2,         CoinDev,   Block.BlockNum, 0xFFFF, "", "Coin base dev 3%", 1, 0, OperationNum);
                OperationNum++; this.SendMoneyTR(Block, 0, 1,         CoinFond,  Block.BlockNum, 0xFFFF, "", "Coin base Fond One 5%", 1, 0, OperationNum);
            }
        }
    }
    
    ReadState(Num)
    {
        var Data = this.DBState.Read(Num);
        if(Data)
            Data.WN = "";
        return Data;
    }
    FindAccounts(PubKeyArr, Map, HiddenMap, nSet)
    {
        var Count = 0;
        for(var num = 0; true; num++)
        {
            if(this.IsHole(num, 1) || (HiddenMap && HiddenMap[num] !== undefined))
                continue;
            
            var Data = this.ReadState(num);
            if(!Data)
                break;
            
            for(var i = 0; i < PubKeyArr.length; i++)
                if(CompareArr(Data.PubKey, PubKeyArr[i]) === 0)
                {
                    Map[Data.Num] = i;
                    Count++
                }
        }
        return Count;
    }
    
    GetWalletAccountsByMap(map)
    {
        var arr = [];
        for(var key in map)
        {
            var Num = parseInt(key);
            var Data = this.ReadState(Num);
            if(Data)
            {
                if(!Data.PubKeyStr)
                    Data.PubKeyStr = GetHexFromArr(Data.PubKey);
                arr.push(Data);
                Data.WN = map[key];
                Data.Name = NormalizeName(Data.Name);
                
                if(Data.Currency)
                {
                    Data.CurrencyObj = SMARTS.ReadSimple(Data.Currency, 1);
                }
                
                if(Data.Value.Smart)
                {
                    Data.SmartObj = SMARTS.ReadSimple(Data.Value.Smart);
                    if(Data.SmartObj)
                    {
                        Data.SmartState = this.GetSmartState(Data, Data.SmartObj.StateFormat);
                    }
                    else
                    {
                        Data.SmartState = {}
                    }
                }
                //ERC
                Data.BalanceArr=this.ReadBalanceArr(Data);
            }
        }
        return arr;
    }

    GetMaxAccount()
    {
        return this.DBState.GetMaxNum();
    }
    
    GetPowTx(Body, BlockNum)
    {
        var HASH = sha3(Body);
        var HashTicket = HASH.slice(0, 10);
        var FullHashTicket = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for(var i = 0; i < 10; i++)
            FullHashTicket[i] = HashTicket[i]
        
        WriteUintToArrOnPos(FullHashTicket, BlockNum, 10)
        
        var HashPow = sha3(FullHashTicket, 32);
        var power = GetPowPower(HashPow);
        
        return power;
    }
    
    GetFormatTransaction(Type)
    {
        var format;
        switch(Type)
        {
            case TYPE_TRANSACTION_CREATE:
                {
                    format = FORMAT_ACC_CREATE
                    break;
                }
                
            case TYPE_DEPRECATED_TRANSFER1:
                {
                    format = FORMAT_MONEY_TRANSFER1;
                    break;
                }
            case TYPE_DEPRECATED_TRANSFER2:
                {
                    format = FORMAT_MONEY_TRANSFER2;
                    break;
                }
            case TYPE_TRANSACTION_TRANSFER3:
                {
                    format = FORMAT_MONEY_TRANSFER3;
                    break;
                }
            case TYPE_TRANSACTION_TRANSFER5:
            {
                format = FORMAT_MONEY_TRANSFER5;
                break;
            }
            case TYPE_TRANSACTION_ACC_HASH_OLD:
            case TYPE_TRANSACTION_ACC_HASH:
                format = FORMAT_ACCOUNT_HASH;
                break;
                
            case TYPE_TRANSACTION_ACC_CHANGE:
                format = FORMAT_ACC_CHANGE;
                break;
                
            default:
                format = ""
        }
        return format;
    }


    //Coin store
    RegInWallet(BlockNum,Account,SmartNum)
    {
        var SysCore=SYSCORE.GetInfo(BlockNum);

        var Item=this.ReadRegWallet(Account);
        var ItemArr=Item.Arr;

        for(var i=0;i<ItemArr.length;i++)
            if(ItemArr[i]===SmartNum)
                return  0;//was add

        if(ItemArr.length>=SysCore.WalletMaxCount)
            return  0;//not add

        ItemArr.push(SmartNum);

        this.WriteRegWallet(Item);

        if(ItemArr.length>SysCore.WalletFreeStorage)
            return 2;//need pay
        else
            return 1;
    }
    WriteRegWallet(Item)
    {
        this.WriteValue(0,Item.Key, Item, Item.Format);
    }
    ReadRegWallet(Account,bRaw)
    {
        var Format="{Arr:[uint32]}";
        var Key="WALLET:"+Account;
        var Item=this.ReadValue(0,Key, Format);
        if(bRaw)
            return Item;

        if(!Item)
            Item={Arr:[]};

        Item.Key=Key;
        Item.Format=Format;
        return Item;
    }
    ReadBalanceArr(Data)
    {
        var Arr=this.ReadSoftBalanceArr(Data);
        if(!Arr)
            Arr=[];

        var Value={ID:"",SumCOIN:Data.Value.SumCOIN,SumCENT:Data.Value.SumCENT};
        var Smart=Data.CurrencyObj;
        var Token,IconBlockNum,IconTrNum;
        if(Smart)
        {
            //Token = "" + Data.Currency + "." + Smart.ShortName.trim();
            Token = Smart.ShortName.trim();
            if(Smart.IconBlockNum)
            {
                Value.IMG = "/file/" + Smart.IconBlockNum + "/" + Smart.IconTrNum;
                IconBlockNum = Smart.IconBlockNum;
                IconTrNum = Smart.IconTrNum;
            }
        }
        else
        {
            // AIcuNet: native currency ticker is "AXNT".
            // This is the on-chain Token identifier for Currency=0 (returned in GetAccountList.BalanceArr[].Token).
            // New chain genesis uses "AXNT" as the Currency=0 ticker.
            Token="AXNT";
            Value.IMG="/PIC/AICULogo.svg";
            IconBlockNum=undefined;
            IconTrNum=undefined;
        }

        Arr.unshift({Currency: Data.Currency, Token:Token, IconBlockNum:IconBlockNum,IconTrNum:IconTrNum, Inner:1, Arr: [Value]});

        return Arr;
    }

    ReadSoftBalanceArr(Data)
    {
        var Account=Data.Num;


        var Arr;
        var Item=this.ReadRegWallet(Account,1);
        if(!Item)
        {
            if(!global.DEV_MODE)
                return undefined;

            var Ret=this.ReadValue(COIN_STORE_NUM, "ACCOUNT:"+Account, MULTI_COIN_FORMAT,1);
            if(Ret)
            {
                //console.log("COIN_STORE", JSON.stringify(Ret, "", 4));

                for(var i=0;i<Ret.Arr.length;i++)
                    Ret.Arr[i].Old=1;

                return  Ret.Arr;
            }


            //console.log("No reg wallet on Account:"+Account);
            return undefined;
        }


        Arr=[];
        for(var i=0;i<Item.Arr.length;i++)
        {
            var SmartNum=Item.Arr[i];
            var Smart = SMARTS.ReadSmart(SmartNum);
            if(Smart && Smart.Version>=2)
            {
                var Ret=RunStaticSmartMethod(Smart.Account, "OnGetBalance", Account,undefined,0);
                var RetValue=Ret.RetValue;
                if(Ret.result==1 && RetValue)
                {
                    var ValueArr;
                    if(!RetValue.length)
                    {
                        if(ISZERO(RetValue))
                            continue;
                        if(!RetValue.ID)
                            RetValue.ID = "";
                        if(!RetValue.IMG)
                            RetValue.IMG = "/file/" + Smart.IconBlockNum + "/" + Smart.IconTrNum;
                        ValueArr=[RetValue];
                    }
                    else
                    {
                        ValueArr=RetValue;
                    }


                    var Token = Smart.ShortName.trim();
                    Arr.push({Currency: Smart.Num, Token:Token,IconBlockNum:Smart.IconBlockNum,IconTrNum:Smart.IconTrNum, Arr: ValueArr});
                }
            }
        }

        return Arr;

    }

    GetBalance(Account,Currency,ID)
    {
        Account = Account >>> 0;
        Currency = Currency >>>0;

        if(!Currency)
        {
            var Data = ACCOUNTS.ReadStateTR(Account);
            if(Data)
                return {SumCOIN:Data.Value.SumCOIN, SumCENT:Data.Value.SumCENT, Currency:Currency};
        }
        else
        {
            var Smart = SMARTS.ReadSmart(Currency);
            if(Smart)
            {
                var Ret=RunStaticSmartMethod(Smart.Account, "OnGetBalance", Account,ID,0);
                var RetValue=Ret.RetValue;
                if(Ret.result==1 && RetValue)
                {
                    if(RetValue.length)
                        RetValue={Arr:RetValue};
                    RetValue.ID=ID;
                    RetValue.Currency=Currency;

                    return RetValue;
                }
            }
        }

        return {SumCOIN:0,SumCENT:0,Currency:Currency,ID:ID};
    }

}
var App = new AccountApp;

REGISTER_SYS_DAPP(App, TYPE_TRANSACTION_CREATE);
REGISTER_SYS_DAPP(App, TYPE_TRANSACTION_ACC_CHANGE);
REGISTER_SYS_DAPP(App, TYPE_DEPRECATED_TRANSFER1);
REGISTER_SYS_DAPP(App, TYPE_DEPRECATED_TRANSFER2);
REGISTER_SYS_DAPP(App, TYPE_TRANSACTION_TRANSFER3);
REGISTER_SYS_DAPP(App, TYPE_TRANSACTION_TRANSFER5);
REGISTER_SYS_DAPP(App, TYPE_TRANSACTION_ACC_HASH);
REGISTER_SYS_DAPP(App, TYPE_TRANSACTION_ACC_HASH_OLD);

