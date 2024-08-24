const es_main = {
    play_lits: getEBI('play-list'),
    lyric_lits: getEBI('lyric-list'),
    playing: {
        progress: getEBI('progress'),
        title: getEBI('song-name'),
        order: getEBI('song-order'),
        singer: getEBI('song-singer'),
    }
}

app.listenInit(() => {
    let loop
    /**本页面当前的播放列表 */
    const this_list = []
    /**
     * 进入主循环, 请求播放状态
     * @param {number} time 请求间隔时间
     */
    const mainLoop = (time = app.loop_res_time) => {
        loop = setInterval(() => {
            app.useAPI({'type': 'get_song_list'}, (res_data) => {
                // update list
                log(res_data)
                let update = [] // 只更新增加的曲目, 节约性能
                

                const this_len = this_list.length
                /**@type {Array} */
                const server_list = res_data.data.list
                if (server_list.length < this_len) {
                    // 出现远程列表长度没本地列表长时, 触发重置
                    this_list = server_list
                    update = server_list
                } else {
                    // 默认情况只更新增加曲目
                    update = server_list.splice(this_len)
                }
                
                
            }, () => {
                // error
                stopLoop()
            })
        }, time)
    }
    const stopLoop = () => { clearInterval(loop) }
    /**
     * (DOM)更新播放列表
     * @param {Array} list 新歌列表
     */
    const updateList = (list) => {
        const e_list = es_main.play_lits
        list.forEach((song) => {
            const e_root = createElement('li')
            const es_info = {
                'number': createElement('span', {class: 'number'}, )
            }
            // (TSK) =w=   接下来就是纯纯的dom操作了
        })

        e_list.appendChild()
    }
    
    mainLoop()
})