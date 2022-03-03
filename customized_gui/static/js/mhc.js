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
oldPatients = []
onScreenPatients = []
deadPatients = []
healedPatients = []

// which patient cards are being shown at the moment
patient_cards_open = [];
homePatients = 0
blockedButtons = true
newHealed=false;

$(document).ready(function() {
//    patientCardUtilities()
})

function patientCardUtilities() {
    $("#patient-cards").sortable({
        placeholder: "patientcard-placeholder",
        cursor: "move",
        revert: true,
        // started sorting, block revert
        start: function(event, ui) {
            //            console.log("start sort:, adding block-revert");
            ui.item.addClass("block-revert");
            var patient_id = ui.item.attr("data-agentID");
            data = {
                "current_tick": current_tick,
                "tps": tps,
                "agentID": patient_id,
                "tdp": mhc_settings['tdp'],
                "start_timestamp": mhc_settings['start_timestamp']
            }
            setTimeout(function() {
                post_mhc_message("pickupPatient", data);
            }, 30);

        },
        // moved out, activate revert
        out: function(event, ui) {
            //            console.log("out:, removing block-revert");
            ui.item.removeClass("block-revert");
        },
        // moved into sorting list, block double revert
        over: function(event, ui) {
            //            console.log("in:, adding block-revert");
            ui.item.addClass("block-revert");
        }
    });

    // we also want to drag patient cards to drop zones
    $(".patientcard").draggable({
        connectToSortable: "#patient-cards",
        revert: function() {
            console.log("checking revert");
            // send a message to the MHC visualizer to make a screenshot

            // prevent double revert animation when moving within sorting
            if ($(this).hasClass('block-revert')) {
                console.log("revert blocked")
                $(this).removeClass('block-revert');
                var patient_id = this.attr("data-agentID");
                data = {
                    "agentID": patient_id,
                    "tdp": mhc_settings['tdp'],
                    "start_timestamp": mhc_settings['start_timestamp']
                }
                // not used anymore
                post_mhc_message("returnPatient", data);
                return false;
            }

            // revert to the original position
            if ($(this).hasClass('drag-revert') && !leftButtonDown) {
                console.log("reverting");
                var patient_id = this.attr("data-agentID");
                data = {
                    "agentID": patient_id,
                    "tdp": mhc_settings['tdp'],
                    "start_timestamp": mhc_settings['start_timestamp']
                }
                // not used anymore
                post_mhc_message("returnPatient", data);
                return true;
            }
        },
        scroll: false,
        scrollSensitivity: 400
    });

    // keep track of the left mouse button state
    var leftButtonDown;
    $(document).mousedown(function(e) {
        if (e.which === 1) leftButtonDown = true;
    });
    $(document).mouseup(function(e) {
        if (e.which === 1) leftButtonDown = false;
    });

    // specify drop zones for the patient cards
    $(".droppable").droppable({
        tolerance: "pointer",
        drop: function(event, ui) {
            // make sure the user intended to drop it here
            if (leftButtonDown) return false;

            // get the patient and target location
            var patient = ui.draggable.find('.patient_name').text();
            var patient_id = ui.draggable.attr("data-agentID");
            var target = $(this).attr("data-destination");
            if ((target == "IC" && !ICFull) || (target == "ziekenboeg" && !wardFull))
                if (confirm('Weet je zeker dat je ' + patient + ' naar ' + target + ' wilt sturen?')) {
                    // do stuff with our patient, e.g. send the input to MATRX
                    console.log("User wants to send", ui.draggable.find('.patient_name').text(), ' with ID ' + patient_id + " to ", target)

                    // stop reverting
                    ui.draggable.removeClass('drag-revert');

                    // remove the patient card
                    ui.draggable.fadeOut(300, function() {
                        $(this).remove();
                    });
                    sendPatientToDestination(target, lv_agent_id, patient_id)

                }
        }
    });
}



function sendPatientToDestination(target, lv_agent_id, patient_id) {
    // send a message to MATRX with the results of the triage decision
    type = "send_message"
    data = {
        "content": {
            "type": "triage_decision",
            "decision": target,
            "triaged_by": "human"
        },
        "sender": lv_agent_id,
        "receiver": patient_id
    }
    send_matrx_message(type, data);
}

function reassignPatient(target, lv_agent_id,patient_id){
    type = "send_message"
    data = {
        "content": {
            "type": "reassign",
            "assigned_to": target
        },
        "sender": lv_agent_id,
        "receiver": patient_id
    }
    send_matrx_message(type, data);
    }

function setDropZones() {
    $("#home_dropzone").css('left', $("#home_sign_219").position().left - 50);
    $("#home_dropzone").css('top', $("#home_sign_219").position().top);
    $("#ward_dropzone").css('left', $("#ward_sign_217").position().left - 40);
    $("#ward_dropzone").css('top', $("#ward_sign_217").position().top);
    $("#IC_dropzone").css('left', $("#IC_sign_218").position().left - 50);
    $("#IC_dropzone").css('top', $("#IC_sign_218").position().top);
}


/*
 * Add patients with pop-ups
 * @Param patients: a list of patients IDs currently present in the world
 */
function extend_update(patients) {
    worldObjects = Object.keys(lv_state)
    for (var ind in patients) {

        // update the triage countdown
        if (lv_state[patients[ind]].hasOwnProperty("countdown")) {
            var countdown = Math.round(lv_state[patients[ind]]['countdown']);
            if (countdown < 0) { countdown = 0};
            var elem = $("#"+patients[ind]+"patientCardBody #timer .mhc-healthbar");
            if (elem.length != 0) {
                $("#"+patients[ind]+"patientCardBody #timer .countdown_text")[0].innerHTML = countdown + " sec";
                elem[0].style.width = (countdown / lv_state[patients[ind]]['original_countdown'] * 100) + "%";
                if(mhc_settings['tdp'] == 'tdp_dynamic_task_allocation')
                 {
                    if ($("#"+patients[ind]+"patientCardBody input")[0].checked)
                        {$("#"+patients[ind]+"patientCardBody #infoButton").hide();
                        $("#"+patients[ind]+"patientCardBody .agent_triage_decision_preview").show()

                        }
                    else{
                    $("#"+patients[ind]+"patientCardBody #infoButton").show()
                    $("#"+patients[ind]+"patientCardBody .agent_triage_decision_preview").hide()
                    }
                    }

            }
        }

        // remove any triaged patients that are still on screen
        if (lv_state[patients[ind]]['triaged']){
            try{
            $("#" + patients[ind] + "patientCard").remove();} catch{}
            // remove item from patients_cards_open list
            patient_cards_open = patient_cards_open.filter(function(item) {
                return item !== patients[ind];
            })
        }

        // The triage agent takes one or two ticks to generate a triage decision, so replace the triage decision preview
        // placeholder of any uninitialized triage decision previews when the triage decision becomes available
        if( (mhc_settings['tdp'] == 'tdp_supervised_autonomy' || mhc_settings['tdp'] == 'tdp_dynamic_task_allocation') &&
            lv_state[patients[ind]]['agent_planned_triage_decision'] != null) {
            var triage_preview = $("#" + patients[ind] + "_triage_preview");
            if (triage_preview.length > 0) {
                triage_preview[0].innerHTML = lv_state[patients[ind]]['agent_planned_triage_decision'];
                triage_preview[0].style.display = "inline-block";
            }
        }

        // sync the toggle with the backend
        var assigned_to = lv_state[patients[ind]]['assigned_to'];
        var toggle = $("#"+patients[ind]+"patientCardBody input")
        var robot_assigned = (lv_state[patients[ind]]["assigned_to"]=='robot');
        if (toggle.length > 0) {
            toggle[0].checked = robot_assigned;
            if (robot_assigned) {
                $("#"+patients[ind]+"patientCardBody #infoButton").hide();
                $("#"+patients[ind]+"patientCardBody #timer").show();
                $("#"+patients[ind]+"patientCardBody .agent_triage_decision_preview").show();
                $("#"+ patients[ind]+"patientCardBody").removeClass("patientcard-human");
                $("#"+ patients[ind]+"patientCardBody").addClass("patientcard-robot");
            } else {
                $("#"+patients[ind]+"patientCardBody #infoButton").show();
                $("#"+patients[ind]+"patientCardBody #timer").hide();
                $("#"+patients[ind]+"patientCardBody .agent_triage_decision_preview").hide();
                $("#"+ patients[ind]+"patientCardBody").removeClass("patientcard-robot");
                $("#"+ patients[ind]+"patientCardBody").addClass("patientcard-human");
            }
        }


        //Check if there are any recently deceased patients
        if (lv_state[patients[ind]]["health"] < 0 && !deadPatients.includes(patients[ind])) {
            deadPatients.push(patients[ind])
            //if the dead patient was being triaged, close the pop up
            if ($("#" + patients[ind] + "popUp").length>0)
                {$("#dialog-confirm").dialog('close')}
            data = {
                "current_tick": current_tick,
                "tps": tps,
                "patient_id": patients[ind],
                "tdp": mhc_settings['tdp'],
                "start_timestamp": mhc_settings['start_timestamp']
            }
            //f=popupPatientStatus;
            resp = post_mhc_message("updatePatient", data)

        }
        //for the patients that are still alive
        else
            {
                //Check if there are any recently healed patients, add them to the correct list and close their pop up
                //if open
                if (lv_state[patients[ind]]["health"] >= 100 && !healedPatients.includes(patients[ind])) {
                    healedPatients.push(patients[ind])
                    newHealed=true;
                    if ($("#" + patients[ind] + "popUp").length>0)
                        {$("#dialog-confirm").dialog('close')}

                    data = {
                        "current_tick": current_tick,
                        "tps": tps,
                        "patient_id": patients[ind],
                        "tdp": mhc_settings['tdp'],
                        "start_timestamp": mhc_settings['start_timestamp']
                    }
                    //f=popupPatientStatus
                    resp = post_mhc_message("updatePatient", data)
                }
                else
                    {
                    //Check if anybody has been sent home and meke the card disappear
                    if (lv_state[patients[ind]]["is_traversable"] && lv_state[patients[ind]]["medical_care"]=="huis")
                        {
                            fade_out_effect($("#"+patients[ind])[0], 5);
                        }
                     else
                     {
                        $("#"+patients[ind]+"patientCardBody").find("#symptoms").find("span").text(lv_state[patients[ind]]["symptoms"])
                        //try to get the toggle and change it if the patient had not been assigned yet, otherwise leave it to the user
//                        try{
//                            if($("#"+patients[ind]+"patientCardBody input")[0].getAttribute("set")!="robot"&&$("#"+patients[ind]+"patientCardBody input")[0].getAttribute("set")!='person'){
//                                $("#"+patients[ind]+"patientCardBody input")[0].checked = (lv_state[patients[ind]]["assigned_to"]=='robot')
//                                //only show the timer if assigned to the robot
//                                if(! $("#"+patients[ind]+"patientCardBody input")[0].checked){
//                                    $("#"+patientID+"patientCardBody #timer").hide();
//                                }
//                                else {$("#"+patientID+"patientCardBody #timer").show();
//                                }
//                                $("#"+patients[ind]+"patientCardBody input")[0].setAttribute("set", lv_state[patients[ind]]["assigned_to"])
//                                }
//                            } catch{}
                    health=lv_state[patients[ind]]["health"]
                    healthcircle=$("#"+patients[ind]+"patientCardBody").find("#healthCircle")
                    //Update the cards with the correct healthcircle
                    try{
                        if(health<25)
                            {
                            healthcircle[0].style.backgroundColor = "red"
                            }

                        else
                            {
                            if(health<50)
                                {healthcircle[0].style.backgroundColor = "orange"}

                            else
                                {
                                    if(health<75)
                                       {healthcircle[0].style.backgroundColor = "yellow"}
                                    else
                                    {healthcircle[0].style.backgroundColor = "green"}
                                    }
                                    }
                                    }
                            catch{}
                            }



        }
    }
    //Add the counters on top for the total number of available beds
    if (TotalBeds.length == 0 && worldObjects.length > 0) {
        TotalBeds = worldObjects.filter((object) => object.indexOf("Bed_top") >= 0);
        for (bed in TotalBeds) {
            if (lv_state[TotalBeds[bed]]["room"] == "eerste hulp") waitingBeds += 1;
            if (lv_state[TotalBeds[bed]]["room"] == "IC") ICBeds += 1;
            if (lv_state[TotalBeds[bed]]["room"] == "ziekenboeg") wardBeds += 1;

        }
        $("#waitingBeds").html(waitingBeds)
        $("#ICBeds").html(ICBeds)
        $("#wardBeds").html(wardBeds)
        //setDropZones()
    }
    //check if the number of patients has changed - there are less patients than before, or somebody healed
    if (oldPatients.filter(value => patients.includes(value)) != patients.length && worldObjects.length > 0 || newHealed)  {
        missingPatients = oldPatients.filter(value => !patients.includes(value))
        i = 0
        newHealed=false;
        if (missingPatients.length > 0 && i < missingPatients.length) {
            $("#" + missingPatients[i] + "patientCard").remove()

            i += 1
        }
        onScreenPatients = onScreenPatients.filter(value => value != missingPatients[0])
        waiting = 0
        ward = 0;
        ic = 0;
        //change the values of the counters/ make sure that only the relevant buttons are being shown in the pop ups
        for (var ind in patients) {
            if (lv_state[patients[ind]]["medical_care"] == "eerste hulp") waiting += 1
            if (lv_state[patients[ind]]["medical_care"] == "ziekenboeg") ward += 1
            if (lv_state[patients[ind]]["medical_care"] == "IC") ic += 1
        }
        //$("#myHome").html(home)
        $("#myWard").html(ward)
        if (ward == wardBeds) {
            wardFull = true
        } else {
            wardFull = false
            if (!blockedButtons) {
                $("#send_to_ward").show()
            }
        }
        $("#myIC").html(ic)
        if (ic == ICBeds) {
            ICFull = true
        } else {
            ICFull = false
            if (!blockedButtons) {
                $("#send_to_IC").show()
            }
        }
        $("#waitingStatus").html(waiting)
        $("#wardStatus").html(ward)
        $("#ICStatus").html(ic)

        //make the top flicker for dead of healed
        var current_patients_cured = parseInt($("#cured").html());
        if (healedPatients.length > current_patients_cured) {
            fade_out_background($("#cured")[0].parentElement, 200, 0, 255, 0, 0.9);
            fade_out_background($(".infoBar")[0], 200, 0, 255, 0, 0.9);
        }
        $("#cured").html(healedPatients.length)

        var current_patients_died = parseInt($("#dead").html());
        if (deadPatients.length > current_patients_died) {
            fade_out_background($("#dead")[0].parentElement, 200, 255, 0, 0, 0.9);
            fade_out_background($(".infoBar")[0], 200, 255, 0, 0, 0.9);
        }
        $("#dead").html(deadPatients.length)

    }
    //Check if a new patient has been added and add the patient card
    if (patients.filter(value => oldPatients.includes(value)) != patients.length && worldObjects.length > 0 && patients.length > 0) {
        if (patients.filter(value => !onScreenPatients.includes(value)).length > 0) {
            if (!open) {
                patientID = patients.filter(value => !onScreenPatients.includes(value))[0]
                patient = lv_state[patientID]
                //popupPatient(patient);
                open = true
                patientCard = '<div class="card patientcard drag-revert" data-agentID="' + patient.obj_id + '" id="' + patient.obj_id + 'patientCard" >'
                patientCard += gen_patient_card_complete(patient);
                patientCard += '</div>'

                // note that we opened this patient card
                patient_cards_open.push(patient.obj_id);

                $('#patient-cards').append(patientCard);
                newBody = $("#" + patient.obj_id + "patientCardBody")
                opacity = 0.9
                // newBody.css('background-color', 'rgba(0, 0, 255, 0.9)');
                fade_out_background(newBody[0].parentElement, 100, 236, 236, 138, opacity);
                patientCardUtilities()
                open = false;
                //Show the info next to the patient if they have left the waiting room
                $("#" + patientID).hover(function() {
                        if (lv_state[$(this)[0].id]["medical_care"] != "eerste hulp") {
                            $("#patient_Data").show()
                            $("#patient_Data").html(lv_state[$(this)[0].id]['patient_introduction_text'])
                        }
                    },
                    function() {
                        $("#patient_Data").hide();

                    }
                )
                onScreenPatients.push(patientID)
            }
            waiting = 0;
            ward = 0;
            ic = 0;
            //show the correct info in the counters + pop up buttons
            for (var ind in patients) {
                if (lv_state[patients[ind]]["medical_care"] == "eerste hulp") waiting += 1
                if (lv_state[patients[ind]]["medical_care"] == "ziekenboeg") ward += 1
                if (lv_state[patients[ind]]["medical_care"] == "IC") ic += 1
            }
            $("#myWard").html(ward)
            $("#myIC").html(ic)
            if (ward == wardBeds) {
                wardFull = true
            } else {
                wardFull = false
                if (!blockedButtons) {
                    $("#send_to_ward").removeClass("not-visible")
                    $("#send_to_ward").addClass("visible")
                }
            }
            $("#myIC").html(ic)
            if (ic == ICBeds) {
                ICFull = true
            } else {
                ICFull = false
                if (!blockedButtons) {
                    $("#send_to_IC").removeClass("not-visible")
                    $("#send_to_IC").addClass("visible")
                }
            }
            $("#waitingStatus").html(waiting)
            $("#wardStatus").html(ward)
            $("#ICStatus").html(ic)
            $("#cured").html(healedPatients.length)
            $("#dead").html(deadPatients.length)
        }
        oldPatients = patients;

    }
    };

}


function popupPatientStatus(data) {
    //gen_patient_popup(patientID)
    $("#dialog-update").html(gen_patient_status_popUp(data["patient_id"], data["result"], data["time"], data["choice"]));
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
            $('#patient-cards').removeClass("blurred")
        },
        width: '30%',
        modal: true,
        open: function(event, ui) {
            $('#dialog-confirm').parent('.ui-dialog').css('zIndex', 10000)
            $('#container').addClass("blurred")
            $('#patient-cards').addClass("blurred")
        },
        buttons: [],
    });

}

// sleep for x milliseconds before doing other code
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function popupPatient(patientID) {
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
        $("#dialog-confirm").html(gen_patient_popup(patientID));
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



    $("#dialog-confirm").html(gen_patient_popup(patientID));
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
            $('#patient-cards').removeClass("blurred")
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
            $('#patient-cards').addClass("blurred")
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
                    var currPatient = lv_state[patientID];
                    if (currPatient['IC_foil'] != 'None') {
                        large_dialog = true;
                        are_you_sure_text = `<div class="dss_agent_foil_question">${are_you_sure_text}</div>`;
                        are_you_sure_text += `
                            <div class="dss_agent_foil_explanation">
                                <div id="agent_predictions">
                                    ${currPatient['IC_foil']}
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
                            //makeScreenshot(patientID);
                             data = {
                            "current_tick": current_tick,
                            "tps": tps,
                            "agentID": patientID,
                            "tdp": mhc_settings['tdp'],
                            "start_timestamp": mhc_settings['start_timestamp']
                                }
                           var confirm_confirm = $(this);
                           var resp = $.ajax({
                                method: "POST",
                                url: mhc_url + ":" + port_mhc + "/" + "pickupPatient",
                                contentType: "application/json; charset=utf-8",
                                dataType: 'json',
                                data: JSON.stringify(data),
                                success: function(response) {
                                   sendPatientToDestination("IC", lv_agent_id, patientID)
                                    $("#" + patientID + "patientCard").remove();
                                    patient_cards_open.pop(patientID)
                                    $('#container').removeClass("blurred")
                                    $('#patient-cards').removeClass("blurred")
                                    open = false;

                                    // close the second confirmation dialog
                                    confirm_confirm.dialog("close");
                                    //close the triage dialog
                                    dialog1.dialog("close");

                                }
                            });

                            /*sleep(500).then(() => {
                                sendPatientToDestination("IC", lv_agent_id, patientID)
                                $("#" + patientID + "patientCard").remove();
                                patient_cards_open.pop(patientID)
                                $('#container').removeClass("blurred")
                                $('#patient-cards').removeClass("blurred")
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
                    var currPatient = lv_state[patientID];
                    if (currPatient['Ziekenboeg_foil'] != 'None') {
                        large_dialog = true;
                        are_you_sure_text = `<div class="dss_agent_foil_question">${are_you_sure_text}</div>`;
                        are_you_sure_text += `
                            <div class="dss_agent_foil_explanation">
                                <div id="agent_predictions">
                                    ${currPatient['Ziekenboeg_foil']}
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
                            //makeScreenshot(patientID);

                            data = {
                            "current_tick": current_tick,
                            "tps": tps,
                            "agentID": patientID,
                            "tdp": mhc_settings['tdp'],
                            "start_timestamp": mhc_settings['start_timestamp']
                                }
                            var confirm_confirm = $(this);
                            var resp = $.ajax({
                                method: "POST",
                                url: mhc_url + ":" + port_mhc + "/" + "pickupPatient",
                                contentType: "application/json; charset=utf-8",
                                dataType: 'json',
                                data: JSON.stringify(data),
                                success: function(response) {
                                   sendPatientToDestination("ziekenboeg", lv_agent_id, patientID)
                                    $("#" + patientID + "patientCard").remove();
                                    patient_cards_open.pop(patientID)
                                    $('#container').removeClass("blurred")
                                    $('#patient-cards').removeClass("blurred")
                                    open = false;

                                    // close the second confirmation dialog
                                    confirm_confirm.dialog("close");
                                    //close the triage dialog
                                    dialog1.dialog("close");

                                }
                            });
                            /*sleep(500).then(() => {
                                sendPatientToDestination("ziekenboeg", lv_agent_id, patientID)
                                $("#" + patientID + "patientCard").remove();
                                patient_cards_open.pop(patientID)
                                $('#container').removeClass("blurred")
                                $('#patient-cards').removeClass("blurred")
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
                    var currPatient = lv_state[patientID];
                    if (currPatient['Huis_foil'] != 'None') {
                        large_dialog = true;
                        are_you_sure_text = `<div class="dss_agent_foil_question">${are_you_sure_text}</div>`;
                        are_you_sure_text += `
                            <div class="dss_agent_foil_explanation">
                                <div id="agent_predictions">
                                    ${currPatient['Huis_foil']}
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
                            "agentID": patientID,
                            "tdp": mhc_settings['tdp'],
                            "start_timestamp": mhc_settings['start_timestamp']
                                }
                          var confirm_confirm = $(this);
                           var resp = $.ajax({
                                method: "POST",
                                url: mhc_url + ":" + port_mhc + "/" + "pickupPatient",
                                contentType: "application/json; charset=utf-8",
                                dataType: 'json',
                                data: JSON.stringify(data),
                                success: function(response) {
                                   sendPatientToDestination("huis", lv_agent_id, patientID)
                                   if (onScreenPatients.includes(patientID)) {
                                       homePatients += 1;
                                       $("#myHome").html(homePatients)
                                       }
                                   $("#" + patientID + "patientCard").remove();
                                   patient_cards_open.pop(patientID)
                                    $('#container').removeClass("blurred")
                                    $('#patient-cards').removeClass("blurred")
                                    open = false;

                                     // close the second confirmation dialog
                                     confirm_confirm.dialog("close");
                                     //close the triage dialog
                                      dialog1.dialog("close");

                                }
                            });

                            /*sleep(500).then(() => {
                                sendPatientToDestination("huis", lv_agent_id, patientID)
                                if (onScreenPatients.includes(patientID)) {
                                    homePatients += 1;
                                    $("#myHome").html(homePatients)
                                }
                                $("#" + patientID + "patientCard").remove();
                                patient_cards_open.pop(patientID)
                                $('#container').removeClass("blurred")
                                $('#patient-cards').removeClass("blurred")
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
function makeScreenshot(patientID) {
    data = {
        "current_tick": current_tick,
        "tps": tps,
        "agentID": patientID,
        "tdp": mhc_settings['tdp'],
        "start_timestamp": mhc_settings['start_timestamp']
    }

   var resp = $.ajax({
        method: "POST",
        url: mhc_url + ":" + port_mhc + "/" + "pickupPatient",
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        data: JSON.stringify(data),
        success: function(response) {
           sendPatientToDestination("huis", lv_agent_id, patientID)
           if (onScreenPatients.includes(patientID)) {
               homePatients += 1;
               $("#myHome").html(homePatients)
               }
           $("#" + patientID + "patientCard").remove();
           patient_cards_open.pop(patientID)
            $('#container').removeClass("blurred")
            $('#patient-cards').removeClass("blurred")
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

            //            if (f != 'undefined') {
            //                f(response)
            //            }

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
 * Generate the HTML template for the patient triage decision popup, and fill it with patient data
 */
function gen_patient_popup(patientID) {
    currPatient = lv_state[patientID];

    // Each TDP has slightly different information in the popup

    // baseline info
    if (mhc_settings['tdp'] == 'baseline'  || mhc_settings['tdp'] == 'tdp_dynamic_task_allocation') {
        return gen_patient_popup_baseline(currPatient);

    // TDP decision support with potential bias for exp 1
    } else if (mhc_settings['tdp'] == 'tdp_decision_support_potential_bias') {
        return gen_patient_popup_dss_bias(currPatient);

    // TDP decision support with explanations for exp 2 & 3
    } else if (mhc_settings['tdp'] == 'tdp_decision_support_explained') {
        return gen_patient_popup_dss_explained(currPatient);


    } else if (mhc_settings['tdp'] == 'tdp_supervised_autonomy') {
        return gen_patient_popup_autonomy(currPatient);
    }
}



/*
 * Generate the patient popup with all required info for the baseline
 */
function gen_patient_popup_baseline(currPatient) {
    patient_data = `
    <div id="${patientID}popUp" class="patient_card_body">
        <div id="patient_identification" class="row">
            <div class="col-3">
                <img src="/fetch_external_media/${currPatient['patient_photo']}" class="patient_photo popUp_photo">
            </div>
            <div class="col-9">
                <div class="patient_name_wrapper">
                    <div class="patient_number">Patient ${currPatient['number']}</div>
                    <h2 class="patient_name">${currPatient['patient_name']}</h2>
                </div>
                <div class="patient_properties container">
                    <div class="row">
                        <div class="patient_property col-6"><img src="/fetch_external_media/gender.svg" title="Geslacht">${currPatient["gender"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/symptoms.svg" title="Symptomen">${currPatient["symptoms"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/calendar.svg" title="Leeftijd">${currPatient["age"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/fitness2.png" title="Fitheid">${currPatient["fitness"]}</div>
                        <div class="patient_property col-12"><img src="/fetch_external_media/home_situation.svg" title="Thuis situatie">${currPatient["home_situation"]}</div>
                        <div class="patient_property col-12"><img src="/fetch_external_media/work.svg" title="Baan">${currPatient["profession"]}</div>
                    </div>
                </div>
            </div>

        </div>

        <div class="patient_card_inner_divider"><hr></div>

        <div class="card-body">
           ${currPatient['patient_introduction_text']}
        </div>
        <div class="row">
                <div id="Timer">Tijd : 7s</div>
        </div>
    </div>`;
    return patient_data;
}



/*
 * Generate the patient popup with all required info for the TDP decision support with potential bias (experiment 2 & 3)
 */
function gen_patient_popup_dss_bias(currPatient) {

    // fetch the correct agent suggestion for experiment 1: decision support with (un)biased suggestions
    var care_suggestion = currPatient['care_suggestion_unbiased'];
    if (mhc_dss_biased_suggestion) {
        care_suggestion = currPatient['care_suggestion_biased'];
    }

    patient_data = `
    <div id="${patientID}popUp" class="patient_card_body">
        <div id="patient_identification" class="row">
            <div class="col-3">
                <img src="/fetch_external_media/${currPatient['patient_photo']}" class="patient_photo popUp_photo">
            </div>
            <div class="col-9">
                <div class="patient_name_wrapper">
                    <div class="patient_number">Patient ${currPatient['number']}</div>
                    <h2 class="patient_name">${currPatient['patient_name']}</h2>
                </div>
                <div class="patient_properties container">
                    <div class="row">
                        <div class="patient_property col-6"><img src="/fetch_external_media/gender.svg" title="Geslacht">${currPatient["gender"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/symptoms.svg" title="Symptomen">${currPatient["symptoms"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/calendar.svg" title="Leeftijd">${currPatient["age"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/fitness2.png" title="Fitheid">${currPatient["fitness"]}</div>
                        <div class="patient_property col-12"><img src="/fetch_external_media/home_situation.svg" title="Thuis situatie">${currPatient["home_situation"]}</div>
                        <div class="patient_property col-12"><img src="/fetch_external_media/work.svg" title="Baan">${currPatient["profession"]}</div>
                    </div>
                </div>
            </div>

        </div>

        <div class="patient_card_inner_divider"><hr></div>

        <div class="card-body">
           ${currPatient['patient_introduction_text']}
        </div>
        <div class="row">
                <div id="Timer">Tijd : 7s</div>
        </div>
    </div>

    <div class="dss_agent_predictions">
        <div id="agent_predictions">
            <table id="agent_predictions_table" class="table table-bordered table-striped">
                <thead>
                    <tr><th></th><th>Op de IC</th><th>In de ziekenboeg</th><th>Thuis</th></tr>
                </thead>
                <tbody>
                    <tr><td>Overlevingskans</td><td>${(currPatient['survival_IC']*100).toFixed(0)}% </td><td>${(currPatient['survival_ziekenboeg']*100).toFixed(0)}% </td><td>${(currPatient['survival_huis']*100).toFixed(0)}% </td></tr>
                    <tr><td>Verwachte opnameduur</td><td>${sickness_updates_to_hours(currPatient['opnameduur_IC'])}</td><td>${sickness_updates_to_hours(currPatient['opnameduur_ziekenboeg'])}</td><td>${sickness_updates_to_hours(currPatient['opnameduur_huis'])}</td></tr>
                    <tr><td>Verwachte resterende levensjaren</td><td style="text-align:center" colspan=3>${currPatient['remaining_life_years']} jaar</td></tr>

                </tbody>
            </table>
            <b>Advies: Stuur naar <span id="care_suggestion">${care_suggestion}</span></b>
        </div>

        <img class="tdp_dss_robot" src="/fetch_external_media/dss_robot.png">
        <img class="dialogRobotHome" src="/fetch_external_media/dss_robot.png">
        <img class="dialogRobotWard" src="/fetch_external_media/dss_robot.png">
        <img class="dialogRobotIC" src="/fetch_external_media/dss_robot.png">
    </div>`;

    return patient_data;
}



/*
 * Generate the patient popup with all required info for the TDP decision support with explanatiosn (experiment 2 & 3)
 */
function gen_patient_popup_dss_explained(currPatient) {

    patient_data = `
    <div id="${patientID}popUp" class="patient_card_body">
        <div id="patient_identification" class="row">
            <div class="col-3">
                <img src="/fetch_external_media/${currPatient['patient_photo']}" class="patient_photo popUp_photo">
            </div>
            <div class="col-9">
                <div class="patient_name_wrapper">
                    <div class="patient_number">Patient ${currPatient['number']}</div>
                    <h2 class="patient_name">${currPatient['patient_name']}</h2>
                </div>
                <div class="patient_properties container">
                    <div class="row">
                        <div class="patient_property col-6"><img src="/fetch_external_media/gender.svg" title="Geslacht">${currPatient["gender"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/symptoms.svg" title="Symptomen">${currPatient["symptoms"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/calendar.svg" title="Leeftijd">${currPatient["age"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/fitness2.png" title="Fitheid">${currPatient["fitness"]}</div>
                        <div class="patient_property col-12"><img src="/fetch_external_media/home_situation.svg" title="Thuis situatie">${currPatient["home_situation"]}</div>
                        <div class="patient_property col-12"><img src="/fetch_external_media/work.svg" title="Baan">${currPatient["profession"]}</div>
                    </div>
                </div>
            </div>

        </div>

        <div class="patient_card_inner_divider"><hr></div>

        <div class="card-body">
           ${currPatient['patient_introduction_text']}
        </div>
        <div class="row">
                <div id="Timer">Tijd : 7s</div>
        </div>
    </div>

    <div class="dss_agent_predictions">
        <div id="agent_predictions">
            <table id="agent_predictions_table" class="table table-bordered table-striped">
                <thead>
                    <tr><th></th><th>Op de IC</th><th>In de ziekenboeg</th><th>Thuis</th></tr>
                </thead>
                <tbody>
                    <tr><td>Overlevingskans</td><td>${(currPatient['survival_IC']*100).toFixed(0)}% </td><td>${(currPatient['survival_ziekenboeg']*100).toFixed(0)}% </td><td>${(currPatient['survival_huis']*100).toFixed(0)}% </td></tr>
                    <tr><td>Verwachte opnameduur</td><td>${sickness_updates_to_hours(currPatient['opnameduur_IC'])}</td><td>${sickness_updates_to_hours(currPatient['opnameduur_ziekenboeg'])}</td><td>${sickness_updates_to_hours(currPatient['opnameduur_huis'])}</td></tr>
                    <tr><td>Verwachte resterende levensjaren</td><td style="text-align:center" colspan=3>${currPatient['remaining_life_years']} jaar</td></tr>

                </tbody>
            </table>
            <b>Advies: Stuur naar <span id="care_suggestion">${currPatient['care_suggestion']}</span></b>
            <br><br>

            ${currPatient['confidence_explanation']}
            <br><br>
            ${currPatient['advice_explanation']}
        </div>

        <img class="tdp_dss_robot" src="/fetch_external_media/dss_robot.png">
        <img class="dialogRobotHome" style="width: auto;height: 100px;" src="/fetch_external_media/dss_robot.png">
        <img class="dialogRobotWard" style="width: auto;height: 100px;" src="/fetch_external_media/dss_robot.png">
        <img class="dialogRobotIC" style="width: auto;height: 100px;" src="/fetch_external_media/dss_robot.png">
    </div>`;

    return patient_data;
}



/*
 * Generate the patient popup with all required info for the TDP dynamic task allocation (experiment 2 & 3)
 */
function popupPatientDynamicTaskAllocation(patientID) {
    // check if we are displaying a decision support triage window or a regular one
    var classes = "source_dialog mhc_show_explanations";
    var width = "94%";
    var maxHeight = 950;

    var assign_to_agent = $("#"+patientID+"patientCardBody input")[0].checked;

    // assigning from the the human to the robot
    if (assign_to_agent) {
        var buttons_unblocked = {
            "Wijs aan robot toe": function() {
                // assign the patient to the robot
                reassignPatient("robot", lv_agent_id, patientID)
                $(this).dialog('close');
            },
            "Annuleren": function() {
                // the patient was still assigned to the human, so closing the window is enough
                $(this).dialog('close');
            },
        }

        var buttons_blocked = {
            "Annuleren": function() {
                // the patient was still assigned to the human, so closing the window is enough
                $(this).dialog('close');
            },
        }

        $("#dialog-confirm").html(gen_patient_popup_dynamic(lv_state[patientID], assign_patient_to="robot"));
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
            },
            buttons: (lv_state[patientID]['can_be_triaged_by_agent']) ? buttons_unblocked : buttons_blocked,
        });

    // assign from robot to person
    } else {
        // first assign the patient to the test subject (no timer), so the test subject has enough time to consider the choice
        reassignPatient("person", lv_agent_id, patientID)

        // open de popup en vraag om confirmation
        $("#dialog-confirm").html(gen_patient_popup_dynamic(lv_state[patientID], assign_patient_to="person"));
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
            },
            buttons: {
                "Wijs aan mij toe": function() {
                    // the patient is already assigned to the test subject, so closing is enough
                    $(this).dialog('close');
                },
                "Annuleren": function() {
                    // assign back to the robot
                    reassignPatient("robot", lv_agent_id, patientID)
                    $(this).dialog('close');
                },
            }
        });
    }
    return;
}


/*
 * Generate the patient popup content with all required info for the TDP dynamic task allocation (experiment 2 & 3)
 */
function gen_patient_popup_dynamic(currPatient, assign_patient_to) {

    patient_data = `
    <div id="${patientID}popUp" class="patient_card_body">
        <div id="patient_identification" class="row">
            <div class="col-3">
                <img src="/fetch_external_media/${currPatient['patient_photo']}" class="patient_photo popUp_photo">
            </div>
            <div class="col-9">
                <div class="patient_name_wrapper">
                    <div class="patient_number">Patient ${currPatient['number']}</div>
                    <h2 class="patient_name">${currPatient['patient_name']}</h2>
                </div>
                <div class="patient_properties container">
                    <div class="row">
                        <div class="patient_property col-6"><img src="/fetch_external_media/gender.svg" title="Geslacht">${currPatient["gender"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/symptoms.svg" title="Symptomen">${currPatient["symptoms"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/calendar.svg" title="Leeftijd">${currPatient["age"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/fitness2.png" title="Fitheid">${currPatient["fitness"]}</div>
                        <div class="patient_property col-12"><img src="/fetch_external_media/home_situation.svg" title="Thuis situatie">${currPatient["home_situation"]}</div>
                        <div class="patient_property col-12"><img src="/fetch_external_media/work.svg" title="Baan">${currPatient["profession"]}</div>
                    </div>
                </div>
            </div>

        </div>

        <div class="patient_card_inner_divider"><hr></div>

        <div class="card-body">
           ${currPatient['patient_introduction_text']}
        </div>
    </div>

    <div class="dss_agent_predictions">
        <div id="agent_predictions">`;


    // sort influences from big (positive) influence to small (negative)
    var influences = currPatient['agent_triage_decision_influences'];
    var sortable = [];
    for (var infl in influences) {
        sortable.push([infl, influences[infl]['reason'], influences[infl]['influence']]);
    }
    sortable.sort(function(a, b) {
        if (Math.abs(a[2]) > Math.abs(b[2])) return -1;
        if (Math.abs(a[2]) < Math.abs(b[2])) return 1;
    });


    // mens mag altijd patiënten overnemen die naar huis worden gestuurd
    if (currPatient['can_be_triaged_by_agent'] && currPatient['agent_planned_triage_decision'] == 'huis') {
        patient_data += `Deze patiënt kan <b>wel</b> door de computer worden opgepakt omdat omdat deze naar huis gestuurd zou moeten worden en er is dus geen sprake is van een tekort aan bedden.`;
        patient_data += `<br><br><b>Deze patiënt moet naar huis wegens de door u opgestelde prioriteiten. De volgende zijn hierin de 3 belangrijkste in dit besluit:</b><br>`;

        // show max 3 attributes
        var max = (sortable.length < 3) ? sortable.length : 3;
        for (i = 1; i < max + 1; i++) {
            try{patient_data += `&nbsp;&nbsp;${i}. ${sortable[i-1][1]}<br>`;}
            catch{}
        }

        // make the question whether to assign or not
        var assign_to = (assign_patient_to == "person") ? "jezelf" : "de robot";
        patient_data += `<br><br><b>Weet je zeker dat je deze patiënt aan ${assign_to} wilt toewijzen?</b>`;


    // geen onzekerheid, zowel mens als agent kunnen hem doen
    } else if (currPatient['can_be_triaged_by_agent']) {
        patient_data += `Deze patiënt kan <b>wel</b> door de computer worden opgepakt omdat er <b>geen sprake lijkt te zijn van een dilemma</b>.<br><br> De patiënt moet naar de ${currPatient['agent_planned_triage_decision']} gestuurd worden en er zijn voldoende bedden beschikbaar voor zowel deze patiënt als alle anderen nu in de wachtkamer die ook naar de ${currPatient['agent_planned_triage_decision']} gestuurd moeten worden.`;
        patient_data += `<br><br><b>Deze patiënt moet naar de ${currPatient['agent_planned_triage_decision']} wegens de door u opgestelde prioriteiten. De volgende zijn hierin de 3 belangrijkste in dit besluit:</b><br>`;

        // show max 3 attributes
        var max = (sortable.length < 3) ? sortable.length : 3;
        for (i = 1; i < max + 1; i++) {
            try{patient_data += `&nbsp;&nbsp;${i}. ${sortable[i-1][1]}<br>`;}
            catch{}
        }

        // make the question whether to assign or not
        var assign_to = (assign_patient_to == "person") ? "jezelf" : "de robot";
        patient_data += `<br><br><b>Weet je zeker dat je deze patiënt aan ${assign_to} wilt toewijzen?</b>`;
    }

    // wel onzekerheid, mens moet hem verplicht doen want agent kan hem niet doen
    else {

        console.log(patient, sortable)
        var care_contending_string = "";
        currPatient['care_contending_patients'].forEach(function(patient) {
            if (care_contending_string != "") {
                care_contending_string += ", "
            }
            care_contending_string += patient
        })

        patient_data += `Deze patiënt kan <b>niet</b> door de computer worden opgepakt omdat er sprake lijkt te zijn van <b>een dilemma</b>. <br><br>De patiënt moet naar de ${currPatient['agent_planned_triage_decision']} gestuurd worden maar er zijn maar ${$("#ICBeds").text()} bedden beschikbaar voor zowel deze patiënt als de ${currPatient['care_contending_patients'].length} anderen patiënten nu in de wachtkamer die ook naar de ${currPatient['agent_planned_triage_decision']} gestuurd moeten worden.`;
        patient_data += `<br><br>Deze ${currPatient['care_contending_patients'].length} andere patiënten zijn ${care_contending_string}.<br><br>`;
        patient_data += `<b>Deze patiënt moet naar de ${currPatient['agent_planned_triage_decision']} wegens de door u opgestelde prioriteiten. De volgende zijn hierin de 3 belangrijkste in dit besluit:</b><br>`;

        // show max 3 attributes for the exaplanation
        var max = (sortable.length < 3) ? sortable.length : 3;
        for (i = 1; i < max + 1; i++) {
            try{patient_data += `&nbsp;&nbsp;${i}. ${sortable[i-1][1]}<br>`;}
            catch{}
        }

    }


    // make the question whether to assign or not
    patient_data += `</div></div><img class="tdp_dss_robot" src="/fetch_external_media/dss_robot.png">`;


    return patient_data;
}


/*
 * Generate the patient popup with all required info for the TDP supervised autonomy (experiment 2 & 3)
 */
function gen_patient_popup_autonomy(currPatient) {

    patient_data = `
    <div id="${patientID}popUp" class="patient_card_body">
        <div id="patient_identification" class="row">
            <div class="col-3">
                <img src="/fetch_external_media/${currPatient['patient_photo']}" class="patient_photo popUp_photo">
            </div>
            <div class="col-9">
                <div class="patient_name_wrapper">
                    <div class="patient_number">Patient ${currPatient['number']}</div>
                    <h2 class="patient_name">${currPatient['patient_name']}</h2>
                </div>
                <div class="patient_properties container">
                    <div class="row">
                        <div class="patient_property col-6"><img src="/fetch_external_media/gender.svg" title="Geslacht">${currPatient["gender"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/symptoms.svg" title="Symptomen">${currPatient["symptoms"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/calendar.svg" title="Leeftijd">${currPatient["age"]}</div>
                        <div class="patient_property col-6"><img src="/fetch_external_media/fitness2.png" title="Fitheid">${currPatient["fitness"]}</div>
                        <div class="patient_property col-12"><img src="/fetch_external_media/home_situation.svg" title="Thuis situatie">${currPatient["home_situation"]}</div>
                        <div class="patient_property col-12"><img src="/fetch_external_media/work.svg" title="Baan">${currPatient["profession"]}</div>
                    </div>
                </div>
            </div>

        </div>

        <div class="patient_card_inner_divider"><hr></div>

        <div class="card-body">
           ${currPatient['patient_introduction_text']}
        </div>
    </div>

    <div class="dss_agent_predictions">
        <div id="agent_predictions">
            <b>Deze patient wordt gestuurd naar: ${currPatient['agent_planned_triage_decision']}. <br><br>Op onderstaande manier droegen de verschillende eigenschappen bij aan de prioriteitsbepaling voor de benodigde zorg (hoe hoger de prioriteit des te eerder een patient toegewezen wordt aan de IC):</b>
            <br>`;

    // sort influences from big (positive) influence to small (negative)
    var influences = currPatient['agent_triage_decision_influences'];
    var sortable = [];
    for (var infl in influences) {
        sortable.push([infl, influences[infl]['reason'], influences[infl]['influence']]);
    }
    sortable.sort(function(a, b) {
        if (a[2] > b[2]) return -1;
        if (a[2] < b[2]) return 1;
    });

    var pos_attributes = [];
    var neg_attributes = [];
    var neutr_attributes = [];

    // show all influences
    sortable.forEach(function(item) {
        if (item[2] > 0) {
            pos_attributes.push(item);
        } else if (item[2] < 0 ) {
            neg_attributes.push(item);
        } else {
            neutr_attributes.push(item);
        }
    })

    // positive attributes
    if (pos_attributes.length > 0) {
        patient_data += "<br>De volgende zorgde voor een hoge prioriteit:<br>"
        var i = 1;
        pos_attributes.forEach(function(pos_item) {
            patient_data += `&nbsp;&nbsp;${i++}. ${pos_item[1]}<br>`;
        })
    }

    // negative attributes
    if (neg_attributes.length > 0) {
        patient_data += "<br>De volgende verlaagde juist de prioriteit:<br>"
        var i = 1;
        neg_attributes.forEach(function(neg_item) {
            patient_data += `&nbsp;&nbsp;${i++}. ${neg_item[1]}<br>`;
        })
    }

    // neutral attributes
    if (neutr_attributes.length > 0) {
        patient_data += "<br>Deze hadden geen effect op de prioriteit:<br>"
        var i = 1;
        neutr_attributes.forEach(function(neutr_item) {
            patient_data += `&nbsp;&nbsp;${i++}. ${neutr_item[1]}<br>`;
        })
    }

    patient_data += `</div>

        <img class="tdp_dss_robot" src="/fetch_external_media/dss_robot.png">
    </div>`;

    return patient_data;
}



// convert sickness updates (of the sickness model) to ticks (defined in config), to hours (1 tick = 0.5h)
function sickness_updates_to_hours(s_updates) {
//    console.log("Mhc settings:", mhc_settings);

    // calc how many ticks are between each sickness udpate
//    var s_per_sickness_update = mhc_settings['config']['patients']['update_sickness_every_x_seconds'];
//    var ticks_per_s = s_per_sickness_update / mhc_settings['config']['world']['tick_duration'];
//    var ticks = s_updates * ticks_per_s

    var ticks = s_updates;
    var hours = ticks / 2;

    // longer than 24 hours is calculated to a day
    if (hours >= 24) {
        return (hours / 24).toFixed(1) + " dagen";

    // less than 24 hours, display in hours
    } else {
        return hours.toFixed(1)  + " uren"
    }
}


function gen_patient_status_popUp(patientID, result, time, choice) {
    currPatient = lv_state[patientID]
    patient_data = `
    <div id="${currPatient.obj_id}patientCardBody" class="patient_card_body">
        <div id="patient_identification" class="row">
            <div class="col-3">
                <img src="/fetch_external_media/${currPatient['patient_photo']}" class="patient_photo popUp_photo">
            </div>
            <div class="col-7">
                <div class="patient_name_wrapper">
                    <div class="patient_number">Patient ${currPatient['number']}</div>
                    <h2 class="patient_name">${currPatient['patient_name']}</h2>
                </div>
            </div>
            <div class="col-2 patient_identification_right">
                <img src="/fetch_external_media/exit_complete.png">
            </div>
        </div>

        <div class="patient_card_inner_divider"><hr></div>

        <div class="card-body">
            U koos voor medische zorg ${choice} na ${time} minuten wachten in de noodopvang,
            waardoor de persoon volledig ${result} is.
        </div>
    </div>`;

    return patient_data
}

/*
 * Return a patient card filled with the data of the patient
 */
function gen_patient_card_complete(patient_data) {
    patientPhoto = '/fetch_external_media/' + patient_data["patient_photo"]
    //"/fetch_external_media/patients/patient_"+(patient_data['number']+1)+".jpg"

    patient_card_html = `
    <div id="${patient_data.obj_id}patientCardBody" class="patient_card_body">
        <div id="patient_identification" class="row">
            <div class="col-3">
                <img src=${patientPhoto} class="patient_photo">
            </div>
            <div class="col-6">
                <div class="patient_name_wrapper">
                    <div class="patient_number">Patient ${patient_data['number']}</div>
                    <h2 class="patient_name">${patient_data['patient_name']}</h2>
                 </div>
                 <div class="mhc-healthcircle-border-patientCard"><div class="mhc-healthcircle-patientCard" id="healthCircle" style="background-color: orange;"></div>
        </div>
            </div>
         <div class="col-3 ">
            `

    //add the toggle
    if((mhc_settings['tdp'] == 'tdp_dynamic_task_allocation') && patient_data['countdown'] > 0) {
        patient_card_html += `

            <div class="patient_property col-12" id="toggle">
                <img src="/fetch_external_media/person.png" class="toggle-image">
                <label class="switch">
                    <input type="checkbox"  onclick=popupPatientDynamicTaskAllocation("${patient_data.obj_id}") set="None" checked>
                    <span class="slider round"></span>
                </label>
                <img src="/fetch_external_media/robot.svg" class="toggle-image">
            </div>
            <!-- spacer to make room for the toggle -->
            <div class="col-12" style="height:10px;"></div>
            `;
    }
    // add the countdown for agent triage
    if((mhc_settings['tdp'] == 'tdp_supervised_autonomy' || mhc_settings['tdp'] == 'tdp_dynamic_task_allocation') && patient_data['countdown'] > 0){
        patient_card_html +=
        `<div class="patient_property col-12" id="timer">
            <div class="mhc-healthbar-border">
                <div class="mhc-healthbar" style="width: 100%;"> </div>
            </div>
            <span class="countdown_text"></span>
         </div>`;
     }

    patient_card_html += `

                <button class="btn btn-info collapsed" type="button"
                        data-target="#collapse_${patient_data.obj_id}" aria-expanded="false"
                        onclick=popupPatient("${patient_data.obj_id}"); aria-controls="collapse_${patient_data.obj_id}"
                        id="infoButton">Trieer</button></div>
        </div>

        <div class="patient_card_inner_divider"><hr></div>

        <div class="collapse patient_extra_info_collapse" id="collapse_${patient_data.obj_id}">
            <div class="card-body">
                ${patient_data['patient_introduction_text']}
            </div>
        </div>

        <div class="patient_properties container">
            <div class="row">
                <div class="patient_property col-6" id="gender"><img src="/fetch_external_media/gender.svg" title="Geslacht"> <span>${patient_data["gender"]}</span></div>
                <div class="patient_property col-6" id="symptoms"><img src="/fetch_external_media/symptoms.svg" title="Symptomen" ><span>${patient_data["symptoms"]}</span></div>
                <div class="patient_property col-6" id="age"><img src="/fetch_external_media/calendar.svg" title="Leeftijd" ><span>${patient_data["age"]}</span></div>
                <div class="patient_property col-6" id="fitness"><img src="/fetch_external_media/fitness2.png" title="Fitness" ><span>${patient_data["fitness"]}</span></div>
                <div class="patient_property col-12" id="home_situation"><img src="/fetch_external_media/home_situation.svg" title="Buurgerlijke staat" ><span>${patient_data["home_situation"]}</span></div>
                <div class="patient_property col-12" id="profession"><img src="/fetch_external_media/work.svg" title="Beroep" ><span>${patient_data["profession"]}</span></div>
            </div>
        </div>`;


    // For the supervised autonomy and dynamic allocation
    // TODO: also add for TDP 2 for patients assigned to agent
    if (mhc_settings['tdp'] == 'tdp_supervised_autonomy' || mhc_settings['tdp'] == 'tdp_dynamic_task_allocation') {
//        console.log(patient_data)
        patient_card_html += `<div class="agent_triage_decision_preview"><div class="agent_decision_preview_text">Naar: <span id="${patient_data['obj_id']}_triage_preview">${patient_data['agent_planned_triage_decision']}</span></div><img src="/fetch_external_media/robot_decision_preview.png"</div>`;
    }

    patient_card_html += `</div>`;
    return patient_card_html;
}



/*
 * Parse the settings object
 * @param settings_obj: the MATRX settings object
 */
function parse_mhc_settings(settings_obj) {

    // hide the your vs robot patients
    if (!settings_obj['visualize_your_vs_robot_patients']) {
        var my_patients = $('#myPatients');
        my_patients.next().hide();
        my_patients.hide();

        var robot_patients = $('#robotPatients');
        robot_patients.next().hide();
        robot_patients.hide();
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