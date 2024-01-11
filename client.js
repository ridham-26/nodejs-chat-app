$(document).ready(async () => {
    const response = await fetch('/chatappLogin');
    
    let userDetails = (await response.json()).details;
    
    const socket = io('/active');

    let usersOnline;

    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    
    socket.emit('user connected', userDetails);
    
    socket.on('user connected', data => {
        usersOnline = data;

        for (let i in usersOnline) {
            if (usersOnline[i] == userParam) {
                $('.chatNav .reqProfile').find('.activeStatus').text('online');
                break;
            }
        }
    });

    socket.on('user disconnected', data => {
        if (data == userParam) {
            $('.chatNav .reqProfile').find('.activeStatus').text('offline');
        }
    });

    socket.on('message sent', async data => {
        if (data.recievers.includes(userDetails._id)) {
            let conversationID;
    
            let user = await fetch('/getUserDetails', {
                method: 'POST', 
                body: data.sender
            });
            let who = await user.json();
    
            if (!window.location.href.includes('/chat')) {
                if (data.type == 'private') {
                    let unreadTextsElement = $(`.requests`).find(`.result-item[data-id='${data.sender}']`).closest('.requests').find('.unreadTexts');
                    let x;
            
                    if (unreadTextsElement.prop('hidden')) {
                        x = 0;
                    } else {
                        x = parseInt(unreadTextsElement.text(), 10);
                    }
                    x++;
                    unreadTextsElement.prop('hidden', false);
                    unreadTextsElement.text(x++);
    
                    appendNoti(who.user.username, data.message, data.sender, 'Private', userDetails._id, data.sender, who.profile);

                    let y = $(`.requests`).find(`.result-item[data-id='${data.sender}']`).closest('.requests').css('order');
                    let numericOrder = parseInt(y, 10);
                    $('.sidenavAppend .requests').find(`.result-item[data-id='${data.sender}']`).closest('.requests').css({
                        order: `${numericOrder - 1}`
                    });

                } else {
                    const res = await fetch('/getGroupConvoDetails', {
                        method: 'POST', 
                        headers: { 'content-type': 'text/plain' }, 
                        body: data.convo
                    });
                    let convoDetails = await res.json();
    
                    let unreadTextsElement = $(`.groups`).find(`.result-item[data-id='${data.convo}']`).closest('.groups').find('.unreadTexts');
                    let x;
    
                    if (unreadTextsElement.prop('hidden')) {
                        x = 0;
                    } else {
                        x = parseInt(unreadTextsElement.text(), 10);
                    }
                    x++;
                    unreadTextsElement.prop('hidden', false);
                    unreadTextsElement.text(x++);
    
                    appendNoti(who.user.username, data.message, data.convo, convoDetails.id, userDetails._id, data.sender, who.profile);

                    let y = $(`.groups`).find(`.result-item[data-id='${data.convo}']`).closest('.groups').css('order');
                    let numericOrder = parseInt(y, 10);
                    $('.sidenavAppend .groups').find(`.result-item[data-id='${data.convo}']`).closest('.groups').css({
                        order: `${numericOrder - 1}`
                    });
                }
            } else { 
                const urlParams = new URLSearchParams(window.location.search);
                const chatType = urlParams.get('private');
    
                if (chatType == 'true') {
                    const userParam = urlParams.get('user');
                    const convoRes = await fetch('/getConversationID', {
                        method: 'POST', 
                        headers: { 'content-type': 'application/json' }, 
                        body: JSON.stringify({ p1: userDetails._id, p2: userParam })
                    });
                
                    conversationID = await convoRes.text();
                } else {
                    conversationID = urlParams.get('group');
                }
    
                if (conversationID != data.convo) {
                    if (data.type == 'private') {
                        let unreadTextsElement = $(`.requests`).find(`.result-item[data-id='${data.sender}']`).closest('.requests').find('.unreadTexts');
                        let x;
                
                        if (unreadTextsElement.prop('hidden')) {
                            x = 0;
                        } else {
                            x = parseInt(unreadTextsElement.text(), 10);
                        }
                        x++;
                        unreadTextsElement.prop('hidden', false);
                        unreadTextsElement.text(x++);
    
                        appendNoti(who.user.username, data.message, data.sender, 'Private', userDetails._id, data.sender, who.profile);
                        let y = $(`.requests`).find(`.result-item[data-id='${data.sender}']`).closest('.requests').css('order');
                        let numericOrder = parseInt(y, 10);
                        $('.sidenavAppend .requests').find(`.result-item[data-id='${data.sender}']`).closest('.requests').css({
                            order: `${numericOrder - 1}`
                        });
                    } else {
                        const ress = await fetch('/getGroupConvoDetails', {
                            method: 'POST', 
                            headers: { 'content-type': 'text/plain' }, 
                            body: data.convo
                        });
                        let convoDetails = await ress.json();

                        let unreadTextsElement = $(`.groups`).find(`.result-item[data-id='${data.convo}']`).closest('.groups').find('.unreadTexts');
                        let x;
        
                        if (unreadTextsElement.prop('hidden')) {
                            x = 0;
                        } else {
                            x = parseInt(unreadTextsElement.text(), 10);
                        }
                        x++;
                        unreadTextsElement.prop('hidden', false);
                        unreadTextsElement.text(x++);
    
                        appendNoti(who.user.username, data.message, data.convo, convoDetails.id, userDetails._id, data.sender, who.profile);

                        let y = $(`.groups`).find(`.result-item[data-id='${data.convo}']`).closest('.groups').css('order');
                        let numericOrder = parseInt(y, 10);
                        $('.sidenavAppend .groups').find(`.result-item[data-id='${data.convo}']`).closest('.groups').css({
                            order: `${numericOrder - 1}`
                        });
                    }
                }
            }
        }
        
    });

    socket.on('friend request', async data => {
        if (data.to == userDetails._id) {
            let counter;
            if ($('.requestsIndicator').text() == '') {
                counter = 1;
                $('.requestsIndicator').show();
                $('.requestsIndicator').text(counter);
            } else {
                counter = parseInt($('.requestsIndicator').text()) + 1;
                $('.requestsIndicator').show();
                $('.requestsIndicator').text(counter);
            }
            let user = await fetch('/getUserDetails', {
                method: 'POST', 
                body: data.from
            });
            let who = await user.json();
            $('nav .requestsPanel').append(`
                <li>
                    <div class='d-flex requests align-items-center ps-1  justify-content-between'>
                        <div class="d-flex align-items-center reqProfile">
                            <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                <img src="data:image/jpeg;base64,${who.profile}" alt="Profile" height='47px' width='47px'>
                            </div>
                            <div class='result-item d-flex flex-column' data-id='${who.user._id}'>
                                ${who.user.fname} ${who.user.lname}
                                <small style='font-size:10px;'>
                                    ${who.user.username}
                                </small>
                            </div>
                        </div>
                        <div class="justify-self-end">
                            <button class="btn btn-success btn-sm rounded-pill me-1 acceptReq" data-id='${who.user._id}'>Accept</button>
                            <button class="btn btn-danger btn-sm rounded-pill me-1 deleteReq" data-id='${who.user._id}'>Delete</button>
                        </div>
                    </div>
                </li>
            `);
            $('nav .reqProfile').off('click').on('click', async (event) => {
                try {
                    window.location.href = `/userProfile?user=${$(event.currentTarget).find('.result-item').data('id')}`;
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            });

            $('.deleteReq').off('click').on('click', async (event) => {
                try {
                    let deleteReq = $(event.currentTarget).data('id');

                    const deleteRes = await fetch('/reqRejected', {
                        method: 'POST', 
                        headers: {'content-type': 'application/json'}, 
                        body: JSON.stringify({ p1: userDetails._id, p2: deleteReq })
                    });
                    console.log(deleteRes);
                    
                    if (deleteRes.ok) {
                        $(event.target).closest('li').remove();
                        alert('Friend request deleted successfully!');
                        counter--;
                        reqCounter(counter);
                    } else {
                        alert('Error deleting friend request.');
                    }
                } catch (err) {
                    console.log(err);
                }
            });

            $('.acceptReq').off('click').on('click', async (event) => {
                try {
                    let acceptReq = $(event.target).data('id');

                    const acceptRes = await fetch('/reqAccepted', {
                        method: 'POST', 
                        headers: {'content-type': 'application/json'}, 
                        body: JSON.stringify({ p1: userDetails._id, p2: acceptReq })
                    });

                    if (acceptRes.ok) {
                        alert('Friend added.');
                        location.reload();
                    } else {
                        alert('Cannot add friend.');
                    }
                } catch (err) {
                    console.log(err);
                }
            });
        }
        let reqCounter = (counter) => {
            if (counter == 0) {
                $('.requestsPanel').text('No Requests Pending.');
                $('.requestsPanel').css({
                    color: 'rgb(132, 142, 148)'
                });
                $('.requestsIndicator').hide();
            } else {
                $('.requestsIndicator').show();
                $('.requestsIndicator').html(counter);
            }
        }
    });

    let timeout;
    socket.on('typing', async data => {
        if (data.user !== userDetails._id) {
            
            if (data.type == 'true') {
                if (data.to == userDetails._id) {
                    $('.sidenav').find(`.result-item[data-id='${data.user}']`).find('small').text(`${data.fname} is typing...`);
                }
            } else {
                const isInGroupRes = await fetch('/isInGroup', {
                    method: 'POST', 
                    headers: {
                        'content-type': 'application/json'
                    }, 
                    body: JSON.stringify({ user: userDetails._id, group: data.convo })
                });
                if (isInGroupRes.ok) {
                    $('.sidenav').find(`.result-item[data-id='${data.convo}']`).find('small').text(`${data.fname} is typing...`);
                }
            }
            if (timeout) {
                clearTimeout(timeout);
            }
    
            timeout = setTimeout(() => {
                if (data.type == 'true') {
                    $('.sidenav').find(`.result-item[data-id='${data.user}']`).find('small').text(data.username);
                } else {
                    $('.sidenav').find(`.result-item[data-id='${data.convo}']`).find('small').text('Group');
                }
            }, 1000);
        }
    });

});

let appendNoti = (username, message, sender, chat, current, senderId, profile) => {

    if (current != senderId) {
        let notification = `
            <div class="alert alert-info alert-dismissible fade show">
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                <div class="d-flex align-items-center">
                    <div class="notiImg me-2">
                        <img src="data:image/jpeg;base64,${profile}" alt="Profile" height="47px" width="47px">
                    </div>
                    <div class="d-flex align-items-center">
                        <strong class='me-1'>${username}</strong><span class='me-1'>in</span><strong class="me-2">${chat}</strong>
                        <span>${message}</span>
                    </div>
                </div>
            </div>
        `;
    
        $('.alertContainer').html(notification);
    
        setTimeout(() => {
            $('.alert').fadeOut(300);
        }, 5000);
        
        if (chat == 'Private') {
            $('.alert > div').on('click', () => {
                window.location.href = `/chat?private=true&user=${sender}`;
            });
        } else {
            $('.alert > div').on('click', () => {
                window.location.href = `/chat?private=false&group=${sender}`;
            });
        }
    }
}
