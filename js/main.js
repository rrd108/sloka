(function($){

    var inventory = {};
    var url = {};
    var text = '';

    var test = false;

    if (test) {
        url.base = '';
        url.root = 'pandit-toc-root.json';
        url.tocGet = 'pandit-toc-get-response.json-';
        url.sectionGo = 'pandit-section-go-response.json?';
        url.auth = 'pandit-authenticate.json';
    } else {
        url.base = 'http://pandit.hu/app/';
        url.root = url.base + 'toc/root';
        url.tocGet = url.base + 'toc/get/';
        url.sectionGo = url.base + 'section/go/';
        url.auth = url.base + 'auth/authenticate';
    }

    function isAcceptableTitle(value) {
        return value.search(/ének/i) != -1
            || value.search(/līlā/i) != -1
            || value.search(/fejezet/i) != -1
            || value.search(/vers/i) != -1
            || value.search(/mantra/i) != -1;
    }

    function appendOptions(value) {
        var d = value.partial ? ('data-partial="' + value.partial + '"') : '';
        $('#sel2').append(
            '<option value="' + value.id + '" ' + d + '>'
            + value.title +
            '</option>'
        );
    }

    $.ajax(
        {
            async: false,
            url : url.root,
            xhrFields: {
                withCredentials: true
            },
            success : function(response){
                if (response.id == 0) {
                    //the user is logged in to pandit
                    inventory = response;
                    //put BG chapters to sel2
                    $.each(response.children[0].children, function(index, value){
                        if (isAcceptableTitle(value.title)) {
                            appendOptions(value);
                        }
                    });
                } else {
                    //display log in to pandit and hide other parts
                    $('#login').show();
                    $('#app').hide();
                }
            },
            error : function(response){
                // TODO display some error message
                alert('Valami hiba történt');
            }
        }
    );

    $.localStorage(
        'sloka',
        ($.localStorage('sloka') ? $.localStorage('sloka') : {step : 1})
    );

    function makeAllTextVisible() {
        //make all visible
        text = text.replace(/<span class="unseen">/g, '');
        text = text.replace(/<\/span>/g, '');
    }

    function prepareVars() {
        var match, splitters = [];
        var splitPattern = /[ \-\n]/g;
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
                //'<span class="invisible">' +
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
                //'<span class="invisible">' +
                '<span class="unseen">' +
                word.substr(1, spanPos) +
                '</span>';
            putSplittersBack(v, modifiedWord);
        });
        text = v.modifiedVerse;
    }

    function loadText(num) {
        $.localStorage('sloka.step', num);
        if (num == 1) {
            makeAllTextVisible();
        } else if (num == 2) {
            makeHalfTextVisible();
        } else if (num == 3) {
            makeFirstCharVisible();
        }
        displayText();
    }

    function displayText() {
        $('#main').html(text.replace(/(?:\n)/g, '<br>'));
    }

    function addFilledToImgSrc(img) {
        if (img.attr('src').search('filled') == -1) {
            img.attr('src', img.attr('src').replace('.png', '-filled.png'));
        }
    }

    function removeFilledFromImgSrc(img) {
        img.attr('src', img.attr('src').replace('-filled', ''));
    }

    $(function() {      //onready
        if (inventory.id >= 0) {     //we are logged in to pandit

            //attach event handlers for nav images and load last verse from localStorage
            $('nav img').click(function (event) {
                $('nav img').each(function () {
                    if (event.target == this) {
                        var num = $(this).attr('src').replace('.png', '')
                            .replace('img/', '')
                            .replace('-filled', '');
                        loadText(num);
                        addFilledToImgSrc($(this));
                    } else {
                        removeFilledFromImgSrc($(this));
                    }
                });
            });

            //attach event handlers to spans
            //we use .on() as it will work with later dynamically created spans
            $('p').on('click', 'span', function () {
                $(this).removeClass('unseen');
                $(this).delay(2000).queue(function () {
                    $(this).addClass('unseen');
                });
            });

            addFilledToImgSrc($('#s' + $.localStorage('sloka.step')));

            loadText($.localStorage('sloka.step'));

            //build select for books
            var options = '';
            $.each(inventory.children, function (index, book){
                options += '<option value="'  + book.id + '">' + book.title + '</option>';
            });
            $('#books').append(options);

            $('#books').change(function () {
                var selectedBookId = $(this).find('option:selected').val();
                var childrenAlreadyInInventory = false;
                var bookIndexInInventory;
                //check if the selected book is already in inventory and if its children is also there
                $.each(inventory.children, function (index, book) {
                    if (book.id == selectedBookId) {
                        bookIndexInInventory = index;
                        if (book.children) {
                            childrenAlreadyInInventory = true;
                        }
                    }
                });

                if (!childrenAlreadyInInventory) {
                    $.ajax(
                        {
                            async : false,
                            url : url.tocGet + selectedBookId,
                            xhrFields: {
                                withCredentials: true
                            },
                            success: function (response) {
                                if (response.error == 'expired') {
                                    $('#login').show();
                                    $('#app').hide();
                                } else if (response.id >= 0) {
                                    //put the contents to books
                                    inventory['children'][bookIndexInInventory] = response;
                                }
                            },
                            error: function (response) {
                                // TODO display some error message
                            }
                        }
                    );
                }

                //update second select
                $('#sel2 > option').detach();
                if (availableBooks.indexOf(inventory.children[bookIndexInInventory].id) != -1) {
                    $('#sel2').append('<option>--- válassz ---</option>');
                    $.each(inventory.children[bookIndexInInventory].children, function (index, value) {
                        if (isAcceptableTitle(value.title)) {
                            appendOptions(value);
                        }
                    });
                } else {
                    $('#sel2').append('<option>- ebben a könyvben nincsenek slokák -</option>');
                }
            });

                    }
                });
            });
        } else {
            $('#login').show();
            $('#app').hide();
            $('#loginBtn').click(function(){
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
                            $('#app').show();
                        }
                        // TODO response.message.search('csak 1 eszközön') != -1
                    },
                    error: function (response) {
                        console.log(response);  // TODO
                    }
                });
            });
        }
    });

})(jQuery);

//this part is needed for md5-ing the password
//stolen from original pandit site
!function(a){"use strict";function b(a,b){var c=(65535&a)+(65535&b),d=(a>>16)+(b>>16)+(c>>16);return d<<16|65535&c}function c(a,b){return a<<b|a>>>32-b}function d(a,d,e,f,g,h){return b(c(b(b(d,a),b(f,h)),g),e)}function e(a,b,c,e,f,g,h){return d(b&c|~b&e,a,b,f,g,h)}function f(a,b,c,e,f,g,h){return d(b&e|c&~e,a,b,f,g,h)}function g(a,b,c,e,f,g,h){return d(b^c^e,a,b,f,g,h)}function h(a,b,c,e,f,g,h){return d(c^(b|~e),a,b,f,g,h)}function i(a,c){a[c>>5]|=128<<c%32,a[(c+64>>>9<<4)+14]=c;var d,i,j,k,l,m=1732584193,n=-271733879,o=-1732584194,p=271733878;for(d=0;d<a.length;d+=16)i=m,j=n,k=o,l=p,m=e(m,n,o,p,a[d],7,-680876936),p=e(p,m,n,o,a[d+1],12,-389564586),o=e(o,p,m,n,a[d+2],17,606105819),n=e(n,o,p,m,a[d+3],22,-1044525330),m=e(m,n,o,p,a[d+4],7,-176418897),p=e(p,m,n,o,a[d+5],12,1200080426),o=e(o,p,m,n,a[d+6],17,-1473231341),n=e(n,o,p,m,a[d+7],22,-45705983),m=e(m,n,o,p,a[d+8],7,1770035416),p=e(p,m,n,o,a[d+9],12,-1958414417),o=e(o,p,m,n,a[d+10],17,-42063),n=e(n,o,p,m,a[d+11],22,-1990404162),m=e(m,n,o,p,a[d+12],7,1804603682),p=e(p,m,n,o,a[d+13],12,-40341101),o=e(o,p,m,n,a[d+14],17,-1502002290),n=e(n,o,p,m,a[d+15],22,1236535329),m=f(m,n,o,p,a[d+1],5,-165796510),p=f(p,m,n,o,a[d+6],9,-1069501632),o=f(o,p,m,n,a[d+11],14,643717713),n=f(n,o,p,m,a[d],20,-373897302),m=f(m,n,o,p,a[d+5],5,-701558691),p=f(p,m,n,o,a[d+10],9,38016083),o=f(o,p,m,n,a[d+15],14,-660478335),n=f(n,o,p,m,a[d+4],20,-405537848),m=f(m,n,o,p,a[d+9],5,568446438),p=f(p,m,n,o,a[d+14],9,-1019803690),o=f(o,p,m,n,a[d+3],14,-187363961),n=f(n,o,p,m,a[d+8],20,1163531501),m=f(m,n,o,p,a[d+13],5,-1444681467),p=f(p,m,n,o,a[d+2],9,-51403784),o=f(o,p,m,n,a[d+7],14,1735328473),n=f(n,o,p,m,a[d+12],20,-1926607734),m=g(m,n,o,p,a[d+5],4,-378558),p=g(p,m,n,o,a[d+8],11,-2022574463),o=g(o,p,m,n,a[d+11],16,1839030562),n=g(n,o,p,m,a[d+14],23,-35309556),m=g(m,n,o,p,a[d+1],4,-1530992060),p=g(p,m,n,o,a[d+4],11,1272893353),o=g(o,p,m,n,a[d+7],16,-155497632),n=g(n,o,p,m,a[d+10],23,-1094730640),m=g(m,n,o,p,a[d+13],4,681279174),p=g(p,m,n,o,a[d],11,-358537222),o=g(o,p,m,n,a[d+3],16,-722521979),n=g(n,o,p,m,a[d+6],23,76029189),m=g(m,n,o,p,a[d+9],4,-640364487),p=g(p,m,n,o,a[d+12],11,-421815835),o=g(o,p,m,n,a[d+15],16,530742520),n=g(n,o,p,m,a[d+2],23,-995338651),m=h(m,n,o,p,a[d],6,-198630844),p=h(p,m,n,o,a[d+7],10,1126891415),o=h(o,p,m,n,a[d+14],15,-1416354905),n=h(n,o,p,m,a[d+5],21,-57434055),m=h(m,n,o,p,a[d+12],6,1700485571),p=h(p,m,n,o,a[d+3],10,-1894986606),o=h(o,p,m,n,a[d+10],15,-1051523),n=h(n,o,p,m,a[d+1],21,-2054922799),m=h(m,n,o,p,a[d+8],6,1873313359),p=h(p,m,n,o,a[d+15],10,-30611744),o=h(o,p,m,n,a[d+6],15,-1560198380),n=h(n,o,p,m,a[d+13],21,1309151649),m=h(m,n,o,p,a[d+4],6,-145523070),p=h(p,m,n,o,a[d+11],10,-1120210379),o=h(o,p,m,n,a[d+2],15,718787259),n=h(n,o,p,m,a[d+9],21,-343485551),m=b(m,i),n=b(n,j),o=b(o,k),p=b(p,l);return[m,n,o,p]}function j(a){var b,c="";for(b=0;b<32*a.length;b+=8)c+=String.fromCharCode(a[b>>5]>>>b%32&255);return c}function k(a){var b,c=[];for(c[(a.length>>2)-1]=void 0,b=0;b<c.length;b+=1)c[b]=0;for(b=0;b<8*a.length;b+=8)c[b>>5]|=(255&a.charCodeAt(b/8))<<b%32;return c}function l(a){return j(i(k(a),8*a.length))}function m(a,b){var c,d,e=k(a),f=[],g=[];for(f[15]=g[15]=void 0,e.length>16&&(e=i(e,8*a.length)),c=0;16>c;c+=1)f[c]=909522486^e[c],g[c]=1549556828^e[c];return d=i(f.concat(k(b)),512+8*b.length),j(i(g.concat(d),640))}function n(a){var b,c,d="0123456789abcdef",e="";for(c=0;c<a.length;c+=1)b=a.charCodeAt(c),e+=d.charAt(b>>>4&15)+d.charAt(15&b);return e}function o(a){return unescape(encodeURIComponent(a))}function p(a){return l(o(a))}function q(a){return n(p(a))}function r(a,b){return m(o(a),o(b))}function s(a,b){return n(r(a,b))}function t(a,b,c){return b?c?r(b,a):s(b,a):c?p(a):q(a)}"function"==typeof define&&define.amd?define(function(){return t}):a.md5=t}(this);
