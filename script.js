async function copyScript() {
    try {
        var scriptText = await (await fetch("MSET9-ChromeOS.js")).text();
        navigator.clipboard.writeText(scriptText);
        clearTimeout(successAlertTimeout);
        document.getElementById("copied").style.display = "block";
        successAlertTimeout = setTimeout(()=>{
            document.getElementById("copied").style.display = "none";
        },5000);
    } catch(err) {
        console.error(err);
        clearTimeout(failedAlertTimeout);
        document.getElementById("failed").style.display = "block";
        failedAlertTimeout = setTimeout(()=>{
            document.getElementById("failed").style.display = "none";
        },5000);
    }
}
var successAlertTimeout, failedAlertTimeout;
document.getElementById("only-js").style.display = "block";
document.getElementById("copyScript").addEventListener("click",copyScript);