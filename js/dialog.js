(function(win){
    var tips = {
        'title':'教材开发平台提示',
        'enter':'确定',
        'cancel':'取消',
        'close':''
    },
    isIE6 = !window.XMLHttpRequest,
    cssLoaded = false,
    isOpen = false,
    loadCss = function(){
        if(cssLoaded) return;
        var cssHref = 'dialog.css';
        var style = document.createElement('link');
        style.type = 'text/css';
        style.rel = 'stylesheet';
        style.href = cssHref;
        document.getElementsByTagName('head')[0].appendChild(style);
        cssLoaded = true;
    };
 
    /*************************************对外提供的接口****************************************************/
    var dialog = function(opts){
        return new dialog.prototype.init(opts);
    };
 
    dialog.prototype = {
        constructor:dialog,
        init:function(opts){
            //loadCss();
        },
        alert:function(opts){
            var _this = this;
            var set = extend({
                width:400,
                height:80,
                alertClass:1
            },opts||{});
            if(isOpen) this.close();
            isOpen = true;
            this.doms = createElements(set);
            this.doms.contentBox.innerHTML = opts.content;
            setTimeout(function(){setCenter(_this.doms);},0);
            this.doms.btnEnter.onclick = function(){
                _this.close();
                opts.callback && opts.callback(true);
            };
            this.doms.contentTitle.onmousedown = function(e){
                var mousePos= getMousePos(e),pos = getElementPos(_this.doms.contentOuter);
                var _move = move(mousePos,_this.doms.contentOuter,pos.y,pos.x);
                addEvent(document,'mousemove',_move);
                addEvent(document,'mouseup',function(){
                    removeEvent(document,'mousemove',_move)
                });
            };
            this.doms.contentTitle.ondragstart = function(){ return false;};
            this.doms.close.onclick = function(){
                _this.close();
            };
 
            addEvent(window,'resize',function(){setCenter(_this.doms);})
        },
        confirm:function(opts){
            var _this = this;
            this.alert(opts);
            this.doms.btnBox.appendChild(this.doms.btnCancel);
            this.doms.btnCancel.onclick = function(){
                _this.close();
                opts.callback && opts.callback(false);
            }
        },
        prompt:function(opts){
            var _this = this,input;
            opts.alertClass = '';
            this.alert(opts);
            input = createEl('<input type="text" name="" value="'+opts.defaultValue+'" id="diaglo_prompt_input"/>',this.doms.contentBox);
            input.select();
            this.doms.btnBox.appendChild(this.doms.btnCancel);
            this.doms.btnEnter.onclick = function(){
                 _this.close();
                 opts.callback && opts.callback(input.value);
            };
            this.doms.btnCancel.onclick = function(){
                _this.close();
                opts.callback && opts.callback(null);
            };
            this.doms.close.onclick = function(){
                _this.close();
            };
        },
        load:function(opts){
            var _this = this;
            opts.alertClass = '';
            this.alert(opts);
            this.doms.contentOuter.removeChild(this.doms.btnBox);
            this.doms.btnEnter.onclick = null;
            _this.doms.contentBox.className = 'isLoading'
            ajax({
                url:opts.content,
                success:function(data){
                    _this.doms.contentBox.innerHTML = data;
                    opts.callback && opts.callback(data);
                    _this.doms.contentBox.className = '';
                }
            })
        },
        loadIframe:function(opts){
            var _this = this,iframe = document.createElement('iframe'),doc;
            opts.alertClass = '';
            this.alert(opts);
            this.doms.contentOuter.removeChild(this.doms.btnBox);
            this.doms.btnEnter.onclick = null;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.frameBorder = 0;
            _this.doms.contentBox.innerHTML = '';
            _this.doms.contentBox.className = 'isLoading';
            _this.doms.contentBox.appendChild(iframe);
            iframe.attachEvent ? iframe.attachEvent('onload',_load) : (iframe.onload = _load);
            function _load(){
                doc = iframe.contentDocument || iframe.contentWindow.document;
                if(opts.height == 'auto'){
                    _this.doms.contentBox.style.height = Math.max(doc.documentElement.offsetHeight,doc.body.offsetHeight) + 'px'; 
                }
                opts.callback && opts.callback(iframe);
                _this.doms.contentBox.className = '';
                setCenter(_this.doms);
            };
            iframe.src = opts.content;
        },
        close:function(){
            var db = document.body;
            db.removeChild(this.doms.overlayer);
            db.removeChild(this.doms.contentOuter);
            isIE6 && db.removeChild(this.doms.overlayIframe);
            this.doms.btnEnter.onclick = this.doms.btnCancel.onclick = this.doms.close.onclick = this.doms.contentTitle.onmousedown = null;
            this.doms = null;
            isOpen = false;
        }
    };
 
    dialog.prototype.init.prototype = dialog.prototype;
	win.dialog = dialog();
 
    /**********************************私有方法*******************************************************/
    function extend(subClass,superClass){
        for(var key in superClass) subClass[key] = superClass[key];
        return subClass;
    };
    function createElements(opts){
        var db = document.body,h = Math.max(document.documentElement.clientHeight,document.body.offsetHeight);
        var width = opts.width,height = opts.height == 'auto' ? 'auto' : opts.height + 'px';
        var overlayer = createEl('<div id="dialog_overlayer" style="position:absolute;top:0;left:0;width:100%;height:'+h+'px;background:#000;opacity:.5;filter: Alpha(Opacity=50);z-index:9999;"></div>',db),
            overlayIframe = isIE6 && createEl('<iframe marginwidth="0" marginheight="0" align="top" scrolling="no" frameborder="0" class="dialog_HideSelect" src="" style="position:absolute;top:0;left:0;z-index:9998;width:100%;height:'+h+'px;filter: Alpha(Opacity=0);"></iframe>',db),
            contentOuter = createEl('<div id="dialog_window" style="position:fixed;top:50%;left:50%;width:'+width+'px;z-index:10000;"></div>',db),
            contentTitle = createEl('<div id="dialog_title"><h3>'+ (opts.title || tips.title) +'</h3></div>',contentOuter),
            close = createEl('<a href="javascript:void(0);" id="dialog_btn_close" >'+ tips.close +'</a>',contentTitle),
            contentBox = createEl('<div id="dialog_Content" style="height:'+height+';"'+(opts.alertClass ? 'class="dialog_icon_alert"':'')+'></div>',contentOuter),
            btnBox = createEl('<div id="dialog_btnBox"></div>',contentOuter),
            btnEnter = createEl('<a href="javascript:;" id="dialog_btn_enter" class="btn_enter">'+ (opts.enter||tips.enter) +'</a>',btnBox),
            btnCancel = createEl('<a href="javascript:;" id="dialog_btn_cancel" class="btn_cancel">'+(opts.cancel|| tips.cancel) +'</a>')
            isIE6 && (contentOuter.style.position = 'absolute');
        return {
            overlayer:overlayer,
            overlayIframe:overlayIframe,
            contentOuter:contentOuter,
            contentTitle:contentTitle,
            close:close,
            contentBox:contentBox,
            btnBox:btnBox,
            btnEnter:btnEnter,
            btnCancel:btnCancel
        };
    };
    function createEl(str,parent){
        var div = document.createElement('div'),el;
        div.innerHTML = str;
        el = div.firstChild;
        return parent ? parent.appendChild(el) : el;
    };
    function setCenter(doms){
        if(!doms) return;
        var T = doms.contentOuter,w = T.offsetWidth,h = T.offsetHeight,timer = null;
        var dd = document.documentElement,W = dd.clientWidth,H = dd.clientHeight,dbh = document.body.offsetHeight; 
        var st = Math.max(dd.scrollTop,document.body.scrollTop),sl = Math.max(dd.scrollLeft,document.body.scrollLeft);
        T.style.top = (H-h)/2 + (isIE6 ? st : 0 )+'px';
        T.style.left = (W-w)/2 +(isIE6 ? sl : 0 ) + 'px';
        doms.overlayer.style.height = Math.max(H,dbh) + 'px';
        if(isIE6){
            addEvent(window,'scroll',function(){
                if(timer) clearTimeout(timer);
                timer = setTimeout(function(){
                    var t = Math.max(document.body.scrollTop,document.documentElement.scrollTop);
                    T.style.top = (H-h)/2+ t +'px';
                },100);
            });
        };
    };
    function getMousePos(e){
        e = e || window.event;
        if(e.pageX || e.pageY) return { left:e.pageX,top:e.pageY};
        return {
            left:e.clientX + document.documentElement.scrollLeft - document.body.clientLeft,
            top:e.clientY + document.documentElement.scrollTop - document.body.clientTop
        };
    };
    function addEvent(el,type,fn){
        if(el.addEventListener != undefined){
            el.addEventListener(type,fn,false);
        }else if(el.attachEvent != undefined){
            el.attachEvent('on'+type,fn)
        }else{
            el['on'+type] = fn;
        };
    };
    function removeEvent(el,type,fn){
        if(el.removeEventListener != undefined){
            el.removeEventListener(type,fn,false);
        }else if(el.detachEvent != undefined){
            el.detachEvent('on'+type,fn);
        }else{
            el['on'+type] = function(){};
        };
    };
    function move(oldPos,target,t,l){
        var dd = document.documentElement, st = Math.max(dd.scrollTop,document.body.scrollTop),sl = Math.max(dd.scrollLeft,document.body.scrollLeft)
        var w = target.offsetWidth,h = target.offsetHeight,cw = dd.clientWidth,ch = dd.clientHeight;
        var rw = cw-w,rh = ch-h;
        return function(e){
            var newPos = getMousePos(e);
            //clear selection
            if (document.selection && document.selection.empty) {
                document.selection.empty();  //IE
            } else if (window.getSelection) {
                window.getSelection().removeAllRanges(); //DOM
            };
            if(isIE6){
                target.style.top = Math.max(st,Math.min(st+rh,(t + (newPos.top - oldPos.top)))) + 'px';
                target.style.left = Math.max(sl,Math.min(sl+rw,(l + (newPos.left - oldPos.left)))) + 'px';
            }else{
                target.style.top = Math.max(0,Math.min(rh,(t + (newPos.top - oldPos.top) - st))) + 'px';
                target.style.left = Math.max(0,Math.min(rw,(l + (newPos.left - oldPos.left) - sl))) + 'px';
            };
        };
    };
    function getElementPos(el){
        var x = 0,y=0;
        if(el.getBoundingClientRect){
            var pos = el.getBoundingClientRect();
            var d_root = document.documentElement,db = document.body;
            x = pos.left + Math.max(d_root.scrollLeft,db.scrollLeft) - d_root.clientLeft;
            y = pos.top + Math.max(d_root.scrollTop,db.scrollTop) - d_root.clientTop;
        }else{
            while(el != db){
                x += el.offsetLeft;
                y += el.offsetTop;
                el = el.offsetParent;
            };
        };
        return {
            x:x,
            y:y
        };
    };
    function ajax(opts){
        var xhr = null;
        var set = extend({
            type:'GET',
            url:''
        },opts||{});
        if(typeof window.XMLHttpRequest != 'undefined'){
            xhr = new window.XMLHttpRequest();
        }else{
            xhr = new ActiveXObject('MSXML2.XmlHttp.6.0');
        };
        xhr.open(set.type,set.url);
        xhr.onreadystatechange = function(){
            if(xhr.readyState == 4){
                if(xhr.status >= 200 && xhr.status <= 304 ){
                    set.success && set.success(xhr.responseText);
                }else{
                    set.failure && set.failure(xhr.status);
                };
            };
        };
        xhr.send(null);
    }
})(window);