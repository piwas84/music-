(function () {
    'use strict';

    if (window.plugin_music_installed) return;
    window.plugin_music_installed = true;

    // =============================================================
    // 1. РОБОТА З ТОКЕНОМ ТА НАЛАШТУВАННЯМИ
    // =============================================================

    function getToken() {
        return Lampa.Storage.get('music_api_token', '');
    }

    function setToken(value) {
        Lampa.Storage.set('music_api_token', value);
    }

    // Виклик екранної клавіатури Lampa для введення токена
    function promptToken(callback) {
        Lampa.Input.edit({
            title: 'Введіть API Токен',
            value: getToken(),
            free: true
        }, function (value) {
            setToken(value);
            Lampa.Noty.show('Токен збережено');
            if (callback) callback();
        });
    }

    // Додавання вкладки в системні Налаштування Lampa
    function initSettings() {
        if (Lampa.SettingsApi) {
            Lampa.SettingsApi.addComponent({
                component: 'music_plugin_settings',
                name: 'Музика',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M9 9l12-2"/></svg>'
            });

            Lampa.SettingsApi.addParam({
                component: 'music_plugin_settings',
                param: {
                    name: 'music_api_token',
                    type: 'input',
                    default: ''
                },
                field: {
                    name: 'API Токен / Ключ',
                    description: 'Натисніть для введення токена'
                },
                onChange: function (value) {
                    setToken(value);
                }
            });
        }
    }

    // =============================================================
    // 2. СТИЛІ ІНТЕРФЕЙСУ
    // =============================================================

    function injectStyles() {
        if ($('#music-plugin-styles').length) return;
        $('head').append(`
            <style id="music-plugin-styles">
                .music-modal-content {
                    padding: 20px;
                    text-align: center;
                    color: #ffffff;
                }
                .music-btn {
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: #ffffff;
                    padding: 12px 24px;
                    border-radius: 8px;
                    margin: 10px 5px;
                    cursor: pointer;
                    font-size: 15px;
                    transition: all 0.2s ease;
                }
                .music-btn.focus, .music-btn:hover {
                    background: #e50914;
                    border-color: #e50914;
                    color: #ffffff;
                    transform: scale(1.03);
                }
                .music-token-info {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 15px;
                    word-break: break-all;
                    font-family: monospace;
                }
            </style>
        `);
    }

    // =============================================================
    // 3. МОДАЛЬНЕ ВІКНО ПЛЕЄРА
    // =============================================================

    function openPlayerModal() {
        injectStyles();
        var token = getToken();

        // ГОЛОВНЕ ВИПРАВЛЕННЯ: Елемент створюється як jQuery-об'єкт $(...)
        var $html =$('<div class="music-modal-content"></div>');

        if (!token) {
            $html.append(`
                <div style="font-size: 1.2em; margin-bottom: 10px; color: #ff5252; font-weight: bold;">
                    API Токен не вказано
                </div>
                <div style="font-size: 0.9em; opacity: 0.8; margin-bottom: 20px;">
                    Для роботи плагіна необхідно ввести токен доступу.
                </div>
                <div class="music-btn selector btn-enter-token" tabindex="0">
                    Ввести токен
                </div>
            `);
        } else {
            $html.append(`
                <div style="font-size: 1.1em; margin-bottom: 15px; font-weight: bold;">
                    Музичний плеєр
                </div>
                <div class="music-token-info">
                    <span style="opacity:0.6;">Токен:</span> ${token}
                </div>
                <div>
                    <div class="music-btn selector btn-start-play" tabindex="0">Запустити плеєр</div>
                    <div class="music-btn selector btn-enter-token" tabindex="0">Змінити токен</div>
                </div>
            `);
        }

        // Обробка натискання кнопок
        $html.find('.btn-enter-token').on('click', function () {
            Lampa.Modal.close();
            promptToken(function () {
                openPlayerModal(); // Перевідкриваємо модалку після збереження
            });
        });

        $html.find('.btn-start-play').on('click', function () {
            Lampa.Noty.show('Запуск відтворення...');
        });

        // Відкриття модального вікна Lampa
        Lampa.Modal.open({
            title: 'Музика',
            html: $html, // Передаємо саме jQuery об'єкт
            size: 'medium',
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('content');
            }
        });

        // Налаштування контролера для навігації пульта TV
        Lampa.Controller.add('music_modal_controller', {
            toggle: function () {
                Lampa.Controller.collectionSet($html);
                Lampa.Controller.collectionFocus($html.find('.selector').first()[0],$html);
            },
            left: function () { Lampa.Controller.move('left'); },
            right: function () { Lampa.Controller.move('right'); },
            up: function () { Lampa.Controller.move('up'); },
            down: function () { Lampa.Controller.move('down'); },
            enter: function () {
                var active = Lampa.Controller.focused();
                if (active) $(active).trigger('click');
            },
            back: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('content');
            }
        });

        Lampa.Controller.toggle('music_modal_controller');
    }

    // =============================================================
    // 4. ДОДАВАННЯ АКТИВНИХ КНОПОК В ІНТЕРФЕЙС LAMPA
    // =============================================================

    function injectMenuButton() {
        var $menu =$('.menu .menu__list, .sidebar .sidebar__list');
        if ($menu.length && !$menu.find('[data-action="music_plugin"]').length) {
            var $item =$(`
                <div class="menu__item selector" data-action="music_plugin" tabindex="0">
                    <div class="menu__ico">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                            <path d="M9 18V5l12-2v13M9 9l12-2"/>
                        </svg>
                    </div>
                    <div class="menu__text">Музика</div>
                </div>
            `);

            $item.on('click', function () {
                openPlayerModal();
            });

            $menu.append($item);
        }
    }

    function injectHeadButton() {
        var $head =$('.head .head__actions');
        if ($head.length && !$head.find('.head-music-btn').length) {
            var $headBtn =$(`
                <div class="head__action selector head-music-btn" tabindex="0" title="Музика">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                        <path d="M9 18V5l12-2v13M9 9l12-2"/>
                    </svg>
                </div>
            `);

            $headBtn.on('click', function () {
                openPlayerModal();
            });

            $head.prepend($headBtn);
        }
    }

    function startPlugin() {
        initSettings();

        // Додаємо кнопки при завантаженні та відкритті меню/шапки
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                injectMenuButton();
                injectHeadButton();
            }
        });

        Lampa.Listener.follow('menu', function (e) {
            if (e.type === 'render' || e.type === 'open') {
                injectMenuButton();
            }
        });

        Lampa.Listener.follow('head', function (e) {
            if (e.type === 'render') {
                injectHeadButton();
            }
        });

        window.openPlayerModal = openPlayerModal;
    }

    if (window.appready) {
        startPlugin();
    } else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') startPlugin();
        });
    }

})();
