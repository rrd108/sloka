(function($){
    var steps = 7;

    var verse = 'ceto-darpaṇa-mārjanaṁ bhava-mahā-dāvāgni-nirvāpaṇaṁ' + "\n" +
        'śreyaḥ-kairava-candrikā-vitaraṇaṁ vidyā-vadhū-jīvanam' + "\n" +
        'ānandāmbudhi-vardhanaṁ prati-padaṁ pūrṇāmṛtāsvādanaṁ' + "\n" +
        'sarvātma-snapanaṁ paraṁ vijayate śrī-kṛṣṇa-saṅkīrtanam';

    var translation = '„»Teljes győzelmet az Úr Kṛṣṇa szent neve éneklésének, ' +
        'amely megtisztítja a szív tükrét, s véget vet az anyagi lét lángoló tüze ' +
        'okozta gyötrelmeknek! Ez az éneklés a telő hold, amely mindenkit az áldott ' +
        'szerencse fehér lótuszával ajándékoz meg. Ez minden műveltség élete és ' +
        'lelke. Kṛṣṇa szent nevének éneklése egyre nagyobbra dagasztja a ' +
        'transzcendentális élet gyönyörteli óceánját. Mindenkire hűsítően hat, ' +
        'és képessé tesz bennünket arra, hogy minden pillanatban a tökéletes ' +
        'nektár ízét élvezhessük.«”';

    if (localStorage.getItem('counter') === null) {
        localStorage.setItem('counter', 0);
    }
    if (localStorage.getItem('lap') === null) {
        localStorage.setItem('lap', 1);
    }
    localStorage.setItem('counter', parseInt(localStorage.getItem('counter')) + 1);
    if (localStorage.getItem('counter') > steps) {
        localStorage.setItem('lap', parseInt(localStorage.getItem('lap')) + 1);
        localStorage.setItem('counter', 1);
    }

localStorage.setItem('lap', 2);
localStorage.setItem('counter', 7);

    if (localStorage.getItem('lap') == 2) {
        //make first few character visible of each words
        var match, splitters = [];
        var splitPattern = /[ \-\n]/g;
        //collect the indexes of split charaters into splitters array
        while ((match = splitPattern.exec(verse)) != null) {
            splitters.push(match.index);
        }

        var modifiedVerse = '';
        var words = verse.split(splitPattern);
        var pos = 0;
        $.each(words, function (index, word) {
            // TODO words longer than steps will still shown up
            var modifiedWord = '';
            for (var i = 0; i < word.length; i++) {
                if (i < (word.length - localStorage.getItem('counter')) //char pos is smaller than counter
                    //|| i == (word.length - 1)                         //the last char
                    // counter is over the length of this word, but this is the first character
                    || (word.length <= localStorage.getItem('counter')
                        && i == 0))
                {
                    modifiedWord += word[i];
                } else {
                    //this is a hidden char
                    //modifiedWord += '<span class="invisible">' + word[i] + '</span>';
                    modifiedWord += '<span style="color:#eee">' + word[i] + '</span>';
                    // TODO 1 span per word would be better
                }
            }
            //put splitters back
            modifiedVerse += modifiedWord + (verse[splitters[pos]] ? verse[splitters[pos]] : '');
            pos++;
        });

        verse = modifiedVerse;
    }

    $(function() {
        //onready
        $('#counter').text(localStorage.getItem('lap') + '/' + localStorage.getItem('counter'));

        verse = verse.replace(/(?:\n)/g, '<br>');
        $('#main').html(verse + '<hr>' + translation);
    });

})(jQuery);