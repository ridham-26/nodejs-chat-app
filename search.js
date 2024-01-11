$(document).ready(async () => {
    const response = await fetch('/chatappLogin');
    let userDetails = (await response.json()).details;

    $('.suggLoader').hide();

    let controller = new AbortController();

    const socket = io('/friendRequest');

    $('#search').on('input', async (event) => {

        $('.suggLoader').show();

        controller.abort();
        controller = new AbortController();

        const query = $(event.target).val().toLowerCase();
        const resultsContainer = $("#search-results");
        resultsContainer.html('');

        if (query.trim() !== "" && query.length > 2) {

            let users = await fetch('/getUsersList', {
                method: 'POST', 
                headers: { 'content-type': 'text/plain' }, 
                body: query, 
                signal: controller.signal
            });
            let matchingResults = await users.json();

            if (matchingResults.length > 0) {
                matchingResults.forEach(result => {
                    if (result.user._id != userDetails._id) {
                        if (!userDetails.friends || !userDetails.friends[result.user._id]) {
                            const resultItem = `
                                <div class='d-flex searchBlocks align-items-center justify-content-between ps-1'>
                                    <div class='d-flex align-items-center userProfile'>
                                        <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                            <img src="data:image/jpeg;base64,${result.profile}" alt="Profile" height='47px' width='47px'>
                                        </div>
                                        <div class='result-item d-flex flex-column' data-name='${result.user.fname} ${result.user.lname}' data-id='${result.user._id}'>
                                            ${result.user.fname} ${result.user.lname}
                                            <small style='font-size:10px;'>
                                                ${result.user.username}
                                            </small>
                                        </div>
                                    </div>
                                    <div class='d-flex align-items-center justify-content-center searchAddFriend me-1'>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 2048 2048"><path fill="#d8e1e7" d="M1536 1536h-13q-23-112-81-206t-141-162t-187-106t-218-38q-88 0-170 23t-153 64t-129 100t-100 130t-65 153t-23 170H128q0-120 35-231t101-205t156-167t204-115q-113-74-176-186t-64-248q0-106 40-199t109-163T696 40T896 0q106 0 199 40t163 109t110 163t40 200q0 66-16 129t-48 119t-75 103t-101 83q112 43 206 118t162 176zM512 512q0 80 30 149t82 122t122 83t150 30q79 0 149-30t122-82t83-122t30-150q0-79-30-149t-82-122t-123-83t-149-30q-80 0-149 30t-122 82t-83 123t-30 149m1280 1152h256v128h-256v256h-128v-256h-256v-128h256v-256h128z"/></svg>
                                    </div>
                                </div>
                            `;
                            resultsContainer.append(resultItem);
                        }
                        else if (userDetails.friends[result.user._id]) {
                            const resultItem = `<div class='d-flex searchBlocks align-items-center justify-content-between ps-1'>
                                <div class='d-flex align-items-center userProfile'>
                                    <div class='d-flex align-items-center' style='height:47px; width:47px; overflow:hidden; border-radius:50%'>
                                        <img src="data:image/jpeg;base64,${result.profile}" alt="Profile" height='47px' width='47px'>
                                    </div>
                                    <div class='result-item d-flex flex-column' data-name='${result.user.fname} ${result.user.lname}' data-id='${result.user._id}'>
                                        ${result.user.fname} ${result.user.lname}
                                        <small style='font-size:10px;'>
                                            ${result.user.username}
                                        </small>
                                    </div>
                                </div>
                            </div>`;
                            resultsContainer.append(resultItem);
                        }
                        
                        $('.userProfile').off('click').on('click', async (event) => {
                            $("#search").val($(event.currentTarget).find('.result-item').data('name'));
                            resultsContainer.html('');
                            resultsContainer.hide();
    
                            try {
                                window.location.href = `/userProfile?user=${$(event.currentTarget).find('.result-item').data('id')}`;
    
                            } catch (error) {
                                console.error('Error fetching user data:', error);
                            }
                        });

                        $('.searchAddFriend').off('click').on('click', async (event) => {
                            const friendReqRes = await fetch('/friendRequest', {
                                method: 'POST', 
                                body: JSON.stringify({ from: userDetails._id, to: $(event.target).closest('.searchBlocks').find('.result-item').data('id') })
                            });
                            if (friendReqRes.ok) {
                                socket.emit('friend request', { from: userDetails._id, to: $(event.target).closest('.searchBlocks').find('.result-item').data('id') });
                                alert('Friend request sent!');

                            } else {
                                alert('Failed to send friend request.');
                            }
                        });
                    }

                });
                resultsContainer.show();
            } else {
                resultsContainer.hide();
            }
        } else {
            resultsContainer.html('');
            resultsContainer.hide();
        }

        $('.suggLoader').hide();
    });
    
    
    $(document).on("click", (event) => {
        const searchContainer = $("#search-container");
        const reqContainer = $('.requestsContainer');
        const friendsList = $('.friends');
        if (!searchContainer.is(event.target) && searchContainer.has(event.target).length === 0) {
            $("#search-results").hide();
        }
        if (!reqContainer.is(event.target) && reqContainer.has(event.target).length === 0) {
            $(".requestsPanel").fadeOut(100);
        }
        if (!friendsList.is(event.target) && friendsList.has(event.target).length === 0) {
            $(".friendsList").fadeOut(100);
        }
    });

    $('.search').on('click', async () => {
        $('#search-results').hide();

        if ($('#search').val().trim() !== '') {
            try {
                window.location.href = `/userProfile?user=${$('#search').val()}`;
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }

    });
});