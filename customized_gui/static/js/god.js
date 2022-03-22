function storeExplType() {
    var expl_type = document.getElementById("explanation-select").value
    if (expl_type == "consequential"){
        localStorage.setItem("expl_type", "consequential");
        console.log("store");
    }
    if (expl_type == "combination"){
        console.log("store");
        localStorage.setItem("expl_type", "combination");

    }
}

