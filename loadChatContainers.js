$(document).ready(async () => {
    const response = await fetch('/chatappLogin');
            
    let userDetails = (await response.json()).details;

    const urlParams = new URLSearchParams(window.location.search);
    const userParam = urlParams.get('user');
    const groupParam = urlParams.get('group');

    $('.sidenavAppend').hide();
    $('.chatContainerLoader').show();

    let friendsList = userDetails.friends;

    if (friendsList) {
        const friendsArr = await Promise.all(
            Object.keys(friendsList)
                .filter(key => friendsList[key])
                    .map(async key => {
                        const user = await fetch('/getUserDetails', {
                            method: 'POST',
                            headers: { 'content-type': 'text/plain' },
                            body: key
                        });
                
                        return user.json();
                    })
        );

        friendsArr.sort((a, b) => {
            const usernameA = a.user.username.toUpperCase();
            const usernameB = b.user.username.toUpperCase();
        
            if (usernameA < usernameB) {
                return -1;
            }
            if (usernameA > usernameB) {
                return 1;
            }
            return 0;
        });

        friendsArr.forEach(async reqUser => {
            const convoRes = await fetch('/getConversationID', {
                method: 'POST', 
                headers: { 'content-type': 'application/json' }, 
                body: JSON.stringify({ p1: userDetails._id, p2: reqUser.user._id })
            });
        
            conversationID = await convoRes.text();

            let unreadMessagesRes = await fetch('/unreadMessages', {
                method: 'POST', 
                headers: {
                    'content-type': 'application/json'
                }, 
                body: JSON.stringify({ user: userDetails._id, convo: conversationID })
            });

            let unreadMessages;
            if (unreadMessagesRes.status == 200) {
                unreadMessages = await unreadMessagesRes.text();
                let unreadMsgDisplay = unreadMessages;
                
                
                if (reqUser.user.username != 'undefined') {
                    $('.sidenavAppend').append(`
                        <div class='d-flex requests align-items-center ps-1 justify-content-between'>
                            <div class="d-flex align-items-center reqProfile">
                                <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                    <img src="data:image/jpeg;base64,${reqUser.profile}" alt="Profile" height='47px' width='47px'>
                                </div>
                                <div class='result-item d-flex flex-column' data-id='${reqUser.user._id}'>
                                    <div>
                                        ${reqUser.user.fname} ${reqUser.user.lname}
                                    </div>
                                    <span style='font-size:10px;'>
                                        ${reqUser.user.username}
                                    </span>
                                </div>
                            </div>
                            <div class='me-2'>
                                <div class='unreadTexts bg-success rounded-pill'>${unreadMsgDisplay}</div>
                            </div>
                        </div>
                    `);

                } else {
                    $('.sidenavAppend').append(`
                        <div class='d-flex requests align-items-center ps-1 justify-content-between'>
                            <div class="d-flex align-items-center reqProfile">
                                <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                    <img src="data:image/jpeg;base64,${reqUser.profile}" alt="Profile" height='47px' width='47px'>
                                </div>
                                <div class='result-item d-flex flex-column' data-id='${reqUser.user._id}'>
                                    <div>
                                        ${reqUser.user.fname} ${reqUser.user.lname}
                                    </div>
                                    <span style='font-size:10px;'>
                                        deleted user
                                    </span>
                                </div>
                            </div>
                            <div class='me-2'>
                                <div class='unreadTexts bg-success rounded-pill'>${unreadMsgDisplay}</div>
                            </div>
                        </div>
                    `);
                }

                $('.sidenavAppend .requests').find(`.result-item[data-id='${reqUser.user._id}']`).closest('.requests').css({
                    order: '-1'
                });

            } else {
                unreadMessages = 0;

                if (reqUser.user.username != 'undefined') {
                    $('.sidenavAppend').append(`
                        <div class='d-flex requests align-items-center ps-1 justify-content-between'>
                            <div class="d-flex align-items-center reqProfile">
                                <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                    <img src="data:image/jpeg;base64,${reqUser.profile}" alt="Profile" height='47px' width='47px'>
                                </div>
                                <div class='result-item d-flex flex-column' data-id='${reqUser.user._id}'>
                                    <div>
                                        ${reqUser.user.fname} ${reqUser.user.lname}
                                    </div>
                                    <small style='font-size:10px;'>
                                        ${reqUser.user.username}
                                    </small>
                                </div>
                            </div>
                            <div class='me-2'>
                                <div class='unreadTexts bg-success rounded-pill' hidden></div>
                            </div>
                        </div>
                    `);

                } else {
                    $('.sidenavAppend').append(`
                        <div class='d-flex requests align-items-center ps-1 justify-content-between'>
                            <div class="d-flex align-items-center reqProfile">
                                <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                    <img src="data:image/jpeg;base64,${reqUser.profile}" alt="Profile" height='47px' width='47px'>
                                </div>
                                <div class='result-item d-flex flex-column' data-id='${reqUser.user._id}'>
                                    <div>
                                        ${reqUser.user.fname} ${reqUser.user.lname}
                                    </div>
                                    <small style='font-size:10px;'>
                                        deleted user
                                    </small>
                                </div>
                            </div>
                            <div class='me-2'>
                                <div class='unreadTexts bg-success rounded-pill' hidden></div>
                            </div>
                        </div>
                    `);
                }


                $('.sidenavAppend .requests').find(`.result-item[data-id='${reqUser.user._id}']`).closest('.requests').css({
                    order: '0'
                });
            }

            if (userParam) {
                if (reqUser.user._id == userParam) {
                    $(`.requests .result-item[data-id='${reqUser.user._id}']`).closest('.requests').css({
                        backgroundColor: '#38444d'
                    });
                    $(`.requests .result-item[data-id='${reqUser.user._id}']`).closest('.requests').find('.unreadTexts').prop('hidden', true);
                }
            }

            $('.sidenavAppend .requests').off('click').on('click', async (event) => {
                window.location.href = `/chat?private=true&user=${$(event.target).closest('.requests').find('.result-item').data('id')}`;

            });
                
        });

    } else {
        $('.sidenavAppend').append('You have 0 friends :( <br><br>You can add friends by searching them!')
    }

    const getGroupsRes = await fetch('/getGroups', {
        method: 'POST', 
        headers: {
            'content-type': 'text/plain'
        }, 
        body: userDetails._id
    });

    if (getGroupsRes.status == 200) {
        let groups = await getGroupsRes.json();

        for (let i in groups) {
            let unreadMessagesRes = await fetch('/unreadMessages', {
                method: 'POST', 
                headers: {
                    'content-type': 'application/json'
                }, 
                body: JSON.stringify({ user: userDetails._id, convo: groups[i]._id })
            });
            let unreadMessages;
            if (unreadMessagesRes.status == 200) {
                unreadMessages = await unreadMessagesRes.text();
                let unreadMsgDisplay = unreadMessages;

                $('.sidenavAppend').append(`
                    <div class='d-flex groups align-items-center ps-1 justify-content-between'>
                        <div class="d-flex align-items-center reqProfile">
                            <div class='d-flex align-items-center justify-content-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 1920 1792"><path fill="#a0abb3" d="M593 896q-162 5-265 128H194q-82 0-138-40.5T0 865q0-353 124-353q6 0 43.5 21t97.5 42.5T384 597q67 0 133-23q-5 37-5 66q0 139 81 256m1071 637q0 120-73 189.5t-194 69.5H523q-121 0-194-69.5T256 1533q0-53 3.5-103.5t14-109T300 1212t43-97.5t62-81t85.5-53.5T602 960q10 0 43 21.5t73 48t107 48t135 21.5t135-21.5t107-48t73-48t43-21.5q61 0 111.5 20t85.5 53.5t62 81t43 97.5t26.5 108.5t14 109t3.5 103.5M640 256q0 106-75 181t-181 75t-181-75t-75-181t75-181T384 0t181 75t75 181m704 384q0 159-112.5 271.5T960 1024T688.5 911.5T576 640t112.5-271.5T960 256t271.5 112.5T1344 640m576 225q0 78-56 118.5t-138 40.5h-134q-103-123-265-128q81-117 81-256q0-29-5-66q66 23 133 23q59 0 119-21.5t97.5-42.5t43.5-21q124 0 124 353m-128-609q0 106-75 181t-181 75t-181-75t-75-181t75-181t181-75t181 75t75 181"/></svg>
                            </div>
                            <div class='result-item d-flex flex-column' data-id='${groups[i]._id}'>
                                <div>
                                    ${groups[i].id}
                                </div>
                                <small style='font-size:10px;'>
                                    Group
                                </small>
                            </div>
                        </div>
                        <div class='me-2'>
                            <div class='unreadTexts bg-success rounded-pill'>${unreadMsgDisplay}</div>
                        </div>
                    </div>
                `);

                $('.sidenavAppend .groups').find(`.result-item[data-id='${groups[i]._id}']`).closest('.groups').css({
                    order: '-1'
                });

            } else {
                $('.sidenavAppend').append(`
                    <div class='d-flex groups align-items-center ps-1 justify-content-between'>
                        <div class="d-flex align-items-center reqProfile">
                            <div class='d-flex align-items-center justify-content-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 1920 1792"><path fill="#a0abb3" d="M593 896q-162 5-265 128H194q-82 0-138-40.5T0 865q0-353 124-353q6 0 43.5 21t97.5 42.5T384 597q67 0 133-23q-5 37-5 66q0 139 81 256m1071 637q0 120-73 189.5t-194 69.5H523q-121 0-194-69.5T256 1533q0-53 3.5-103.5t14-109T300 1212t43-97.5t62-81t85.5-53.5T602 960q10 0 43 21.5t73 48t107 48t135 21.5t135-21.5t107-48t73-48t43-21.5q61 0 111.5 20t85.5 53.5t62 81t43 97.5t26.5 108.5t14 109t3.5 103.5M640 256q0 106-75 181t-181 75t-181-75t-75-181t75-181T384 0t181 75t75 181m704 384q0 159-112.5 271.5T960 1024T688.5 911.5T576 640t112.5-271.5T960 256t271.5 112.5T1344 640m576 225q0 78-56 118.5t-138 40.5h-134q-103-123-265-128q81-117 81-256q0-29-5-66q66 23 133 23q59 0 119-21.5t97.5-42.5t43.5-21q124 0 124 353m-128-609q0 106-75 181t-181 75t-181-75t-75-181t75-181t181-75t181 75t75 181"/></svg>
                            </div>
                            <div class='result-item d-flex flex-column' data-id='${groups[i]._id}'>
                                <div>
                                    ${groups[i].id}
                                </div>
                                <small style='font-size:10px;'>
                                    Group
                                </small>
                            </div>
                        </div>
                        <div class='me-2'>
                            <div class='unreadTexts bg-success rounded-pill' hidden></div>
                        </div>
                    </div>
                `);

                $('.sidenavAppend .groups').find(`.result-item[data-id='${groups[i]._id}']`).closest('.groups').css({
                    order: '0'
                });
            }

            if (groupParam == groups[i]._id) {
                $(`.groups .result-item[data-id='${groups[i]._id}']`).closest('.groups').css({
                    backgroundColor: '#38444d'
                });
                $(`.groups .result-item[data-id='${groups[i]._id}']`).closest('.groups').find('.unreadTexts').prop('hidden', true);
            }
    
            $('.sidenavAppend .groups').off('click').on('click', (event) => {
                window.location.href = `/chat?private=false&group=${$(event.target).closest('.groups').find('.result-item').data('id')}`;
            });
        }

    } else if (!getGroupsRes.ok) {
        alert('Internal server error while fetching groups.');
    }

    $('.sidenavAppend').show();
    $('.chatContainerLoader').hide();

});