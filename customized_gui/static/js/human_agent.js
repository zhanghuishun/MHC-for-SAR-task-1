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
var moral_dict = {}
//get values in copy list
function submitMoralValue() {
    var list = document.getElementById("copy-list").getElementsByTagName("li");
    if(list.length < 5) alert("miss moral value");
    else {
        moral_dict = {};
        moral_dict['very_high'] = list[0].innerText;
        moral_dict['high'] = list[1].innerText;
        moral_dict['middle'] = list[2].innerText;
        moral_dict['low'] = list[3].innerText;
        moral_dict['very_low'] = list[4].innerText;  
        var json_data = JSON.stringify(moral_dict);
        //mhc.js
        post_mhc_message("moralvalue", json_data);
    }
}

//close and show dialog
function show(){
    var show = $(".dialog").css("display");
    $(".dialog").css("display",show =="none"?"block":"none");
}
function close(){
    var show = $(".dialog").css("display");
    $(".dialog").css("display",show =="none"?"block":"none");
}

//change statement
function changeStatement() {
    var statement = document.getElementById("statement");
    var expl_type = localStorage.getItem("expl_type");
    console.log(expl_type);
    if (expl_type == "consequential"){
        statement.innerHTML = "consequential";

    }
    if (expl_type == "combination"){
        statement.innerHTML = "combination";
    }
    if (expl_type == "without"){
        statement.innerHTML = "";
    }

}