/**
 * @typedef {import('../../types').SearchSongData} SearchSongData
 * @typedef {import('../../types').SearchSongData} SearchSongData
 */

const es_main = {
    search: {
        input: getEBI('search-input'),
        submit: getEBI('search-submit'),
    },
    preview: {
        root: getEBI('preview'),
        title: getEBI('preview-title'),
        audio: getEBI('player'),
        submit: getEBI('order-submit'),
    },
    control: getEBI('control'),
    table: getEBI('search-table'),
}

const es_preview = es_main.preview
const e_audio = es_main.preview.audio

class SelectSong {
    title = ''
    singer = ''
    src = ''
    cover = null
    /**
     * @param {string} title 
     * @param {string} singer 
     * @param {string} src 
     * @param {string | null} cover 
     */
    constructor(title, singer, src, cover) {
        SelectSong.title = title
        SelectSong.singer = singer
        SelectSong.src = src
        SelectSong.cover = cover ? cover : null
        es_preview.title.innerText = title
        e_audio.src = src
    }
    static order() {
        app.useAPI({'type': ''})
    }

}


// listen audio event...
es_preview.audio.addEventListener('error', () => {
    es_main.control.setAttribute('data-style-preview', 'hidden')
})

es_preview.audio.addEventListener('canplay', () => {
    es_main.control.setAttribute('data-style-preview', 'show')
    e_audio.play()
})





app.listenInit(() => {
    // ref
    const e_table = es_main.table

    const startSearch = () => {
        const keyword = es_main.search.input.value
        if (!keyword) {
            app.errorBox(msgBoxText('please_input_keyword'))
            return
        }
        app.waitBox(true, msgBoxText('operate_requesting'))
        app.useAPI({type: 'search_song', keyword: keyword}, (res_data) => {
            log(res_data)
            /**返回的搜索列表 @type {SearchSongData[]} */
            const search_list = res_data.data

            es_main.table.innerHTML = ''
            // create element ...
            search_list.forEach((song_item) => {
                log(song_item)

                // button
                const e_button = createElement('button', {type: 'button', class: 'icon-play no-margin success'},  () => {
                    // select song -> create preview
                    if (!song_item.valid) {
                        app.errorBox(msgBoxText('get_preview_fail'))
                        return
                    }
                    new SelectSong(
                        song_item.title,
                        song_item.singer,
                        song_item.src,
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
        
    })



    app.initBackTop()
})