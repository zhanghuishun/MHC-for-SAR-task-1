var mhc_url = 'http://' + window.location.hostname,
    port_mhc = "3000",
    port_matrx_api = "3001",
    mhc_send_message_url = "send_message";
open = false;
worldObjects = []
ICBeds = 0;
ICFull = false;
wardFull = false
waitingBeds = 0;
wardBeds = 0;
TotalBeds = []
oldVictims = []
onScreenVictims = []
deadVictims = []
healedVictims = []

// which victim cards are being shown at the moment
victim_cards_open = [];
homeVictims = 0
blockedButtons = true
newHealed=false;



/*
 * Add victims with pop-ups
 * @Param victims: a list of victims IDs currently present in the world
 */
function extend_update(victims) {
    worldObjects = Object.keys(lv_state)
    
    //Check if a new victim has been added and add the victim card
    if (victims.filter(value => oldVictims.includes(value)) != victims.length && worldObjects.length > 0 && victims.length > 0) {
        if (victims.filter(value => !onScreenVictims.includes(value)).length > 0) {
            if (!open) {
                victimID = victims.filter(value => !onScreenVictims.includes(value))[0]
                victim = lv_state[victimID]
                //popupVictim(victim);
                open = true
                victimCard = '<div class="card victimcard drag-revert" data-agentID="' + victim.obj_id + '" id="' + victim.obj_id + 'victimCard" >'
                victimCard += gen_victim_card_complete(victim);
                victimCard += '</div>'

                // note that we opened this victim card
                victim_cards_open.push(victim.obj_id);

                $('#victim-cards').append(victimCard);
                newBody = $("#" + victim.obj_id + "victimCardBody")
                opacity = 0.9
                // newBody.css('background-color', 'rgba(0, 0, 255, 0.9)');
                fade_out_background(newBody[0].parentElement, 100, 236, 236, 138, opacity);
                //victimCardUtilities()
                open = false;
                //Show the info next to the victim if they have left the waiting room
                $("#" + victimID).hover(function() {
                        if (lv_state[$(this)[0].id]["medical_care"] != "eerste hulp") {
                            $("#victim_Data").show()
                            $("#victim_Data").html(lv_state[$(this)[0].id]['victim_introduction_text'])
                        }
                    },
                    function() {
                        $("#victim_Data").hide();

                    }
                )
                onScreenVictims.push(victimID)
            }
        }
        oldVictims = victims;

    }
}


function popupVictimStatus(data) {
    //gen_victim_popup(victimID)
    $("#dialog-update").html(gen_victim_status_popUp(data["victim_id"], data["result"], data["time"], data["choice"]));
    $("#dialog-update").dialog({
        resizable: true,
        position: {
            my: "center top",
            at: "center center-200",
            of: window
        },
        zIndex: 10000,
        maxHeight: 800,
        classes: {
            "ui-dialog": "source_dialog",
        },
        closeOnEscape: true,
        close: function() {
            open = false;
            $('#container').removeClass("blurred")
            $('#victim-cards').removeClass("blurred")
        },
        width: '30%',
        modal: true,
        open: function(event, ui) {
            $('#dialog-confirm').parent('.ui-dialog').css('zIndex', 10000)
            $('#container').addClass("blurred")
            $('#victim-cards').addClass("blurred")
        },
        buttons: [],
    });

}

// sleep for x milliseconds before doing other code
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function popupVictim(victimID) {
    // check if we are displaying a decision support triage window or a regular one
    var classes = "source_dialog";
    var width = "70%";
    var maxHeight = 800;

    if (mhc_settings['tdp'] == 'tdp_dynamic_task_allocation') {
        width = "70%";

    } else if (mhc_show_explanations) {
        classes += " mhc_show_explanations";
        width = "94%";
        maxHeight = 950;
    }

    // supervised autonomy requires a simpler popup with less options
    if (mhc_settings['tdp'] == 'tdp_supervised_autonomy') {
        $("#dialog-confirm").html(gen_victim_popup(victimID));
        $("#dialog-confirm").dialog({
            resizable: true,
            position: {
                my: "center top",
                at: "center top+10%",
                of: window
            },
            zIndex: 1000,
            maxHeight: maxHeight,
            classes: {
                "ui-dialog": classes
            },
            width: width,
            modal: true,
            open: function(event, ui) {
                $(".ui-dialog-titlebar-close").hide();
                $("#send_to_IC").hide();
                $("#send_to_ward").hide();
                $("#send_to_home").hide();
            },
            buttons: {
                "Sluiten": function() {
                    $(this).dialog('close');
                }
            }
        });
        return;
    }



    $("#dialog-confirm").html(gen_victim_popup(victimID));
    $("#dialog-confirm").dialog({
        resizable: true,
        position: {
            my: "center top",
            at: "center top+9%",
            of: window
        },
        zIndex: 10000,
        maxHeight: maxHeight,
        classes: {
            "ui-dialog": classes
        },
//        closeOnEscape: true,
        close: function() {
            open = false;
            blockedButtons = true;
            $('#container').removeClass("blurred")
            $('#victim-cards').removeClass("blurred")
        },
        width: width,
        modal: true,
        open: function(event, ui) {
            $(".ui-dialog-titlebar-close").hide();
            $("#send_to_IC").hide()
            $("#send_to_ward").hide()
            $("#send_to_home").hide()
            $('#dialog-confirm').parent('.ui-dialog').css('zIndex', 10000)
            $('#container').addClass("blurred")
            $('#victim-cards').addClass("blurred")
            var seconds = 7
            $("#Timer").html("Lees de bovenstaande tekst")
            int = setInterval(function() {

                seconds += -1

                blockedButtons = true
                if (seconds < 0) {
                    $("#send_to_IC").show();
                    $("#send_to_ward").show();
                    $("#send_to_home").show();
                    $("#send_to_home").removeClass("not-visible")
                    $("#send_to_home").addClass("visible")
                    blockedButtons = false
                    $("#Timer").html("");
                    if (!ICFull) {
                        $("#send_to_IC").removeClass("not-visible")
                        $("#send_to_IC").addClass("visible")
                        if($("#care_suggestion").text()=="IC"){
                        $("#send_to_IC")[0].style["border-color"]="#416098"
                        $("#send_to_IC")[0].style["background"]="#deebf7"
                        $(".ui-dialog-buttonset").append($(".dialogRobotIC"));
                        $(".dialogRobotIC").show()
                        }
                    }
                    if (!wardFull) {
                        $("#send_to_ward").removeClass("not-visible")
                        $("#send_to_ward").addClass("visible")
                        if($("#care_suggestion").text()=="Ziekenboeg"){
                        $("#send_to_ward")[0].style["border-color"]="#416098"
                        $("#send_to_ward")[0].style["background"]="#deebf7"
                        $(".ui-dialog-buttonset").append($(".dialogRobotWard"));
                        $(".dialogRobotWard").show()
                        }
                    }
                    $("#send_to_home").show()
                    if($("#care_suggestion").text()=="Huis"){

                        $("#send_to_home")[0].style["border-color"]="#416098"
                        $("#send_to_home")[0].style["background"]="#deebf7"
                        $(".ui-dialog-buttonset").append($(".dialogRobotHome"));
                        $(".dialogRobotHome").show()
                        }
                    clearInterval(int);
                }
            }, 1000);

        },
        // When a triage button is pressed, a confirmation window is opened with for some TDPs extra info
        buttons: [{
            id: "send_to_IC",
            text: "Stuur naar IC "+ String(Number($("#ICBeds").text())-Number($("#ICStatus").text()))+"/"+$("#ICBeds").text()+" vrije bedden",
            class: "popUpButton not-visible",
            click: function() {
                var dialog1 = $(this);
                var are_you_sure_text = "Weet u zeker dat u deze patiënt naar de IC wil sturen?";
                var large_dialog = false;

                // check if we need to add a foil explanation
                if(mhc_settings['tdp'] == 'tdp_decision_support_explained') {
                    var currVictim = lv_state[victimID];
                    if (currVictim['IC_foil'] != 'None') {
                        large_dialog = true;
                        are_you_sure_text = `<div class="dss_agent_foil_question">${are_you_sure_text}</div>`;
                        are_you_sure_text += `
                            <div class="dss_agent_foil_explanation">
                                <div id="agent_predictions">
                                    ${currVictim['IC_foil']}
                                </div>
                            </div>
                            <img class="tdp_dss_robot foil_explanation_bot" src="/fetch_external_media/dss_robot.png">
                        `;
                    }
                }

                // fill and open the confirmation dialog for the triage decision
                $("#dialog-second-confirm").html(are_you_sure_text);
                $("#dialog-second-confirm").dialog({
                    modal: true,
                    zIndex: 10001,
                    width: (large_dialog ? 1100 : 500),
                    height: (large_dialog ? 575 : 250),
                    position: {
                        my: "center bottom",
                        at: (large_dialog ? "center bottom" : "center center"),
                        of: window
                    },
                    buttons: {
                        "Ja": function() {
                            // do the triage decision
                            //makeScreenshot(victimID);
                             data = {
                            "current_tick": current_tick,
                            "tps": tps,
                            "agentID": victimID,
                            "tdp": mhc_settings['tdp'],
                            "start_timestamp": mhc_settings['start_timestamp']
                                }
                           var confirm_confirm = $(this);
                           var resp = $.ajax({
                                method: "POST",
                                url: mhc_url + ":" + port_mhc + "/" + "pickupVictim",
                                contentType: "application/json; charset=utf-8",
                                dataType: 'json',
                                data: JSON.stringify(data),
                                success: function(response) {
                                   sendVictimToDestination("IC", lv_agent_id, victimID)
                                    $("#" + victimID + "victimCard").remove();
                                    victim_cards_open.pop(victimID)
                                    $('#container').removeClass("blurred")
                                    $('#victim-cards').removeClass("blurred")
                                    open = false;

                                    // close the second confirmation dialog
                                    confirm_confirm.dialog("close");
                                    //close the triage dialog
                                    dialog1.dialog("close");

                                }
                            });

                            /*sleep(500).then(() => {
                                sendVictimToDestination("IC", lv_agent_id, victimID)
                                $("#" + victimID + "victimCard").remove();
                                victim_cards_open.pop(victimID)
                                $('#container').removeClass("blurred")
                                $('#victim-cards').removeClass("blurred")
                                open = false;
                                var confirm_confirm = $(this);
                                // close the second confirmation dialog
                                confirm_confirm.dialog("close");
                                //close the triage dialog
                                dialog1.dialog("close");
                            });*/
                        },
                        "Nee, kies anders": function() {
                            var confirm_confirm = $(this);
                            // close the second confirmation dialog
                            confirm_confirm.dialog("close");
                        }
                    }
                });
            }
        },
        {
            id: "send_to_ward",
            class:"popUpButton not-visible",
            text: "Stuur naar ziekenboeg "+ String(Number($("#wardBeds").text())-Number($("#wardStatus").text()))+"/"+$("#wardBeds").text()+" vrije bedden",
            click: function() {
                var dialog1 = $(this);
                var are_you_sure_text = "Weet u zeker dat u deze patiënt naar de ziekenboeg wilt sturen?";
                var large_dialog = false;

                // check if we need to add a foil explanation
                if(mhc_settings['tdp'] == 'tdp_decision_support_explained') {
                    var currVictim = lv_state[victimID];
                    if (currVictim['Ziekenboeg_foil'] != 'None') {
                        large_dialog = true;
                        are_you_sure_text = `<div class="dss_agent_foil_question">${are_you_sure_text}</div>`;
                        are_you_sure_text += `
                            <div class="dss_agent_foil_explanation">
                                <div id="agent_prediction s">
                                    ${currVictim['Ziekenboeg_foil']}
                                </div>
                            </div>
                            <img class="tdp_dss_robot foil_explanation_bot" src="/fetch_external_media/dss_robot.png">
                        `;
                    }
                }

                // fill and open the confirmation dialog for the triage decision
                $("#dialog-second-confirm").html(are_you_sure_text);
                $("#dialog-second-confirm").dialog({
                    modal: true,
                    zIndex: 10001,
                    width: (large_dialog ? 1100 : 500),
                    height: (large_dialog ? 575 : 250),
                    position: {
                        my: "center bottom",
                        at: (large_dialog ? "center bottom" : "center center"),
                        of: window
                    },
                    buttons: {
                        "Ja": function() {
                            // do the triage decision
                            //makeScreenshot(victimID);

                            data = {
                            "current_tick": current_tick,
                            "tps": tps,
                            "agentID": victimID,
                            "tdp": mhc_settings['tdp'],
                            "start_timestamp": mhc_settings['start_timestamp']
                                }
                            var confirm_confirm = $(this);
                            var resp = $.ajax({
                                method: "POST",
                                url: mhc_url + ":" + port_mhc + "/" + "pickupVictim",
                                contentType: "application/json; charset=utf-8",
                                dataType: 'json',
                                data: JSON.stringify(data),
                                success: function(response) {
                                   sendVictimToDestination("ziekenboeg", lv_agent_id, victimID)
                                    $("#" + victimID + "victimCard").remove();
                                    victim_cards_open.pop(victimID)
                                    $('#container').removeClass("blurred")
                                    $('#victim-cards').removeClass("blurred")
                                    open = false;

                                    // close the second confirmation dialog
                                    confirm_confirm.dialog("close");
                                    //close the triage dialog
                                    dialog1.dialog("close");

                                }
                            });
                            /*sleep(500).then(() => {
                                sendVictimToDestination("ziekenboeg", lv_agent_id, victimID)
                                $("#" + victimID + "victimCard").remove();
                                victim_cards_open.pop(victimID)
                                $('#container').removeClass("blurred")
                                $('#victim-cards').removeClass("blurred")
                                open = false;
                                var confirm_confirm = $(this);
                                // close the second confirmation dialog
                                confirm_confirm.dialog("close");
                                //close the triage dialog
                                dialog1.dialog("close");
                            });*/
                        },
                        "Nee, kies anders": function() {
                            var confirm_confirm = $(this);
                            // close the second confirmation dialog
                            confirm_confirm.dialog("close");
                        }
                    }
                });
            }
        },
        {
            id: "send_to_home",
            class:"popUpButton not-visible",
            text: "Stuur naar huis",
            click: function() {
                var dialog1 = $(this);
                var are_you_sure_text = "Weet u zeker dat u deze patiënt naar huis wilt sturen?";
                var large_dialog = false;

                // check if we need to add a foil explanation
                if(mhc_settings['tdp'] == 'tdp_decision_support_explained') {
                    var currVictim = lv_state[victimID];
                    if (currVictim['Huis_foil'] != 'None') {
                        large_dialog = true;
                        are_you_sure_text = `<div class="dss_agent_foil_question">${are_you_sure_text}</div>`;
                        are_you_sure_text += `
                            <div class="dss_agent_foil_explanation">
                                <div id="agent_predictions">
                                    ${currVictim['Huis_foil']}
                                </div>
                            </div>
                            <img class="tdp_dss_robot foil_explanation_bot" src="/fetch_external_media/dss_robot.png">
                        `;
                    }
                }

                // fill and open the confirmation dialog for the triage decision
                $("#dialog-second-confirm").html(are_you_sure_text);
                $("#dialog-second-confirm").dialog({
                    modal: true,
                    zIndex: 10001,
                    width: (large_dialog ? 1100 : 500),
                    height: (large_dialog ? 575 : 250),
                    position: {
                        my: "center bottom",
                        at: (large_dialog ? "center bottom" : "center center"),
                        of: window
                    },
                    buttons: {
                        "Ja": function() {
                            // do the triage decision

                            data = {
                            "current_tick": current_tick,
                            "tps": tps,
                            "agentID": victimID,
                            "tdp": mhc_settings['tdp'],
                            "start_timestamp": mhc_settings['start_timestamp']
                                }
                          var confirm_confirm = $(this);
                           var resp = $.ajax({
                                method: "POST",
                                url: mhc_url + ":" + port_mhc + "/" + "pickupVictim",
                                contentType: "application/json; charset=utf-8",
                                dataType: 'json',
                                data: JSON.stringify(data),
                                success: function(response) {
                                   sendVictimToDestination("huis", lv_agent_id, victimID)
                                   if (onScreenVictims.includes(victimID)) {
                                       homeVictims += 1;
                                       $("#myHome").html(homeVictims)
                                       }
                                   $("#" + victimID + "victimCard").remove();
                                   victim_cards_open.pop(victimID)
                                    $('#container').removeClass("blurred")
                                    $('#victim-cards').removeClass("blurred")
                                    open = false;

                                     // close the second confirmation dialog
                                     confirm_confirm.dialog("close");
                                     //close the triage dialog
                                      dialog1.dialog("close");

                                }
                            });

                            /*sleep(500).then(() => {
                                sendVictimToDestination("huis", lv_agent_id, victimID)
                                if (onScreenVictims.includes(victimID)) {
                                    homeVictims += 1;
                                    $("#myHome").html(homeVictims)
                                }
                                $("#" + victimID + "victimCard").remove();
                                victim_cards_open.pop(victimID)
                                $('#container').removeClass("blurred")
                                $('#victim-cards').removeClass("blurred")
                                open = false;
                                var confirm_confirm = $(this);
                                // close the second confirmation dialog
                                confirm_confirm.dialog("close");
                                //close the triage dialog
                                dialog1.dialog("close");
                            });*/
                        },
                        "Nee, kies anders": function() {
                            var confirm_confirm = $(this);
                            // close the second confirmation dialog
                            confirm_confirm.dialog("close");
                        }
                    }
                });
            }
        }],
    });

}

//NOT USED ANYMORE
function makeScreenshot(victimID) {
    data = {
        "current_tick": current_tick,
        "tps": tps,
        "agentID": victimID,
        "tdp": mhc_settings['tdp'],
        "start_timestamp": mhc_settings['start_timestamp']
    }

   var resp = $.ajax({
        method: "POST",
        url: mhc_url + ":" + port_mhc + "/" + "pickupVictim",
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        data: JSON.stringify(data),
        success: function(response) {
           sendVictimToDestination("huis", lv_agent_id, victimID)
           if (onScreenVictims.includes(victimID)) {
               homeVictims += 1;
               $("#myHome").html(homeVictims)
               }
           $("#" + victimID + "victimCard").remove();
           victim_cards_open.pop(victimID)
            $('#container').removeClass("blurred")
            $('#victim-cards').removeClass("blurred")
            open = false;
            var confirm_confirm = $(this);
             // close the second confirmation dialog
             confirm_confirm.dialog("close");
             //close the triage dialog
              dialog1.dialog("close");

        }
    });
}

function get_mhc_message(type) {
    var resp = $.ajax({
        method: "GET",
        url: mhc_url + ":" + port_mhc + "/" + type,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        success: function(response) {
            console.log(response);
        }
    });
}


/* Highlight the background of an element with a specific colour, and fade it back to its regular colour */
function fade_out_background(element, interval, r, g, b, opacity) {
    var fadeTarget = element;
    var fadeEffect = setInterval(function() {
        if (!opacity) {
            fadeTarget.style.setProperty("background-color", "rgba(" + r + "," + g + "," + b + ", 1)", "important");
            opacity = 1
        }
        if (opacity > 0) {
            opacity -= 0.025
            fadeTarget.style.setProperty("background-color", "rgba(" + r + "," + g + "," + b + "," + opacity + ")", "important");
        } else {
            clearInterval(fadeEffect);
        }
    }, interval);
}

function fade_out_effect(element, interval) {
    var fadeTarget = element;
    var fadeEffect = setInterval(function() {
        if (!fadeTarget.style.opacity) {
            fadeTarget.style.opacity = 1;
        }
        if (fadeTarget.style.opacity > 0) {
            fadeTarget.style.opacity -= 0.025;
        } else {
            clearInterval(fadeEffect);
        }
    }, interval);
}

function post_mhc_message(type, data, f) {

    var resp = $.ajax({
        method: "POST",
        url: mhc_url + ":" + port_mhc + "/" + type,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        data: JSON.stringify(data),
        success: function(response) {
                       if (f != 'undefined') {
                           f(response)
                       }

        }
    });
}

function send_matrx_message(type, data) {
    console.log("Send message of type " + type + " with data ", data);
    var resp = $.ajax({
        method: "POST",
        url: mhc_url + ":" + port_matrx_api + "/" + type,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        data: JSON.stringify(data),
        success: function(response) {
//            console.log(response);
        }
    })
}


/*
 * Return a victim card filled with the data of the victim
 */
function gen_victim_card_complete(victim_data) {
    victimPhoto = '/fetch_external_media/' + victim_data["victim_photo"]
    //"/fetch_external_media/victims/victim_"+(victim_data['number']+1)+".jpg"
    difficulty_to_reach_color = get_difficulty_color(victim_data["difficulty_to_reach"])
    difficulty_to_rescue_color = get_difficulty_color(victim_data["difficulty_to_rescue"])
    level_of_injury_color = get_level_of_injury_color(victim_data["level_of_injury"])
    victim_card_html = `
    <div id="${victim_data.obj_id}victimCardBody" class="victim_card_body">
        <div id="victim_identification" class="row">
            <div class="col-3">
                <img src=${victimPhoto} class="victim_photo">
            </div>
            <div class="col-6">
                <div class="victim_name_wrapper">
                    <div class="victim_number">Victim ${victim_data['number']}</div>
                    <h2 class="victim_name">${victim_data['victim_name']}</h2>
                 </div>
        </div>
            </div>
            `
    victim_card_html += `
        <div class="victim_card_inner_divider"><hr></div>

        <div class="collapse victim_extra_info_collapse" id="collapse_${victim_data.obj_id}">
            <div class="card-body">
                ${victim_data['victim_introduction_text']}
            </div>
        </div>

        <div class="victim_properties container">
            <div class="row">
            <div class="victim_property col-6"><img src="/fetch_external_media/gender.svg" title="gender">${victim_data["gender"]}</div>
            <div class="victim_property col-6" style="color:${difficulty_to_reach_color}"><img src="/fetch_external_media/distance.svg" title="distance">${victim_data["difficulty_to_reach"]}</div>
            <div class="victim_property col-6"><img src="/fetch_external_media/age.svg" title="age">${victim_data["age"]}</div>
            <div class="victim_property col-6" style="color:${difficulty_to_rescue_color}"><img src="/fetch_external_media/difficulty.svg" title="difficulty">${victim_data["difficulty_to_rescue"]}</div>
            <div class="victim_property col-12" style="color:${level_of_injury_color}"><img src="/fetch_external_media/injury.svg" title="level of injury">${victim_data["level_of_injury"]}</div>
            </div>
        </div>`;

    victim_card_html += `</div>`;
    return victim_card_html;
}

function gen_victim_card_for_explanation(victim_data, number) {
    victim_data = JSON.parse(victim_data)
    victimPhoto = '/fetch_external_media/' + victim_data["image"]
    //"/fetch_external_media/victims/victim_"+(victim_data['number']+1)+".jpg"
    difficulty_to_reach_color = get_difficulty_color(victim_data["difficulty_to_reach"])
    difficulty_to_rescue_color = get_difficulty_color(victim_data["difficulty_to_rescue"])
    level_of_injury_color = get_level_of_injury_color(victim_data["level_of_injury"])
    gender_color = get_gender_color(victim_data["gender"])
    age_color = get_age_color(victim_data["age"])
    victim_card_html = `
    <div id="${victim_data.obj_id}victimCardBody" class="victim_card_body">
        <div id="victim_identification" class="row">
            <div class="col-3">
                <img src=${victimPhoto} class="victim_photo">
            </div>
            <div class="col-6">
                <div class="victim_name_wrapper">
                    <h2 class="victim_name">${number}</h2>
                 </div>
        </div>
            </div>
            `
    victim_card_html += `
        <div class="victim_card_inner_divider"><hr></div>

        <div class="collapse victim_extra_info_collapse" id="collapse_${victim_data.obj_id}">
            <div class="card-body">
                ${victim_data['victim_introduction_text']}
            </div>
        </div>

        <div class="victim_properties container">
            <div class="row">
            <div class="victim_property col-6" style="color:${gender_color}"><img src="/fetch_external_media/gender.svg" title="gender">${victim_data["gender"]}</div>
            <div class="victim_property col-6" style="color:${difficulty_to_reach_color}"><img src="/fetch_external_media/distance.svg" title="distance">${victim_data["difficulty_to_reach"]}</div>
            <div class="victim_property col-6" style="color:${age_color}"><img src="/fetch_external_media/age.svg" title="age">${victim_data["age"]}</div>
            <div class="victim_property col-6" style="color:${difficulty_to_rescue_color}"><img src="/fetch_external_media/difficulty.svg" title="difficulty">${victim_data["difficulty_to_rescue"]}</div>
            <div class="victim_property col-12" style="color:${level_of_injury_color}"><img src="/fetch_external_media/injury.svg" title="level of injury">${victim_data["level_of_injury"]}</div>
            </div>
        </div>`;

    victim_card_html += `</div>`;
    return victim_card_html;
}

/*
 * Parse the settings object
 * @param settings_obj: the MATRX settings object
 */
function parse_mhc_settings(settings_obj) {

    // hide the your vs robot victims
    if (!settings_obj['visualize_your_vs_robot_victims']) {
        var my_victims = $('#myVictims');
        my_victims.next().hide();
        my_victims.hide();

        var robot_victims = $('#robotVictims');
        robot_victims.next().hide();
        robot_victims.hide();
    }

    // fetch whether to show the agent (Decision support) predictions or not
    var show_agent_predictions = false;
    if (Object.keys(settings_obj).includes('show_agent_predictions')) {
        show_agent_predictions = settings_obj['show_agent_predictions'];
    }
    if (mhc_show_explanations != show_agent_predictions) {
        console.log("Show agent predictions (e.g. for TDP decision support)?: ", show_agent_predictions);
    }
    mhc_show_explanations = show_agent_predictions;

    // fetch whether to show the biased agent car suggestions or not
    var biased_agent_suggestion = false;
    if (Object.keys(settings_obj).includes('bias')) {
        biased_agent_suggestion = settings_obj['bias'];
    }
    if (mhc_dss_biased_suggestion != biased_agent_suggestion) {
        console.log("Show biased agent care suggestion (e.g. for TDP decision support exp1)?: ", biased_agent_suggestion);
    }
    mhc_dss_biased_suggestion = biased_agent_suggestion;

}
//color: green < blue < yellow < orange < red
function get_level_of_injury_color(level) {
    level_of_injury = localStorage.getItem("level_of_injury");
    if(level == "low") {
        if(level_of_injury == "high") {
            return "#DC143C" //red
        }else{
            return "#3CB371" //green
        }
    }else if(level == "middle"){
        return "#FFD700" //yellow
    }else if(level == "high"){
        if(level_of_injury == "high"){
            return "#3CB371" //green
        }else{
            return "#DC143C" //red
        }
    }
}

function get_difficulty_color(level) {
    if(level == "low") {
        return "#3CB371" //green
    }else if(level == "middle"){
        return "#FFD700" //yellow
    }else if(level == "high"){
        return "#DC143C" //red
    }
}

function get_gender_color(level) {
    gender = localStorage.getItem("gender");
    if(level == "Man"){
        if(gender == "female"){
            return "#DC143C"//red
        }else return "#3CB371"//green
    }else if (level == "Woman"){
        if(gender == "female"){
            return "#3CB371"//green
        }else return "#DC143C"//red
    }
}

function get_age_color(level) {
    age = localStorage.getItem("age");
    level = parseInt(level);
    if(level > 0 && level <= 20){
        return age == "old"?"#DC143C":"#3CB371";
    }
    else if(level > 20 && level <= 40){
        return age == "old"?"#FF8C00":"#1E90FF";
    }
    if(level > 40 && level <= 60){
        return "#FFD700";
    }
    if(level > 60 && level <= 80){
        return age == "old"?"#1E90FF":"#FF8C00";
    }
    if(level > 80){
        return age == "old"?"#3CB371":"#DC143C";
    }
}