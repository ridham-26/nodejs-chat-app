$(document).ready(async () => {
    const response = await fetch('/chatappLogin');
    let userDetails;
    let counter = 0;

    $('.requestsPanel').hide();
    $('.requestsIndicator').hide();

    $('.friendRequests').on('click', () => {
        $('.requestsPanel').fadeToggle(100);
    });
    
    if (response.ok) {
        userDetails = await response.json();
        const imgSrc = `data:image/jpeg;base64,${userDetails.profile}`;
        $('#selfProfile > img').attr('src', imgSrc);
        $('#selfProfile > img').data('id', userDetails.details._id);
        
        let friendsList = userDetails.details.friends;
        if (friendsList) {
            Object.keys(friendsList).forEach(async key => {
                const value = friendsList[key];
                if (!value) {
                    counter++;
                    let user = await fetch('/getUserDetails', {
                        method: 'POST', 
                        headers: {'content-type': 'text/plain'}, 
                        body: key
                    });
                    let reqUser = await user.json();
                    $('nav .requestsPanel').append(`
                        <li>
                            <div class='d-flex requests align-items-center ps-1  justify-content-between'>
                                <div class="d-flex align-items-center reqProfile">
                                    <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                        <img src="data:image/jpeg;base64,${reqUser.profile}" alt="Profile" height='47px' width='47px'>
                                    </div>
                                    <div class='result-item d-flex flex-column' data-id='${reqUser.user._id}'>
                                        ${reqUser.user.fname} ${reqUser.user.lname}
                                        <small style='font-size:10px;'>
                                            ${reqUser.user.username}
                                        </small>
                                    </div>
                                </div>
                                <div class="justify-self-end">
                                    <button class="btn btn-success btn-sm rounded-pill me-1 acceptReq" data-id='${reqUser.user._id}'>Accept</button>
                                    <button class="btn btn-danger btn-sm rounded-pill me-1 deleteReq" data-id='${reqUser.user._id}'>Delete</button>
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
                                body: JSON.stringify({ p1: userDetails.details._id, p2: deleteReq })
                            });
                            
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
                                body: JSON.stringify({ p1: userDetails.details._id, p2: acceptReq })
                            });
    
                            if (acceptRes.ok) {
                                $(event.target).closest('li').remove();
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
            });
        }
        reqCounter(counter);
        
    } else {
        window.location.href = '/chatLogin';
    }

    $('#logout').on('click', async () => {
        
        const logoutres = await fetch('/logout', {
            method: 'DELETE', 
            headers: {'content-type': 'text/plain'}, 
            body: userDetails.details._id
        });

        if (logoutres.ok) {
            window.location.href = '/chatLogin';
        }

    });

    $('#edit').on('click', () => {
        window.location.href = '/myProfile';
    });

});
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