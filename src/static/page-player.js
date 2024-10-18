/**
 * @typedef {import('../../types').DocPlayerDOMList} PlayerList 当前播放列表元素
 */

const es_main = {
    play_lits: getEBI('play-list'),
    lyric_lits: getEBI('lyric-list'),
    player: getEBI('audio'),
    playing: {
        root: getEBI('player-area'),
        progress: getEBI('song-progress'),
        title: getEBI('song-title'),
        order: getEBI('song-order'),
        singer: getEBI('song-singer'),
    }
}
const player = new Audio()
log(es_main)


app.listenInit(() => {
    let main_loop
    let player_loop
    /**本页面当前的播放列表 @type {SongList} */
    let this_list = []
    /**播放列表DOM元素 @type {PlayerList} */
    let es_this_list = []
    /**播放列表的歌词类 @type {(Lyric|null)[]} */
    let lyric_this_list = []
    /**当前歌曲的歌词DOM元素 @type {Object.<number, Element[]>} */
    let es_now_lyric = {}
    /**当前歌曲的对象 @type {Lyric | null} */
    let now_lyric = null
    /**当前播放歌曲的索引 */
    let now_index = -1
    /**尝试错误的次数 */
    let error_count = 0
    /**允许尝试错误的次数 */
    let max_error_count = 6
    /**
     * 进入主循环, 请求播放状态
     * @param {number} time 请求间隔时间
     */
    const mainLoop = (time = app.loop_res_time) => {
        main_loop = setInterval(() => {
            refreshList()
        }, time)
    }
    /**
     * 向服务器请求播放列表并更新本地播放列表
     * @param {function} [callback] 刷新完毕时触发回调函数
     */
    const refreshList = (callback) => {
        app.useAPI({'type': 'get_song_list'}, (res_data) => {
            error_count = 0
            // update list
            let update = [] // 只更新增加的曲目, 节约性能
            

            const this_len = this_list.length
            /**@type {Array} */
            const server_list = res_data.data.list

            if (server_list.length < this_len) {
                // 出现远程列表长度没本地列表长时, 触发重置
                update = server_list
                this_list = server_list
                es_this_list = []
                lyric_this_list = []
                now_index = -1
                initList()
                
                log('(!)init list')
            } else {
                // 默认情况只更新增加曲目
                update = server_list.splice(this_len)
                if (update.length <= 0) return // not have new song

                this_list.push(...update)

                log('(i)update list, now list: ', this_list)
            }

            updateList(update, this_list)



            // exec callback
            if (typeof callback === 'function') {
                callback()
            }
        }, () => {
            // error
            error_count += 1
            console.warn(`WARN: Server error encountered. Re-request attempts: ${error_count}`)
            if (error_count >= max_error_count) {
                app.errorBox(msgBoxText('server_error'))
                stopLoop()
            }
        }, false)
    }
    /**停止主循环 */
    const stopLoop = () => { clearInterval(main_loop) }
    /**(DOM)清空网页内播放列表 */
    const initList = () => {
        es_main.play_lits.innerHTML = ''
    }




    /**
     * (DOM)更新播放列表
     * @param {SongList} list 新歌列表
     * @param {SongList} player_list 所有歌曲列表(含有新歌)
     */
    const updateList = (list, player_list = this_list) => {
        const update_list_length = list.length
        const player_list_length = player_list.length
        

        const e_list = es_main.play_lits
        let number = player_list_length - update_list_length
        list.forEach((song) => {
            // ref value
            const user_avatar = song.order.avatar
            const user_name = song.order.name
            const user_id = song.order.uid
            const song_data = song.data
            const song_lyric = song.data.lyric
            const song_sub_lyric = song.data.sub_lyric
            log(song.data)
            
            number += 1

            // create
            const e_root = createElement('li')

            // create - info(order info)
            const es_info = {
                'number': createElement('span', {class: 'number'}, number, false),
                'avatar': createElement('img', {class: 'avatar', src: user_avatar, alt: 'user avatar'}),
                'name': createElement('span', {class: 'name'}, user_name),
            }
            const e_info = createElement('article', {class: 'info'})
            join(e_info, es_info)

            // create - item(song info)
            const es_item = {
                'title': createElement('span', {class: 'title'}, song_data.title),
                'singer': createElement('span', {class: 'singer'}, song_data.singer.toString()),
            }
            const e_item = createElement('article', {class: 'item'})
            join(e_item, es_item)


            // join
            join(e_root, [e_info, e_item])
            e_list.appendChild(e_root)
            es_this_list.push({
                root: e_root,
                item: es_item,
                info: es_info,
            })

            // init lyric
            lyric_this_list.push(song_lyric ? new Lyric(song_lyric, song_sub_lyric) : null)

            // check player
            if (player.ended) {
                switchSong()
            }
        })

    }

    /**切换到下一曲 */
    const switchSong = () => {
        // ref
        const es_player = es_main.playing

        now_index += 1
        // get value
        const song_item = this_list[now_index] // now song data
        const elem_last_item = es_this_list[now_index - 1] // last item
        const elem_now_item = es_this_list[now_index] // now item
        const lyric = lyric_this_list[now_index] // now lyric

        log('now:', elem_now_item, 'last:', elem_last_item, 'data:', song_item)

        if (!elem_now_item) { // no next
            player.pause()
            now_index -= 1
            return
        }

        // set style
        const e_now_root = elem_now_item.root
        if (elem_last_item) elem_last_item.root.classList.remove('now')
        // log(elem_now_item)
        e_now_root.classList.add('now')
        e_now_root.scrollIntoView()

        // set audio
        player.src = song_item.data.src
        
        // set player
        es_player.order.innerText = song_item.order.name
        es_player.singer.innerText = song_item.data.singer
        es_player.title.innerText = song_item.data.title
        es_player.root.setAttribute('style', `--image-url: url('${song_item.data.cover}')`)



        // lyric - init
        const e_lyric = es_main.lyric_lits
        e_lyric.innerHTML = ''
        es_now_lyric = {}
        now_lyric = null
        // lyric - have
        if (lyric) {
            // update lyric
            now_lyric = lyric
            lyric.lyrics.forEach((lyric_item, index) => {
                // create element
                app.forEachObject(lyric_item, (key, value) => {
                    if (!es_now_lyric[key]) es_now_lyric[key] = []
                    es_now_lyric[key][index] = createElement('li', {}, value)
                })

                // join element
                app.forEachObject(es_now_lyric, (_, elems) => {
                    elems.forEach((elem) => {
                        join(e_lyric, elem)
                    })
                })
            })

            log('init:', es_now_lyric)
        }
    }

    /**已设置lyric样式的列表 @type {Element[]} */
    let es_lyric_set_style = []
    /**设置当前歌词位置的 @param {number} time */
    const setLyricNow = (time) => {
        es_lyric_set_style.forEach((e_last) => {
            e_last.classList.remove('now')
        })
        es_lyric_set_style = []

        // log('use:', es_now_lyric)
        const now_lyric_time = now_lyric.get(time)
        const e_now_lyric = es_now_lyric[now_lyric_time]
        if (!e_now_lyric) return
        e_now_lyric.forEach((element, index) => {
            if (index === 0) element.scrollIntoView()
            element.classList.add('now')
            es_lyric_set_style.push(element)
        })
    }
    /**刷新播放器内容(如进度条) */
    const refreshPlayer = () => {
        const current = player.currentTime
        const duration = player.duration
        const progress = (current / duration) * 100
        if (now_lyric) {
            // have lyric
            setLyricNow(current)
        }

        es_main.playing.progress.setAttribute('style', `--progress: ${progress}%`)
    }

    /**正在播放, 进入播放器刷新主循环 */
    const playing = (is_play = true) => {
        clearInterval(player_loop)
        if (!is_play) return
        player_loop = setInterval(() => {
            refreshPlayer()
        }, 500)
    }

    // const initLyric = () => {

    // }

    // listen...
    player.addEventListener('ended', () => { // play end
        playing(false)
        switchSong()
    })
    player.addEventListener('pause', () => { // play pause
        playing(false)
    })
    player.addEventListener('playing', () => { // playing
        playing(true)
    })
    player.addEventListener('canplay', () => { // audio ready
        player.play()
    })


    // 调试模式下添加原生播放器
    // if (app.debug_mode) {
    //     es_main.player.appendChild(player)
    //     player.controls = true
    // }
    es_main.player.appendChild(player)
    player.controls = true
    

    // init
    initList()
    refreshList(() => {
        // 第一次初始化时
        player.volume = .3
        switchSong()
    })
    mainLoop()
}, true)