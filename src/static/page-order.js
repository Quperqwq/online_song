/**
 * @typedef {import('../../types').SearchSongData} SearchSongData
 * @typedef {import('../../types').SearchSongData} SearchSongData
 */

const es_main = {
    search: {
        input: getEBI('search-input'),
        submit: getEBI('search-submit'),
        info: getEBI('search-info')
    },
    preview: {
        root: getEBI('preview'),
        title: getEBI('preview-title'),
        audio: getEBI('player'),
        download: getEBI('start-download'),
        submit: getEBI('order-submit'),
    },
    control: getEBI('control'),
    table: getEBI('search-table'),
}

const es_preview = es_main.preview
const e_audio = es_main.preview.audio
const es_search = es_main.search

class SelectSong {
    title = ''
    singer = ''
    src = ''
    cover = null
    /**
     * @param {string} title 
     * @param {string} singer 
     * @param {string} src 
     * @param {number} id 
     * @param {string | null} cover 
     */
    constructor(title, singer, src, id, cover) {
        SelectSong.title = title
        SelectSong.singer = singer
        SelectSong.src = src
        SelectSong.id = id
        SelectSong.cover = cover ? cover : null
        es_preview.title.innerText = title
        e_audio.src = src
    }
    static order() {
        app.waitBox(true, msgBoxText('server_processing'))
        const {title, singer, src, cover, id} = SelectSong
        if (!(title && singer && src)) {
            app.errorBox(msgBoxText('order_song_fail'))
            return
        }
        app.useAPI({
            type: 'add_song',
            src: src,
            title: title,
            singer: singer,
            cover: cover,
            id: id
        }, (res_data) => {
            app.waitBox(false)
            app.finishBox(msgBoxText('order_song_finish'))
        })
    }

}

class Page {
    /**
     * 设置预览元素是否隐藏
     * @param {boolean} is_hidden 是否隐藏
     */
    static setPreviewHidden(is_hidden) {
        const set_attrib = str => es_main.control.setAttribute('data-style-preview', str)
        if (is_hidden) {
            set_attrib('hidden')
        } else {
            set_attrib('show')
        }
    }
}


// listen audio event...
es_preview.audio.addEventListener('error', () => {
    Page.setPreviewHidden(true)
})

es_preview.audio.addEventListener('canplay', () => {
    Page.setPreviewHidden(false)
    e_audio.play()
})





app.listenInit(() => {
    // ref
    const e_table = es_main.table

    // init
    Page.setPreviewHidden(true)


    // func
    const startSearch = () => {
        const keyword = es_main.search.input.value
        if (!keyword) {
            app.errorBox(msgBoxText('please_input_keyword'))
            return
        }
        app.waitBox(true, msgBoxText('operate_requesting'))
        app.useAPI({type: 'search_song', keyword: keyword}, (res_data) => {
            /**返回的搜索列表 @type {SearchSongData[]} */
            const search_list = res_data.data

            es_main.table.innerHTML = ''
            // create element ...
            search_list.forEach((song_item) => {
                // button
                const e_button = createElement('button', {type: 'button', class: 'icon-play no-margin success'},  () => {
                    // select song -> create preview
                    if (!song_item.valid) {
                        app.errorBox(msgBoxText('get_preview_fail'))
                        return
                    }
                    log(song_item, song_item.id)
                    new SelectSong(
                        song_item.title,
                        song_item.singer,
                        song_item.src,
                        song_item.id,
                        song_item.cover
                    )
                })
                const e_play = createElement('td', {class: 'play'})
                join(e_play, e_button)

                // elems
                const es_item = {
                    title: createElement('td', {class: 'title'}, song_item.title),
                    singer: createElement('td', {class: 'singer'}, song_item.singer.toString()),
                    play: e_play
                }
                const e_root = createElement('tr')
                join(e_root, es_item)
                join(es_main.table, e_root)
                app.waitBox(false)
            })

            // change info
            es_search.info.innerText = `共检索到${search_list.length}首`
        }
        // , (res_data) => {
        //     app.errorBox(serverText(res_data.message))
        // }
        )
    }


    // listen event
    es_main.search.input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            startSearch()
        }
    })

    es_main.search.submit.addEventListener('click', () => {
        startSearch()
    })

    es_preview.submit.addEventListener('click', () => {
        SelectSong.order()
    })

    es_preview.download.addEventListener('click', () => {
        e_audio.pause()
        // window.open(e_audio.src, '_blank')
        const download_name = SelectSong.title + '-' + SelectSong.singer
        app.downloadFile(SelectSong.src, download_name)
    })



    app.initBackTop()
})