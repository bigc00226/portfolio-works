/*
 * The first message of the visitor statistics, sent from <head> as soon as the page starts loading — before React has
 * hydrated the page, so a visitor who leaves within the first seconds still counts (the list page is large and takes
 * a while to hydrate on a slow phone). It leaves the answer in window.__ppView (a promise of { id }), which
 * lib/track-client.ts picks up. Until the tracker takes over, a visitor leaving sends the time the page was open.
 * Nothing is sent from /admin, nor when the browser asks not to be tracked (Global Privacy Control).
 * Plain ES5 on purpose: it runs before anything else.
 */
export const TRACK_HEAD = `(function(){try{
var n=navigator,l=location,w=window;
if(n.globalPrivacyControl||l.pathname.indexOf('/admin')===0)return;
var u=n.userAgentData,base={touch:n.maxTouchPoints||0,webdriver:n.webdriver||undefined};
function plain(){return u?{touch:base.touch,webdriver:base.webdriver,brands:u.brands,mobile:u.mobile,platform:u.platform}:base}
var hints=u&&u.getHighEntropyValues?u.getHighEntropyValues(['platformVersion','model','fullVersionList']).then(function(x){var h=plain();h.brands=x.fullVersionList||u.brands;h.platformVersion=x.platformVersion;h.model=x.model;return h},plain):Promise.resolve(plain());
w.__ppView=hints.then(function(h){return fetch('/api/track',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({t:'view',path:l.pathname,ref:document.referrer,lang:n.language,tz:Intl.DateTimeFormat().resolvedOptions().timeZone,screen:screen.width+'\\u00d7'+screen.height,hints:h})})}).then(function(r){return r.ok?r.json():null}).then(function(j){if(j)w.__ppId=j.id;return j}).catch(function(){return null});
addEventListener('pagehide',function(){if(w.__ppTook||!w.__ppId||!n.sendBeacon)return;n.sendBeacon('/api/track',new Blob([JSON.stringify({t:'ping',id:w.__ppId,active:Math.round(performance.now())})],{type:'text/plain'}))});
}catch(e){}})();`;
