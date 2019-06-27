(function($){

    var inventory = {};
    var url = {};
    var allowedBooks = [1, 729, 11365, 22894, 22996];    //books with slokas
    //['BG', 'SB', 'CC', 'NOI', 'ISO']
    //TODO check on reindexing
    var text = '';
    var verseSelectsNum = 4;

    var test = true;

    if (test) {
        url = {
            sloka : '',
            pandit : '',
            root : 'testdata/pandit-toc-root.json',
            tocGet: 'testdata/pandit-toc-get-response-',    //BG4.4
            sectionGo: 'testdata/pandit-section-go-response.json?',
            auth: 'testdata/pandit-authenticate.json',
            expired: 'testdata/pandit-expired.json',
            help : 'help.html',
            logout: 'testdata/pandit-auth-logout.json'
        };
    } else {
        url.sloka = 'http://pandit.hu/sloka/';
        url.pandit = 'http://pandit.hu/app/';
        url.root = url.pandit + 'toc/root';
        url.tocGet = url.pandit + 'toc/get/';
        url.sectionGo = url.pandit + 'txt/section/go/';
        url.auth = url.pandit + 'auth/authenticate';
        url.help = 'help.html';
        url.logout = url.pandit + 'auth/logout';
    }  /*else {
        url.sloka = 'http://pandit.hu/sloka/';
        url.pandit = './gateway.php';
        url.root = url.pandit + '?url=toc/root';
        url.tocGet = url.pandit + '?url=toc/get/';
        url.sectionGo = url.pandit + '?url=txt/section/go/';
        url.auth = url.pandit + '?url=auth/authenticate';
        url.help = 'help.html';
        url.logout = url.pandit + '?url=auth/logout';
    }*/

    function isAcceptableTitle(value) {
        return value.search(/ének/i) != -1
            || value.search(/līlā/i) != -1
            || value.search(/fejezet/i) != -1
            || value.search(/vers/i) != -1
            || value.search(/\d+\./i) != -1     //for CC verses we just get verse number like 32.
            || value.search(/mantra/i) != -1;
    }

    function appendOptions(select, value, selected) {
        var d = value.partial ? (' data-partial="' + value.partial + '"') : '';
        selected = (selected == value.id) ? 'selected ' : '';
        select.append(
            '<option '
                + 'value="' + value.id + '"'
                + selected
                + d
                + '>'
                + value.title +
            '</option>'
        );
    }

    function filterText(responseText) {
        var r = $('<div>' + responseText + '</div>');
        var text = r.find('.Uvaca').text() ? r.find('.Uvaca').text() + "\n" + ' ' : '';
        text += r.find('.Vers').html()        //we want to keep \n so text() will not be good
            .replace(/<\/*i>/g, '')
            //a responseban igazából <br/> van, de ha arra akarunk cserélni akkor
            // bennemarad valamiért a szövegben, így viszont jó FF-ban
            .replace(/<br>/g, "\n");
        text += "\n\n" + r.children('.Forditas').text();
        return text;
    }

    function makeAllTextVisible() {
        //make all visible
        text = text.replace(/<span class="unseen">/g, '');
        text = text.replace(/<\/span>/g, '');
    }

    function prepareVars() {
        var match, splitters = [];
        var splitPattern = /[ \-\n ]/g;  //szóköz, kötőjel, újsor, nemtommi whitespace
        //collect the indexes of split characters into splitters array
        while ((match = splitPattern.exec(text)) != null) {
            splitters.push(match.index);
        }

        var modifiedVerse = '';
        var words = text.split(splitPattern);
        var pos = 0;
        return {
            splitters: splitters,
            modifiedVerse: modifiedVerse,
            words: words,
            pos: pos
        };
    }

    function putSplittersBack(v, modifiedWord) {
        v.modifiedVerse += modifiedWord + (text[v.splitters[v.pos]] ? text[v.splitters[v.pos]] : '');
        v.pos++;
    }

    function makeHalfTextVisible() {
        //make half of each words visible
        makeAllTextVisible();
        var v = prepareVars();
        $.each(v.words, function (index, word) {
            var spanPos = parseInt(word.length / 2);
            var modifiedWord = word.substr(0, spanPos) +
                '<span class="unseen">' +
                word.substr(spanPos, word.length - spanPos) +
                '</span>';
            putSplittersBack(v, modifiedWord);
        });
        text = v.modifiedVerse;
    }

    function makeFirstCharVisible() {
        //make only first letters visible
        makeAllTextVisible();
        var v = prepareVars();
        $.each(v.words, function (index, word) {
            var spanPos = parseInt(word.length - 1);
            var modifiedWord = word.substr(0, 1) +
                '<span class="unseen">' +
                word.substr(1, spanPos) +
                '</span>';
            putSplittersBack(v, modifiedWord);
        });
        text = v.modifiedVerse;
    }

    function loadText() {
        if (inventory.step == 1) {
            makeAllTextVisible();
        } else if (inventory.step == 2) {
            makeHalfTextVisible();
        } else if (inventory.step == 3) {
            makeFirstCharVisible();
        }
        displayText();
    }

    function displayText() {
        $('main').html(text.replace(/(?:\n)/g, '<br>'));
    }

    function addFilledToImgSrc(img) {
        if (img.attr('src').search('filled') == -1) {
            img.attr('src', img.attr('src').replace('.png', '-filled.png'));
        }
    }

    function removeFilledFromImgSrc(img) {
        img.attr('src', img.attr('src').replace('-filled', ''));
    }

    function getPath() {
        var p;
        var path = 'id' + $('#books').val();
        for (var i = 2; i < 5; i++) {
            p = parseInt($('#sel' + i).val());  //NaN is falsy
            if (p) {
                path += '/id' + p;
            }
        }
        return path;
    }

    function buildObjForTocGet(selectedBookId) {
        return {
            async: false,
            url: url.tocGet + selectedBookId,
            xhrFields: {
                withCredentials: true
            },
            success: function (response) {
                if (response.error == 'expired') {
                    $('#login').show();
                    $('#app').hide();
                } else if (response.id >= 0) {
                    inventory['id' + response.id] = response;
                    inventory['id' + response.id]['path'] = getPath();
                }
            },
            error: function (response) {
                alert('Valami gáz van típusú hibába botlottam! (buildObjForTocGet)');    // TODO display some error message
            }
        };
    }

    function isChildrenInInventory(selectedBookId) {
        var childrenAlreadyInInventory = false;
        //check if the selected book / part and its children are also in inventory
        if (inventory['id' + selectedBookId]) {
            if(inventory['id' + selectedBookId]['children']) {
                childrenAlreadyInInventory = true;
            }
        }
        return childrenAlreadyInInventory;
    }

    function removeSelect(selectIds) {
        if($.isNumeric(selectIds)) {
            selectIds = [selectIds];
        }
        $.each(selectIds, function (index, selectId) {
            select = $('#sel' + selectId);
            select.empty();
            select.append('<option>--- válassz ---</option>');
            select.hide();
        });
    }

    function selectChangeHandler() {
        var selectedId = $(this).val();
        var nextSelectId = parseInt($(this).attr('id').replace('sel', '')) + 1;
        var selects = [];
        for (var i = nextSelectId; i < verseSelectsNum; i++) {
            selects.push(i);
        }
        removeSelect(selects);
        if ($(this).find(':selected').data('partial') == true) {
            //go deeper in toc-get
            if (!inventory['id' + selectedId]) {
                $.ajax(
                    buildObjForTocGet(selectedId)
                );
            }
            updateSelect(nextSelectId, selectedId);
        } else {
            //get the sloka from inventory
            if (inventory['id' + selectedId]) {
                text = inventory['id' + selectedId]['text'];
                inventory.lastVerse = 'id' + selectedId;
                loadText();
                setShortref(inventory.lastVerse);
            } else {
                //get it from the server by section-go
                $.ajax({
                    url: url.sectionGo + selectedId,
                    success: function (response) {
                        text = filterText(response.text);
                        inventory['id' + selectedId] = {
                            shortRef : response.shortRef,
                            text : text,
                            path : getPath()
                        };
                        inventory.lastVerse = 'id' + selectedId;
                        loadText();
                        setShortref(inventory.lastVerse);
                    },
                    error: function (response) {
                        alert('Valami gáz van típusú hibába botlottam! (selectChangeHandler)');    // TODO display some error message
                    }
                });
            }
        }
    }

    function initializeInventory() {
        //we need this to do not allow users full offline usage
        // TODO switch this to a 30 days renewal?
        // login could be happen any time when a missing book or text is requested
        if ($.localStorage('sloka.learnt') === undefined) {
            //delete old sloka from localstorage
            //https://github.com/rrd108/sloka/issues/10
            localStorage.removeItem('sloka');
            $.localStorage.remove('sloka');
        }
        inventory = $.localStorage('sloka') ? $.localStorage('sloka') : {step : 1, learnt : []};
        $.ajax(
            {
                async : false,
                url : url.root,
                xhrFields : {
                    withCredentials: true
                },
                success : function (response) {
                    if (response.id == 0) {
                        inventory.loggedin = true;
                        //the user is logged in to pandit
                        inventory.id0 = {
                            id : 0,
                            children : []
                        };
                        $.each(response.children, function (index, book) {
                            inventory.id0.children[index] = {
                                id : book.id,
                                title : book.title,
                                partial : book.partial ? book.partial : true
                            };
                        });
                        inventory.id1 = response.children[0];
                    }
                    // if we are not logged in we will not have anything in inventory - handled in onready
                },
                error : function (response) {
                    // TODO display some error message
                    alert('Valami hiba történt');
                }
            }
        );
    }

    function addNavHandlers() {
        //attach event handlers for nav images
        $('nav img.steps').click(function (event) {
            $('nav img.steps').each(function () {
                if (event.target == this) {
                    inventory.step = $(this).attr('src').replace('.png', '')
                        .replace('img/', '')
                        .replace('-filled', '');
                    addFilledToImgSrc($(this));
                } else {
                    removeFilledFromImgSrc($(this));
                }
            });
            loadText();
        });

        $('#save').click(function () {
            if (inventory.learnt.indexOf(inventory.lastVerse) == -1) {
                inventory.learnt.push(inventory.lastVerse);
                buildLearnt();
            }
        });

        $('#switch').click(function () {
            var parts = $('main').html()
                .replace('<br><br>', '|')
                .replace(/<br>/g, ' ')
                .split('|');
            var verse = [];
            $.each(parts[0].split(' '), function (index, value) {
                verse.push(value.trim());
            });
            shuffledVerse = verse.sort(function () { return 0.5 - Math.random() });

            $('main').append('<div id="shuffledVerse">' + shuffledVerse.join(' ') + '</div>');
        });

        $('#help').click(function () {
            $.ajax(
                {
                    url : url.help,
                    success : function (response) {
                        $('main').empty().append(response);
                    }
                }
            );
        });

        $('#logout').click(function () {
            $.ajax(
                {
                    url : url.logout,
                    success : function () {
                        window.location.href = url.sloka;
                    }
                }
            );
        });
    }

    function addWordSpanHandlers() {
        //we use .on() as it will work with later dynamically created spans
        $('p').on('click', 'span', function () {
            $(this).removeClass('unseen');
            $(this).delay(2000).queue(function () {
                $(this).addClass('unseen');
            });
        });
    }

    function updateSelect(selNum, selectedBookId, selectedId) {
        if (selectedBookId.search('id') !== 0) {
            selectedBookId = 'id' + selectedBookId;
        }
        $.each(inventory[selectedBookId]['children'], function (index, value) {
            if (isAcceptableTitle(value.title)) {
                appendOptions($('#sel' + selNum), value, selectedId);
            }
        });
        $('#sel' + selNum).show();
        for (var i = ++selNum; i < verseSelectsNum; i++) {
            removeSelect(i);
        }
    }

    function buildBookSelect(bookId) {
        $('#books').empty();
        var options = '',
            disabled = '';
        $.each(inventory.id0.children, function (index, book) {
            options += '<option value="' + book.id + '"';
            if (allowedBooks.indexOf(book.id) == -1) {
                options += ' disabled';
            }
            if (bookId == 'id' + book.id) {
                options += ' selected';
            }
            options += '>' + book.title + '</option>';
        });
        $('#books').append(options);
    }

    function addSelectHandlers() {
        removeSelect([3, 4]);
        $('#sel2').change(function () {
            selectChangeHandler.call(this);
        });
        $('#sel3').change(function () {
            selectChangeHandler.call(this);
        });
        $('#sel4').change(function () {
            selectChangeHandler.call(this);
        });
    }

    function setShortref(id) {
        $('#shortref').text(inventory[id]['shortRef']);
    }

    function buildLearnt() {
        if (inventory.learnt.length) {
            var removelearnt = $('#removelearnt').hide().detach();
            var footerhamburger = $('#footerhamburger').hide().detach();
            $('footer').empty().append(footerhamburger.show());
            $.each(inventory.learnt, function (index, value) {
                $('footer').append(
                    '<span data-inventoryid="' + value + '">'
                    + inventory[value].shortRef
                    + '</a>'
                );
            });
            $('footer').append(removelearnt);
        } else {
            //nothing in footer lets add some info text
            $('footer').append('<span>Még nincs elmentett versed</span>');
        }
    }

    function addFooterHandlers() {
        //we use .on() as it will work with later dynamically created anchors
        $('footer').on('mouseover', 'span', function () {
            $(this).append($('#removelearnt').show());
        });
        $('footer').on('mouseout', 'span', function () {
            $('#removelearnt').hide();
        });

        $('footer').click(function (event) {
            var verseId;
            if ($(event.target).attr('id') == 'removelearnt') {
                verseId = $(event.target).parent().data('inventoryid');
                var removeLearnt = $(event.target);
                $(event.target).parent().remove();
                $('footer').append(removeLearnt);
                inventory.learnt = $.grep(inventory.learnt, function (value) {
                    return value != verseId;
                });
            } else if ($(event.target).prop('tagName') == 'SPAN') {
                verseId = $(event.target).data('inventoryid');
                var bookId = loadVerse(verseId);
                loadText();
                buildBookSelect(bookId);
            } else if ($(event.target).attr('id') == 'footerhamburger') {
                var h = ($('footer').height() == '21' ? 'auto' : '21');
                $('footer').height(h);
            }
        });
    }

    function loadVerse(verseId) {
        inventory.lastVerse = verseId;
        text = inventory[verseId]['text'];
        setShortref(verseId);
        var path = inventory[verseId].path.split('/');
        var bookId = path[0];
        var selectNum = path.length - 1;
        for (var i = 0; i < selectNum; i++) {
            //we start with sel2 at index = 0
            removeSelect(i + 2);
            updateSelect(i + 2, path[i], path[i + 1].replace('id', ''));
        }
        return bookId;
    }

    function addBookChangeHandler() {
        $('#books').change(function () {
            removeSelect([2, 3, 4]);
            var selectedBookId = $(this).find('option:selected').val();
            if (!isChildrenInInventory(selectedBookId)) {
                $.ajax(
                    buildObjForTocGet(selectedBookId)
                );
            }
            updateSelect(2, selectedBookId);
        });
    }

    function initializeApp() {
        addSelectHandlers();
        addNavHandlers();
        addWordSpanHandlers();
        addFilledToImgSrc($('#s' + inventory.step));
        var bookId = 'id1';         //BG
        if (inventory.lastVerse) {
            bookId = loadVerse(inventory.lastVerse);
        } else {
            updateSelect(2, bookId);
        }
        loadText();
        buildBookSelect(bookId);
        addBookChangeHandler();
        buildLearnt();
        addFooterHandlers();
    }

    initializeInventory();

    $(function() {      //onready
        if (inventory.loggedin === true) {     //we are logged in to pandit
            $('#app').show();
            initializeApp();
        } else {
            $('#login').show();
            $('#login > form').submit(function (event) {
                event.preventDefault();
                $.ajax({
                    url: url.auth,
                    method: "POST",
                    dataType: "json",
                    data: {
                        email: $('#email').val(),
                        password: window.md5($('#password').val())
                    },
                    success: function (response) {
                        if (response.ok) {
                            //we are logged in
                            $('#login').hide();
                            initializeInventory();
                            initializeApp();
                            $('#app').show();
                        } else if (response.fail) {
                            alert('Hibás bejelentkezési név vagy jelszó!'); // TODO
                        } else if (response.message) {
                            alert(response.message);
                        } else {
                            alert('A bejelentkezés során valamilyen mittudomén típusú hibára futottam!'); // TODO
                        }
                    },
                    error: function (response) {
                        alert('Valami gáz van típusú hibába botlottam! (onReady)');    // TODO display some error message
                    }
                });
            });
        }
    });

    $(window).on('unload', function () {
        inventory.loggedin = false;
        $.localStorage('sloka', inventory);
    });

})(jQuery);

//this part is needed for md5-ing the password
//stolen from original pandit site
!function(a){"use strict";function b(a,b){var c=(65535&a)+(65535&b),d=(a>>16)+(b>>16)+(c>>16);return d<<16|65535&c}function c(a,b){return a<<b|a>>>32-b}function d(a,d,e,f,g,h){return b(c(b(b(d,a),b(f,h)),g),e)}function e(a,b,c,e,f,g,h){return d(b&c|~b&e,a,b,f,g,h)}function f(a,b,c,e,f,g,h){return d(b&e|c&~e,a,b,f,g,h)}function g(a,b,c,e,f,g,h){return d(b^c^e,a,b,f,g,h)}function h(a,b,c,e,f,g,h){return d(c^(b|~e),a,b,f,g,h)}function i(a,c){a[c>>5]|=128<<c%32,a[(c+64>>>9<<4)+14]=c;var d,i,j,k,l,m=1732584193,n=-271733879,o=-1732584194,p=271733878;for(d=0;d<a.length;d+=16)i=m,j=n,k=o,l=p,m=e(m,n,o,p,a[d],7,-680876936),p=e(p,m,n,o,a[d+1],12,-389564586),o=e(o,p,m,n,a[d+2],17,606105819),n=e(n,o,p,m,a[d+3],22,-1044525330),m=e(m,n,o,p,a[d+4],7,-176418897),p=e(p,m,n,o,a[d+5],12,1200080426),o=e(o,p,m,n,a[d+6],17,-1473231341),n=e(n,o,p,m,a[d+7],22,-45705983),m=e(m,n,o,p,a[d+8],7,1770035416),p=e(p,m,n,o,a[d+9],12,-1958414417),o=e(o,p,m,n,a[d+10],17,-42063),n=e(n,o,p,m,a[d+11],22,-1990404162),m=e(m,n,o,p,a[d+12],7,1804603682),p=e(p,m,n,o,a[d+13],12,-40341101),o=e(o,p,m,n,a[d+14],17,-1502002290),n=e(n,o,p,m,a[d+15],22,1236535329),m=f(m,n,o,p,a[d+1],5,-165796510),p=f(p,m,n,o,a[d+6],9,-1069501632),o=f(o,p,m,n,a[d+11],14,643717713),n=f(n,o,p,m,a[d],20,-373897302),m=f(m,n,o,p,a[d+5],5,-701558691),p=f(p,m,n,o,a[d+10],9,38016083),o=f(o,p,m,n,a[d+15],14,-660478335),n=f(n,o,p,m,a[d+4],20,-405537848),m=f(m,n,o,p,a[d+9],5,568446438),p=f(p,m,n,o,a[d+14],9,-1019803690),o=f(o,p,m,n,a[d+3],14,-187363961),n=f(n,o,p,m,a[d+8],20,1163531501),m=f(m,n,o,p,a[d+13],5,-1444681467),p=f(p,m,n,o,a[d+2],9,-51403784),o=f(o,p,m,n,a[d+7],14,1735328473),n=f(n,o,p,m,a[d+12],20,-1926607734),m=g(m,n,o,p,a[d+5],4,-378558),p=g(p,m,n,o,a[d+8],11,-2022574463),o=g(o,p,m,n,a[d+11],16,1839030562),n=g(n,o,p,m,a[d+14],23,-35309556),m=g(m,n,o,p,a[d+1],4,-1530992060),p=g(p,m,n,o,a[d+4],11,1272893353),o=g(o,p,m,n,a[d+7],16,-155497632),n=g(n,o,p,m,a[d+10],23,-1094730640),m=g(m,n,o,p,a[d+13],4,681279174),p=g(p,m,n,o,a[d],11,-358537222),o=g(o,p,m,n,a[d+3],16,-722521979),n=g(n,o,p,m,a[d+6],23,76029189),m=g(m,n,o,p,a[d+9],4,-640364487),p=g(p,m,n,o,a[d+12],11,-421815835),o=g(o,p,m,n,a[d+15],16,530742520),n=g(n,o,p,m,a[d+2],23,-995338651),m=h(m,n,o,p,a[d],6,-198630844),p=h(p,m,n,o,a[d+7],10,1126891415),o=h(o,p,m,n,a[d+14],15,-1416354905),n=h(n,o,p,m,a[d+5],21,-57434055),m=h(m,n,o,p,a[d+12],6,1700485571),p=h(p,m,n,o,a[d+3],10,-1894986606),o=h(o,p,m,n,a[d+10],15,-1051523),n=h(n,o,p,m,a[d+1],21,-2054922799),m=h(m,n,o,p,a[d+8],6,1873313359),p=h(p,m,n,o,a[d+15],10,-30611744),o=h(o,p,m,n,a[d+6],15,-1560198380),n=h(n,o,p,m,a[d+13],21,1309151649),m=h(m,n,o,p,a[d+4],6,-145523070),p=h(p,m,n,o,a[d+11],10,-1120210379),o=h(o,p,m,n,a[d+2],15,718787259),n=h(n,o,p,m,a[d+9],21,-343485551),m=b(m,i),n=b(n,j),o=b(o,k),p=b(p,l);return[m,n,o,p]}function j(a){var b,c="";for(b=0;b<32*a.length;b+=8)c+=String.fromCharCode(a[b>>5]>>>b%32&255);return c}function k(a){var b,c=[];for(c[(a.length>>2)-1]=void 0,b=0;b<c.length;b+=1)c[b]=0;for(b=0;b<8*a.length;b+=8)c[b>>5]|=(255&a.charCodeAt(b/8))<<b%32;return c}function l(a){return j(i(k(a),8*a.length))}function m(a,b){var c,d,e=k(a),f=[],g=[];for(f[15]=g[15]=void 0,e.length>16&&(e=i(e,8*a.length)),c=0;16>c;c+=1)f[c]=909522486^e[c],g[c]=1549556828^e[c];return d=i(f.concat(k(b)),512+8*b.length),j(i(g.concat(d),640))}function n(a){var b,c,d="0123456789abcdef",e="";for(c=0;c<a.length;c+=1)b=a.charCodeAt(c),e+=d.charAt(b>>>4&15)+d.charAt(15&b);return e}function o(a){return unescape(encodeURIComponent(a))}function p(a){return l(o(a))}function q(a){return n(p(a))}function r(a,b){return m(o(a),o(b))}function s(a,b){return n(r(a,b))}function t(a,b,c){return b?c?r(b,a):s(b,a):c?p(a):q(a)}"function"==typeof define&&define.amd?define(function(){return t}):a.md5=t}(this);
