(function () {
    'use strict';

    if (window.lampac_music_plugin) return;
    window.lampac_music_plugin = true;

    var DEFAULT_COVER = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80';

    // ==========================================
    // 1. БАЗА ДАНИХ З ОБКЛАДИНКАМИ (ALBUM ART)
    // ==========================================
    var musicLibrary = {
        radio: [
            { id: 'r1', title: 'Хіт FM', desc: 'Українське радіо • Поп-хіти', url: 'https://online.hitfm.ua/HitFM_HD', cover: 'https://www.hitfm.ua/static/images/og_image.png' },
            { id: 'r2', title: 'Radio ROKS', desc: 'Українське радіо • Рок та рок-хіти', url: 'https://online.radioroks.ua/RadioROKS_HD', cover: 'https://www.radioroks.ua/static/images/og_image.jpg' },
            { id: 'r3', title: 'KISS FM', desc: 'Українське радіо • Dance & EDM', url: 'https://online.kissfm.ua/KissFM_HD', cover: 'https://www.kissfm.ua/static/images/og_image.jpg' },
            { id: 'r4', title: 'Радіо Байрактар', desc: 'Українське радіо • Патріотична музика', url: 'https://online.radiobayraktar.ua/RadioBayraktar_HD', cover: 'https://www.radiobayraktar.ua/static/images/og_image.png' },
            { id: 'r5', title: 'Українське Радіо', desc: 'Суспільне мовлення • Інформаційне', url: 'https://stream.suspilne.media/ur1-mp3', cover: 'https://ukr.radio/images/og-logo.png' }
        ],
        rock: [
            { id: 'rk1', title: 'Radio ROKS Ukraine', desc: 'Прямий ефір', url: 'https://online.radioroks.ua/RadioROKS_HD', cover: 'https://www.radioroks.ua/static/images/og_image.jpg' },
            { id: 'rk2', title: 'Sound Helix — Rock Anthem', desc: 'Інструментальний рок #1', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', cover: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=500&q=80' },
            { id: 'rk3', title: 'Sound Helix — Drive Power', desc: 'Драйвовий трек #2', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&q=80' }
        ],
        classic: [
            { id: 'c1', title: 'Swiss Classic Radio', desc: 'Прямий ефір • Класика 24/7', url: 'https://stream.srg-ssr.ch/m/rsc_fr/mp3_128', cover: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=500&q=80' },
            { id: 'c2', title: 'Symphony in C Minor', desc: 'Симфонічний оркестр', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80' }
        ],
        ai: [
            { id: 'ai1', title: 'AI Cyberpunk Synth 2099', desc: 'Згенеровано ШІ • Synthwave', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80' },
            { id: 'ai2', title: 'AI Lo-Fi Study Chill', desc: 'Згенеровано ШІ • Lo-Fi Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80' }
        ]
    };

    var audioPlayer = new Audio();
    audioPlayer.crossOrigin = "anonymous";
    var currentTrack = null;
    var currentCategory = 'radio';
    var searchQuery = '';
    var onlineResults = [];
    var isSearching = false;
    var favorites = Lampa.Storage.get('lampac_music_favs', []);
    var visualizerAnimFrame = null;

    // ==========================================
    // 2. СТИЛІ ІНТЕРФЕЙСУ С З ОБКЛАДИНКАМИ
    // ==========================================
    var style = document.createElement('style');
    style.textContent = `
        .lampac-music-modal {
            padding: 15px; color: #fff;
            background: rgba(18, 22, 32, 0.9);
            backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
        }
        .lampac-music-tabs { display: flex; gap: 8px; margin-bottom: 12px; overflow-x: auto; padding-bottom: 5px; }
        .lampac-tab-btn {
            padding: 8px 16px; background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px;
            cursor: pointer; white-space: nowrap; font-size: 0.9em; transition: all 0.2s ease;
        }
        .lampac-tab-btn.focus, .lampac-tab-btn.active {
            background: linear-gradient(135deg, #2a72d4, #00d2ff);
            border-color: #00d2ff; box-shadow: 0 0 12px rgba(0, 210, 255, 0.4); font-weight: bold;
        }
        .lampac-search-box { margin-bottom: 12px; }
        .lampac-search-input {
            width: 100%; padding: 10px 14px; background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px;
            color: #fff; font-size: 0.95em; outline: none;
        }
        .lampac-search-input.focus { border-color: #00d2ff; box-shadow: 0 0 10px rgba(0, 210, 255, 0.3); }
        .lampac-track-list { max-height: 240px; overflow-y: auto; margin-bottom: 15px; display: flex; flex-direction: column; gap: 6px; }
        
        /* Стиль картки треку з Album Art */
        .lampac-track-item {
            padding: 8px 12px; background: rgba(255, 255, 255, 0.04);
            border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px;
            border: 1px solid transparent; transition: all 0.2s ease;
        }
        .lampac-track-item.focus {
            background: rgba(255, 255, 255, 0.12); border-color: rgba(255,255,255,0.3); transform: scale(1.01);
        }
        .lampac-track-item.active {
            background: linear-gradient(90deg, rgba(42, 114, 212, 0.35), transparent);
            border-left: 4px solid #00d2ff;
        }
        .lampac-track-cover {
            width: 44px; height: 44px; border-radius: 6px; object-fit: cover;
            background: #1a1a1a; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        
        /* Плеєр та головна обкладинка */
        .lampac-player-card {
            background: rgba(0, 0, 0, 0.5); padding: 12px; border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1); display: flex; gap: 15px; align-items: center; position: relative; overflow: hidden;
        }
        .lampac-main-art {
            width: 80px; height: 80px; border-radius: 8px; object-fit: cover;
            box-shadow: 0 4px 15px rgba(0,0,0,0.6); flex-shrink: 0; position: relative; z-index: 2;
        }
        .lampac-player-info { flex: 1; overflow: hidden; position: relative; z-index: 2; }
        .lampac-viz-canvas {
            position: absolute; bottom: 0; left: 0; width: 100%; height: 100%;
            opacity: 0.2; pointer-events: none;
        }
        .lampac-progress-container { margin: 8px 0 4px 0; display: flex; align-items: center; gap: 8px; font-size: 0.75em; color: #aaa; }
        .lampac-progress-bar { flex: 1; height: 5px; background: rgba(255,255,255,0.15); border-radius: 3px; position: relative; }
        .lampac-progress-fill { height: 100%; background: linear-gradient(90deg, #2a72d4, #00d2ff); border-radius: 3px; width: 0%; }
        .lampac-controls { display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 6px; }
        .lampac-ctrl-btn {
            padding: 6px 14px; background: rgba(255, 255, 255, 0.08); border-radius: 8px;
            cursor: pointer; font-weight: bold; border: 1px solid rgba(255,255,255,0.1); font-size: 0.85em;
        }
        .lampac-ctrl-btn.focus { background: #00d2ff; color: #000; box-shadow: 0 0 10px rgba(0,210,255,0.5); }

        /* Плаваючий віджет */
        .lampac-mini-widget {
            position: fixed; bottom: 25px; right: 25px; z-index: 9999;
            background: rgba(15, 20, 30, 0.95); backdrop-filter: blur(12px);
            border: 1px solid rgba(0, 210, 255, 0.4); border-radius: 30px;
            padding: 6px 14px; display: flex; align-items: center; gap: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8); cursor: pointer;
        }
        .lampac-mini-art { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
    `;
    document.head.appendChild(style);

    // ==========================================
    // 3. API ОНЛАЙН-ПОШУКУ (iTunes / Apple Music)
    // ==========================================
    function searchOnlineiTunes(query, callback) {
        isSearching = true;
        $.ajax({
            url: 'https://itunes.apple.com/search',
            data: { term: query, entity: 'song', limit: 20 },
            dataType: 'jsonp',
            success: function (data) {
                isSearching = false;
                var results = (data.results || []).map(function (item) {
                    return {
                        id: 'itunes_' + item.trackId,
                        title: item.trackName,
                        desc: item.artistName + ' • ' + item.collectionName,
                        url: item.previewUrl,
                        cover: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : DEFAULT_COVER
                    };
                });
                callback(results);
            },
            error: function () {
                isSearching = false;
                callback([]);
            }
        });
    }

    function toggleFavorite(track, e) {
        if (e) e.stopPropagation();
        var index = favorites.findIndex(function (f) { return f.id === track.id || f.url === track.url; });
        if (index >= 0) favorites.splice(index, 1);
        else favorites.push(track);
        Lampa.Storage.set('lampac_music_favs', favorites);
        updatePlayerUI();
    }

    function isFav(track) {
        return favorites.some(function (f) { return f.id === track.id || f.url === track.url; });
    }

    // ==========================================
    // 4. ЛОГІКА ВІДТВОРЕННЯ
    // ==========================================
    function playTrack(track) {
        currentTrack = track;
        audioPlayer.src = track.url;
        audioPlayer.play().catch(function () {});
        updatePlayerUI();
        updateMiniWidget();
    }

    function togglePlay() {
        if (!currentTrack) return;
        if (audioPlayer.paused) audioPlayer.play();
        else audioPlayer.pause();
        updatePlayerUI();
        updateMiniWidget();
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
        if (currentCategory === 'search') return onlineResults;
        var list = currentCategory === 'favs' ? favorites : (musicLibrary[currentCategory] || []);
        if (searchQuery.trim() !== '') {
            var q = searchQuery.toLowerCase();
            return list.filter(function (item) {
                return item.title.toLowerCase().indexOf(q) !== -1 || item.desc.toLowerCase().indexOf(q) !== -1;
            });
        }
        return list;
    }

    function formatTime(sec) {
        if (isNaN(sec) || !isFinite(sec)) return '0:00';
        var m = Math.floor(sec / 60);
        var s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function startVisualizer() {
        var canvas = document.getElementById('lampac-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        cancelAnimationFrame(visualizerAnimFrame);

        function draw() {
            visualizerAnimFrame = requestAnimationFrame(draw);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            var bars = 30;
            var width = canvas.width / bars;
            for (var i = 0; i < bars; i++) {
                var height = audioPlayer.paused ? 4 : Math.random() * (canvas.height - 10) + 5;
                ctx.fillStyle = '#00d2ff';
                ctx.fillRect(i * (width + 2), canvas.height - height, width, height);
            }
        }
        draw();
    }

    // ==========================================
    // 5. МІНІ-ВІДЖЕТ
    // ==========================================
    function updateMiniWidget() {
        var widget = $('.lampac-mini-widget');
        if (!currentTrack) {
            widget.remove();
            return;
        }

        if (!widget.length) {
            widget = $(
                '<div class="lampac-mini-widget selector">' +
                    '<img class="lampac-mini-art" src="" />' +
                    '<div style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.85em; font-weight: bold;" class="lampac-mini-title"></div>' +
                    '<div class="lampac-mini-toggle" style="font-size: 1em;">⏸</div>' +
                '</div>'
            );

            widget.on('hover:enter click', openPlayerModal);
            $('body').append(widget);
        }

        widget.find('.lampac-mini-art').attr('src', currentTrack.cover || DEFAULT_COVER);
        widget.find('.lampac-mini-title').text(currentTrack.title);
        widget.find('.lampac-mini-toggle').text(audioPlayer.paused ? '▶️' : '⏸');
    }

    // ==========================================
    // 6. ОНОВЛЕННЯ ІНТЕРФЕЙСУ З ALBUM ART
    // ==========================================
    function updatePlayerUI() {
        var modalEl = $('.lampac-music-modal');
        if (!modalEl.length) return;

        modalEl.find('.lampac-tab-btn').removeClass('active');
        modalEl.find('.lampac-tab-btn[data-cat="' + currentCategory + '"]').addClass('active');

        var listEl = modalEl.find('.lampac-track-list').empty();
        var list = getFilteredList();

        if (isSearching) {
            listEl.append('<div style="text-align: center; color: #00d2ff; padding: 25px;">🔎 Шукаємо треки з обкладинками в Apple Music...</div>');
        } else if (list.length === 0) {
            listEl.append('<div style="text-align: center; color: #888; padding: 25px;">Нічого не знайдено</div>');
        } else {
            list.forEach(function (track) {
                var isActive = currentTrack && currentTrack.url === track.url;
                var favorite = isFav(track);
                var coverUrl = track.cover || DEFAULT_COVER;

                var item = $(
                    '<div class="lampac-track-item selector ' + (isActive ? 'active' : '') + '">' +
                        '<img class="lampac-track-cover" src="' + coverUrl + '" onerror="this.src=\'' + DEFAULT_COVER + '\'"/>' +
                        '<div style="flex: 1; overflow: hidden;">' +
                            '<div style="font-weight: bold; font-size: 0.95em; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">' + track.title + '</div>' +
                            '<div style="font-size: 0.8em; color: #aaa; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">' + track.desc + '</div>' +
                        '</div>' +
                        '<div style="display: flex; align-items: center; gap: 8px;">' +
                            '<span class="lampac-fav-btn ' + (favorite ? 'is-fav' : '') + '">' + (favorite ? '❤️' : '🤍') + '</span>' +
                            '<span>' + (isActive && !audioPlayer.paused ? '🔊' : '▶️') + '</span>' +
                        '</div>' +
                    '</div>'
                );

                item.find('.lampac-fav-btn').on('click', function (e) { toggleFavorite(track, e); });
                item.on('hover:enter click', function () { playTrack(track); });
                listEl.append(item);
            });
        }

        if (currentTrack) {
            modalEl.find('.lampac-main-art').attr('src', currentTrack.cover || DEFAULT_COVER);
            modalEl.find('.lampac-now-playing').text(currentTrack.title);
            modalEl.find('.lampac-now-desc').text(currentTrack.desc);
        } else {
            modalEl.find('.lampac-main-art').attr('src', DEFAULT_COVER);
            modalEl.find('.lampac-now-playing').text('Оберіть трек');
            modalEl.find('.lampac-now-desc').text('Музична бібліотека & Радіо');
        }

        modalEl.find('.btn-toggle-play').text(audioPlayer.paused ? '▶️ Старт' : '⏸ Пауза');

        startVisualizer();
        Lampa.Controller.toggle('content');
    }

    function openPlayerModal() {
        var html = 
            '<div class="lampac-music-modal">' +
                '<div class="lampac-music-tabs">' +
                    '<div class="lampac-tab-btn selector" data-cat="radio">📻 Радіо</div>' +
                    '<div class="lampac-tab-btn selector" data-cat="rock">🎸 Рок</div>' +
                    '<div class="lampac-tab-btn selector" data-cat="classic">🎻 Класика</div>' +
                    '<div class="lampac-tab-btn selector" data-cat="ai">🤖 ШІ & Synth</div>' +
                    '<div class="lampac-tab-btn selector" data-cat="search">🌐 Онлайн Пошук</div>' +
                    '<div class="lampac-tab-btn selector" data-cat="favs">❤️ Обране</div>' +
                '</div>' +
                '<div class="lampac-search-box">' +
                    '<input type="text" class="lampac-search-input selector" placeholder="🔍 Введіть виконавця чи пісню..." value="' + searchQuery + '">' +
                '</div>' +
                '<div class="lampac-track-list"></div>' +
                '<div class="lampac-player-card">' +
                    '<canvas id="lampac-canvas" class="lampac-viz-canvas"></canvas>' +
                    '<img class="lampac-main-art" src="' + DEFAULT_COVER + '" onerror="this.src=\'' + DEFAULT_COVER + '\'"/>' +
                    '<div class="lampac-player-info">' +
                        '<div class="lampac-now-playing" style="font-weight: bold; color: #00d2ff; font-size: 1.05em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></div>' +
                        '<div class="lampac-now-desc" style="font-size: 0.8em; color: #aaa; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></div>' +
                        '<div class="lampac-progress-container">' +
                            '<span class="lampac-time-current">0:00</span>' +
                            '<div class="lampac-progress-bar"><div class="lampac-progress-fill"></div></div>' +
                            '<span class="lampac-time-duration">0:00</span>' +
                        '</div>' +
                        '<div class="lampac-controls">' +
                            '<div class="lampac-ctrl-btn selector btn-prev">⏮ Назад</div>' +
                            '<div class="lampac-ctrl-btn selector btn-toggle-play">▶️ Старт</div>' +
                            '<div class="lampac-ctrl-btn selector btn-next">⏭ Далі</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        var $html =$(html);

        Lampa.Modal.open({
            title: '🎵 Lampac Music (Album Art Edition)',
            html: $html,
            size: 'medium',
            onBack: function () {
                cancelAnimationFrame(visualizerAnimFrame);
                Lampa.Modal.close();
                updateMiniWidget();
            }
        });

        $html.find('.lampac-tab-btn').on('hover:enter click', function () {
            currentCategory = $(this).data('cat');
            if (currentCategory === 'search' && searchQuery.trim() !== '' && onlineResults.length === 0) {
                searchOnlineiTunes(searchQuery, function (res) {
                    onlineResults = res;
                    updatePlayerUI();
                });
            }
            updatePlayerUI();
        });

        var searchTimeout = null;
        $html.find('.lampac-search-input').on('input field:change', function () {
            searchQuery = $(this).val();
            if (currentCategory === 'search') {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(function () {
                    if (searchQuery.trim().length > 2) {
                        searchOnlineiTunes(searchQuery, function (res) {
                            onlineResults = res;
                            updatePlayerUI();
                        });
                    }
                }, 600);
            } else {
                updatePlayerUI();
            }
        });

        $html.find('.btn-toggle-play').on('hover:enter click', togglePlay);
        $html.find('.btn-next').on('hover:enter click', playNext);$html.find('.btn-prev').on('hover:enter click', playPrev);

        updatePlayerUI();
    }

    // ==========================================
    // 7. ПОДІЇ ТА КНОПКА ШАПКИ
    // ==========================================
    audioPlayer.addEventListener('timeupdate', function () {
        var modalEl = $('.lampac-music-modal');
        if (!modalEl.length) return;
        var cur = audioPlayer.currentTime;
        var dur = audioPlayer.duration;
        modalEl.find('.lampac-time-current').text(formatTime(cur));
        modalEl.find('.lampac-time-duration').text(formatTime(dur));
        var perc = dur ? (cur / dur) * 100 : 0;
        modalEl.find('.lampac-progress-fill').css('width', perc + '%');
    });

    audioPlayer.addEventListener('ended', playNext);

    function initHeaderButton() {
        var musicBtn = $(
            '<div class="head-action selector head-action--music" title="Lampac Music" style="cursor: pointer;">' +
                '<svg height="22" viewBox="0 0 24 24" width="22" fill="#00d2ff">' +
                    '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>' +
                '</svg>' +
            '</div>'
        );

        musicBtn.on('hover:enter click', openPlayerModal);
        $('.head__actions').prepend(musicBtn);
    }

    if (window.appready) initHeaderButton();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') initHeaderButton(); });
})();
