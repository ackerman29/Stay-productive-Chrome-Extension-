var WebsiteUrl;
var WebsiteHostName;
const socialMediaSites = [
    'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'tiktok.com',
    'snapchat.com', 'reddit.com', 'pinterest.com', 'tumblr.com', 'discord.com',
    'whatsapp.com', 'telegram.org', 'youtube.com'
];

const gamingSites = [
    'steam.com', 'twitch.tv', 'epicgames.com', 'roblox.com', 'minecraft.net',
    'battlenet.com', 'origin.com', 'ubisoft.com', 'ea.com', 'xbox.com',
    'playstation.com', 'nintendo.com', 'itch.io', 'gamepass.com'
];

const productiveSites = [
    'linkedin.com', 'coursera.org', 'edx.org', 'khanacademy.org',
    'udemy.com', 'pluralsight.com', 'codecademy.com', 'freecodecamp.org',
    'stackoverflow.com', 'github.com', 'medium.com', 'notion.so'
];

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    WebsiteUrl = tabs[0].url
    WebsiteHostName = new URL(tabs[0].url).hostname

    document.getElementById("url").innerText = WebsiteHostName 
})

function ShowError(text) {    
    var div = document.createElement('div');
    div.setAttribute('id', 'ERRORcontainer');
    div.innerHTML = `
                <div class="ERROR">
                    <p>${text}</p>     
                </div>`
    document.getElementsByClassName("bottomItem")[0].appendChild(div)

    setTimeout(() => {
        document.getElementById("ERRORcontainer").remove()
    }, 3000)
}

function blockWebsitesList(websites, mode) {
    chrome.storage.local.get("BlockedUrls", (data) => {
        let blockedUrls = data.BlockedUrls || [];
        
        blockedUrls = blockedUrls.filter(item => !websites.includes(item.url));
        
        const newBlocks = websites.map(url => ({
            status: "BLOCKED",
            url: url,
            BlockTill: getBlockEndTime(),
            mode: mode
        }));
        
        blockedUrls = [...blockedUrls, ...newBlocks];
        
        chrome.storage.local.set({ BlockedUrls: blockedUrls }, () => {
            console.log("Blocked URLs saved:", blockedUrls);
            ShowError(`${mode} activated! ${websites.length} websites blocked.`);
            
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.url && !tab.url.startsWith('chrome://')) {
                        chrome.tabs.reload(tab.id);
                    }
                });
            });
        });
    });
}
function getBlockEndTime() {
    var then = new Date();
    then.setHours(24, 0, 0, 0);
    return then.getTime();
}
document.getElementById("btn").addEventListener("click", () => {
    if (WebsiteUrl.toLowerCase().includes("chrome://")) {
        ShowError("You cannot block a chrome URL")
    }
    else {
        chrome.storage.local.get("BlockedUrls", (data) => {
            if (data.BlockedUrls === undefined) {
                chrome.storage.local.set({ BlockedUrls: [{ status: "In_Progress", url: WebsiteHostName }] })
                chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                    chrome.tabs.sendMessage(
                        tabs[0].id,
                        { from: "popup", subject: "startTimer" }
                    );
                });

                setTimeout(() => {
                    chrome.storage.local.get("BlockedUrls", (data) => {
                        data.BlockedUrls.forEach((e, index) => {
                            if (e.url === WebsiteHostName && e.status === 'In_Progress') {
                                data.BlockedUrls[index] = { 
                                    status: "BLOCKED", 
                                    url: WebsiteHostName, 
                                    BlockTill: getBlockEndTime(),
                                    mode: "individual"
                                };
                                chrome.storage.local.set({ BlockedUrls: data.BlockedUrls });
                            }
                        })
                    })
                }, 5000);

            }
            else {
                if (data.BlockedUrls.some((e) => e.url === WebsiteHostName && e.status === "In_Progress")) {
                    ShowError("This URL will be completely blocked after some time")
                }
                else if (data.BlockedUrls.some((e) => e.url === WebsiteHostName && e.status === "BLOCKED")) {
                    ShowError("This URL is Blocked completely")
                }
                else {
                    chrome.storage.local.set({ BlockedUrls: [...data.BlockedUrls, { status: "In_Progress", url: WebsiteHostName }] })

                    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                        chrome.tabs.sendMessage(
                            tabs[0].id,
                            { from: "popup", subject: "startTimer" }
                        );
                    });

                    setTimeout(() => {
                        chrome.storage.local.get("BlockedUrls", (data) => {
                            data.BlockedUrls.forEach((e, index) => {
                                if (e.url === WebsiteHostName && e.status === 'In_Progress') {
                                    data.BlockedUrls[index] = { 
                                        status: "BLOCKED", 
                                        url: WebsiteHostName, 
                                        BlockTill: getBlockEndTime(),
                                        mode: "individual"
                                    };
                                    chrome.storage.local.set({ BlockedUrls: data.BlockedUrls });
                                }
                            })
                        })
                    }, 5000);
                }
            }
        })
    }
})

document.getElementById("focusMode").addEventListener("click", () => {
    const websitesToBlock = [...socialMediaSites, ...gamingSites];
    blockWebsitesList(websitesToBlock, "Focus Mode");
});

document.getElementById("chillMode").addEventListener("click", () => {
    
    const educationalSites = [...productiveSites];
    blockWebsitesList(educationalSites, "Chill Mode");
});

document.getElementById("clearBlocks").addEventListener("click", () => {
    chrome.storage.local.set({ BlockedUrls: [] }, () => {
        ShowError("All blocks cleared!");
    });
});