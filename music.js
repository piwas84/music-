(function () {
    'use strict';

    if (window.plugin_music_installed) return;
    window.plugin_music_installed = true;

    // =============================================================
    // 1. НАЛАШТУВАННЯ ТОКЕНА
    // =============================================================
    function getToken() {
        return Lampa.Storage.get('music_api_token', '');
    }

    function setToken(value) {
        Lampa.Storage.set('music_api_token', value);
    }

    function promptToken(callback) {
        Lampa.Input.edit({
            title: 'API Токен / Ключ',
            value: getToken(),
            free: true
        }, function (value) {
            setToken(value);
            Lampa.Noty.show('Токен збережено');
            if (callback) callback();
        });
    }

    // =============================================================
    // 2. НАЛАШТУВАННЯ В ПРАВОМУ МЕНЮ
    // =============================================================
    function initSettings() {
        if (Lampa.SettingsApi) {
            Lampa.SettingsApi.addComponent({
                component: 'music_settings',
                name: 'Музика',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M9 9l12-2"/></svg>'
            });
            Lampa.SettingsApi.addItem({
                name: 'Музика',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M9 9l12-2"/></svg>',
                component: 'music_settings',
                onClick: promptToken
            });
        }
    }

    // =============================================================
    // 3. ПОВНОЦІННИЙ ПЛЕЄР (Spotify + YouTube + Локальний)
    // =============================================================
    function openPlayerModal() {
        var $modal = $('<div class="music-modal-content" style="padding:20px; text-align:center; color:#fff; max-height:80vh; overflow-y:auto;"></div>');

        $modal.html(`
            <h2 style="margin-bottom:15px;">🎵 Музичний плеєр</h2>
            
            <div style="margin:20px 0; display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
                <button onclick="selectSource(0)" class="music-btn">Spotify</button>
                <button onclick="selectSource(1)" class="music-btn">YouTube</button>
                <button onclick="selectSource(2)" class="music-btn">Локальний плеєр</button>
            </div>

            <div id="player-container" style="margin-top:20px; display:none;">
                <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px; margin-bottom:15px; font-size:14px;">
                    Токен: <span id="token-preview">${getToken() || 'Не вказано'}</span>
                </div>
                <audio controls id="audioPlayer" style="width:100%; max-width:600px;"></audio>
                <div style="margin-top:15px;">
                    <span id="current-track">Трек: —</span>
                </div>
                <div style="margin-top:10px;">
                    <button onclick="playPrevious()" style="padding:8px 16px;">⏮</button>
                    <button onclick="playPause()" style="padding:8px 16px;">▶️ / ⏸</button>
                    <button onclick="playNext()" style="padding:8px 16px;">⏭</button>
                </div>
            </div>
        `);

        Lampa.Modal.open({
            title: 'Музика',
            html: $modal,
            size: 'medium',
            onBack: () => Lampa.Modal.close()
        });

        window.selectSource = function (source) {
            var container = $('#player-container');
            container.css('display', 'block');
            $('#audioPlayer').attr('src', '');
            $('#current-track').text('Трек: —');

            if (source === 0) {
                Lampa.Noty.show('Spotify (приклад — локальний плеєр для демо)');
                $('#audioPlayer').attr('src', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
            } else if (source === 1) {
                Lampa.Noty.show('YouTube (приклад — локальний плеєр для демо)');
                $('#audioPlayer').attr('src', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3');
            } else {
                $('#audioPlayer').attr('src', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3');
            }
        };

        window.playPause = function () {
            var audio = document.getElementById('audioPlayer');
            if (audio.paused) audio.play();
            else audio.pause();
        };

        window.playNext = function () {
            var audio = document.getElementById('audioPlayer');
            audio.currentTime = audio.duration - 5;
        };

        window.playPrevious = function () {
            var audio = document.getElementById('audioPlayer');
            audio.currentTime = 0;
        };

        $('#audioPlayer').on('timeupdate', function () {
            var progress = (this.currentTime / this.duration) * 100 || 0;
            $('#current-track').text(`Трек: \( {Math.floor(this.currentTime / 60)}: \){String(Math.floor(this.currentTime % 60)).padStart(2, '0')} / \( {Math.floor(this.duration / 60)}: \){String(Math.floor(this.duration % 60)).padStart(2, '0')}`);
        });
    }

    // =============================================================
    // 4. ІНІЦІАЛІЗАЦІЯ
    // =============================================================
    function startPlugin() {
        initSettings();

        // Кнопка в лівому меню
        function addMusicButton() {
            if ($('.menu__item[data-action="music_plugin"]').length) return;
            var $item = $(`
                <div class="menu__item selector" data-action="music_plugin" tabindex="0">
                    <div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M9 9l12-2"/></svg></div>
                    <div class="menu__text">Музика</div>
                </div>
            `);
            $item.on('click', openPlayerModal);
            $('.menu__list').append($item);
        }

        Lampa.Listener.follow('head', (e) => {
            if (e.type === 'render' && !$('.head-music-btn').length) {
                var $btn = $(`<div class="head__action selector head-music-btn" tabindex="0" title="Музика"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M9 9l12-2"/></svg></div>`);
                $btn.on('click', openPlayerModal);
                $('.head__actions').prepend($btn);
            }
        });

        if ($('.menu').length) addMusicButton();
        window.openPlayerModal = openPlayerModal;
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', e => { if (e.type === 'ready') startPlugin(); });
})();
