function sendAnswers(){
    elements=$(".questionnaire").length
    answers=[]
    i=0
    while (i<elements){
        currentElement=$($(".questionnaire")[i])
        id=currentElement.attr("patientid")
        q1=$($(".questionnaire")[i]).find("#"+id+"_q1")
        q2=$($(".questionnaire")[i]).find("#"+id+"_q2")
        q3=$($(".questionnaire")[i]).find("#"+id+"_q3")
        q4=$($(".questionnaire")[i]).find("#"+id+"_q4")
        q4a=$($(".questionnaire")[i]).find("#"+id+"_q4a")
        q4b=$($(".questionnaire")[i]).find("#"+id+"_q4b")
        answer = {
            "agentID": id,
            "q1":q1[0].value,
            "q2":q2[0].value,
            "q3":q3[0].value,
            "q4":q4[0].value,
            "q4a":q4a[0].value,
            "q4b":q4b[0].value
             }
        answers.push(answer)
        i+=1
    }
    likertAnswer=$('input[name=Likert]:checked').val()
    data = {
        "answers": answers,
        "likertScale":likertAnswer
    }

    post_mhc_message("sendQuestionnaire", data);
    $(".questionnaire").remove()
    $("body").html("<h1 style='text-align: center; vertical-align: middle; padding-top: 20%;'> Bedankt voor het invullen.<br>Klik <a href='https://forms.gle/TuqBkNGrMhavHv37A'>>hier<</a> voor de opvolgende algemene vragenlijst over de gedane opdracht. </h1>")

}