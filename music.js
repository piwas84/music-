(function () {
    'use strict';

    // Запобігаємо повторному завантаженню плагіна
    if (window.plugin_music_installed) return;
    window.plugin_music_installed = true;

    // =============================================================
    // 1. ВПРОВАДЖЕННЯ CSS-СТИЛІВ
    // =============================================================
    function injectStyles() {
        if ($('#music-plugin-styles').length) return;
        var style = `
            <style id="music-plugin-styles">
                .music-modal-wrapper {
                    padding: 15px;
                    color: #ffffff;
                    font-family: inherit;
                }
                .music-player-card {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                }
                .music-cover {
                    width: 160px;
                    height: 160px;
                    border-radius: 12px;
                    object-fit: cover;
                    margin: 0 auto 15px auto;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                    background: #222222;
                    display: block;
                }
                .music-title {
                    font-size: 1.2em;
                    font-weight: bold;
                    margin-bottom: 5px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .music-artist {
                    font-size: 0.9em;
                    opacity: 0.7;
                    margin-bottom: 15px;
                }
                .music-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 15px;
                    margin-top: 15px;
                }
                .music-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: #ffffff;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1.1em;
                    transition: background 0.2s, transform 0.1s;
                }
                .music-btn.focus, .music-btn:hover {
                    background: #e50914;
                    color: #ffffff;
                    transform: scale(1.05);
                }
                .music-progress-container {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.15);
                    height: 6px;
                    border-radius: 3px;
                    margin: 15px 0 5px 0;
                    position: relative;
                    overflow: hidden;
                }
                .music-progress-bar {
                    width: 0%;
                    height: 100%;
                    background: #e50914;
                    border-radius: 3px;
                    transition: width 0.2s linear;
                }
                .music-time {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75em;
                    opacity: 0.6;
                }
                .music-token-alert {
                    background: rgba(229, 9, 20, 0.15);
                    border: 1px solid #e50914;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                }
            </style>
        `;
        $('head').append(style);
    }

    // =============================================================
    // 2. ІНІЦІАЛІЗАЦІЯ НАЛАШТУВАНЬ ТА СХОВИЩА
    // =============================================================
    function initSettings() {
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
                description: 'Введіть токен доступу до музичного сервісу'
            },
            onChange: function (value) {
                Lampa.Storage.set('music_api_token', value);
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'music_plugin_settings',
            param: {
                name: 'music_api_url',
                type: 'input',
                default: 'https://api.example.com'
            },
            field: {
                name: 'URL Сервера',
                description: 'Адреса API сервера'
            },
            onChange: function (value) {
                Lampa.Storage.set('music_api_url', value);
            }
        });
    }

    function getToken() {
        return Lampa.Storage.get('music_api_token', '');
    }

    // =============================================================
    // 3. АУДІО ДВИГУН ТА ТРЕКИ
    // =============================================================
    var audioPlayer = new Audio();
    var currentPlaylist = [
        {
            title: 'Demo Track 1',
            artist: 'Lampa Audio',
            cover: 'https://picsum.photos/200?1',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
        },
        {
            title: 'Demo Track 2',
            artist: 'Lampa Audio',
            cover: 'https://picsum.photos/200?2',
            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
        }
    ];
    var currentIndex = 0;
    var isPlaying = false;

    // =============================================================
    // 4. МОДАЛЬНЕ ВІКНО ПЛЕЄРА (FIX: where.find is not a function)
    // =============================================================
    function openPlayerModal() {
        injectStyles();
        var token = getToken();

        // ГОЛОВНЕ ВИПРАВЛЕННЯ: Створюємо DOM-вузол і одразу огортаємо в jQuery $(...)
        var $modalContent =$('<div class="music-modal-wrapper"></div>');

        // Якщо токен порожній — виводимо попередження
        if (!token) {
            $modalContent.append(`
                <div class="music-token-alert">
                    <h3 style="margin-top:0; color:#ff5252;">API Токен не налаштовано</h3>
                    <p style="font-size:0.9em; margin-bottom:15px; opacity:0.9;">
                        Для відтворення музики потрібно вказати API Токен у налаштуваннях додатка.
                    </p>
                    <div class="music-btn selector btn-open-settings" tabindex="0">
                        Перейти в налаштування
                    </div>
                </div>
            `);

            Lampa.Modal.open({
                title: 'Музика',
                html: $modalContent, // Передаємо саме jQuery-об'єкт!
                size: 'medium',
                onBack: function () {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('content');
                }
            });

            // Реєстрація контролера пульта для вікна з помилкою
            Lampa.Controller.add('music_modal_empty', {
                toggle: function () {
                    Lampa.Controller.collectionSet($modalContent);
                    Lampa.Controller.collectionFocus($modalContent.find('.btn-open-settings')[0],$modalContent);
                },
                enter: function () {
                    Lampa.Modal.close();
                    Lampa.Settings.open('music_plugin_settings');
                },
                back: function () {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('content');
                }
            });
            Lampa.Controller.toggle('music_modal_empty');
            return;
        }

        // Якщо токен вказано — відображаємо плеєр
        var track = currentPlaylist[currentIndex];

        $modalContent.append(`
            <div class="music-player-card">
                <img class="music-cover" src="${track.cover}" alt="cover" />
                <div class="music-title">${track.title}</div>
                <div class="music-artist">${track.artist}</div>
                
                <div class="music-progress-container">
                    <div class="music-progress-bar"></div>
                </div>
                <div class="music-time">
                    <span class="music-curr-time">00:00</span>
                    <span class="music-total-time">00:00</span>
                </div>

                <div class="music-controls">
                    <button class="music-btn selector btn-prev" tabindex="0">⏮</button>
                    <button class="music-btn selector btn-play" tabindex="0">${isPlaying ? '⏸' : '▶'}</button>
                    <button class="music-btn selector btn-next" tabindex="0">⏭</button>
                </div>
            </div>
        `);

        Lampa.Modal.open({
            title: 'Музичний плеєр',
            html: $modalContent, // Передаємо саме jQuery-об'єкт!
            size: 'medium',
            onBack: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('content');
            }
        });

        // Форматування часу мм:сс
        function formatTime(sec) {
            if (isNaN(sec) || !sec) return '00:00';
            var m = Math.floor(sec / 60);
            var s = Math.floor(sec % 60);
            return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
        }

        // Оновлення інтерфейсу
        function updateUI() {
            var tr = currentPlaylist[currentIndex];
            $modalContent.find('.music-cover').attr('src', tr.cover);$modalContent.find('.music-title').text(tr.title);
            $modalContent.find('.music-artist').text(tr.artist);$modalContent.find('.btn-play').text(isPlaying ? '⏸' : '▶');
        }

        // Відстеження прогресу відтворення
        audioPlayer.ontimeupdate = function () {
            if (!audioPlayer.duration) return;
            var pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            $modalContent.find('.music-progress-bar').css('width', pct + '%');
            $modalContent.find('.music-curr-time').text(formatTime(audioPlayer.currentTime));$modalContent.find('.music-total-time').text(formatTime(audioPlayer.duration));
        };

        // Запуск трека
        function playTrack(index) {
            currentIndex = index;
            audioPlayer.src = currentPlaylist[currentIndex].url;
            audioPlayer.play();
            isPlaying = true;
            updateUI();
        }

        // Перемикання пауза/старт
        function togglePlay() {
            if (!audioPlayer.src) {
                playTrack(currentIndex);
                return;
            }
            if (isPlaying) {
                audioPlayer.pause();
                isPlaying = false;
            } else {
                audioPlayer.play();
                isPlaying = true;
            }
            updateUI();
        }

        // Кліки по кнопках
        $modalContent.find('.btn-play').on('click', togglePlay);
        $modalContent.find('.btn-prev').on('click', function () {             var prev = (currentIndex - 1 + currentPlaylist.length) \% currentPlaylist.length;             playTrack(prev);         });$modalContent.find('.btn-next').on('click', function () {
            var next = (currentIndex + 1) % currentPlaylist.length;
            playTrack(next);
        });

        // Реєстрація контролера пульта TV
        Lampa.Controller.add('music_player_modal', {
            toggle: function () {
                Lampa.Controller.collectionSet($modalContent);
                Lampa.Controller.collectionFocus($modalContent.find('.btn-play')[0],$modalContent);
            },
            left: function () {
                Lampa.Controller.move('left');
            },
            right: function () {
                Lampa.Controller.move('right');
            },
            enter: function () {
                var active = Lampa.Controller.focused();
                if (active) $(active).trigger('click');
            },
            back: function () {
                Lampa.Modal.close();
                Lampa.Controller.toggle('content');
            }
        });

        Lampa.Controller.toggle('music_player_modal');
    }

    // =============================================================
    // 5. ДАННЯ ПУНКТУ МЕНЮ
    // =============================================================
    function addMenuButton() {
        var menuItemHtml = `
            <div class="menu__item selector" data-action="music_plugin">
                <div class="menu__ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18V5l12-2v13M9 9l12-2"/>
                    </svg>
                </div>
                <div class="menu__text">Музика</div>
            </div>
        `;

        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') {
                var menuList = $('.menu .menu__list');
                if (menuList.length && !menuList.find('[data-action="music_plugin"]').length) {
                    var $item = $(menuItemHtml);$item.on('click', function () {
                        openPlayerModal();
                    });
                    menuList.append($item);
                }
            }
        });
    }

    // =============================================================
    // 6. СТАРТ ПЛАГІНА
    // =============================================================
    function startPlugin() {
        initSettings();
        addMenuButton();
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
