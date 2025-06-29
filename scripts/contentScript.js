function CloseTab() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #000;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
    `;
    const popup = document.createElement('div');
    popup.style.cssText = `
        background: #fff;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        text-align: center;
        max-width: 400px;
        width: 90%;
    `;
    popup.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #ff4444; margin: 0 0 15px 0;"> Site Blocked</h2>
            <p style="color: #333; margin: 0; line-height: 1.5;">
                This URL is completely blocked for today.<br>
                This tab will close after you press OK.
            </p>
        </div>
        <button id="closeTabBtn" style="
            background: #ff4444;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            font-weight: bold;
        ">OK</button>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    document.getElementById('closeTabBtn').onclick = () => {
        chrome.runtime.sendMessage({ CloseMe: true });
    };
    
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
}


chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.from === "popup" && message.subject === "startTimer") {
        var hour = 0;
        var min = 0;
        var sec = 5;
        var div = document.createElement("div")
        div.innerHTML = `
            <div class="STAYPtopItem">
                <h1>Stay Productive</h1>
                <div class="STAYPtopItemMain">
                    <div class="STAYPInfo">
                        <p>You are currently on :</p>
                        <h4 id="STAYPurl">${window.location.hostname}</h4>
                    </div>
                </div>
            </div>
    
            <div class="STAYPbottomItem">
                <div class="STAYPtimeCont">
                    <p>Time Remaining</p>
                    <div class="STAYPtime">
                        <div class="STAYPnumber">
                            <p id="STAYPhour">${("0" + hour).slice(-2)}</p>
                        </div>
                        <span>:</span>
        
                        <div class="STAYPnumber">
                            <p id="STAYPmin">${("0" + min).slice(-2)}</p>
                        </div>
                        <span>:</span>
        
                        <div class="STAYPnumber">
                            <p id="STAYPsec">${("0" + sec).slice(-2)}</p>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.prepend(div)

       const timerInterval = setInterval(() => {
    if (sec > 0)
        {
        sec--;
        } 
    else if (min > 0) 
        {
        min--;
        sec = 59;
        } 
    else if (hour > 0) 
        {
        hour--;
        min = 59;
        sec = 59;
        } 
    else 
    {
    clearInterval(timerInterval);
     CloseTab();
    return;
    }
    document.getElementById("STAYPhour").innerText = ("0" + hour).slice(-2);
    document.getElementById("STAYPmin").innerText = ("0" + min).slice(-2);
    document.getElementById("STAYPsec").innerText = ("0" + sec).slice(-2);
        }, 1000);

    }
})
function isBlocked(blockedUrls, currentHostname) {
    const currentTime = new Date().getTime();
    console.log("Checking if blocked:", currentHostname);
    console.log("Blocked URLs:", blockedUrls);
    return blockedUrls.some(item => {
        console.log("Checking item:", item);        
        if (item.url === currentHostname && item.status === "BLOCKED" && currentTime < item.BlockTill) {
            console.log("Exact match found for:", currentHostname);
            return true;
        }        
        if (currentHostname.includes(item.url) && item.status === "BLOCKED" && currentTime < item.BlockTill) {
            console.log("Partial match found for:", currentHostname, "with", item.url);
            return true;
        }        
        if (item.mode === "Chill Mode" && currentHostname.endsWith('.edu') && item.status === "BLOCKED" && currentTime < item.BlockTill) {
            console.log("EDU domain blocked in chill mode:", currentHostname);
            return true;
        }
        
        return false;
    });
}

chrome.storage.local.get("BlockedUrls", (data) => {
     console.log("Content script running on:", window.location.hostname);
    console.log("Storage data:", data);
    
    if (data.BlockedUrls !== undefined) {
        const currentHostname = window.location.hostname;
        
        if (isBlocked(data.BlockedUrls, currentHostname)) {
            console.log("Site is blocked, showing black screen");
            
            document.documentElement.style.cssText = `
                background: #000 !important;
                overflow: hidden !important;
            `;
            document.body.style.cssText = `
                background: #000 !important;
                overflow: hidden !important;
                visibility: hidden !important;
            `;
             setTimeout(() => {
                document.body.style.visibility = 'visible';
                CloseTab();
            }, 100);
        }
        else 
        {
            console.log("Site is not blocked");
            const currentTime = new Date().getTime();
            const activeBlocks = data.BlockedUrls.filter((e) => 
                e.status !== "BLOCKED" || currentTime < e.BlockTill
            );
            
            if (activeBlocks.length !== data.BlockedUrls.length) {
                chrome.storage.local.set({ BlockedUrls: activeBlocks });
            }
        }
    } else {
        console.log("No blocked URLs found in storage");
    }
})