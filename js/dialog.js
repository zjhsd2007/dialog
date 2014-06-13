(function(win){
    var isIE6 = !window.XMLHttpRequest;
    var tips = {
        'title':'提示信息',
        'enter':'确定',
        'cancel':'取消',
        'close':''
    };

    var Dialog = function(opts){
        return new Dialog.prototype.init(opts);
    };

    Dialog.prototype = {
        constructor:Dialog,
        init:function(opts){
            this.globalSet = extend({
                pos:'self' //弹出的位置[top,parent,self]
            },opts||{});
            this.dialogs = []; //收集所有的弹窗
        },
        alert:function(opts){
            var _this = this;
            var pWin = win[this.globalSet.pos];
            var doc = pWin.document;
            var set = extend({
                width:400,  //弹窗外层宽度
                height:80,  //弹窗内容层高度
                type:'alert', //弹窗类型
                zIndex:1000  //弹窗的层级z-index
            },opts||{});

            //如果弹窗已经存在
            if(this.dialogs.length){
                this.close();
            }

            //创建弹窗
            var doms = createElements.call(this,set);

            //收集弹窗
            this.dialogs.push(doms);

            //设置提示内容
            doms.dialogBody.innerHTML = set.content;

            //设置居中
            setTimeout(function(){setCenter(doms,doc);},0);

            //点击确定按钮执行的函数
            doms.btnEnter.onclick = function(){
                _this.close();
                set.callback && set.callback.call(_this,true,doms);
            };

            //拖动
            doms.dialogHeader.onmousedown = function(e){
                var mousePos= getMousePos.call(pWin,e),
                    pos = getElementPos.call(pWin,doms.dialogWindow),
                    _move = move.call(pWin,mousePos,doms.dialogWindow,pos.y,pos.x);

                addEvent(doc,'mousemove',_move);
                addEvent(doc,'mouseup',function(){
                    removeEvent(doc,'mousemove',_move)
                });
            };
            doms.dialogHeader.ondragstart = function(){ return false;};

            //关闭
            doms.close.onclick = function(){
                _this.close();
            };

            //resize时居中
            addEvent(pWin,'resize',function(){
                setCenter(doms,doc);
            });

            //返回doms对象，让下面的方法可以对其继续操作
            return doms;
        },
        confirm:function(opts){
            var _this = this;
            var set = extend({
                type:'confirm' //弹窗类型
            },opts||{});

            var doms = this.alert(set);

            doms.dialogFooter.appendChild(doms.btnCancel);
            doms.btnCancel.onclick = function(){
                _this.close();
                opts.callback && opts.callback.call(_this,false,doms);
            }
        },
        load:function(opts){
            var _this = this;
            var set = extend({
                width:700,
                height:300,
                type:'load' //弹窗类型
            },opts||{});

            var doms = this.alert(set);

            doms.dialogWindow.removeChild(doms.dialogFooter);
            doms.btnEnter.onclick = null;

            addClass(doms.dialogBody,'loading');

            //ajax加载内容
            ajax({
                url:set.content,
                success:function(data){
                    doms.dialogBody.innerHTML = data;
                    opts.callback && opts.callback.call(_this,data,doms);
                    removeClass(doms.dialogBody,'loading');
                },
                failure:function(status){
                    throw new Error('数据加载失败:'+ status);
                }
            });

        },
        loadIframe:function(opts){
            var _this = this,
                doc = win[this.globalSet.pos].document,
                iframe = doc.createElement('iframe');

            var set = extend({
                width:700,
                height:300,
                type:'loadIframe' //弹窗类型
            },opts||{});

            var doms = this.alert(set);

            doms.dialogWindow.removeChild(doms.dialogFooter);
            doms.btnEnter.onclick = null;

            iframe.style.cssText = 'width:100%;height:100%';
            iframe.frameBorder = 0;

            addClass(doms.dialogBody,'loading');
            doms.dialogBody.innerHTML = '';
            doms.dialogBody.appendChild(iframe);

            iframe.attachEvent ? iframe.attachEvent('onload',_load) : (iframe.onload = _load);
            function _load(){
                var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
                //IE系列会出现高度只大不小的问题
                iframe.style.height = '0px';

                if(set.height == 'auto'){
                    doms.dialogBody.style.height = Math.max(innerDoc.documentElement.offsetHeight,innerDoc.body.offsetHeight) + 'px';
                }
                set.callback && set.callback.call(_this,iframe,doms);
                removeClass(doms.dialogBody,'loading');
                iframe.style.height = '100%';
                setCenter(doms,doc);
            }
            iframe.src = opts.content;
        },
        close:function(){
            var db =  win[this.globalSet.pos].document.body,
                len = this.dialogs.length;

            //如果没有弹窗
            if(len === 0) return this;
            remove(this.dialogs[0],db);
            this.dialogs.length = 0;
        }
    };

    Dialog.prototype.init.prototype = Dialog.prototype;
    win.Dialog = Dialog;

    /**********************************私有方法*******************************************************/
    function extend(subClass,superClass){
        for(var key in superClass) subClass[key] = superClass[key];
        return subClass;
    }
    //创建弹窗所需的DOM
    function createElements(opts){
        var doc = win[this.globalSet.pos].document,
            db = doc.body,
            h = Math.max(doc.documentElement.clientHeight,db.offsetHeight);
        var width = opts.width,height = opts.height == 'auto' ? 'auto' : opts.height + 'px';
        var dialogMask = createEl.call(doc,'<div class="ui_dialog_mask" style="height:'+h+'px;z-index:'+(opts.zIndex)+'"></div>',db),
            dialogMaskForIE6 = isIE6 && createEl.call(doc,'<iframe marginwidth="0" marginheight="0" align="top" scrolling="no" frameborder="0" class="ui_dialog_iframe_for_ie6" src="" style="height:'+h+'px;z-index:'+opts.zIndex+'"></iframe>',db),
            dialogWindow = createEl.call(doc,'<div class="ui_dialog_window ui_dialog_type_'+opts.type+'" style="width:'+width+'px; z-index:'+(opts.zIndex)+'"></div>',db),
            dialogHeader = createEl.call(doc,'<div class="ui_dialog_hd"><h3>'+ (opts.title || tips.title) +'</h3></div>',dialogWindow),
            close = createEl.call(doc,'<a href="javascript:void(0);" class="ui_dialog_close">'+ tips.close +'</a>',dialogHeader),
            dialogBody = createEl.call(doc,'<div class="ui_dialog_bd" style="height:'+height+';"></div>',dialogWindow),
            dialogFooter = createEl.call(doc,'<div class="ui_dialog_ft"></div>',dialogWindow),
            btnEnter = createEl.call(doc,'<a href="javascript:;" class="btn btn_enter">'+ (opts.enter||tips.enter) +'</a>',dialogFooter),
            btnCancel = createEl.call(doc,'<a href="javascript:;" class="btn btn_cancel">'+(opts.cancel|| tips.cancel) +'</a>')
        isIE6 && (dialogWindow.style.position = 'absolute');
        return {
            dialogMask:dialogMask,
            dialogMaskForIE6:dialogMaskForIE6,
            dialogWindow:dialogWindow,
            dialogHeader:dialogHeader,
            close:close,
            dialogBody:dialogBody,
            dialogFooter:dialogFooter,
            btnEnter:btnEnter,
            btnCancel:btnCancel
        };
    }

    function createEl(str,parent){
        //在哪里创建节点，document就该指向该页面
        var div = this.createElement('div'),el;
        div.innerHTML = str;
        el = div.firstChild;
        return parent ? parent.appendChild(el) : el;
    }

    function setCenter(doms,doc){
        if(!doms) return;
        var T = doms.dialogWindow,w = T.offsetWidth,h = T.offsetHeight,timer = null;
        var dd = doc.documentElement,W = dd.clientWidth,H = dd.clientHeight,dbh = doc.body.offsetHeight;
        var st = Math.max(dd.scrollTop,doc.body.scrollTop),sl = Math.max(dd.scrollLeft,doc.body.scrollLeft);
        T.style.top = (H-h)/2 + (isIE6 ? st : 0 )+'px';
        T.style.left = (W-w)/2 +(isIE6 ? sl : 0 ) + 'px';
        doms.dialogMask.style.height = Math.max(H,dbh) + 'px';
        if(isIE6){
            addEvent(window,'scroll',function(){
                if(timer) clearTimeout(timer);
                timer = setTimeout(function(){
                    var t = Math.max(doc.body.scrollTop,doc.documentElement.scrollTop);
                    T.style.top = (H-h)/2+ t +'px';
                },100);
            });
        }
    }

    function remove(doms,body){
        if(!doms) return;
        body.removeChild(doms.dialogMask);
        body.removeChild(doms.dialogWindow);
        isIE6 && body.removeChild(doms.dialogMaskForIE6);
        doms.btnEnter.onclick = doms.btnCancel.onclick = doms.close.onclick = doms.dialogHeader.onmousedown = null;
    }

    function getMousePos(e){
        var doc = this.document;
        e = e || this.event;
        if(e.pageX || e.pageY) return { left:e.pageX,top:e.pageY};
        return {
            left:e.clientX + doc.documentElement.scrollLeft - doc.body.clientLeft,
            top:e.clientY + doc.documentElement.scrollTop - doc.body.clientTop
        };
    }

    function addEvent(el,type,fn){
        if(el.addEventListener != undefined){
            el.addEventListener(type,fn,false);
        }else if(el.attachEvent != undefined){
            el.attachEvent('on'+type,fn)
        }else{
            el['on'+type] = fn;
        }
    }

    function removeEvent(el,type,fn){
        if(el.removeEventListener != undefined){
            el.removeEventListener(type,fn,false);
        }else if(el.detachEvent != undefined){
            el.detachEvent('on'+type,fn);
        }else{
            el['on'+type] = function(){};
        }
    }

    function move(oldPos,target,t,l){
        var win = this;
        var doc = this.document,dd = doc.documentElement, st = Math.max(dd.scrollTop,doc.body.scrollTop),sl = Math.max(dd.scrollLeft,doc.body.scrollLeft)
        var w = target.offsetWidth,h = target.offsetHeight,cw = dd.clientWidth,ch = dd.clientHeight;
        var rw = cw-w,rh = ch-h;
        return function(e){
            var newPos = getMousePos(e);
            //clear selection
            if (doc.selection && doc.selection.empty) {
                doc.selection.empty();  //IE
            } else if (win.getSelection) {
                win.getSelection().removeAllRanges(); //DOM
            }
            if(isIE6){
                target.style.top = Math.max(st,Math.min(st+rh,(t + (newPos.top - oldPos.top)))) + 'px';
                target.style.left = Math.max(sl,Math.min(sl+rw,(l + (newPos.left - oldPos.left)))) + 'px';
            }else{
                target.style.top = Math.max(0,Math.min(rh,(t + (newPos.top - oldPos.top) - st))) + 'px';
                target.style.left = Math.max(0,Math.min(rw,(l + (newPos.left - oldPos.left) - sl))) + 'px';
            }
        };
    }

    function getElementPos(el){
        var x = 0,y=0,doc = this.document,d_root = doc.documentElement,db = doc.body;
        if(el.getBoundingClientRect){
            var pos = el.getBoundingClientRect();
            x = pos.left + Math.max(d_root.scrollLeft,db.scrollLeft) - d_root.clientLeft;
            y = pos.top + Math.max(d_root.scrollTop,db.scrollTop) - d_root.clientTop;
        }else{
            while(el != db){
                x += el.offsetLeft;
                y += el.offsetTop;
                el = el.offsetParent;
            }
        }
        return {
            x:x,
            y:y
        };
    }

    function hasClass(el,oClass){
        var elClass = el.className;
        return ~ (' '+elClass+' ').indexOf(' ' + oClass + ' ');
    }

    function addClass(el,oClass){
        if(hasClass(el,oClass)) return;
        var elClass = el.className;
        el.className = (elClass+' '+ oClass).replace(/^\s+|\s+$/,'').replace(/\s+/g, ' ');
    }

    function removeClass(el,oClass){
        if(!hasClass(el,oClass)) return;
        var elClass = el.className;
        el.className = (' '+elClass+' ').replace(' ' + oClass + ' ','');
    }

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
        }
        xhr.open(set.type,set.url);
        xhr.onreadystatechange = function(){
            if(xhr.readyState == 4){
                if(xhr.status >= 200 && xhr.status <= 304 ){
                    set.success && set.success(xhr.responseText);
                }else{
                    set.failure && set.failure(xhr.status);
                }
            }
        };
        xhr.send(null);
    }

})(window);