$(document).ready(() => {

    $('#regLogin').on('click', () => {
        $('.dismiss-btn').trigger('click');
    });
    
    $(".toggle-btn").click((event) => {
        let x = $(event.target).closest(".pass-toggle").find("input");
        let y = $(event.target).closest(".pass-toggle").find("i");
        x.attr("type", x.attr("type") === "password" ? "text" : "password");
        y.toggleClass("bi-eye bi-eye-slash");
    });

    let emptymsg = '*This field is required*';

    //patterns to check validation
    let nameRegEx = /^([A-Za-z]{3,10})+$/;
    let pnumRegEx = /^[6-9]\d{9}$/;
    let emailRegEx = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let passRegEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@.#$!%*?&^])[A-Za-z\d@.#$!%*?&]{8,15}$/;
    let unameRegEx = /^(?!\.)(?:[a-zA-Z0-9._]){6,30}(?<!\.)$/;
    
    $('#fname').blur(() => {
        $('#fnameerr').empty();
        if ($('#fname').val() == '') {
            $('#fnameerr').html(emptymsg);
        }
        else if (!nameRegEx.test($('#fname').val())) {
            $('#fnameerr').html('*Invalid First name*');
        }
    });

    $('#lname').blur(() => {
        $('#lnameerr').empty();
        if ($('#lname').val() == "") {
            $('#lnameerr').html(emptymsg);
        }
        else if (!nameRegEx.test($('#lname').val())) {
            $('#lnameerr').html('*Invalid Last name*');
        }
    });

    $('#pnumber').blur(() => {
        $('#pnumerr').empty();
        if ($('#pnumber').val() == '') {
            $('#pnumerr').html(emptymsg);
        }
        else if (!pnumRegEx.test($('#pnumber').val())) {
            $('#pnumerr').html('*Invalid Phone no.*');
        }
    });

    $('#email').blur(() => {
        $('#emailerr').empty();
        if ($('#email').val() == "") {
            $('#emailerr').html(emptymsg);
        }
        else if (!emailRegEx.test($('#email').val())) {
            $('#emailerr').html('*Invalid Email ID*');
        }
    });

    $('#uname').blur(() => {
        $('#unameerr').empty();
        if ($('#uname').val() == "") {
            $('#unameerr').html(emptymsg);
        }
        else if (!unameRegEx.test($('#uname').val())) {
            $('#unameerr').html('*Invalid User name*');
        }
    });

    $('#psswd').blur(() => {
        $('#psswderr').empty();
        if ($('#psswd').val() === "") {
            $('#psswderr').text(emptymsg);
        } else if (!passRegEx.test($('#psswd').val())) {
            if (!/(?=.*[a-z])/.test($('#psswd').val())) {
                $('#psswderr').append('*Use a lowercase letter*<br>');
            }
            if (!/(?=.*[A-Z])/.test($('#psswd').val())) {
                $('#psswderr').append('*Use an uppercase letter*<br>');
            }
            if (!/(?=.*[0-9])/.test($('#psswd').val())) {
                $('#psswderr').append('*Use a number*<br>');
            }
            if (!/(?=.*[@$!%*?&])/.test($('#psswd').val())) {
                $('#psswderr').append('*Use a special character*<br>');
            }
            if ($('#psswd').val().length < 8) {
                $('#psswderr').append('*Use at least 8 characters*<br>');
            }
        }
    });

    $('#cpsswd').blur(() => {
        $('#cpsswderr').empty();
        if ($('#cpsswd').val() == '') {
            $('#cpsswderr').text(emptymsg);
        }
        else if ($('#psswderr').text() != '') {
            $('#cpsswderr').text('*Enter a valid password first*');
        }
        else if ($('#cpsswd').val() != $('#psswd').val()) {
            $('#cpsswderr').text('*Enter the same password to confirm*');
        }
    });
    
    $('#img').change(() => {
        $('#imgerr').empty();
        let imgInput = $('#img')[0];
        let imgErrMessage = 'Please choose a valid image.';
        if (imgInput.files.length === 0) {
            $('#imgerr').text(emptymsg);
        } else {
            let validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if ($.inArray(imgInput.files[0].type, validImageTypes) === -1) {
                $('#imgerr').html(imgErrMessage);
            }
        }
    });

    $('#login-form').on('submit', async (event) => {
        event.preventDefault();
        if ($('#log-user').val() == "") {
            $('#log-usererr').text('Username must not be empty!');
        }
        if ($('#log-pass').val() == "") {
            $('#log-passerr').text('Password must not be empty!');
        }
        if ($('small:lt(2)').text() == '') {
            let username = $('#log-user').val();
            let password = $('#log-pass').val();

            try {
                const response = await fetch('/login', {
                    method: 'POST', 
                    headers: {
                        'content-type': 'application/json'
                    }, 
                    body: JSON.stringify({ username, password })
                });

                if (!response.ok) {
                    const errData = await response.text();
                    alert(`Error: ${errData}`);
                } else if (response.ok) {
                    $('#login-form').trigger('reset');
                    $('.btn-close').trigger('click');
                    window.location.href = '/chatAppHome';
                }
            } catch (err) {
                console.log('Error:', err.message);
                alert('An error occurred. Please try again.');
            }
        }
    });

    $('#reg-form').on('submit', async (event) => {
        event.preventDefault();
        if ($('#fname').val() == "") {
            $('#fnameerr').text(emptymsg);
        }
        if ($('#lname').val() == "") {
            $('#lnameerr').text(emptymsg);
        }
        if ($('#pnumber').val() == '') {
            $('#pnumerr').text(emptymsg);
        }
        if ($('#email').val() == "") {
            $('#emailerr').text(emptymsg);
        }
        if ($('#uname').val() == "") {
            $('#unameerr').text(emptymsg);
        }
        if ($('#psswd').val() == "") {
            $('#psswderr').text(emptymsg);
        }
        if ($('#cpsswd').val() == '') {
            $('#cpsswderr').text(emptymsg);
        }
        if ($('input[name=gender]:checked').length != 1) {
            $('#gendererr').text(emptymsg);
        }
        else {
            $('#gendererr').empty();
        }
        if ($('#selectedDate').val() == '') {
            $('.dateerr').text(emptymsg);
        }
        if ($('#img')[0].files.length === 0) {
            $('#imgerr').text(emptymsg);
        }
        if ($('small').slice(2, 11).text() === '') {
            let fname = $('#fname').val();
            let lname = $('#lname').val();
            let pcountry = $('#pcountry').val();
            let pnumber = $('#pnumber').val();
            let email = $('#email').val();
            let username = $('#uname').val();
            let password = $('#psswd').val();
            let dob = $('#date').datepicker('getDate');
            let gender = $('input[name="gender"]:checked').val();
            let registered_on = new Date();
            let online = false;
            let input = document.getElementById('img');
            let file = input.files[0];

            const allowedExtensions = ['jpg', 'jpeg', 'gif', 'png'];
            const fileNameParts = file.name.split('.');
            const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();

            if (allowedExtensions.includes(fileExtension)) {
                try {
                    const formData = new FormData();
                    formData.append('fname', fname);
                    formData.append('lname', lname);
                    formData.append('pcountry', pcountry);
                    formData.append('pnumber', pnumber);
                    formData.append('email', email);
                    formData.append('username', username);
                    formData.append('password', password);
                    formData.append('dob', dob);
                    formData.append('gender', gender);
                    formData.append('registered_on', registered_on);
                    formData.append('online', online);
                    formData.append('file', file);
                  
                    const response = await fetch('/createUser', {
                        method: 'POST',
                        body: formData,
                    });
                
                    if (response.status !== 201) {
                        const errData = await response.text();
                        alert(`Error: ${errData}`);
                    } else {
                        alert('User registered successfully!');
                        $('#reg-form').trigger('reset');
                        $('.btn-close').trigger('click');
    
                        const response = await fetch('/login', {
                            method: 'POST', 
                            headers: {
                                'content-type': 'application/json'
                            }, 
                            body: JSON.stringify({ username, password })
                        });
        
                        if (response.ok) {
                            window.location.href = '/chatAppHome';
                        }
                    }
    
                } catch (err) {
                    console.error('Error:', err.message);
                    alert('An error occurred. Please try again.');
                }

            } else {
                $('#imgerr').text('Only .jpg and .jpeg extensions are allowed');
            }
        }
    });

    $('#date').hide();
    let dateOnBlur = () => {
        $('#date').hide(300, 'swing');
        $(document).off('click', dateOnBlur);
    };

    $('#selectedDate').on('click', (event) => {
        event.preventDefault();
        $('#date').toggle(300, 'swing', () => {
            if ($('#date').is(':visible')) {
                $(document).on('click', dateOnBlur);
            }
        }); 
    });

    $('#date').datepicker({
        dateFormat: 'dd-mm-yy', 
        changeMonth: true, 
        changeYear: true,  
        firstDay: 1, 
        showOtherMonths: true,
        onSelect: (dateText, inst) => {
            $('#selectedDate').val(dateText);
        }, 
        gotoCurrent: true, 
        yearRange: '1900:2023', 
        altFormat: 'dd-mm-yy', 
    });
    
    $('.ui-datepicker').on('click', (event) => {
        event.stopPropagation();
    });

});
