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

// function patientCardUtilities() {
//     $("#patient-cards").sortable({
//         placeholder: "patientcard-placeholder",
//         cursor: "move",
//         revert: true,
//         // started sorting, block revert
//         start: function(event, ui) {
//             //            console.log("start sort:, adding block-revert");
//             ui.item.addClass("block-revert");
//             var patient_id = ui.item.attr("data-agentID");
//             data = {
//                 "current_tick": current_tick,
//                 "tps": tps,
//                 "agentID": patient_id,
//                 "tdp": mhc_settings['tdp'],
//                 "start_timestamp": mhc_settings['start_timestamp']
//             }
//             setTimeout(function() {
//                 post_mhc_message("pickupPatient", data);
//             }, 30);

//         },
//         // moved out, activate revert
//         out: function(event, ui) {
//             //            console.log("out:, removing block-revert");
//             ui.item.removeClass("block-revert");
//         },
//         // moved into sorting list, block double revert
//         over: function(event, ui) {
//             //            console.log("in:, adding block-revert");
//             ui.item.addClass("block-revert");
//         }
//     });

//     // we also want to drag patient cards to drop zones
//     $(".patientcard").draggable({
//         connectToSortable: "#patient-cards",
//         revert: function() {
//             console.log("checking revert");
//             // send a message to the MHC visualizer to make a screenshot

//             // prevent double revert animation when moving within sorting
//             if ($(this).hasClass('block-revert')) {
//                 console.log("revert blocked")
//                 $(this).removeClass('block-revert');
//                 var patient_id = this.attr("data-agentID");
//                 data = {
//                     "agentID": patient_id,
//                     "tdp": mhc_settings['tdp'],
//                     "start_timestamp": mhc_settings['start_timestamp']
//                 }
//                 // not used anymore
//                 post_mhc_message("returnPatient", data);
//                 return false;
//             }

//             // revert to the original position
//             if ($(this).hasClass('drag-revert') && !leftButtonDown) {
//                 console.log("reverting");
//                 var patient_id = this.attr("data-agentID");
//                 data = {
//                     "agentID": patient_id,
//                     "tdp": mhc_settings['tdp'],
//                     "start_timestamp": mhc_settings['start_timestamp']
//                 }
//                 // not used anymore
//                 post_mhc_message("returnPatient", data);
//                 return true;
//             }
//         },
//         scroll: false,
//         scrollSensitivity: 400
//     });

//     // keep track of the left mouse button state
//     var leftButtonDown;
//     $(document).mousedown(function(e) {
//         if (e.which === 1) leftButtonDown = true;
//     });
//     $(document).mouseup(function(e) {
//         if (e.which === 1) leftButtonDown = false;
//     });

//     // specify drop zones for the patient cards
//     $(".droppable").droppable({
//         tolerance: "pointer",
//         drop: function(event, ui) {
//             // make sure the user intended to drop it here
//             if (leftButtonDown) return false;

//             // get the patient and target location
//             var patient = ui.draggable.find('.patient_name').text();
//             var patient_id = ui.draggable.attr("data-agentID");
//             var target = $(this).attr("data-destination");
//             if ((target == "IC" && !ICFull) || (target == "ziekenboeg" && !wardFull))
//                 if (confirm('Weet je zeker dat je ' + patient + ' naar ' + target + ' wilt sturen?')) {
//                     // do stuff with our patient, e.g. send the input to MATRX
//                     console.log("User wants to send", ui.draggable.find('.patient_name').text(), ' with ID ' + patient_id + " to ", target)

//                     // stop reverting
//                     ui.draggable.removeClass('drag-revert');

//                     // remove the patient card
//                     ui.draggable.fadeOut(300, function() {
//                         $(this).remove();
//                     });
//                     sendPatientToDestination(target, lv_agent_id, patient_id)

//                 }
//         }
//     });
// }



// function sendPatientToDestination(target, lv_agent_id, patient_id) {
//     // send a message to MATRX with the results of the triage decision
//     type = "send_message"
//     data = {
//         "content": {
//             "type": "triage_decision",
//             "decision": target,
//             "triaged_by": "human"
//         },
//         "sender": lv_agent_id,
//         "receiver": patient_id
//     }
//     send_matrx_message(type, data);
// }

// function reassignPatient(target, lv_agent_id,patient_id){
//     type = "send_message"
//     data = {
//         "content": {
//             "type": "reassign",
//             "assigned_to": target
//         },
//         "sender": lv_agent_id,
//         "receiver": patient_id
//     }
//     send_matrx_message(type, data);
//     }

// function setDropZones() {
//     $("#home_dropzone").css('left', $("#home_sign_219").position().left - 50);
//     $("#home_dropzone").css('top', $("#home_sign_219").position().top);
//     $("#ward_dropzone").css('left', $("#ward_sign_217").position().left - 40);
//     $("#ward_dropzone").css('top', $("#ward_sign_217").position().top);
//     $("#IC_dropzone").css('left', $("#IC_sign_218").position().left - 50);
//     $("#IC_dropzone").css('top', $("#IC_sign_218").position().top);
// }


/*
 * Add patients with pop-ups
 * @Param patients: a list of patients IDs currently present in the world
 */
function extend_update(patients) {
    worldObjects = Object.keys(lv_state)
    for (var ind in patients) {
        // update the triage countdown
        // if (lv_state[patients[ind]].hasOwnProperty("countdown")) {
        //     var countdown = Math.round(lv_state[patients[ind]]['countdown']);
        //     if (countdown < 0) { countdown = 0};
        //     var elem = $("#"+patients[ind]+"patientCardBody #timer .mhc-healthbar");
        //     if (elem.length != 0) {
        //         $("#"+patients[ind]+"patientCardBody #timer .countdown_text")[0].innerHTML = countdown + " sec";
        //         elem[0].style.width = (countdown / lv_state[patients[ind]]['original_countdown'] * 100) + "%";
        //         if(mhc_settings['tdp'] == 'tdp_dynamic_task_allocation')
        //          {
        //             if ($("#"+patients[ind]+"patientCardBody input")[0].checked)
        //                 {$("#"+patients[ind]+"patientCardBody #infoButton").hide();
        //                 $("#"+patients[ind]+"patientCardBody .agent_triage_decision_preview").show()

        //                 }
        //             else{
        //             $("#"+patients[ind]+"patientCardBody #infoButton").show()
        //             $("#"+patients[ind]+"patientCardBody .agent_triage_decision_preview").hide()
        //             }
        //             }

        //     }
        // }
        // remove any triaged patients that are still on screen
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
                //patientCardUtilities()
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
            // waiting = 0;
            // ward = 0;
            // ic = 0;
            // //show the correct info in the counters + pop up buttons
            // for (var ind in patients) {
            //     if (lv_state[patients[ind]]["medical_care"] == "eerste hulp") waiting += 1
            //     if (lv_state[patients[ind]]["medical_care"] == "ziekenboeg") ward += 1
            //     if (lv_state[patients[ind]]["medical_care"] == "IC") ic += 1
            // }
            // $("#myWard").html(ward)
            // $("#myIC").html(ic)
            // if (ward == wardBeds) {
            //     wardFull = true
            // } else {
            //     wardFull = false
            //     if (!blockedButtons) {
            //         $("#send_to_ward").removeClass("not-visible")
            //         $("#send_to_ward").addClass("visible")
            //     }
            // }
            // $("#myIC").html(ic)
            // if (ic == ICBeds) {
            //     ICFull = true
            // } else {
            //     ICFull = false
            //     if (!blockedButtons) {
            //         $("#send_to_IC").removeClass("not-visible")
            //         $("#send_to_IC").addClass("visible")
            //     }
            // }
            // $("#waitingStatus").html(waiting)
            // $("#wardStatus").html(ward)
            // $("#ICStatus").html(ic)
            // $("#cured").html(healedPatients.length)
            // $("#dead").html(deadPatients.length)
        }
        oldPatients = patients;

    }
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
 * Return a patient card filled with the data of the patient
 */
function gen_patient_card_complete(patient_data) {
    patientPhoto = '/fetch_external_media/' + patient_data["victim_photo"]
    //"/fetch_external_media/patients/patient_"+(patient_data['number']+1)+".jpg"
    difficulty_to_reach_color = get_difficulty_color(patient_data["difficulty_to_reach"])
    difficulty_to_rescue_color = get_difficulty_color(patient_data["difficulty_to_rescue"])
    level_of_injury_color = get_level_of_injury_color(patient_data["level_of_injury"])
    patient_card_html = `
    <div id="${patient_data.obj_id}patientCardBody" class="patient_card_body">
        <div id="patient_identification" class="row">
            <div class="col-3">
                <img src=${patientPhoto} class="patient_photo">
            </div>
            <div class="col-6">
                <div class="patient_name_wrapper">
                    <div class="patient_number">Victim ${patient_data['number']}</div>
                    <h2 class="patient_name">${patient_data['victim_name']}</h2>
                 </div>
        </div>
            </div>
            `
    patient_card_html += `
        <div class="patient_card_inner_divider"><hr></div>

        <div class="collapse patient_extra_info_collapse" id="collapse_${patient_data.obj_id}">
            <div class="card-body">
                ${patient_data['patient_introduction_text']}
            </div>
        </div>

        <div class="patient_properties container">
            <div class="row">
            <div class="patient_property col-6"><img src="/fetch_external_media/gender.svg" title="gender">${patient_data["gender"]}</div>
            <div class="patient_property col-6" style="color:${difficulty_to_reach_color}"><img src="/fetch_external_media/distance.svg" title="distance">${patient_data["difficulty_to_reach"]}</div>
            <div class="patient_property col-6"><img src="/fetch_external_media/age.svg" title="age">${patient_data["age"]}</div>
            <div class="patient_property col-6" style="color:${difficulty_to_rescue_color}"><img src="/fetch_external_media/difficulty.svg" title="difficulty">${patient_data["difficulty_to_rescue"]}</div>
            <div class="patient_property col-12" style="color:${level_of_injury_color}"><img src="/fetch_external_media/injury.svg" title="level of injury">${patient_data["level_of_injury"]}</div>
            </div>
        </div>`;

    patient_card_html += `</div>`;
    return patient_card_html;
}

function gen_patient_card_for_explanation(patient_data, number) {
    patient_data = JSON.parse(patient_data)
    patientPhoto = '/fetch_external_media/' + patient_data["image"]
    //"/fetch_external_media/patients/patient_"+(patient_data['number']+1)+".jpg"
    difficulty_to_reach_color = get_difficulty_color(patient_data["difficulty_to_reach"])
    difficulty_to_rescue_color = get_difficulty_color(patient_data["difficulty_to_rescue"])
    level_of_injury_color = get_level_of_injury_color(patient_data["level_of_injury"])
    gender_color = get_gender_color(patient_data["gender"])
    age_color = get_age_color(patient_data["age"])
    patient_card_html = `
    <div id="${patient_data.obj_id}patientCardBody" class="patient_card_body">
        <div id="patient_identification" class="row">
            <div class="col-3">
                <img src=${patientPhoto} class="patient_photo">
            </div>
            <div class="col-6">
                <div class="patient_name_wrapper">
                    <h2 class="patient_name">${number}</h2>
                 </div>
        </div>
            </div>
            `
    patient_card_html += `
        <div class="patient_card_inner_divider"><hr></div>

        <div class="collapse patient_extra_info_collapse" id="collapse_${patient_data.obj_id}">
            <div class="card-body">
                ${patient_data['patient_introduction_text']}
            </div>
        </div>

        <div class="patient_properties container">
            <div class="row">
            <div class="patient_property col-6" style="color:${gender_color}"><img src="/fetch_external_media/gender.svg" title="gender">${patient_data["gender"]}</div>
            <div class="patient_property col-6" style="color:${difficulty_to_reach_color}"><img src="/fetch_external_media/distance.svg" title="distance">${patient_data["difficulty_to_reach"]}</div>
            <div class="patient_property col-6" style="color:${age_color}"><img src="/fetch_external_media/age.svg" title="age">${patient_data["age"]}</div>
            <div class="patient_property col-6" style="color:${difficulty_to_rescue_color}"><img src="/fetch_external_media/difficulty.svg" title="difficulty">${patient_data["difficulty_to_rescue"]}</div>
            <div class="patient_property col-12" style="color:${level_of_injury_color}"><img src="/fetch_external_media/injury.svg" title="level of injury">${patient_data["level_of_injury"]}</div>
            </div>
        </div>`;

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