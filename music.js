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
    // 2. СТИЛІ ІНТЕРФЕЙСУ (З ОПТИМІЗАЦІЄЮ ПІД СЕНСОР/ТАЧ)
    // =============================================================

    function injectStyles() {
        if ($('#music-plugin-styles').length) return;
        $('head').append(`
            <style id="music-plugin-styles">
                .music-modal-content {
                    padding: 20px 15px;
                    text-align: center;
                    color: #ffffff;
                    max-height: 80vh;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch; /* Гладкий скролл пальцем на iOS/Android */
                    user-select: none;
                    -webkit-user-select: none;
                }

                .music-btn {
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.12);
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    color: #ffffff;
                    padding: 14px 24px; /* Збільшена зона тапу для пальців */
                    min-height: 48px;   /* Стандарт висоти для тач-інтерфейсів */
                    border-radius: 10px;
                    margin: 8px 5px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 500;
                    box-sizing: border-box;
                    touch-action: manipulation; /* Прибирає затримку 300ms при тапі на мобільних */
                    -webkit-tap-highlight-color: transparent; /* Прибирає синій квадрат під час тапу */
                    transition: background 0.15s ease, transform 0.1s ease;
                }

                /* Для пульта TV (focus) та для мишки (hover) */
                .music-btn.focus, 
                .music-btn:hover {
                    background: #e50914;
                    border-color: #e50914;
                    color: #ffffff;
                }

                /* Ефект натискання пальцем на екрані смартфона */
                .music-btn:active {
                    transform: scale(0.96);
                    background: #b20710;
                }

                .music-token-info {
                    background: rgba(255, 255, 255, 0.07);
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 15px;
                    word-break: break-all;
                    font-family: monospace;
                    font-size: 14px;
                }

                /* Адаптація під вузькі дисплеї телефонів */
                @media screen and (max-width: 480px) {
                    .music-btn {
                        width: 100%;
                        display: block;
                        margin: 8px 0;
                    }
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

        // Універсальна обробка тапу/кліку
        function bindTouchAction($element, handler) {$element.on('click pointerdown', function (e) {
                if (e.type === 'pointerdown' && e.pointerType !== 'touch') return;
                e.preventDefault();
                e.stopPropagation();
                handler();
            });
        }

        bindTouchAction($html.find('.btn-enter-token'), function () {
            Lampa.Modal.close();
            promptToken(function () {
                openPlayerModal();
            });
        });

        bindTouchAction($html.find('.btn-start-play'), function () {
            Lampa.Noty.show('Запуск відтворення...');
        });

        Lampa.Modal.open({
            title: 'Музика',
            html: $html,
            size: 'medium',
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('content');
            }
        });

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
    // 4. КНОПКИ В МЕНЮ ТА ШАПЦІ ДЛЯ ТАЧ-УПРАВЛІННЯ
    // =============================================================

    function injectMenuButton() {
        var $menu =$('.menu .menu__list, .sidebar .sidebar__list');
        if ($menu.length && !$menu.find('[data-action="music_plugin"]').length) {
            var $item =$(`
                <div class="menu__item selector" data-action="music_plugin" tabindex="0" style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;">
                    <div class="menu__ico">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                            <path d="M9 18V5l12-2v13M9 9l12-2"/>
                        </svg>
                    </div>
                    <div class="menu__text">Музика</div>
                </div>
            `);

            $item.on('click pointerdown', function (e) {
                if (e.type === 'pointerdown' && e.pointerType !== 'touch') return;
                openPlayerModal();
            });

            $menu.append($item);
        }
    }

    function injectHeadButton() {
        var $head =$('.head .head__actions');
        if ($head.length && !$head.find('.head-music-btn').length) {
            var $headBtn =$(`
                <div class="head__action selector head-music-btn" tabindex="0" title="Музика" style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                        <path d="M9 18V5l12-2v13M9 9l12-2"/>
                    </svg>
                </div>
            `);

            $headBtn.on('click pointerdown', function (e) {
                if (e.type === 'pointerdown' && e.pointerType !== 'touch') return;
                openPlayerModal();
            });

            $head.prepend($headBtn);
        }
    }

    function startPlugin() {
        initSettings();

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
