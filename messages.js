$(document).ready(async () => {
    const socket = io('/chat');

    const response = await fetch('/chatappLogin');
    const userDetails = (await response.json()).details;

    socket.emit('entered chat', userDetails._id);

    $('#input').trigger('focus');

    let conversationID;

    let convoDetails;

    const urlParams = new URLSearchParams(window.location.search);
    const chatType = urlParams.get('private');

    if (chatType == 'true') {
        const userParam = urlParams.get('user');
        if (userDetails.friends[userParam]) {
            $('.chatNav .reqProfile').data('bs-toggle', '');
            $('.chatNav .reqProfile').data('bs-target', '');
        
            const res = await fetch('/getUserDetails', {
                method: 'POST', 
                headers: { 'content-type': 'text/plain' }, 
                body: userParam
            });
            let userData = await res.json();
        
            $('.chatNav .reqProfile').find('img').attr('src', `data:image/jpeg;base64,${userData.profile}`);
            $('.chatNav .reqProfile').find('.result-item > div').text(`${userData.user.fname} ${userData.user.lname}`);
            $('.chatNav .reqProfile').find('.result-item').data('id', userData.user._id);
            
            $('.chatNav .reqProfile').off('click').on('click', (event) => {
                try {
                    window.location.href = `/userProfile?user=${$(event.target).closest('.reqProfile').find('.result-item').data('id')}`;
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            });
        
            const convoRes = await fetch('/getConversationID', {
                method: 'POST', 
                headers: { 'content-type': 'application/json' }, 
                body: JSON.stringify({ p1: userDetails._id, p2: userData.user._id })
            });
        
            conversationID = await convoRes.text();

            let privConvoDetailsRes = await fetch('/getConvoDetails', {
                method: 'POST', 
                body: conversationID
            });
            convoDetails = await privConvoDetailsRes.json();
        
        } else {
            window.location.href = '/chatAppHome';
        }

    } else {
        const groupParam = urlParams.get('group');
        const isInGroupRes = await fetch('/isInGroup', {
            method: 'POST', 
            headers: {
                'content-type': 'application/json'
            }, 
            body: JSON.stringify({ user: userDetails._id, group: groupParam })
        });

        if (isInGroupRes.ok) {
            $('.chatNav .reqProfile').find('.activeStatus').remove();
        
            const res = await fetch('/getGroupConvoDetails', {
                method: 'POST', 
                headers: { 'content-type': 'text/plain' }, 
                body: groupParam
            });
            convoDetails = await res.json();
            
            let membersList = convoDetails.participants;
    
            const keysArray = membersList.map(obj => Object.keys(obj)[0]);
            const membersArrPromises = await keysArray.map(async key => {
                const user = await fetch('/getUserDetails', {
                    method: 'POST', 
                    headers: { 'Content-Type': 'text/plain' }, 
                    body: key
                });
    
                return (await user.json()).user;
            });
            const membersArr = await Promise.all(membersArrPromises);
    
            $('.chatNav .profileContainer').html(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 1920 1792"><path fill="#a0abb3" d="M593 896q-162 5-265 128H194q-82 0-138-40.5T0 865q0-353 124-353q6 0 43.5 21t97.5 42.5T384 597q67 0 133-23q-5 37-5 66q0 139 81 256m1071 637q0 120-73 189.5t-194 69.5H523q-121 0-194-69.5T256 1533q0-53 3.5-103.5t14-109T300 1212t43-97.5t62-81t85.5-53.5T602 960q10 0 43 21.5t73 48t107 48t135 21.5t135-21.5t107-48t73-48t43-21.5q61 0 111.5 20t85.5 53.5t62 81t43 97.5t26.5 108.5t14 109t3.5 103.5M640 256q0 106-75 181t-181 75t-181-75t-75-181t75-181T384 0t181 75t75 181m704 384q0 159-112.5 271.5T960 1024T688.5 911.5T576 640t112.5-271.5T960 256t271.5 112.5T1344 640m576 225q0 78-56 118.5t-138 40.5h-134q-103-123-265-128q81-117 81-256q0-29-5-66q66 23 133 23q59 0 119-21.5t97.5-42.5t43.5-21q124 0 124 353m-128-609q0 106-75 181t-181 75t-181-75t-75-181t75-181t181-75t181 75t75 181"/></svg>
            `);
            $('.chatNav .reqProfile').find('.result-item > div').text(`${convoDetails.id}`);
            $('.chatNav .reqProfile').find('.result-item ').append(async () => {
                const usernames = membersArr.filter(user => user.username !== 'undefined').map(user => user.username).join(', ');
                $('.chatNav .reqProfile .result-item').append('<span style="font-size:10px;">' + usernames + '</span>');
            });
            $('.chatNav .reqProfile').find('.result-item').data('id', convoDetails._id);
    
            $('.chatNav .reqProfile').off('click').on('click', async () => {
                const res = await fetch('/getGroupConvoDetails', {
                    method: 'POST', 
                    headers: { 'content-type': 'text/plain' }, 
                    body: groupParam
                });
                let convoDetails = await res.json();
                
                let membersList = convoDetails.participants;
        
                const rolesObject = membersList.reduce((acc, obj) => {
                    const key = Object.keys(obj)[0];
                    const value = obj[key];
                    acc[key] = value;
                    return acc;
                }, {});
        
                const keysArray = membersList.map(obj => Object.keys(obj)[0]);
                const membersArrPromises = await keysArray.map(async key => {
                    const user = await fetch('/getUserDetails', {
                        method: 'POST', 
                        headers: { 'Content-Type': 'text/plain' }, 
                        body: key
                    });
        
                    return user.json();
                });

                const membersArr = await Promise.all(membersArrPromises);
                $('#groupDetails .modal-title').text(convoDetails.id);
    
                $('#groupDetails .addMembers').html('');
    
                membersArr.forEach(result => {
    
                    if (rolesObject[userDetails._id] == 'member') {
                        $('.editGroup').remove();
                        if (rolesObject[result.user._id] == 'member') {
                            $('#groupDetails .addMembers').append(`
                                <div class='d-flex searchBlocks align-items-center justify-content-between ps-1'>
                                    <div class='d-flex align-items-center userProfile'>
                                        <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                            <img src="data:image/jpeg;base64,${result.profile}" alt="Profile" height='47px' width='47px'>
                                        </div>
                                        <div class='result-item d-flex flex-column' data-name='${result.user.fname} ${result.user.lname}' data-id='${result.user._id}'>
                                            ${result.user.fname} ${result.user.lname}
                                            <span style='font-size:10px;'>
                                                ${result.user.username}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `);
                        } else {
                            $('#groupDetails .addMembers').append(`
                                <div class='d-flex searchBlocks align-items-center justify-content-between ps-1'>
                                    <div class='d-flex align-items-center userProfile'>
                                        <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                            <img src="data:image/jpeg;base64,${result.profile}" alt="Profile" height='47px' width='47px'>
                                        </div>
                                        <div class='result-item d-flex flex-column' data-name='${result.user.fname} ${result.user.lname}' data-id='${result.user._id}'>
                                            ${result.user.fname} ${result.user.lname}
                                            <span style='font-size:10px;'>
                                                ${result.user.username}
                                                <span style='font-size:10px; font-weight:bold;' class='text-success'>&nbsp;
                                                    (Admin) 
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `);
                        }
                    } else {
                        if (rolesObject[result.user._id] == 'member') {
                            $('#groupDetails .addMembers').append(`
                                <div class='d-flex searchBlocks align-items-center justify-content-between ps-1'>
                                    <div class='d-flex align-items-center userProfile'>
                                        <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                            <img src="data:image/jpeg;base64,${result.profile}" alt="Profile" height='47px' width='47px'>
                                        </div>
                                        <div class='result-item d-flex flex-column' data-name='${result.user.fname} ${result.user.lname}' data-id='${result.user._id}'>
                                            ${result.user.fname} ${result.user.lname}
                                            <span style='font-size:10px;'>
                                                ${result.user.username}
                                            </span>
                                        </div>
                                    </div>
                                    <div class='d-flex align-items-center justify-content-center searchAddFriend me-1'>
                                        <div class="dropdown">
                                            <div class="dropdown-toggle d-flex justify-content-center align-items-center rounded-pill optionsSvg" data-bs-toggle="dropdown">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24"><path fill="#d8e1e7" d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0m0-6a2 2 0 1 0 4 0a2 2 0 0 0-4 0m0 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0"/></svg>
                                            </div>
    
                                            <ul class="dropdown-menu">
                                                <li>
                                                    <div class="dropdown-item makeAdmin">Promote as admin</div>
                                                </li>
                                                <li>
                                                    <div class="dropdown-item kickUser" style="color: rgb(219, 69, 69);">Kick user</div>
                                                </li>
                                            </ul>
                    
                                        </div>
                                    </div>
                                </div>
                            `);
                        } else if (rolesObject[result.user._id] == 'admin' && result.user._id != userDetails._id) {
                            $('#groupDetails .addMembers').append(`
                                <div class='d-flex searchBlocks align-items-center justify-content-between ps-1'>
                                    <div class='d-flex align-items-center userProfile'>
                                        <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                            <img src="data:image/jpeg;base64,${result.profile}" alt="Profile" height='47px' width='47px'>
                                        </div>
                                        <div class='result-item d-flex flex-column' data-name='${result.user.fname} ${result.user.lname}' data-id='${result.user._id}'>
                                            ${result.user.fname} ${result.user.lname}
                                            <span style='font-size:10px;'>
                                            ${result.user.username}
                                            <span style='font-size:10px; font-weight:bold;' class='text-success'>&nbsp;
                                                    (Admin) 
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                    <div class='d-flex align-items-center justify-content-center searchAddFriend me-1'>
                                        <div class="dropdown">
                                            <div class="dropdown-toggle d-flex justify-content-center align-items-center rounded-pill optionsSvg" data-bs-toggle="dropdown">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24"><path fill="#d8e1e7" d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0m0-6a2 2 0 1 0 4 0a2 2 0 0 0-4 0m0 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0"/></svg>
                                            </div>
    
                                            <ul class="dropdown-menu">
                                                <li>
                                                    <div class="dropdown-item makeMember">Demote as member</div>
                                                </li>
                                                <li>
                                                    <div class="dropdown-item kickUser" style="color: rgb(219, 69, 69);">Kick user</div>
                                                </li>
                                            </ul>
                    
                                        </div>
                                    </div>
                                </div>
                            `);
                        } else {
                            $('#groupDetails .addMembers').append(`
                                <div class='d-flex searchBlocks align-items-center justify-content-between ps-1'>
                                    <div class='d-flex align-items-center userProfile'>
                                        <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                            <img src="data:image/jpeg;base64,${result.profile}" alt="Profile" height='47px' width='47px'>
                                        </div>
                                        <div class='result-item d-flex flex-column' data-name='${result.user.fname} ${result.user.lname}' data-id='${result.user._id}'>
                                            ${result.user.fname} ${result.user.lname}
                                            <span style='font-size:10px;'>
                                                ${result.user.username}
                                                <span style='font-size:10px; font-weight:bold;' class='text-success'>&nbsp;
                                                    (Admin) 
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `);
                        }
                    }
    
                    $('#groupDetails .userProfile').off('click').on('click', async event => {
                        let userId = $(event.target).closest('.userProfile').find('.result-item').data('id');
                        if (userId == userDetails._id) {
                            window.location.href = '/myProfile';
                        } else {
                            window.location.href = `/userProfile?user=${userId}`;
                        }
                    });
    
                    $('.makeAdmin').off('click').on('click', async event => {
                        let userID = $(event.target).closest('.searchBlocks').find('.result-item').data('id');
                        const makeAdminRes = await fetch('/makeAdmin', {
                            method: 'POST', 
                            headers: {
                                'content-type': 'application/json'
                            }, 
                            body: JSON.stringify({ user: userID, convo: convoDetails._id })
                        });
    
                        if (makeAdminRes.ok) {
                            $('.addMembers').find(`.result-item[data-id='${userID}'] > span`).append(`<span style='font-size:10px; font-weight:bold;' class='text-success'>&nbsp;
                                (Admin) 
                            </span>`);
                            $('.addMembers').find(`.result-item[data-id='${userID}']`).closest('.searchBlocks').find('.searchAddFriend').html(`<div class="dropdown">
                                <div class="dropdown-toggle d-flex justify-content-center align-items-center rounded-pill optionsSvg" data-bs-toggle="dropdown">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24"><path fill="#d8e1e7" d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0m0-6a2 2 0 1 0 4 0a2 2 0 0 0-4 0m0 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0"/></svg>
                                </div>
    
                                <ul class="dropdown-menu">
                                    <li>
                                        <div class="dropdown-item makeMember">Demote as member</div>
                                    </li>
                                    <li>
                                        <div class="dropdown-item kickUser" style="color: rgb(219, 69, 69);">Kick user</div>
                                    </li>
                                </ul>
    
                            </div>`);
                        } else {
                            alert('User is too dumb to become an admin (error occured).');
                        }
                    });
    
                    $('.makeMember').off('click').on('click', async event => {
                        let userID = $(event.target).closest('.searchBlocks').find('.result-item').data('id');
                        const removeAdminRes = await fetch('/removeAdmin', {
                            method: 'POST', 
                            headers: {
                                'content-type': 'application/json'
                            }, 
                            body: JSON.stringify({ user: userID, convo: convoDetails._id })
                        });
    
                        if (removeAdminRes.ok) {
                            $('.addMembers').find(`.result-item[data-id='${userID}'] .text-success`).remove();
                            $('.addMembers').find(`.result-item[data-id='${userID}']`).closest('.searchBlocks').find('.searchAddFriend').html(`<div class="dropdown">
                                <div class="dropdown-toggle d-flex justify-content-center align-items-center rounded-pill optionsSvg" data-bs-toggle="dropdown">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24"><path fill="#d8e1e7" d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0m0-6a2 2 0 1 0 4 0a2 2 0 0 0-4 0m0 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0"/></svg>
                                </div>
    
                                <ul class="dropdown-menu">
                                    <li>
                                        <div class="dropdown-item makeAdmin">Promote as admin</div>
                                    </li>
                                    <li>
                                        <div class="dropdown-item kickUser" style="color: rgb(219, 69, 69);">Kick user</div>
                                    </li>
                                </ul>
    
                            </div>`);
                            
                        } else {
                            alert('User is too elite to become a member (error occured).');
                        }
                    });
    
                    $('.kickUser').off('click').on('click', async event => {
                        let userID = $(event.target).closest('.searchBlocks').find('.result-item').data('id');
                        const kickUserRes = await fetch('/kickUser', {
                            method: 'POST', 
                            headers: {
                                'content-type': 'application/json'
                            }, 
                            body: JSON.stringify({ user: userID, convo: convoDetails._id })
                        });
    
                        if (kickUserRes.ok) {
                            $('.addMembers').find(`.result-item[data-id='${userID}']`).closest('.searchBlocks').remove();
                        } else {
                            alert('User is too good to be removed (error occured).');
                        }
                    });
    
                    $('.editGroup').off('click').on('click', async event => {
                        $('#createGroup').data('edit', true);
                        $('.sideNavGroup').trigger('click');  
                    });

                    $('.exitGroup').off('click').on('click', async event => {
                        const kickUserRes = await fetch('/kickUser', {
                            method: 'POST', 
                            headers: {
                                'content-type': 'application/json'
                            }, 
                            body: JSON.stringify({ user: userDetails._id, convo: convoDetails._id })
                        });
    
                        if (kickUserRes.ok) {
                            window.location.href = '/chatAppHome';
                        } else {
                            alert('Dont quit TwT (error occured).');
                        }
                    });
                        
                });
            });
    
            conversationID = convoDetails._id;
        } else {
            window.location.href = '/chatAppHome';
        }
    }

    let lastdate;
    if ($('#messages').find('#checkpoint').length == 0) {
        lastdate = new Date();

    } else {
        lastdate = $('#checkpoint').data('lastdate');
    }
    
    let loadMessagesOnScroll = async (convo, user, chatType, socket) => {
        
        if ($('#messages').find('#checkpoint').length == 0) {
            lastdate = new Date();
        } else {
            lastdate = $('#checkpoint').data('lastdate');
        }
        const targetElement = $('#checkpoint');
        const targetPosition = targetElement.offset().top;

        if ($('#chatSection').scrollTop() <= targetPosition) {
            const convoHistoryRes = await fetch('/getConversationHistory', {
                method: 'POST', 
                headers: { 'content-type': 'application/json' }, 
                body: JSON.stringify({ convo: convo, requestedBy: user._id, lastdate: lastdate })
            });
            if (convoHistoryRes.status == 200) {
                let convoHistory = await convoHistoryRes.json();

                $('#messages').hide();
                $('.loaderContainer').show();
                
                await appendMessages(convoHistory, user, chatType, socket);

                const scrollPosition = $('#lastCheckpoint').offset().top - $('#chatSection').offset().top + $('#chatSection').scrollTop();

                $('#chatSection').animate({ scrollTop: scrollPosition }, 0);
        
            } else if (convoHistoryRes.status == 204) {
                $('#chatSection').off('scroll');
            }
        }

    }

    let isFetching = false;
    $('#chatSection').on('scroll', async () => {
        const targetElement = $('#checkpoint');
        if (targetElement.length === 0 || isFetching) {
            return;
        }

        const targetPosition = targetElement.offset().top;
        const container = $('#chatSection');

        if (container.scrollTop() <= targetPosition) {
            isFetching = true; 
            loadMessagesOnScroll(conversationID, userDetails, chatType, socket)
            .then(() => {
                isFetching = false;
            })
            .catch((error) => {
                console.error('Error fetching messages:', error);
                isFetching = false; 
            });
        }
    });

    const convoHistoryRes = await fetch('/getConversationHistory', {
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({ convo: conversationID, requestedBy: userDetails._id, lastdate: lastdate })
    });

    if (convoHistoryRes.status == 200) {
        let convoHistory = await convoHistoryRes.json();
        await appendMessages(convoHistory, userDetails, chatType, socket);
        const scrollPosition = $('#lastCheckpoint').offset().top - $('#chatSection').offset().top + $('#chatSection').scrollTop();

        $('#chatSection').animate({ scrollTop: scrollPosition }, 0);

    } else if (convoHistoryRes.status == 204) {
        $('#messages').html('<div class="freshConvo">This is the beginning of your Conversation!</div>');
        $('#messages').show();
        $('.loaderContainer').hide();
    }
    
    $('#chatMessage').on('submit', event => {
        event.preventDefault();
        if (!($('#chatMessage').data('edit'))) {
            let msgRecievers = {};
    
            if (convoDetails.private == true){
                for (let i in convoDetails.participants) {
                    if (convoDetails.participants[i] == userDetails._id) {
                        msgRecievers[convoDetails.participants[i]] = true;
                    } else {
                        msgRecievers[convoDetails.participants[i]] = false;
                    }
                }
            } else {
                let membersList = convoDetails.participants;
        
                const keysArray = membersList.map(obj => Object.keys(obj)[0]);
    
                for (let i in keysArray) {
                    if (keysArray[i] == userDetails._id) {
                        msgRecievers[keysArray[i]] = true;
                    } else {
                        msgRecievers[keysArray[i]] = false;
                    }
                }
            }
            if ($('#input').val().trim() != '') {
                socket.emit('chat message', { from: userDetails._id, message: $('#input').val(), convoID: conversationID, to: msgRecievers, username: userDetails.username });
            }
        } else {
            if ($('#input').val().trim() != '') {
                socket.emit('message edit', { msgid: $('#chatMessage').data('edit'), message: $('#input').val() });
            }
        }
        
        $('#input').val('');
    });

    socket.emit('joined the conversation', conversationID);

    socket.on('chat message', async data => {
        
        const isCurrentUser = data.sender == socket.id;
        let currentDate;
        dateObj = new Date(data.date);
        const messageDate = dateObj.toISOString().split('T')[0];
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');

        if ($('#messages').find('.freshConvo').length > 0) {
            $('#messages').html('');
        }

        if (messageDate !== currentDate) {
            if ($(`#messages li[data-date='${messageDate}']`).length == 0) {
                $('#messages').append(`
                    <li data-date='${messageDate}'>
                        <div class='d-flex justify-content-center'>
                            ${messageDate}
                        </div>
                    </li>
                `);
                currentDate = messageDate;
            }
        }

        if (chatType == 'true') {
            if (!isCurrentUser) {
                socket.emit('message seen', { user: userDetails._id, msgID: data.msgID });
                $('#messages').append(`
                    <li data-msgID='${data.msgID}' class="generalMessage">
                        <div class="d-flex w-100 justify-content-start">
                            <div class="d-flex flex-column">
                                <div class="d-flex">
                                    <div class="dropdown">

                                        <div class="dropdown-toggle messageActionMenu" data-bs-toggle="dropdown"></div>
                                        
                                        <ul class="dropdown-menu">
                                            <li><div class="dropdown-item deleteForMe" style="color: rgb(245, 133, 133);">Delete for me</div></li>
                                        </ul>
                
                                    </div>

                                    <div class="d-flex bg-secondary px-3 py-2 align-items-center messageContent">
                                        ${data.text}
                                    </div>
                                </div>
                                <div class="msgSender">
                                    ${hours}:${minutes}
                                </div>
                            </div>
                            
                        </div>
                    </li>
                `);

            } else {
                myMessageFromSocket(data, hours, minutes);
            }
        } else {
            if (!isCurrentUser) {
                socket.emit('message seen', { user: userDetails._id, msgID: data.msgID });
                $('#messages').append(`
                    <li data-msgID='${data.msgID}' class="generalMessage">
                        <div class="d-flex w-100 justify-content-start">
                            <div class="d-flex flex-column">
                                <div class="d-flex">
                                    <div class="dropdown">

                                        <div class="dropdown-toggle messageActionMenu" data-bs-toggle="dropdown"></div>
                                        
                                        <ul class="dropdown-menu">
                                            <li><div class="dropdown-item deleteForMe" style="color: rgb(245, 133, 133);">Delete for me</div></li>
                                        </ul>
                
                                    </div>

                                    <div class="d-flex bg-secondary px-3 py-2 align-items-center messageContent">
                                        ${data.text}
                                    </div>
                                </div>
                                <div class="msgSender">
                                    ${hours}:${minutes} &bull; <span>${data.username}</span>
                                </div>
                            </div>
                            
                        </div>
                    </li>
                `);

            } else {
                myMessageFromSocket(data, hours, minutes);
            }
        }

        $('.generalMessage').off('contextmenu').on('contextmenu', async (event) => {
            event.preventDefault();
            const elementWidth = $(event.target).closest('.generalMessage').find('.messageContent')[0].offsetWidth;

            if ($(event.target).closest('.generalMessage > .justify-content-end').length > 0) {
                $(event.target).closest('.generalMessage').find('.dropdown').css({
                    right: `calc(${elementWidth}px + 5px)`
                });
            } else {
                $(event.target).closest('.generalMessage').find('.dropdown').css({
                    left: `calc(${elementWidth}px + 5px)`
                });
            }

            $(event.target).closest('.generalMessage').find('.messageActionMenu').trigger('click');
        });

        $('.deleteForMe').off('click').on('click', async event => {
            let id = $(event.target).closest('.generalMessage').data('msgid');
            
            const deleteForMeReq = await fetch('/deleteForMe', {
                method: 'POST', 
                headers: {
                    'content-type': 'application/json', 
                }, 
                body: JSON.stringify({ user: userDetails._id, message: id })
            });
    
            if (deleteForMeReq.ok) {
                $('#messages').find(`li[data-msgid='${id}']`).remove();
            } else {
                alert('Message is too good to be deleted (error occured).');
            }
        });
    
        $('.deleteForEveryone').off('click').on('click', async event => {
            let id = $(event.target).closest('.generalMessage').data('msgid');
            
            const deleteForMeReq = await fetch('/deleteForEveryone', {
                method: 'POST', 
                headers: {
                    'content-type': 'text/plain', 
                }, 
                body: JSON.stringify({ user: userDetails._id, message: id })
            });
    
            if (deleteForMeReq.ok) {
                socket.emit('message deleted', { msgid: id, user: userDetails._id });

            } else {
                alert('Message is too good to be deleted (error occured).');
            }
        });

        $('.editMessage').off('click').on('click', async event => {
            let id = $(event.target).closest('.generalMessage').data('msgid');
            $('.editingAlert').show();
            $('#chatMessage').data('edit', id);
            $('#input').val($(event.target).closest('.generalMessage').find('.messageContent').text().trim());
            $('#input').trigger('focus');

            $('.cancelEditing').off('click').on('click', () => {
                $('.editingAlert').hide();
                $('#chatMessage').data('edit', null);
                $('#input').val('');
            });
        });

        $('#chatSection').animate({ scrollTop: $('#chatSection')[0].scrollHeight }, 0, 'swing');
    });

    socket.on('message seen', data => {
        
        if (readByAll(data.read) == true) {
            $(`#messages li[data-msgID='${data.id}']`).find('.msgStatus').text('seen');

        } else {
            $(`#messages li[data-msgID='${data.id}']`).find('.msgStatus').text('recieved');
        }
    });

    socket.on('message deleted', data => {
        if (data.user == userDetails._id) {
            $('#messages').find(`li[data-msgid='${data.msgid}']`).find('.editMessage').remove();
            $('#messages').find(`li[data-msgid='${data.msgid}']`).find('.deleteForEveryone').remove();
        }
        $('#messages').find(`li[data-msgid='${data.msgid}']`).find('.messageContent').text('Message has been deleted.');
        $('#messages').find(`li[data-msgid='${data.msgid}']`).find('.messageContent').css({
            fontStyle: 'italic',
            color: 'rgb(190, 193, 195)'
        });
    });

    socket.on('message edit', data => {
        $('.editingAlert').hide();
        $('#chatMessage').data('edit', '');

        if ($(`.generalMessage[data-msgid='${data.msgid}']`).find('.msgSender').find('.msgEdited').length == 0) {
            if ($(`.generalMessage[data-msgid='${data.msgid}'] > .justify-content-end`).length > 0) {
                $(`.generalMessage[data-msgid='${data.msgid}']`).find('.msgSender').append(`
                     &bull; <span class='msgEdited' style='color: #83cfcc'>edited</span>
                `);
            } else {
                $(`.generalMessage[data-msgid='${data.msgid}']`).find('.msgSender').prepend(`
                    <span class='msgEdited' style='color: #83cfcc'>edited</span> &bull; 
                `);
            }
        }

        $(`.generalMessage[data-msgid='${data.msgid}']`).find('.messageContent').text(data.message);
        
    });

    let timeout;
    let x = $('.chatNav').find('.result-item > span').text();
    socket.on('typing', data => {
        if (data.convo == conversationID && data.user !== userDetails._id) {
            $('.chatNav').find('.result-item > span').text(`${data.fname} is typing...`);
            
            if (timeout) {
                clearTimeout(timeout);
            }

            timeout = setTimeout(() => {
                $('.chatNav').find('.result-item > span').text(x);
                if (data.type == 'true') {
                    $('.sidenav').find(`.result-item[data-id='${data.user}']`).find('small').text(data.username);
                } else {
                    $('.sidenav').find(`.result-item[data-id='${data.convo}']`).find('small').text('Group');
                }
            }, 1000);
        }
        
    });

    $('#clearChatConfirm').off('click').on('click', async () => {

        const clearChatRes = await fetch('/clearChat', {
            method: 'DELETE', 
            headers: {
                'content-type': 'application/json'
            }, 
            body: JSON.stringify({ user: userDetails._id, convo: conversationID })
        });

        if (clearChatRes.ok) {
            $('#messages').html('');
            $('.btn-close').trigger('click');
        } else {
            alert('Too sussy messages, can\'t delete (error occured).');
        }

    });

    
    let userParam = urlParams.get('user');
    $('#input').on('input', async () => {
        socket.emit('typing', { user: userDetails._id, convo: conversationID, fname: userDetails.fname, username: userDetails.username, type: chatType, to: userParam });
    });

});

let readByAll = (data) => {
    for (let i in data) {
        if (data[i] == false) {
            return false;
        }
    }
    return true;
}

let otherUser = (data) => {
    for (let i in data) {
        if (data[i] == false) {
            return i;
        }
    }
}

const myMessageAppend = (data, hours, minutes) => {
    let x;
    if (data.read[otherUser(data.read)] == false) {
        x = 'recieved';
    } else {
        x = 'seen';
    }

    $('#messages').prepend(`
        <li data-msgID='${data._id}' class="generalMessage">
            <div class="d-flex w-100 justify-content-end">
                <div class="d-flex flex-column align-items-end">
                    <div class="d-flex">
                        <div class="d-flex bg-primary px-3 py-2 align-items-center messageContent">
                            ${data.content}
                        </div>

                        <div class="dropdown">

                            <div class="dropdown-toggle messageActionMenu" data-bs-toggle="dropdown"></div>
                            
                            <ul class="dropdown-menu">
                                <li><div class="dropdown-item editMessage">Edit Message</div></li>
                                <li><div class="dropdown-item deleteForMe" style="color: rgb(245, 133, 133);">Delete for me</div></li>
                                <li><div class="dropdown-item deleteForEveryone" style="color: rgb(219, 69, 69);">Delete for everyone</div></li>
                            </ul>
                        </div>
                    </div>
                    <div class="msgSender">
                        <span class='msgStatus'>${x}</span> &bull; ${hours}:${minutes}
                    </div>
                </div>
                
            </div>
        </li>
    `);

    if (data.edited == true) {
        $(`.generalMessage[data-msgid='${data._id}']`).find('.msgSender').append(`
                &bull; <span class='msgEdited' style='color: #83cfcc'>edited</span>
        `);
    }
}

const myMessageFromSocket = (data, hours, minutes) => {
    
    $('#messages').append(`
        <li data-msgID='${data.msgID}' class="generalMessage">
            <div class="d-flex w-100 justify-content-end">
                <div class="d-flex flex-column align-items-end">
                    <div class="d-flex">
                        <div class="d-flex bg-primary px-3 py-2 align-items-center messageContent">
                            ${data.text}
                        </div>

                        <div class="dropdown">

                            <div class="dropdown-toggle messageActionMenu" data-bs-toggle="dropdown"></div>
                            
                            <ul class="dropdown-menu">
                                <li><div class="dropdown-item editMessage">Edit Message</div></li>
                                <li><div class="dropdown-item deleteForMe" style="color: rgb(245, 133, 133);">Delete for me</div></li>
                                <li><div class="dropdown-item deleteForEveryone" style="color: rgb(219, 69, 69);">Delete for everyone</div></li>
                            </ul>
                        </div>
                    </div>
                    <div class="msgSender">
                        <span class='msgStatus'>recieved</span> &bull; ${hours}:${minutes}
                    </div>
                </div>
                
            </div>
        </li>
    `);
}

const YourMessageInPrivate = (id, content, hours, minutes) => {
    $('#messages').prepend(`
        <li data-msgID='${id}' class="generalMessage">
            <div class="d-flex w-100 justify-content-start">
                <div class="d-flex flex-column">
                    <div class="d-flex">
                        <div class="dropdown">

                            <div class="dropdown-toggle messageActionMenu" data-bs-toggle="dropdown"></div>
                            
                            <ul class="dropdown-menu">
                                <li><div class="dropdown-item deleteForMe" style="color: rgb(245, 133, 133);">Delete for me</div></li>
                            </ul>
    
                        </div>

                        <div class="d-flex bg-secondary px-3 py-2 align-items-center messageContent">
                            ${content}
                        </div>
                    </div>
                    <div class="msgSender">
                        ${hours}:${minutes}
                    </div>
                </div>
                
            </div>
        </li>
    `);
}

const yourMessageInGroup = (id, content, hours, minutes, username) => {
    $('#messages').prepend(`
        <li data-msgID='${id}' class="generalMessage">
            <div class="d-flex w-100 justify-content-start">
                <div class="d-flex flex-column">
                    <div class="d-flex">
                        <div class="dropdown">

                            <div class="dropdown-toggle messageActionMenu" data-bs-toggle="dropdown"></div>
                            
                            <ul class="dropdown-menu">
                                <li><div class="dropdown-item deleteForMe" style="color: rgb(245, 133, 133);">Delete for me</div></li>
                            </ul>
    
                        </div>

                        <div class="d-flex bg-secondary px-3 py-2 align-items-center messageContent">
                            ${content}
                        </div>
                    </div>
                    <div class="msgSender">
                        ${hours}:${minutes} &bull; <span>${username}</span>
                    </div>
                </div>
                
            </div>
        </li>
    `);
}

const myDeletedMessage = (id, hours, minutes) => {
    $('#messages').prepend(`
        <li data-msgID='${id}' class="generalMessage">
            <div class="d-flex w-100 justify-content-end">
                <div class="d-flex flex-column align-items-end">
                    <div class="d-flex">
                        <div class="d-flex bg-primary px-3 py-2 align-items-center messageContent" style='font-style: italic; color: rgb(190, 193, 195)'>
                            Message has been deleted.
                        </div>

                        <div class="dropdown">

                            <div class="dropdown-toggle messageActionMenu" data-bs-toggle="dropdown"></div>
                            
                            <ul class="dropdown-menu">
                                <li><div class="dropdown-item deleteForMe" style="color: rgb(245, 133, 133);">Delete for me</div></li>
                            </ul>
                        </div>
                    </div>
                    <div class="msgSender">
                        <span class=''></span>${hours}:${minutes}
                    </div>
                </div>
            </div>
        </li>
    `);
}

let appendMessages = async (convoHistory, userDetails, chatType, socket) => {

    $('#messages').hide();
    $('.loaderContainer').show();
    
    if ($('#checkpoint').length > 0) {
        $('#checkpoint').data('lastdate', '');
        $('#checkpoint').removeAttr('id');
    }
    if ($('.loaderContainer').length > 0) {
        $('#lastCheckpoint').removeAttr('id');
    }

    if (chatType == 'true') {
        let currentDate = new Date(convoHistory[0].date).toISOString().split('T')[0];
        for (let i in convoHistory) {
            dateObj = new Date(convoHistory[i].date);
            const messageDate = dateObj.toISOString().split('T')[0];
            const hours = dateObj.getHours().toString().padStart(2, '0');
            const minutes = dateObj.getMinutes().toString().padStart(2, '0');

            if (messageDate !== currentDate) {
                if ($(`#messages li[data-date='${currentDate}']`).length == 0) {
                    $('#messages').prepend(`
                        <li data-date='${currentDate}'>
                            <div class='d-flex justify-content-center'>
                                ${currentDate}
                            </div>
                        </li>
                    `);
                }
                currentDate = messageDate;
            }

            if (convoHistory[i].deleted_for[0] == 'everyone') {
                if (convoHistory[i].deleted_for.indexOf(userDetails._id) == -1) {
                    if (convoHistory[i].sender == userDetails._id) {
                        myDeletedMessage(convoHistory[i]._id, hours, minutes);

                    } else {
                        $('#messages').prepend(`
                            <li data-msgID='${convoHistory[i]._id}' class="generalMessage">
                                <div class="d-flex w-100 justify-content-start">
                                    <div class="d-flex flex-column">
                                        <div class="d-flex">
                                            <div class="dropdown">
    
                                                <div class="dropdown-toggle messageActionMenu" data-bs-toggle="dropdown"></div>
                                                
                                                <ul class="dropdown-menu">
                                                    <li><div class="dropdown-item deleteForMe" style="color: rgb(245, 133, 133);">Delete for me</div></li>
                                                </ul>
                        
                                            </div>
    
                                            <div class="d-flex bg-secondary px-3 py-2 align-items-center messageContent" style='font-style: italic; color: rgb(190, 193, 195)'>
                                                Message has been deleted.
                                            </div>
                                        </div>
                                        <div class="msgSender">
                                            ${hours}:${minutes}
                                        </div>
                                    </div>
                                    
                                </div>
                            </li>
                        `);
                    }
                }
            } else {
                if (convoHistory[i].deleted_for.indexOf(userDetails._id) == -1) {
                    if (convoHistory[i].sender == userDetails._id) {
                        myMessageAppend(convoHistory[i], hours, minutes);
                    } else {
                        socket.emit('message seen', { user: userDetails._id, msgID: convoHistory[i]._id });
                        YourMessageInPrivate(convoHistory[i]._id, convoHistory[i].content, hours, minutes);

                        if (convoHistory[i].edited == true) {
                            $(`.generalMessage[data-msgid='${convoHistory[i]._id}']`).find('.msgSender').prepend(`
                                <span class='msgEdited' style='color: #83cfcc'>edited</span> &bull; 
                            `);
                        }
                    }
                }
            }

        }
        let z = new Date(convoHistory[convoHistory.length - 1].date).toISOString().split('T')[0];

        if ($(`#messages li[data-date='${z}']`).length > 0) {
            $(`#messages li[data-date='${z}']`).remove();
        } 
        $('#messages').prepend(`
            <li data-date='${z}'>
                <div class='d-flex justify-content-center'>
                    ${z}
                </div>
            </li>
        `); 

    } else {
        let currentDate = new Date(convoHistory[0].date).toISOString().split('T')[0];
        for (let i in convoHistory) {
            dateObj = new Date(convoHistory[i].date);
            const messageDate = dateObj.toISOString().split('T')[0];
            const hours = dateObj.getHours().toString().padStart(2, '0');
            const minutes = dateObj.getMinutes().toString().padStart(2, '0');

            if (messageDate !== currentDate) {
                if ($(`#messages li[data-date='${currentDate}']`).length == 0) {
                    $('#messages').prepend(`
                        <li data-date='${currentDate}'>
                            <div class='d-flex justify-content-center'>
                                ${currentDate}
                            </div>
                        </li>
                    `);
                }
                currentDate = messageDate;
            }

            if (convoHistory[i].deleted_for[0] == 'everyone') {
                if (convoHistory[i].deleted_for.indexOf(userDetails._id) == -1) {
                    if (convoHistory[i].sender == userDetails._id) {
                        myDeletedMessage(convoHistory[i]._id, hours, minutes);

                    } else {

                        $('#messages').prepend(`
                            <li data-msgID='${convoHistory[i]._id}' class="generalMessage">
                                <div class="d-flex w-100 justify-content-start">
                                    <div class="d-flex flex-column">
                                        <div class="d-flex">
                                            <div class="dropdown">
    
                                                <div class="dropdown-toggle messageActionMenu" data-bs-toggle="dropdown"></div>
                                                
                                                <ul class="dropdown-menu">
                                                    <li><div class="dropdown-item deleteForMe" style="color: rgb(245, 133, 133);">Delete for me</div></li>
                                                </ul>
                        
                                            </div>
    
                                            <div class="d-flex bg-secondary px-3 py-2 align-items-center messageContent" style='font-style: italic; color: rgb(190, 193, 195)'>
                                                Message has been deleted.
                                            </div>
                                        </div>
                                        <div class="msgSender">
                                            ${hours}:${minutes} &bull; <span>${convoHistory[i].sender_username}</span>
                                        </div>
                                    </div>
                                    
                                </div>
                            </li>
                        `);
                    }
                }
            } else {
                if (convoHistory[i].deleted_for.indexOf(userDetails._id) == -1) {
                    if (convoHistory[i].sender == userDetails._id) {
                        myMessageAppend(convoHistory[i], hours, minutes);

                    } else {
                        socket.emit('message seen', { user: userDetails._id, msgID: convoHistory[i]._id });
                        yourMessageInGroup(convoHistory[i]._id, convoHistory[i].content, hours, minutes, convoHistory[i].sender_username);

                        if (convoHistory[i].edited == true) {
                            $(`.generalMessage[data-msgid='${convoHistory[i]._id}']`).find('.msgSender').prepend(`
                                <span class='msgEdited' style='color: #83cfcc'>edited</span> &bull; 
                            `);
                        }
                    }
                }
            }

        }

        let z = new Date(convoHistory[convoHistory.length - 1].date).toISOString().split('T')[0];

        if ($(`#messages li[data-date='${z}']`).length > 0) {
            $(`#messages li[data-date='${z}']`).remove();
        } 
        $('#messages').prepend(`
            <li data-date='${z}'>
                <div class='d-flex justify-content-center'>
                    ${z}
                </div>
            </li>
        `);
    }

    if (convoHistory.length == 20) {
        $('#messages').find(`.generalMessage[data-msgid='${convoHistory[convoHistory.length - 1]._id}']`).attr('id', 'checkpoint');
    }
    $('#messages').find(`.generalMessage[data-msgid='${convoHistory[0]._id}']`).attr('id', 'lastCheckpoint');
    $('#messages').find(`.generalMessage[data-msgid='${convoHistory[convoHistory.length - 1]._id}']`).data('lastdate', convoHistory[convoHistory.length - 1].date);


    $('.generalMessage').off('contextmenu').on('contextmenu', async (event) => {
        event.preventDefault();
        const elementWidth = $(event.target).closest('.generalMessage').find('.messageContent')[0].offsetWidth;

        if ($(event.target).closest('.generalMessage > .justify-content-end').length > 0) {
            $(event.target).closest('.generalMessage').find('.dropdown').css({
                right: `calc(${elementWidth}px + 5px)`
            });
        } else {
            $(event.target).closest('.generalMessage').find('.dropdown').css({
                left: `calc(${elementWidth}px + 5px)`
            });
        }

        $(event.target).closest('.generalMessage').find('.messageActionMenu').trigger('click');
    });

    $('.deleteForMe').off('click').on('click', async event => {
        let id = $(event.target).closest('.generalMessage').data('msgid');
        
        const deleteForMeReq = await fetch('/deleteForMe', {
            method: 'POST', 
            headers: {
                'content-type': 'application/json', 
            }, 
            body: JSON.stringify({ user: userDetails._id, message: id })
        });

        if (deleteForMeReq.ok) {
            $('#messages').find(`li[data-msgid='${id}']`).remove();
        } else {
            alert('Message is too good to be deleted (error occured).');
        }
    });

    $('.deleteForEveryone').off('click').on('click', async event => {
        let id = $(event.target).closest('.generalMessage').data('msgid');
        
        const deleteForMeReq = await fetch('/deleteForEveryone', {
            method: 'POST', 
            headers: {
                'content-type': 'text/plain', 
            }, 
            body: JSON.stringify({ user: userDetails._id, message: id })
        });

        if (deleteForMeReq.ok) {
            socket.emit('message deleted', { msgid: id, user: userDetails._id });

        } else {
            alert('Message is too good to be deleted (error occured).');
        }
    });

    $('.editMessage').off('click').on('click', async event => {
        let id = $(event.target).closest('.generalMessage').data('msgid');
        $('.editingAlert').show();
        $('#chatMessage').data('edit', id);
        $('#input').val($(event.target).closest('.generalMessage').find('.messageContent').text().trim());
        $('#input').trigger('focus');

        $('.cancelEditing').off('click').on('click', () => {
            $('.editingAlert').hide();
            $('#chatMessage').data('edit', null);
            $('#input').val('');
        });
    });
    
    $('#messages').show();
    $('.loaderContainer').hide();
    
}