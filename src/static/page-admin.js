const es_main = {
    control: {
        'show_time': getEBI('but-show-time'),
        'show_name': getEBI('but-show-name'),
        'show_role': getEBI('but-show-role'),
    },
    table: {
        'root': getEBI('table'),
        'body': getEBI('table-body'),
    }
}

app.listenInit(() => {
    // button
    log('ok')
    const es_control = es_main.control
    /**
     * 切换表格内容元素显示内容
     * @param {Element} btn_element 按下的按钮元素
     * @param {string} class_name */
    const setDisplay = (btn_element, class_name) => {
        const e_table = es_main.table.root
        if (app.haveClassName(btn_element, 'icon-show')) {
            // (TSK)
        }
    }

    es_control.show_name.addEventListener('click', (event) => {
        
    })
    es_control.show_role.addEventListener('click', () => {

    })
    es_control.show_time.addEventListener('click', () => {

    })

})