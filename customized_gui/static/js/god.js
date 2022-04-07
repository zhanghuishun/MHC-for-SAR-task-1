function storeExplType() {
    var expl_type = document.getElementById("explanation-select").value
    if (expl_type == "combination"){
        console.log("store combination");
        localStorage.setItem("expl_type", "combination");
    }
    else if (expl_type == "without"){
        console.log("store without");
        localStorage.setItem("expl_type", "without");
    }
}
function clearLocalStorage() {
    localStorage.clear();
}
