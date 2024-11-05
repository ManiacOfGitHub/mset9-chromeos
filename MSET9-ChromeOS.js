var consoleNames = {
    o1: "Old 3DS/2DS, 11.8.0 to 11.17.0",
    n1: "New 3DS/2DS, 11.8.0 to 11.17.0",
    o2: "Old 3DS/2DS, 11.4.0 to 11.7.0",
    n2: "New 3DS/2DS, 11.4.0 to 11.7.0"
};
var haxID1s = {
    o1: "\u{FFFF}\u{FAFF}\u{9911}\u{4807}\u{4685}\u{6569}\u{A108}\u{2201}\u{4B05}\u{4798}\u{4668}\u{4659}\u{AAC0}\u{1C17}\u{4643}\u{4C03}\u{47A0}\u{47B8}\u{9000}\u{80A}\u{A071}\u{805}\u{CE99}\u{804}sdmc\u{9000}\u{80A}b9",
    n1: "\u{FFFF}\u{FAFF}\u{9911}\u{4807}\u{4685}\u{6569}\u{A108}\u{2201}\u{4B05}\u{4798}\u{4668}\u{4659}\u{AAC0}\u{1C17}\u{4643}\u{4C03}\u{47A0}\u{47B8}\u{9000}\u{80A}\u{A071}\u{805}\u{CE5D}\u{804}sdmc\u{9000}\u{80A}b9",
    o2: "\u{FFFF}\u{FAFF}\u{9911}\u{4807}\u{4685}\u{6569}\u{A108}\u{2201}\u{4B05}\u{4798}\u{4668}\u{4659}\u{AAC0}\u{1C17}\u{4643}\u{4C03}\u{47A0}\u{47B8}\u{9000}\u{80A}\u{9E49}\u{805}\u{CC99}\u{804}sdmc\u{9000}\u{80A}b9",
    n2: "\u{FFFF}\u{FAFF}\u{9911}\u{4807}\u{4685}\u{6569}\u{A108}\u{2201}\u{4B05}\u{4798}\u{4668}\u{4659}\u{AAC0}\u{1C17}\u{4643}\u{4C03}\u{47A0}\u{47B8}\u{9000}\u{80A}\u{9E45}\u{805}\u{CC81}\u{804}sdmc\u{9000}\u{80A}b9"
}
var haxStates = [["ID1 not created","color:gray;background:white;"],["Not Ready - check MSET9 status for more details","color:yellow;background:black;"],["Ready","color:green;background:white;"],["Injected","color:lime;background:white;"],["Removed trigger file","color:green;background:white;"]];
var realID1BackupTag = "_user-id1";
var homeMenuExtdata = [0x8F,  0x98,  0x82,  0xA1,  0xA9,  0xB1];
var miiMakerExtdata = [0x217, 0x227, 0x207, 0x267, 0x277, 0x287];
var trigger = "002F003A.txt";


async function main(){
    window.haxState = 0;
    window.titleDatabasesGood = true;
    window.titleDatabasesDummyGood = true;
    window.menuExtdataGood = false;
    window.miiExtdataGood = false;
    commands = {};
    registerCommand("restart",main);
    registerCommand("lp",()=>{window.logPausedEnabled=true;prinfo("Log Pause Enabled")});
    registerCommand("lpoff",()=>{window.logPausedEnabled=false;prinfo("Log Pause Disabled")});
    registerCommand("eject",ejectSD);
    
    console.clear();
    prinfo("Please wait..."); //bypass confusing value return thing
    await new Promise(resolve=>setTimeout(resolve,50));
    resetLog();
    
    prinfo("Checking current app...");
    var validApp = await checkApp();
    if(!validApp) {
        exitScript();
        return;
    }
    
    window.sdRootEntry = await searchForRoot();
    if(!sdRootEntry) {
        exitScript();
        return;
    }
    if(!volumeId) {
        prbad("Error 08C: No volumeId variable. This should not be possible.");
        exitScript();
        return;
    }
    prgood("Found SD card!");

    prinfo("Checking SD card...");
    var sdGood = await checkSD();
    if(!sdGood) {
        exitScript();
        return;
    }
    prgood("SD card looks good!");
    prinfo("Volume Label: "+sdMetadata.volumeLabel);
    
    if(window["logPausedEnabled"]) {
        prinfo("Log Pause is currently enabled. Type \"lp\" to continue.");
        await new Promise(resolve=>{
            registerCommand("lp",resolve);
        });
        prinfo("Continuing...");
    }
    
    prinfo("Please wait a few seconds...");
    await new Promise(resolve=>setTimeout(resolve,1500)); // pause so they have a chance to read it without lp.
    resetLog();
    if(!inFilesApp) prinfo("Script is running in unknown app. You may encounter some issues!");
    console.log("%cWhat is your console model and version?\nOld 3DS has two shoulder buttons (L and R)\nNew 3DS has four shoulder buttons (L, R, ZL, ZR)\n\n-- Please type one of the following and then press enter --","font-size:12px;");
    window.consoleSelection = await new Promise(resolve=>{
        for(var i in consoleNames) {
            (async(k)=>{
                console.log(`%cEnter ${i} for: ${consoleNames[i]}`,"font-size:12px");
                registerCommand(k,()=>{
                    for(var j in consoleNames) delete commands[j];
                    resolve(k);
                })
            })(i)
        }
    });

    window.id0folder = await checkID0();
    if(!id0folder) {
        exitScript();
        return;
    }
    var result = await checkID1();
    if(!result) {
        exitScript();
        return;
    }
    if(window["logPausedEnabled"]) {
        prinfo("Log Pause is currently enabled. Type \"lp\" to continue.");
        await new Promise(resolve=>{
            registerCommand("lp",resolve);
        });
        prinfo("Continuing...");
    }
    await mainMenu();

    exitScript();
}

function exitScript() {
    prinfo("The script has exited.");
    prinfo("You can eject your SD card either by typing \"eject\" or using the eject button in the Files app.");
    prinfo("As long as you keep both the Files app and this window open, you can restart the script by typing \"restart\".");
    prinfo("If you exit the Files app, you must copy and paste the code into the DevTools Console window again.");
}

async function mainMenu() {
    resetLog();
    console.log("%cUsing " + consoleNames[consoleSelection],"font-size:12px;");
    console.log("%cCurrent MSET9 state: %c" + haxStates[haxState][0],"font-size:12px;","font-size:12px;font-weight:bold;"+haxStates[haxState][1]);
    console.log("%c-- Please type in a letter then push enter --\n\n\u{2193} Input one of these letters","font-size:12px;");
    console.log("%ca. Create MSET9 ID1","font-size:12px");
    console.log("%cb. Check MSET9 status","font-size:12px");
    console.log("%cc. Inject trigger file","font-size:12px");
    console.log("%cd. Remove trigger file","font-size:12px");
    if(haxState != 3) {
        console.log("%ce. Remove MSET9","font-size:12px");
    }
    console.log("%cz. Exit","font-size:12px");
    while(true) {
        var userInput = await new Promise(resolve=>{
            for(var i of ["a","b","c","d","e","z"]) {
                (async(k)=>{
                    registerCommand(k,()=>{resolve(k)});
                })(i);
            }
        });

        if(userInput=="a") {
            if(haxState>0) {
                prinfo("Hacked ID1 already exists.");
                continue;
            }
            await createHaxID1();
            break;
        } else if(userInput == "b") {
            if(haxState==0) {
                prbad("Can't do that now!");
                continue;
            }
            await sanityReport();
            break;
        } else if(userInput == "c") {
            if(haxState != 2) {
                prbad("Can't do that now!");
                continue;
            }
            await createInject();
            break;
        } else if(userInput == "d") {
            if(haxState < 2) {
                prbad("Can't do that now!");
                continue;
            }
            await removeInject();
            if(window["logPausedEnabled"]) {
                prinfo("Log Pause is currently enabled. Type \"lp\" to continue.");
                await new Promise(resolve=>{
                    registerCommand("lp",resolve);
                });
                prinfo("Continuing...");
            }
            await new Promise(resolve=>setTimeout(resolve,1500));
            return await mainMenu();
        } else if(userInput == "e") {
            if(haxState == 0) {
                prinfo("Nothing to do.");
                continue;
            }
            if(haxState == 3) {
                prbad("Can't do that now!");
                continue;
            }
            await remove();
            break;
        } else if(userInput == "z") {
            break;
        }
    }
}

async function remove() {
    prinfo("Removing MSET9...");

    window.hackedId1folder = await new Promise(resolve=>{id0folder.getDirectory(haxID1s[consoleSelection],{create:true},resolve,()=>{resolve()})});
    window.realId1folder = await new Promise(resolve=>{id0folder.getDirectory(realId1folder.name,{create:true},resolve,()=>{resolve()})});
    
    if(hackedId1folder) {
        if(realId1folder && titleDatabasesGood) {
            var realDbsFolder = await new Promise(resolve=>{realId1folder.getDirectory("dbs",{},resolve,()=>{resolve()})});
            if(!realDbsFolder) {
                prinfo("Moving databases to user ID1...");
                var result = await new Promise(resolve=>{hackedDbsFolder.moveTo(realId1folder,"dbs",()=>{resolve(true),()=>{resolve(false)}})});
                if(!result) {
                    prbad("Failed to move databases.");
                }
            }
        }
        prinfo("Deleting hacked ID1...");
        var result = await new Promise(resolve=>{hackedId1folder.removeRecursively(()=>{resolve(true)},()=>{resolve(false)})});
        if(!result) {
            prbad("Failed to delete hacked ID1.");
            return;
        }
    }
    if(realId1folder && realId1folder.name.endsWith(realID1BackupTag)) {
        prinfo("Renaming original ID1...");
        var result = await new Promise(resolve=>{realId1folder.moveTo(id0folder,realId1folder.name.slice(0,32),()=>{resolve(true),()=>{resolve(false)}})});
        if(!result) {
            prbad("Failed to rename original ID1.");
            return;
        }
    }
    haxState = 0;
	prgood("Successfully removed MSET9!");
}

async function createInject() {
    prinfo("Injecting trigger file...");
    var exists = await checkFile(hackedId1folder, "extdata/"+trigger);
    if(exists) {
        prbad("Trigger file already injected.");
        return;
    }
    var triggerFile = await new Promise(resolve=>{hackedId1folder.getFile("extdata/"+trigger,{create:true},resolve,()=>{resolve()})});
    if(!triggerFile) {
        prbad("Failed to inject trigger file.");
        return;
    }
    try {
        (await triggerFile.createWriter()).write(new Blob(["pls be haxxed mister arm9, thx"]));
    } catch(err) {};
    prgood("MSET9 successfully injected!");
}

async function removeInject() {
    var exists = await checkFile(hackedId1folder, "extdata/"+trigger);
    if(!exists) {
        prbad("Trigger file already removed.");
        return;
    }
    var triggerFile = await new Promise(resolve=>{hackedId1folder.getFile("extdata/"+trigger,{create:true},resolve,()=>{resolve()})});
    var result = await new Promise(resolve=>{triggerFile.remove(()=>{resolve(true)},()=>{resolve(false)})});
    if(!result) {
        prbad("Failed to remove trigger file.");
        return;
    }
    prgood("Removed trigger file.");
    haxState = 4;
}

async function sanityReport() {
    if(!menuExtdataGood) {
        prbad("HOME menu extdata: Missing!");
		prinfo("Please power on your console with your SD inserted, then check again.");
		prinfo("If this does not work, your SD card may need to be reformatted.");
        prinfo("Please note that ChromeOS is known to not be able to format cards to FAT32 properly.");
        prinfo("This means that you will either need to use another device (like a computer or modded 3DS), or buy a SD card that is already preformatted to FAT32.");
        prinfo("(Cards from reputable brands with 32GB or less of space are generally formatted to FAT32 out of the box)");
    } else {
        prgood("HOME menu extdata: OK!");
    }
    console.log("");
    if(!miiExtdataGood) {
        prbad("Mii Maker extdata: Missing!");
		prinfo("Please power on your console with your SD inserted, then launch Mii Maker.");
    } else {
        prgood("Mii Maker extdata: OK!");
    }
    console.log("");
    if(!titleDatabasesGood) {
        if(!titleDatabasesDummyGood) {
            prbad("Title database: Failed to create dummy files!");
        } else {
            prbad("Title database: Not initialized!");
    		prinfo("Please power on your console with your SD inserted, open System Setttings,");
    		prinfo("navigate to Data Management -> Nintendo 3DS -> Software, then select Reset.");
        }
    } else {
        prgood("Title database: OK!");
    }
    console.log("");
}

async function createHaxID1() {
    console.log("%c=== DISCLAIMER ===","font-size:20px;background:black;color:gold;");
    console.log(
        "%cThis process will temporarily reset all your 3DS data.\n"+
        "All your applications and themes will disappear.\n"+
        "This is perfectly normal, and if everything goes right, it will re-appear\n"+
        "at the end of the process.\n\n"+

        "In any case, it is highly recommended to make a backup of your SD card's contents to a folder on your PC.\n"+
        "(Especially the 'Nintendo 3DS' folder.)",

        "font-size:12px;"
    );
    var shouldContinue = await new Promise(resolve=>{
        console.log("%cInput 'a' again to confirm.\nInput 'b' to cancel.","font-size:12px");
        for(var i of ["c","d","e","z"]) {
            delete commands[i];
        }
        registerCommand("a",()=>{resolve(true)});
        registerCommand("b",()=>{resolve(false)});
    });
    if(!shouldContinue) {
        prinfo("Cancelled.");
        return;
    }

    prinfo("Creating hacked ID1...");
    window.hackedId1folder = await new Promise(resolve=>{id0folder.getDirectory(haxID1s[consoleSelection],{create:true},resolve,()=>{resolve()});});
    if(!hackedId1folder) {
        prbad("Failed to create hacked ID1!");
        prinfo("ID1 folder could not be created.");
        return;
    }
    prinfo("Creating dummy databases...");
    window.hackedDbsFolder = await new Promise(resolve=>{hackedId1folder.getDirectory("dbs",{create:true},resolve,()=>{resolve()})});
    if(!hackedDbsFolder) {
        prbad("Failed to create hacked ID1!");
        prinfo("dbs folder could not be created.");
        return;
    }
    var titleDb = await new Promise(resolve=>{hackedDbsFolder.getFile("title.db",{create:true},resolve,()=>{resolve()})});
    var importDb = await new Promise(resolve=>{hackedDbsFolder.getFile("import.db",{create:true},resolve,()=>{resolve()})});
    if(!titleDb || !importDb) {
        prbad("Failed to create hacked ID1!");
        prinfo("Dummy databases could not be created.");
        return;
    }

    if(!realId1folder.name.endsWith(realID1BackupTag)) {
        prinfo("Backing up original ID1...");
        var result = await new Promise(resolve=>{realId1folder.moveTo(id0folder,realId1folder.name+realID1BackupTag,()=>{resolve(true)},()=>{resolve(false)})});
        if(!result) {
            prbad("Failed to rename original ID1...");
            return;
        }
    }
    prgood("Created hacked ID1.");
}

async function checkID0() {
    var nin3dsFolder = await new Promise(resolve=>{
        sdRootEntry.getDirectory("Nintendo 3DS",{},resolve,()=>{resolve()});
    });
    if(!nin3dsFolder) {
        err01(); //shouldnt be possible, but whatever
        return false;
    }
    var id0Entry;
    var ID0Count = 0;
    var dirListing = await new Promise(resolve=>nin3dsFolder.createReader().readEntries(resolve));
    for(var i in dirListing) {
        if(dirListing[i].isFile) {
            prinfo("Found file in Nintendo 3DS folder? '"+dirListing[i].name+"'");
            continue;
        }
        if(!is3DSID(dirListing[i].name)) {
            continue;
        }
        prinfo("ID0 detected: " + dirListing[i].name);
        window.ID0 = dirListing[i].name;
        id0Entry = dirListing[i];
        ID0Count++;
    }
    if(ID0Count!=1) {
        prbad(`Error 04: You don't have 1 ID0 in your Nintendo 3DS folder, you have ${ID0Count}!`);
        prinfo("Consult: https://wiki.hacks.guide/wiki/3DS:MID0 for help!");
        return false;
    }
    return id0Entry;
}

async function checkID1() {
    var ID1Count = 0;
    var dirListing = await new Promise(resolve=>id0folder.createReader().readEntries(resolve));
    for(var i in dirListing) {
        if(dirListing[i].isFile) {
            prinfo("Found file in ID0 folder? '"+dirListing[i].name+"'");
            continue;
        }

        if(is3DSID(dirListing[i].name) || (dirListing[i].name.slice(32) == realID1BackupTag && is3DSID(dirListing[i].name.slice(0,32)))) {
            prinfo("ID1 detected: " + dirListing[i].name);
            window.ID1 = dirListing[i].name;
            window.realId1folder = dirListing[i];
            ID1Count++;
        } else if(dirListing[i].name.includes("sdmc") && dirListing[i].name.length == 32) {
            var currentHaxID1index = 0;
            for(var j in haxID1s) {
                if(dirListing[i].name==haxID1s[j]) {
                    currentHaxID1index = j;
                    break;
                }
            }
            if(currentHaxID1index == 0) {
                prbad("Unrecognized/duplicate hacked ID1 in ID0 folder, removing!");
                await new Promise(resolve=>{
                    dirListing[i].removeRecursively(resolve, resolve);
                });
            } else if(currentHaxID1index != consoleSelection) {
                prbad("Error 03: Don't change console model/version in the middle of MSET9!");
                prinfo(`Earlier, you selected: '[${currentHaxID1index}.] ${consoleNames[currentHaxID1index]}'`);
                prinfo(`Now, you selected: '[${consoleSelection}.] ${consoleNames[consoleSelection]}'`);
                prinfo("");
                prinfo("Please re-enter one of the above for your console model and version.");

                var choice = await new Promise(resolve=>{
                    for(var i of [consoleSelection, currentHaxID1index]) {
                        (async(k)=>{
                            registerCommand(k,()=>{
                                for(var j in consoleNames) delete commands[j];
                                resolve(k);
                            })
                        })(i)
                    }
                });
                if(choice==currentHaxID1index) {
                    consoleSelection = currentHaxID1index;
                } else if(choice==consoleSelection) {
                    var result = await new Promise(resolve=>{dirListing[i].moveTo(id0folder, haxID1s[consoleSelection], ()=>{resolve(true)}, ()=>{resolve(false)})});
                    if(!result) {
                        prbad("Failed to change console version.");
                        return false;
                    }
                }
            }
            window.hackedId1folder = await new Promise(resolve=>{id0folder.getDirectory(haxID1s[consoleSelection],{},resolve,()=>{resolve()});});
            if(!hackedId1folder) {
                prbad("Could not get hacked ID1.");
                return false;
            }
            var sanityOK = await sanity();

            if(await checkFile(hackedId1folder,"extdata/"+trigger)) {
                haxState = 3;
            } else if(sanityOK) {
                haxState = 2;
            } else {
                haxState = 1;
            }
        }
    }
    if(ID1Count!=1) {
        prbad(`Error 05: You don't have 1 ID1 in your Nintendo 3DS folder, you have ${ID1Count}!`);
        prinfo("Consult: https://wiki.hacks.guide/wiki/3DS:MID1 for help!");
        return false;
    }
    return true;
}

async function sanity() {
    prinfo("Checking databases...");
    window.hackedDbsFolder = await new Promise(resolve=>{hackedId1folder.getDirectory("dbs",{create:true},resolve,()=>{resolve()})});
    var titleDb = await checkFile(hackedDbsFolder,"title.db");
    var importDb = await checkFile(hackedDbsFolder,"import.db");
    if(!titleDb || !importDb) {
        var titleDb = await new Promise(resolve=>{hackedDbsFolder.getFile("title.db",{create:true},resolve,()=>{resolve()})});
        var importDb = await new Promise(resolve=>{hackedDbsFolder.getFile("import.db",{create:true},resolve,()=>{resolve()})});
        if(!titleDb || !importDb) {
            titleDatabasesDummyGood = false;
        }
        try {
            (await titleDb.createReader()).write(new Blob([""]));
            (await importDb.createReader()).write(new Blob([""]));
        } catch(err) {};
        titleDatabasesGood = false;
    } else {
        var titleDbFile = await new Promise(resolve=>{titleDb.file(resolve,()=>{resolve()})});
        var importDbFile = await new Promise(resolve=>{importDb.file(resolve,()=>{resolve()})});
        if(titleDbFile.size!=0x31E400) {
            titleDatabasesGood = false;
            if(titleDbFile.size==0) {
                prbad("title.db is an empty file!");
            } else {
                prbad("title.db is size " + titleDbFile.size + " bytes, not expected " + 0x31E400 + " bytes");
            }
        } else {
            prgood("title.db looks good!");
        }
        if(importDbFile.size!=0x31E400) {
            titleDatabasesGood = false;
            if(importDbFile.size==0) {
                prbad("import.db is an empty file!");
            } else {
                prbad("import.db is size " + importDbFile.size + " bytes, not expected " + 0x31E400 + " bytes");
            }
        } else {
            prgood("import.db looks good!");
        }
    }

    prinfo("Checking for HOME menu extdata...");
    for(var i of homeMenuExtdata) {
        var exists = await new Promise(resolve=>{hackedId1folder.getDirectory("extdata/00000000/"+i.toString(16).padStart(8,"0"),{},resolve,()=>{resolve()})});
        if(exists) {
            menuExtdataGood = true;
            break;
        }
    }

    prinfo("Checking for Mii Maker extdata...");
    for(var i of miiMakerExtdata) {
        var exists = await new Promise(resolve=>{hackedId1folder.getDirectory("extdata/00000000/"+i.toString(16).padStart(8,"0"),{},resolve,()=>{resolve()})});
        if(exists) {
            miiExtdataGood = true;
            break;
        }
    }

    return menuExtdataGood && miiExtdataGood && titleDatabasesGood;
}

async function checkSD() {
    window.sdMetadata = await new Promise(resolve=>chrome.fileManagerPrivate.getVolumeMetadataList(a=>resolve(a.find(o=>o.volumeId==volumeId))));
    prinfo("Checking if SD card is writeable...");
    if(sdMetadata.isReadOnly) {
        prbad("Error 02: Your SD card is write protected! If using a full size SD card, ensure that the lock switch is facing upwards.");
        prinfo("Visual aid: https://nintendohomebrew.com/assets/img/nhmemes/sdlock.png");
        return false;
    }
    prgood("SD card is writeable!");
    prinfo("Checking SD card format...");
    if(sdMetadata.diskFileSystemType != "vfat") {
        prbad("Error 09C: Not FAT32!");
        prinfo("This SD card has not been formatted to FAT32. You will need to format it in order to make it readable by the 3DS.");
        prinfo("Please note that ChromeOS is known to not be able to format cards to FAT32 properly.");
        prinfo("This means that you will either need to use another device (like a computer or modded 3DS), or buy a SD card that is already preformatted to FAT32.");
        prinfo("(Cards from reputable brands with 32GB or less of space are generally formatted to FAT32 out of the box)");
        return false;
    }
    prgood("SD card is formatted to FAT32!");
    prinfo("Checking available space...");
    var sizeStats = await new Promise(resolve=>{chrome.fileManagerPrivate.getSizeStats(volumeId,resolve)});
    if(sizeStats.remainingSize < 16 * 1024 * 1024) {
        prbad("Error 06: You need at least 16MB free space on your SD card!");
        prinfo("Please free up some space and try again.");
        return false;
    }
    prgood("There is enough space on the SD card!");
    prinfo("Ensuring extracted files exist...");
    var filesMissing = 0;
    for(var i of ["boot9strap/boot9strap.firm", "boot9strap/boot9strap.firm.sha", "boot.firm", "boot.3dsx", "b9", "SafeB9S.bin"]) {
        var result = await checkFile(sdRootEntry, i);
        if(result) {
            prgood(i.split("/").at(-1) + " looks good!");
        } else {
            prbad(i.split("/").at(-1) + " does not exist on SD card!");
            filesMissing+=1;
        }
    }
    if(filesMissing > 0) {
        prbad("Error 07: " + filesMissing + " files are missing!");
        prinfo("Please re-extract the MSET9 zip file, overwriting any existing files when prompted.");
        return false;
    }
    return true;
}

async function checkApp() {
    var apiExposed = chrome.hasOwnProperty("fileManagerPrivate");
    window.inFilesApp = location.protocol=="chrome:" && location.hostname=="file-manager";
    var continueScriptExecution = false;
    if(!apiExposed) {
        if(inFilesApp) {
            prbad("Error 02C: Script is running in the ChromeOS Files app, but the fileManagerPrivate API is not exposed.");
            prinfo("This should never happen. This script may be outdated.");
        } else if(location.protocol == "devtools:") {
            prbad("Error 03C: Script is running within an extra-inspected DevTools window.");
            prinfo("You pushed Ctrl+Shift+J too many times. Close all DevTools windows and then the Files app, and retry the section you are currently following.");
        } else {
            prbad("Error 04C: Script is running in an unknown location.");
            prinfo("You likely pushed Ctrl+Shift+I in the wrong location. Close this DevTools window and retry the section you are currently following.");
            prinfo("Alternatively, if this URL below matches where you would expect the Files app to be located, this script may be outdated.");
            prinfo("Location: " + location.href);
            console.log(location);
        }
        return false;
    }
    if(!inFilesApp && (!window.localStorage || !localStorage.getItem || localStorage.getItem("allowUnknownApp")!='true')) {
        prbad("Error 01C: Script is running in an unknown app, but the fileManagerPrivate API is exposed.");
        prinfo("This likely means that ChromeOS is not up-to-date.");
        prinfo("To ensure the most compatibility, please update your Chromebook in the Settings app under the \"About ChromeOS\" section.");
        prinfo("If you are unable to update to the latest version (perhaps your device has gone out of support), you can attempt to continue running this script regardless, although you may encounter some issues.");
        prinfo("");
        prinfo("Please read the above info. If you wish to continue regardless, please type \"i.understand\" and press Enter.");
        await new Promise(resolve=>{
            i = {
                get understand() {
                    if(window.localStorage && localStorage.setItem) localStorage.setItem("allowUnknownApp",'true');
                    resolve();
                }
            };
        });
    }
    if(inFilesApp) {
        prgood("Script is running in the ChromeOS Files app.");
    } else {
        prinfo("Script is running in an unknown app. You may encounter some issues!");
    }
    return true;
}

async function searchForRoot() {
    prinfo("Checking current location for root of SD...");
    var result = await searchCurrentLocationForRoot(); 
    if(result) return result;
    prinfo("Searching all removable drives for root of SD...");
    if(!chrome.fileManagerPrivate.getVolumeMetadataList) {
        prbad("Error 05C: Could not get list of volumes.");
        prinfo("This should never happen.");
        return false;
    }
    var volumeList = await new Promise(r=>chrome.fileManagerPrivate.getVolumeMetadataList(r));
    if(!volumeList) {
        prbad("Error 05C: Could not get list of volumes.");
        prinfo("This should never happen.");
        return false;
    }
    volumeList = volumeList.filter(o=>o.volumeType=="removable");
    if(volumeList.length==0) {
        prbad("Error 06C: No SD card inserted.");
        prinfo("Insert the SD card and select it in the Files app before retrying.");
        prinfo("If your SD card is already inserted, remove it and reinsert it.");
        return false;
    }
    if(volumeList.length == 1 && result === 0) {
        err01();
        return false;
    }
    var validVolume;
    var validVolumeRoot;
    for(var volume of volumeList) {
        prinfo("Testing volume \""+volume.volumeId+"\"");
        var volumeRoot = await new Promise(r=>chrome.fileManagerPrivate.getVolumeRoot({volumeId:volume.volumeId},r));
        if(!volumeRoot) {
            prinfo("Unable to get volume root.");
            continue;
        }
        var result = await new Promise(resolve=>{volumeRoot.getDirectory("Nintendo 3DS", {}, ()=>{resolve({success:true})},err=>{resolve({success:false,errMessage:err.message,errName:err.name})})});
        if(!result || !result.success) {
            if(result.errName && result.errName == "NotFoundError") {
                prinfo("There is no Nintendo 3DS folder in this volume.");
                continue;
            } else {
                prinfo("The Nintendo 3DS folder could not be opened in this volume.");
                if(result.errMessage) prinfo("Reason: "+result.errMessage);
                continue;
            }
        }
        if(validVolume) {
            prbad("Error 07C: Multiple SD cards!");
            prinfo("There seems to be multiple Nintendo 3DS SD cards inserted.");
            prinfo("Please either remove the extra SD card(s) or select the root of the SD card you want to use in the Files app.");
            return false;
        }
        validVolume = volume;
        validVolumeRoot = volumeRoot;
    }
    if(!validVolume) {
        err01();
        return false;
    }
    window.volumeId = validVolume.volumeId;
    return validVolumeRoot;
}

async function searchCurrentLocationForRoot() {
    if(!window.fileManager) {
        prinfo("fileManager variable does not exist.");
        return;
    }
    if(!fileManager.directoryModel) {
        prinfo("directoryModel property does not exist.");
        return;
    }
    if(!fileManager.directoryModel.getCurrentVolumeInfo) {
        prinfo("getCurrentVolumeInfo property does not exist.");
        return;
    }
    var volumeInfo = fileManager.directoryModel.getCurrentVolumeInfo();
    if(!volumeInfo || !volumeInfo.volumeId || !volumeInfo.volumeType) {
        prinfo("volumeInfo is invalid.");
        return;
    }
    if(volumeInfo.volumeType != "removable") {
        prinfo("Current location is not on SD card. Volume ID: " + volumeInfo.volumeId + ".");
        return;
    }
    var volume = await new Promise(r=>chrome.fileManagerPrivate.getVolumeRoot({volumeId:volumeInfo.volumeId},r));
    if(!volume) {
        prinfo("Unable to get current volume root.");
        return;
    }
    var result = await new Promise(resolve=>{volume.getDirectory("Nintendo 3DS", {}, ()=>{resolve({success:true})},err=>{resolve({success:false,errMessage:err.message,errName:err.name})})});
    if(!result || !result.success) {
        if(result.errName && result.errName == "NotFoundError") {
            prinfo("Nintendo 3DS folder is not in the current location.");
            return 0;
        } else {
            prinfo("Nintendo 3DS folder could not be opened on current drive.");
            if(result.errMessage) prinfo("Reason: "+result.errMessage);
            return;
        }
    }
    window.volumeId=volumeInfo.volumeId;
    return volume;
}
async function checkFile(dirEntry, path) {
    if(!dirEntry.getFile) {
        prbad("getFile or getDirectory property does not exist. This shouldn't be possible.");
        return false;
    }
    return await new Promise(resolve=>{
        dirEntry.getFile(path,{},resolve,()=>resolve(false));
    });
}

async function ejectSD() {
    if(!volumeId) {
        prbad("This script must be run at least once in this session in order to eject the SD card.");
    }
    var volumeList = await new Promise(resolve=>{chrome.fileManagerPrivate.getVolumeMetadataList(resolve)});
    if(!volumeList.find(o=>o.volumeId==volumeId)) {
        prbad("SD card is no longer mounted, so it cannot be ejected.");
        return;
    }
    prinfo("Attempting to eject SD card... Please wait.");
    chrome.fileManagerPrivate.removeMount(volumeId,()=>{prgood("Assuming no errors appear below, the SD card was successfully ejected!")});
}

function err01() {
    prbad("Error 01: Couldn't find Nintendo 3DS folder! Ensure that you are running this script from the root of the SD card.");
    prinfo("If that doesn't work, eject the SD card, and put back it into your console. Turn it on and off again, then rerun this script.");
}
function is3DSID(name) {
    if(name.length != 32) return false;

    var hex_test = parseInt(name, 16);
    return Number.isInteger(hex_test);
}
function prgood(content) {
    console.log("%c[%cOK%c] " + content,"font-size:12px;","font-size:12px;color:limegreen","font-size:12px;");
}
function prbad(content) {
    console.log("%c[%cXX%c] " + content,"font-size:12px;", "font-size:12px;color:red","font-size:12px;");
}
function prinfo(content) {
    console.log("%c[--] " + content, "font-size:12px;");
}

function resetLog() {
    console.clear();
    console.log("%cMSET9-ChromeOS%c\nVersion 1.0-beta by ManiacOfHomebrew\nOriginal script by zoogie, Aven, DannyAAM, and thepikachugamer","font-size:40px;font-family:Roboto;color:red;text-shadow: 1px 1px blue;","");
}

var commands = {};
function registerCommand(command, executeFunction){
    if(executeFunction) commands[command]=executeFunction;
    Object.defineProperty(window,command,{get:function(){
        if(commands[command]) {
            commands[command]();
        } else {
            prbad("Invalid input, try again.");
        }
    },configurable:true})
}

var i;
await main();