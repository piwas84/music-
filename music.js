(function () {
    'use strict';

    if (window.lampac_music_plugin) return;
    window.lampac_music_plugin = true;

    // ==========================================
    // 1. БАЗА ДАНИХ: РАДІОСТАНЦІЇ ТА ТРЕКИ
    // ==========================================
    var musicLibrary = {
        radio: [
            { title: 'Хіт FM', desc: 'Українське радіо • Поп-хіти', url: 'https://online.hitfm.ua/HitFM_HD' },
            { title: 'Radio ROKS', desc: 'Українське радіо • Рок та рок-хіти', url: 'https://online.radioroks.ua/RadioROKS_HD' },
            { title: 'KISS FM', desc: 'Українське радіо • Dance & EDM', url: 'https://online.kissfm.ua/KissFM_HD' },
            { title: 'Радіо Байрактар', desc: 'Українське радіо • Патріотична музика', url: 'https://online.radiobayraktar.ua/RadioBayraktar_HD' },
            { title: 'Українське Радіо', desc: 'Суспільне мовлення • Інформаційно-музичне', url: 'https://stream.suspilne.media/ur1-mp3' },
            { title: 'Наше Радіо', desc: 'Українська естрада та сучасна музика', url: 'https://online.nasheradio.ua/NasheRadio_HD' }
        ],
        rock: [
            { title: 'Radio ROKS Ukraine Live', desc: 'Прямий ефір', url: 'https://online.radioroks.ua/RadioROKS_HD' },
            { title: 'Sound Helix — Track #1', desc: 'Інструментальний рок-хіт #1', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
            { title: 'Sound Helix — Track #2', desc: 'Драйвовий трек #2', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
            { title: 'Sound Helix — Track #3', desc: 'Енергійний трек #3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' }
        ],
        classic: [
            { title: 'Swiss Classic Radio', desc: 'Прямий ефір • Класика 24/7', url: 'https://stream.srg-ssr.ch/m/rsc_fr/mp3_128' },
            { title: 'Symphony in C Minor', desc: 'Симфонічний оркестр', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
            { title: 'Piano & Strings Melancholy', desc: 'Фортепіано та скрипка', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
            { title: 'Baroque Chamber Music', desc: 'Класичний ансамбль', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' }
        ],
        ai: [
            { title: 'AI Cyberpunk Synth 2099', desc: 'Згенеровано ШІ • Synthwave', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
            { title: 'AI Lo-Fi Study Chill', desc: 'Згенеровано ШІ • Lo-Fi Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3' },
            { title: 'AI Ambient Deep Relax', desc: 'Згенеровано ШІ • Електронний релакс', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' },
            { title: 'AI Futuristic Electro Wave', desc: 'Згенеровано ШІ • Електроніка', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3' }
        ]
    };

    var audioPlayer = new Audio();
    var currentTrack = null;
    var currentCategory = 'radio';
    var searchQuery = '';

    // ==========================================
    // 2. СТИЛІ ІНТЕРФЕЙСУ
    // ==========================================
    var style = document.createElement('style');
    style.textContent = 
        '.lampac-music-modal { padding: 10px; color: #fff; }' +
        '.lampac-music-tabs { display: flex; gap: 8px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 5px; }' +
        '.lampac-tab-btn { padding: 8px 14px; background: rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer; white-space: nowrap; font-size: 0.9em; }' +
        '.lampac-tab-btn.active { background: #2a72d4; font-weight: bold; }' +
        '.lampac-search-box { margin-bottom: 12px; display: flex; gap: 8px; }' +
        '.lampac-search-input { flex: 1; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #fff; font-size: 1em; outline: none; }' +
        '.lampac-track-list { max-height: 280px; overflow-y: auto; margin-bottom: 15px; display: flex; flex-direction: column; gap: 6px; }' +
        '.lampac-track-item { padding: 10px 14px; background: rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }' +
        '.lampac-track-item.active { background: rgba(42, 114, 212, 0.4); border-left: 4px solid #2a72d4; }' +
        '.lampac-player-bar { background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }' +
        '.lampac-controls { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 10px; }' +
        '.lampac-ctrl-btn { padding: 8px 16px; background: rgba(255,255,255,0.15); border-radius: 6px; cursor: pointer; font-weight: bold; }';
    document.head.appendChild(style);

    // ==========================================
    // 3. НАЛАШТУВАННЯ В БІЧНОМУ МЕНЮ
    // ==========================================
    function initSettings() {
        Lampa.SettingsApi.addComponent({
            component: 'lampac_music_settings',
            title: 'Lampac Music & Radio',
            icon: '<svg height="24" viewBox="0 0 24 24" width="24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>'
        });

        Lampa.SettingsApi.addParam({
            component: 'lampac_music_settings',
            param: {
                name: 'lampac_music_autonext',
                type: 'select',
                values: { 'true': 'Увімкнено', 'false': 'Вимкнено' },
                default: 'true'
            },
            field: {
                name: 'Автовідтворення',
                description: 'Автоматично переходити до наступного треку після завершення'
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'lampac_music_settings',
            param: {
                name: 'lampac_music_volume',
                type: 'select',
                values: { '0.3': '30%', '0.6': '60%', '1.0': '100%' },
                default: '0.6'
            },
            field: {
                name: 'Гучність',
                description: 'Стандартний рівень гучності аудіоплеєра'
            },
            onChange: function (val) {
                audioPlayer.volume = parseFloat(val);
            }
        });
    }

    // ==========================================
    // 4. ЛОГІКА ВІДТВОРЕННЯ
    // ==========================================
    function playTrack(track) {
        currentTrack = track;
        audioPlayer.src = track.url;
        var defaultVol = Lampa.Storage.get('lampac_music_volume', '0.6');
        audioPlayer.volume = parseFloat(defaultVol);
        audioPlayer.play().catch(function () {});
        updatePlayerUI();
    }

    function togglePlay() {
        if (!currentTrack) return;
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
        updatePlayerUI();
    }

    function playNext() {
        var list = getFilteredList();
        if (!list.length || !currentTrack) return;
        var idx = list.findIndex(function (t) { return t.url === currentTrack.url; });
        var nextIdx = (idx + 1) % list.length;
        playTrack(list[nextIdx]);
    }

    function playPrev() {
        var list = getFilteredList();
        if (!list.length || !currentTrack) return;
        var idx = list.findIndex(function (t) { return t.url === currentTrack.url; });
        var prevIdx = (idx - 1 + list.length) % list.length;
        playTrack(list[prevIdx]);
    }

    function getFilteredList() {
        var list = musicLibrary[currentCategory] || [];
        if (searchQuery.trim() !== '') {
            var q = searchQuery.toLowerCase();
            return list.filter(function (item) {
                return item.title.toLowerCase().indexOf(q) !== -1 || item.desc.toLowerCase().indexOf(q) !== -1;
            });
        }
        return list;
    }

    // ==========================================
    // 5. МОДАЛЬНЕ ВІКНО ПЛЕЄРА
    // ==========================================
    function updatePlayerUI() {
        var modalEl = $('.lampac-music-modal');
        if (!modalEl.length) return;

        modalEl.find('.lampac-tab-btn').removeClass('active');
        modalEl.find('.lampac-tab-btn[data-cat="' + currentCategory + '"]').addClass('active');

        var listEl = modalEl.find('.lampac-track-list').empty();
        var list = getFilteredList();

        if (list.length === 0) {
            listEl.append('<div style="text-align: center; color: #888; padding: 20px;">Нічого не знайдено</div>');
        } else {
            list.forEach(function (track) {
                var isActive = currentTrack && currentTrack.url === track.url;
                var item = $(
                    '<div class="lampac-track-item selector ' + (isActive ? 'active' : '') + '">' +
                        '<div>' +
                            '<div style="font-weight: bold; font-size: 1em;">' + track.title + '</div>' +
                            '<div style="font-size: 0.8em; color: #aaa;">' + track.desc + '</div>' +
                        '</div>' +
                        '<div>' + (isActive && !audioPlayer.paused ? '🔊' : '▶️') + '</div>' +
                    '</div>'
                );

                item.on('hover:enter click', function () {
                    playTrack(track);
                });

                listEl.append(item);
            });
        }

        var titleText = currentTrack ? currentTrack.title : 'Оберіть трек або радіостанцію';
        modalEl.find('.lampac-now-playing').text(titleText);
        modalEl.find('.btn-toggle-play').text(audioPlayer.paused ? '▶️ Старт' : '⏸ Пауза');

        Lampa.Controller.toggle('content');
    }

    function openPlayerModal() {
        var html = 
            '<div class="lampac-music-modal">' +
                '<div class="lampac-music-tabs">' +
                    '<div class="lampac-tab-btn selector" data-cat="radio">📻 Радіо</div>' +
                    '<div class="lampac-tab-btn selector" data-cat="rock">🎸 Рок</div>' +
                    '<div class="lampac-tab-btn selector" data-cat="classic">🎻 Класика</div>' +
                    '<div class="lampac-tab-btn selector" data-cat="ai">🤖 ШІ & Електро</div>' +
                '</div>' +
                '<div class="lampac-search-box">' +
                    '<input type="text" class="lampac-search-input selector" placeholder="🔍 Пошук за назвою або жанром..." value="' + searchQuery + '">' +
                '</div>' +
                '<div class="lampac-track-list"></div>' +
                '<div class="lampac-player-bar">' +
                    '<div class="lampac-now-playing" style="font-weight: bold; color: #ffd700; font-size: 1.1em;"></div>' +
                    '<div class="lampac-controls">' +
                        '<div class="lampac-ctrl-btn selector btn-prev">⏮ Назад</div>' +
                        '<div class="lampac-ctrl-btn selector btn-toggle-play">▶️ Старт</div>' +
                        '<div class="lampac-ctrl-btn selector btn-next">⏭ Далі</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        Lampa.Modal.open({
            title: '🎵 Lampac Music & Radio',
            html: html,
            size: 'medium',
            onBack: function () {
                Lampa.Modal.close();
            }
        });

        $('.lampac-tab-btn').on('hover:enter click', function () {
            currentCategory = $(this).data('cat');
            updatePlayerUI();
        });

        $('.lampac-search-input').on('input field:change', function () {
            searchQuery = $(this).val();
            updatePlayerUI();
        });

        $('.btn-toggle-play').on('hover:enter click', togglePlay);
        $('.btn-next').on('hover:enter click', playNext);
        $('.btn-prev').on('hover:enter click', playPrev);

        updatePlayerUI();
    }

    audioPlayer.addEventListener('ended', function () {
        var auto = Lampa.Storage.get('lampac_music_autonext', 'true');
        if (auto === 'true' || auto === true) {
            playNext();
        }
    });

    // ==========================================
    // 6. КНОПКА В ШАПЦІ СЕРВІСУ
    // ==========================================
    function initHeaderButton() {
        var musicBtn = $(
            '<div class="head-action selector head-action--music" title="Lampac Music" style="cursor: pointer;">' +
                '<svg height="22" viewBox="0 0 24 24" width="22" fill="currentColor">' +
                    '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>' +
                '</svg>' +
            '</div>'
        );

        musicBtn.on('hover:enter click', function () {
            openPlayerModal();
        });

        $('.head__actions').prepend(musicBtn);
    }

    function start() {
        initSettings();
        initHeaderButton();
    }

    if (window.appready) {
        start();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') start();
        });
    }
})();
