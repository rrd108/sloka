(function($){
    var text = 'ceto-darpaṇa-mārjanaṁ bhava-mahā-dāvāgni-nirvāpaṇaṁ' + "\n" +
        'śreyaḥ-kairava-candrikā-vitaraṇaṁ vidyā-vadhū-jīvanam' + "\n" +
        'ānandāmbudhi-vardhanaṁ prati-padaṁ pūrṇāmṛtāsvādanaṁ' + "\n" +
        'sarvātma-snapanaṁ paraṁ vijayate śrī-kṛṣṇa-saṅkīrtanam' + "\n" + "\n" +
        '„»Teljes győzelmet az Úr Kṛṣṇa szent neve éneklésének, ' +
        'amely megtisztítja a szív tükrét, s véget vet az anyagi lét lángoló tüze ' +
        'okozta gyötrelmeknek! Ez az éneklés a telő hold, amely mindenkit az áldott ' +
        'szerencse fehér lótuszával ajándékoz meg. Ez minden műveltség élete és ' +
        'lelke. Kṛṣṇa szent nevének éneklése egyre nagyobbra dagasztja a ' +
        'transzcendentális élet gyönyörteli óceánját. Mindenkire hűsítően hat, ' +
        'és képessé tesz bennünket arra, hogy minden pillanatban a tökéletes ' +
        'nektár ízét élvezhessük.«”';

    if (localStorage.getItem('step') === null) {
        localStorage.setItem('step', 1);
    }

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

    function step(num) {
        localStorage.setItem('step', num);
        if (num == 1) {
            makeAllTextVisible();
        } else if (num == 2) {
            makeHalfTextVisible();
        } else if (num == 3) {
            makeFirstCharVisible();
        }
        updateMain();
    }

    function updateMain() {
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

    $(function() {
        //onready
        $('nav img').click(function(event) {
            $('nav img').each(function() {
                if (event.target == this) {
                    var num = $(this).attr('src').replace('.png', '');
                    num = num.replace('img/', '');
                    num = num.replace('-filled', '');
                    step(num);
                    addFilledToImgSrc($(this));
                } else {
                    removeFilledFromImgSrc($(this));
                }
            });
        });

        //attach event handlers to spans
        //we use .on() as it will work with later dynamically created spans
        $('p').on('click', 'span', function() {
            $(this).removeClass('unseen');
            $(this).delay(2000).queue(function(){
                $(this).addClass('unseen');
            });
        });

        addFilledToImgSrc($('#s' + localStorage.getItem('step')));

        step(localStorage.getItem('step'));
    });

})(jQuery);