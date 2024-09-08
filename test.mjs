import {app, songAPI} from "./app.mjs"


songAPI.search('勇敢的心', (data) => {
    app.log(data)
})

// songAPI.getSongURL(2031170908, (url) => {
//     app.log(url)
// })