/*
 * This file handles keypresses and sends them back to the MATRX server
 */
$(document).ready(function() {
    // bind key listener
    document.onkeydown = checkArrowKey;
});

window.onload = function() {
    var expl_type = localStorage.getItem("expl_type");
    if(expl_type == "without") {
        var robot_explanation = this.document.getElementById("robot_explanation");
        robot_explanation.style.display = 'none';
    }
}

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
    //press "space" to control start or pause
    if(data == ' '){
        start_button = document.getElementById("start_button");
        pause_button = document.getElementById("pause_button");
        if(start_button.classList.contains("hidden")){
            pause_button.click();
        }else{
            start_button.click();
        }
    }
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
    var your_moral_value = document.getElementById("moral_value_rankings");
    if(list.length < 5) alert("miss moral value");
    else {
        //change "your moral value"
        your_moral_value.innerHTML = "";
        for(let i = 0; i < list.length; i++){
            //check level of injury
            if(list[i].innerText == "low level of injury") {localStorage.setItem("level_of_injury","low");}
            else if(list[i].innerText == "high level of injury") {localStorage.setItem("level_of_injury","high");}
            else if(list[i].innerText == "female preferred") {localStorage.setItem("gender","female");}
            else if(list[i].innerText == "male preferred") {localStorage.setItem("gender","male");}
            else if(list[i].innerText == "older preferred") {localStorage.setItem("age","old");}
            else if(list[i].innerText == "younger preferred") {localStorage.setItem("age","young");}
            //add values to selected moral values
            your_moral_value.innerHTML += "<div class=\"image-frame\"> <img src=\"/static/images/"+list[i].innerText+".png\">"
        }
        //your_moral_value.innerHTML = list[0].innerText+">"+list[1].innerText+">"+list[2].innerText+">"+list[3].innerText+">"+list[4].innerText
        moral_dict = {};
        moral_dict['very_high'] = list[0].innerText;
        moral_dict['high'] = list[1].innerText;
        moral_dict['middle'] = list[2].innerText;
        moral_dict['low'] = list[3].innerText;
        moral_dict['very_low'] = list[4].innerText;  
        var json_data = JSON.stringify(moral_dict);
        //mhc.js
        post_mhc_message("set_moral_value", json_data);
    }
}

//close and show dialog
function showDialog(){
    var show = $(".dialog").css("display");
    $(".dialog").css("display",show =="none"?"block":"none");
}
function closeDialog(){
    var show = $(".dialog").css("display");
    $(".dialog").css("display",show =="none"?"block":"none");
}
function showMoralValues(){
    var show = $("#moral_values_select").css("display");
    $("#moral_values_select").css("display",show =="none"?"block":"none");
}
function closeMoralValues(){
    var show = $("#moral_values_select").css("display");
    $("#moral_values_select").css("display",show =="none"?"block":"none");
}
