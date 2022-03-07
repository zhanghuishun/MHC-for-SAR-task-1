/*
 * This file handles keypresses and sends them back to the MATRX server
 */
$(document).ready(function() {
    // bind key listener
    document.onkeydown = checkArrowKey;
});


/**
 * Catch user pressed keys with arrow keys
 *
 */
function checkArrowKey(e) {
    e = e || window.event;

    // ignore the event if the user is writing in the message input field
    if (document.getElementById("chat_form_input") === document.activeElement) {
        return
    }

    console.log("Userinput:", e);

    data = [e.key];

    send_userinput_to_MATRX(data);
}

var showing_sidebar = false
function moralvalueToggle() {
    showing_sidebar = !showing_sidebar;
    if (showing_sidebar) {
        document.getElementById("moral_value_button").className = "btn btn-secondary";
    } else {
        document.getElementById("moral_value_button").className = "btn btn-dark";
    }
}


