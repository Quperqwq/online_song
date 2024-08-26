const es_main = {
    control: {
        'show_time': getEBI('but-show-time'),
        'show_name': getEBI('but-show-name'),
        'show_role': getEBI('but-show-role'),
        'refresh_data': getEBI('btn-refresh-data'),
    },
    table: {
        'root': getEBI('table'),
        'body': getEBI('table-body'),
    }
}

app.listenInit(() => {
    // button
    const es_control = es_main.control
    const e_table = es_main.table.root
    const e_table_body = es_main.table.body
    /**
     * 切换表格内容元素显示内容
     * @param {Element} btn_element 按下的按钮元素
     * @param {string} class_name */
    const setDisplay = (btn_element, class_name) => {
        const addAttrib = (value) => {app.addAttributeValue(e_table, 'data-style-hidden', value)}
        const removeAttrib = (value) => {app.removeAttributeValue(e_table, 'data-style-hidden', value)}

        if (app.haveClassName(btn_element, 'icon-show')) {
            btn_element.className = btn_element.className.replace('icon-show', 'icon-hidden')

            addAttrib(class_name)
        } else {
            btn_element.className = btn_element.className.replace('icon-hidden', 'icon-show')

            removeAttrib(class_name)
        }
    }

    es_control.show_name.addEventListener('click', (event) => {
        const e_btn = event.target
        setDisplay(e_btn, 'name')
    })
    es_control.show_role.addEventListener('click', (event) => {
        const e_btn = event.target
        setDisplay(e_btn, 'role')
    })
    es_control.show_time.addEventListener('click', (event) => {
        const e_btn = event.target
        setDisplay(e_btn, 'time')
    })
    es_control.refresh_data.addEventListener('click', () => {
        initTable()
    })


    // init table
    const initTable = () => {
        app.waitBox(true, msgBoxText('initializing'))
        e_table_body.innerHTML = ''
        app.useAPI({type: 'admin', method: 'get_all_user'}, (res_data) => {
            app.waitBox(false)
            log(res_data)
    
            app.forEachObject(res_data.data, (user_id, user_data) => {
                // get data
                const {info, profile, role} = user_data
                const username = profile.name
                const uid = profile.id

                // create
                const e_root = createElement('tr', {
                    'data-id': user_id
                })

                // create - role...
                const e_role = createElement('td', {class: 'role'})

                app.forEachObject(role, (type, is_have) => {
                    // process item
                    let attribs = {
                        type: 'checkbox'
                    }
                    if (is_have) attribs.checked = true

                    const e_item_root = createElement('label')
                    const e_item_input = createElement('input', attribs, (event) => {
                        // click to change
                        const target = event.target
                        const is_checked = target.checked
                        // disabled input element
                        app.disabledElement(target, true)
                        app.waitBox(true, msgBoxText('operate_requesting'))
                        const endReq = () => {
                            app.disabledElement(target, false)
                        }

                        app.useAPI({
                            'type': 'admin',
                            'method': 'change_user_role',
                            'uid': uid,
                            'target': type,
                            'value': is_checked
                        }, () => {
                            app.waitBox(false)
                            endReq()
                        }, // ok
                        () => { // error
                            endReq()
                            target.checked = !is_checked
                        })
                    })
                    const e_item_text = createElement('span', {class: 'checkable'}, itemText(type))
                    join(e_item_root, [e_item_input, e_item_text])
                    join(e_role, e_item_root)
                })

                // create - operate
                const es_operate_item = [
                    createElement('button', {type: 'button', class: 'icon-del error operate-item', title: 'delete the user'}, () => {
                        // del user
                        app.confirmBox(msgBoxText('confirm_del_user') + `\n${username}`, (is_confirm) => {
                            if (!is_confirm) return

                        })
                    }, '删除用户')
                ]

                const e_operate = createElement('td', {class: 'operate'})
                join(e_operate, es_operate_item)


                // create - line
                const es_new_line = {
                    name: createElement('td', {class: 'name'}, username),
                    id: createElement('td', {class: 'id'}, user_id),
                    c_time: createElement('td', {class: 'c-time'}, info.ctime),
                    m_time: createElement('td', {class: 'm-time'}, info.mtime),
                    login_time: createElement('td', {class: 'login-time'}, info.login_time),
                    role: e_role,
                    operate: e_operate,
                }
                join(e_root, es_new_line)

                // join
                join(e_table_body, e_root)
            })
        })
    }
    initTable()
})
