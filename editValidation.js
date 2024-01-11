$(document).ready(async () => {
    
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

    $('#ppsswd').blur(() => {
        $('#ppsswderr').empty();
        if ($('#ppsswd').val() == '') {
            $('#ppsswderr').text(emptymsg);
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

    $('#changePsswd-form').on('submit', async (event) => {
        event.preventDefault();
        if ($('#ppsswd').val() == "") {
            $('#ppsswderr').text(emptymsg);
        }
        if ($('#psswd').val() == "") {
            $('#psswderr').text(emptymsg);
        }
        if ($('#cpsswd').val() == '') {
            $('#cpsswderr').text(emptymsg);
        }
        if ($('#changePsswd-form small').text() === '') {
            let ppsswd = $('#ppsswd').val();
            let npsswd = $('#psswd').val();

            try {
                const formData = new FormData();
                formData.append('_id', $(`#changePsswd-form button[type='submit']`).data('_id'));
                formData.append('ppsswd', ppsswd);
                formData.append('npsswd', npsswd);
              
                const response = await fetch('/editUserPsswd', {
                    method: 'PATCH',
                    body: formData,
                });
            
                if (response.ok) {
                    alert('Password changed successfully.');
                    $('#changePsswd-form').trigger('reset');
                    $('.btn-close').trigger('click');
                } else if (response.status == 401) {
                    alert('Current password is incorrect. Cannot change password.')
                } else {
                    alert(`Internal server error occoured while changing password.`);
                }

            } catch (err) { 
                console.log(err);
            }
        }
    });

    $('#edit-form').on('submit', async (event) => {
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
        if ($('#editProfile small').text() === '') {
            let fname = $('#fname').val();
            let lname = $('#lname').val();
            let pcountry = $('#pcountry').val();
            let pnumber = $('#pnumber').val();
            let email = $('#email').val();
            let username = $('#uname').val();
            let dob = $('#date').datepicker('getDate');
            let gender = $('input[name="gender"]:checked').val();

            try {
                const formData = new FormData();
                formData.append('_id', $(`#editProfile button[type='submit']`).data('_id'))
                formData.append('fname', fname);
                formData.append('lname', lname);
                formData.append('pcountry', pcountry);
                formData.append('pnumber', pnumber);
                formData.append('email', email);
                formData.append('username', username);
                formData.append('dob', dob);
                formData.append('gender', gender);
              
                const response = await fetch('/editUser', {
                    method: 'PATCH',
                    body: formData,
                });
            
                if (!response.ok) {
                    const errData = await response.text();
                    alert(`Error: ${errData}`);
                } else {
                    location.reload();
                }

            } catch (err) {
                console.error('Error:', err.message);
                alert('An error occurred. Please try again.');
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
        onSelect: (dateText) => {
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
