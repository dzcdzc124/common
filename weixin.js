var ua = navigator.userAgent.toLowerCase();
//var WXversion = ua.match(/micromessenger/) ? ua.match(/micromessenger\/([\d.]+)/)[1] : null;

var ADTAG = GetQueryString("ADTAG");

//自定义微信分享
window.shareData = {
	picUrl: basePath + "img/120.jpg",
    url: baseLink + (ADTAG ? "?ADTAG="+ADTAG : ""),
	title: "THIS IS NEX！AI智慧旗舰NEX惊喜开售",
	desc: "",
    timelineTitle : "THIS IS NEX！AI智慧旗舰NEX惊喜开售",
	callback: function(type) {
        if(typeof MtaH5 != "undefined"){
            MtaH5.clickStat(type)
        }
    }
};

function refreshShareData() {
    timelineShareData = {
        title: window.shareData.title,
        link: window.shareData.url,
        imgUrl: window.shareData.picUrl,
        success: function () {
            window.shareData.callback("shareTimeline");
        },
        cancel: function () {}
    }

    appmessageShareData = {
        title: window.shareData.title,
        desc: window.shareData.desc,
        link: window.shareData.url,
        imgUrl: window.shareData.picUrl,
        success: function () {
            window.shareData.callback("shareAppMessage");
        },
        cancel: function () {}
    }

    wx.ready(function(){
        wx.onMenuShareTimeline(timelineShareData);

        wx.onMenuShareAppMessage(appmessageShareData);

        wx.onMenuShareQQ({
            title: window.shareData.title,
            desc: window.shareData.desc,
            link: window.shareData.url,
            imgUrl: window.shareData.picUrl,
            success: function () {
               shareData.callback("ShareQQ");
            },
            cancel: function () {
               // 用户取消分享后执行的回调函数
            }
        });
        wx.onMenuShareWeibo({
            title: window.shareData.title,
            desc: window.shareData.desc,
            link: window.shareData.url,
            imgUrl: window.shareData.picUrl,
            success: function () {
               shareData.callback("shareWeibo");
            },
            cancel: function () {
                // 用户取消分享后执行的回调函数
            }
        });
    });
}
refreshShareData();
