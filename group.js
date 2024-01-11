$(document).ready(async () => {
    const response = await fetch('/chatappLogin');

    let userDetails = (await response.json()).details;

    let friendsList = userDetails.friends;
    let friendsArr;

    if (friendsList) {
        friendsArr = await Promise.all(
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
    }

    $('.sideNavGroup').on('click', async () => {
        if ($('#createGroup').data('edit') != true) {
            if (friendsList) {
    
                $('.addMembers').html('');
                $('#createGroup .modal-title').text('Add Members (more than 2)');
                $('#createGroup .modal-footer button').text('Create');
                $('#grpTitle').val('');
        
                friendsArr.forEach(result => {

                    if (result.user.username !== 'undefined') {
                        $('.addMembers').append(`
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
                                <div class='d-flex align-items-center justify-content-center searchAddFriend me-1' data-value='add' data-invite=''>
                                   <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 50 50"><path fill="#d8e1e7" d="M25 42c-9.4 0-17-7.6-17-17S15.6 8 25 8s17 7.6 17 17s-7.6 17-17 17m0-32c-8.3 0-15 6.7-15 15s6.7 15 15 15s15-6.7 15-15s-6.7-15-15-15"/><path fill="#d8e1e7" d="M16 24h18v2H16z"/><path fill="#d8e1e7" d="M24 16h2v18h-2z"/></svg>
                                </div>
                            </div>
                        `);
        
                        $('.addMembers .searchAddFriend').off('click').on('click', (event) => {
                            let x = $(event.target).closest('.searchBlocks').find('.searchAddFriend');
                            if (x.data('value') == 'add') {
                                x.html('<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24"><path fill="#5cc461" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m-2 15l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8z"/></svg>');
                                x.data('value', 'added');
                                x.addClass('added');
                            } else {
                                x.html('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 50 50"><path fill="#d8e1e7" d="M25 42c-9.4 0-17-7.6-17-17S15.6 8 25 8s17 7.6 17 17s-7.6 17-17 17m0-32c-8.3 0-15 6.7-15 15s6.7 15 15 15s15-6.7 15-15s-6.7-15-15-15"/><path fill="#d8e1e7" d="M16 24h18v2H16z"/><path fill="#d8e1e7" d="M24 16h2v18h-2z"/></svg>');
                                x.data('value', 'add');
                                x.removeClass('added');
                            }
                        });
                    }
        
                });
        
            } else {
                $('.addMembers').append('You have 0 friends :( <br><br>You can add friends by searching them!')
            }
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            const groupParam = urlParams.get('group');
        
            const res = await fetch('/getGroupConvoDetails', {
                method: 'POST', 
                headers: { 'content-type': 'text/plain' }, 
                body: groupParam
            });
            let groupDetails = await res.json();
            
            let membersList = groupDetails.participants;

            const keysArray = membersList.map(obj => Object.keys(obj)[0]);

            $('#createGroup .modal-title').text('Edit group');
            $('#createGroup .modal-footer button').text('Done');
            $('#grpTitle').val(groupDetails.id);
            $('.addMembers').html('');

            friendsArr.forEach(result => {

                if (keysArray.indexOf(result.user._id) == -1 && result.user.username !== 'undefined') {
                    $('.addMembers').append(`
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
                            <div class='d-flex align-items-center justify-content-center searchAddFriend me-1' data-value='add' data-invite=''>
                               <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 50 50"><path fill="#d8e1e7" d="M25 42c-9.4 0-17-7.6-17-17S15.6 8 25 8s17 7.6 17 17s-7.6 17-17 17m0-32c-8.3 0-15 6.7-15 15s6.7 15 15 15s15-6.7 15-15s-6.7-15-15-15"/><path fill="#d8e1e7" d="M16 24h18v2H16z"/><path fill="#d8e1e7" d="M24 16h2v18h-2z"/></svg>
                            </div>
                        </div>
                    `);
    
                    $('.addMembers .searchAddFriend').off('click').on('click', (event) => {
                        let x = $(event.target).closest('.searchBlocks').find('.searchAddFriend');
                        if (x.data('value') == 'add') {
                            x.html('<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 24 24"><path fill="#5cc461" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m-2 15l-5-5l1.41-1.41L10 14.17l7.59-7.59L19 8z"/></svg>');
                            x.data('value', 'added');
                            x.addClass('added');
                        } else {
                            x.html('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 50 50"><path fill="#d8e1e7" d="M25 42c-9.4 0-17-7.6-17-17S15.6 8 25 8s17 7.6 17 17s-7.6 17-17 17m0-32c-8.3 0-15 6.7-15 15s6.7 15 15 15s15-6.7 15-15s-6.7-15-15-15"/><path fill="#d8e1e7" d="M16 24h18v2H16z"/><path fill="#d8e1e7" d="M24 16h2v18h-2z"/></svg>');
                            x.data('value', 'add');
                            x.removeClass('added');
                        }
                    });
                }

                if ($('.addMembers').html() == '') {
                    $('.addMembers').html('No friends available to add. Add more friends first.');
                }
                
            });
            $('#createGroup').on('hide.bs.modal',() => {
                $('#createGroup').data('edit', '');
            });
        }

    });

    $('#group-form').on('submit', async event => {
        event.preventDefault();
        
        if ($('#createGroup').data('edit') != true) {
            let dataIds = $('.added').map(function () {
                let id =  $(this).closest('.searchBlocks').find('.result-item').data('id');
                return { [id]: 'member' }
            }).get();
            if (dataIds.length > 1) {
                dataIds.push({ [userDetails._id]: 'admin' });
                const createGroupRes = await fetch('/createGroup', {
                    method: 'POST', 
                    headers: {
                        'content-type': 'application/json'
                    }, 
                    body: JSON.stringify({ participants: dataIds, title: $('#grpTitle').val() })
                });
    
                if (createGroupRes.ok) {
                    $('#formerr').text('');
                    $('.btn-close').toggle('click');
                    $('#group-form').trigger('reset');
                    $('.addMembers .searchAddFriend').removeClass('added');
                    location.reload();
    
                } else {
                    alert('Error while creating group cuz there\'s an imposter amongus!!');
                }
    
            } else {
                $('#formerr').text('Please select more members.');
            }
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            const groupParam = urlParams.get('group');
            let dataIds = $('.added').map(function () {
                let id =  $(this).closest('.searchBlocks').find('.result-item').data('id');
                return { [id]: 'member' }
            }).get();

            const editGroupRes = await fetch('/editGroup', {
                method: 'POST', 
                headers: {
                    'content-type': 'application/json'
                }, 
                body: JSON.stringify({id: groupParam, participants: dataIds, title: $('#grpTitle').val() })
            });

            if (editGroupRes.ok) {
                $('#formerr').text('');
                $('.btn-close').toggle('click');
                $('#group-form').trigger('reset');
                $('.addMembers .searchAddFriend').removeClass('added');
                location.reload();

            } else {
                alert('Error while editing group cuz there\'s an imposter amongus!!');
            }
        }

    });
});