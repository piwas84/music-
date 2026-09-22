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
    // 2. НАЛАШТУВАННЯ В ПРАВОМУ МЕНЮ (Lampa.SettingsApi)
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
                onClick: function () {
                    Lampa.Noty.show('Налаштування музичного модуля');
                    // можна додати більше налаштувань тут
                }
            });
        }
    }

    // =============================================================
    // 3. ПОВНОЦІННИЙ ПЛЕЄР
    // =============================================================
    function openPlayerModal() {
        var token = getToken();

        var $modal = $('<div class="music-modal-content" style="padding:20px; text-align:center; color:#fff; max-height:80vh; overflow-y:auto;"></div>');

        if (!token) {
            $modal.html(`
                <h2 style="color:#ff5252;">API Токен не вказано</h2>
                <p>Введіть токен для роботи музичного модуля</p>
                <button onclick="promptToken()" style="padding:12px 24px; background:#e50914; color:white; border:none; border-radius:8px; font-size:16px;">Ввести токен</button>
            `);
        } else {
            $modal.html(`
                <h2>🎵 Музичний плеєр</h2>
                <div style="background:rgba(255,255,255,0.1); padding:15px; border-radius:10px; margin:15px 0; font-size:14px;">Токен: ${token}</div>
                <button onclick="Lampa.Noty.show('Плеєр запущено! (локальний режим)')" style="padding:14px 30px; background:#e50914; color:white; border:none; border-radius:10px; font-size:17px; margin:10px;">Запустити плеєр</button>
                <button onclick="promptToken()" style="padding:14px 30px; background:rgba(255,255,255,0.15); color:white; border:1px solid rgba(255,255,255,0.3); border-radius:10px; font-size:17px; margin:10px;">Змінити токен</button>
            `);
        }

        Lampa.Modal.open({
            title: 'Музика',
            html: $modal,
            size: 'medium',
            onBack: () => Lampa.Modal.close()
        });
    }

    // =============================================================
    // 4. ДОДАВАННЯ КНОПКИ У ЛІВЕ МЕНЮ
    // =============================================================
    function addMusicButton() {
        if ($('.menu__item[data-action="music_plugin"]').length) return;

        var $item = $(`
            <div class="menu__item selector" data-action="music_plugin" tabindex="0">
                <div class="menu__ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                        <path d="M9 18V5l12-2v13M9 9l12-2"/>
                    </svg>
                </div>
                <div class="menu__text">Музика</div>
            </div>
        `);

        $item.on('click pointerdown', (e) => {
            if (e.type === 'pointerdown' && e.pointerType !== 'touch') return;
            openPlayerModal();
        });

        $('.menu__list').append($item);
    }

    // =============================================================
    // 5. ІНІЦІАЛІЗАЦІЯ
    // =============================================================
    function startPlugin() {
        initSettings();
        addMusicButton();

        // Додаткова кнопка в головному меню
        Lampa.Listener.follow('head', (e) => {
            if (e.type === 'render' && !$('.head-music-btn').length) {
                var $btn = $(`
                    <div class="head__action selector head-music-btn" tabindex="0" title="Музика">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M9 9l12-2"/></svg>
                    </div>
                `);
                $btn.on('click', openPlayerModal);
                $('.head__actions').prepend($btn);
            }
        });

        window.openPlayerModal = openPlayerModal;
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', e => { if (e.type === 'ready') startPlugin(); });
})();
