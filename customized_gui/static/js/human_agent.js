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
    var your_moral_value = document.getElementById("moral_value");
    if(list.length < 5) alert("miss moral value");
    else {
        //change "your moral value"
        your_moral_value.innerHTML = list[0].innerText+">"+list[1].innerText+">"+list[2].innerText+">"+list[3].innerText+">"+list[4].innerText
        moral_dict = {};
        moral_dict['very_high'] = list[0].innerText;
        moral_dict['high'] = list[1].innerText;
        moral_dict['middle'] = list[2].innerText;
        moral_dict['low'] = list[3].innerText;
        moral_dict['very_low'] = list[4].innerText;  
        var json_data = JSON.stringify(moral_dict);
        //mhc.js
        post_mhc_message("set_moral_value", json_data, function(result){
            localStorage.setItem("prior_victim", JSON.stringify(result["info"]["prior_victim"]));
            localStorage.setItem("victimA", result["info"]["victimA"]);
            localStorage.setItem("victimB", result["info"]["victimB"]);

            localStorage.setItem("value1", JSON.stringify(result["info"]["value1"]));
            localStorage.setItem("value2", JSON.stringify(result["info"]["value2"]));
        });
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
//change statement
function changeStatement() {
    //change pic of victims
    cards = document.getElementById("cards");
    cards.innerHTML = ""
    cards.innerHTML += gen_patient_card_for_explanation(localStorage.getItem("victimA"));
    cards.innerHTML += gen_patient_card_for_explanation(localStorage.getItem("victimB"));
    //change explanations
    prior_victim = JSON.parse(localStorage.getItem("prior_victim"));
    the_other_victim = prior_victim=="victimA"?"victimB":"victimA";
    value1 = JSON.parse(localStorage.getItem("value1"));
    value2 = JSON.parse(localStorage.getItem("value2"));
    var statement = document.getElementById("statement");
    var expl_type = localStorage.getItem("expl_type");
    console.log(expl_type);
    if (expl_type == "combination"){
        statement.innerHTML = "Robot: Based on your value elicitation, if I have to decide between rescuing  victimA or victimB, I will rescue " + prior_victim + ".";
        statement.innerHTML += "And if you prioritized " + value1 + " over " + value2 + ", my decision would have been rescuing " + the_other_victim + " rather than " + prior_victim + ".";
    }
    if (expl_type == "without"){
        statement.innerHTML = "";
    }

}