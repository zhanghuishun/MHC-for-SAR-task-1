import threading
import logging
from datetime import datetime
from urllib import response

import pyautogui
import os
import csv
from flask import Flask, render_template, request, jsonify, send_from_directory, json, Response
from tempfile import NamedTemporaryFile
import shutil
import random
import time
from rescue_model import RescueModel
'''
This file holds the code for the MATRX RESTful api. 
External scripts can send POST and/or GET requests to retrieve state, tick and other information, and send 
userinput or other information to MATRX. The api is a Flask (Python) webserver.

For visualization, see the seperate MATRX visualization folder / package.
'''

debug = True
port = 3000
app = Flask(__name__, template_folder='templates')
# trial_tdpX_7-9-2020-16h09m

# the path to the media folder of the user (outside of the MATRX package)
ext_media_folder = ""


#########################################################################
# Visualization server routes
#########################################################################

@app.route('/human-agent/<id>')
def human_agent_view(id):
    """
    Route for HumanAgentBrain

    Parameters
    ----------
    id
        The human agent ID. Is obtained from the URL.

    Returns
    -------
    str
        The template for this agent's view.

    """
    return render_template('human_agent.html', id=id)


# route for agent, get the ID from the URL
@app.route('/agent/<id>')
def agent_view(id):
    """
    Route for AgentBrain

    Parameters
    ----------
    id
        The agent ID. Is obtained from the URL.

    Returns
    -------
    str
        The template for this agent's view.

    """
    return render_template('agent.html', id=id)


@app.route('/god')
def god_view():
    """
    Route for the 'god' view which contains the ground truth of the world without restrictions.

    Returns
    -------
    str
        The template for this view.

    """
    return render_template('god.html')


@app.route('/pickupPatient', methods=['GET', 'POST'])
def pickupPatient():
    data = request.json
    n = 0

    a = time.perf_counter()
    folder = r'mhc/images/Screenshots/' + data['start_timestamp']

    # create folder if it doesn't exist yet
    os.makedirs(folder, exist_ok=True)

    # Checks the names of existing screenshots
    for filename in os.listdir(folder):
        if filename.startswith('screenShot_') and filename.endswith(".png"):
            screenShot = filename
            numberPng = screenShot.split("_")[1]
            number = int(numberPng.split(".")[0], 0)
            if n < number:
                n = number
    n += 1

    # name of the new screenshot
    filename = "screenShot_" + str(n) + ".png"
    # Saves to name and time to log file
    file = "Results/temp_questionnaire_data/" + data['tdp'] + "__" + data['start_timestamp'] + "/resultLog.csv"
    os.makedirs(os.path.dirname(file), exist_ok=True)
    with open(file, mode='a') as result_file:
        result_writer = csv.writer(result_file, delimiter=',', lineterminator='\n')
        result_writer.writerow([data["current_tick"], data["tps"], data['agentID'], filename])
    r = "saved screenshot"
    response = app.response_class(
        response=json.dumps(r),
        status=200,
        mimetype='application/json'
    )

    myScreenshot = pyautogui.screenshot()

    b = time.perf_counter()
    print(f"Taking screenshot took {b-a} milliseconds")

    myScreenshot.save(r'mhc/images/Screenshots/' + data['start_timestamp'] + "/" + filename)
    return response


@app.route('/returnPatient', methods=['GET', 'POST'])
def returnPatient():
    data = request.json

    tempfile = NamedTemporaryFile('w+t', newline='', delete=False)
    file = "Results/temp_questionnaire_data/" + data['tdp'] + "__" + data['start_timestamp'] + "/resultLog.csv"
    os.makedirs(os.path.dirname(file), exist_ok=True)
    with open(file, 'r', newline='') as csvFile, tempfile:
        reader = csv.reader(csvFile, delimiter=',', quotechar='"')
        writer = csv.writer(tempfile, delimiter=',', quotechar='"')
        for row in reader:
            if not row[2] == data['agentID']:
                writer.writerow(row)
            else:
                try:
                    os.remove("mhc/images/Screenshots/" + data['start_timestamp'] + (row[3]))
                except:
                    pass

    shutil.move(tempfile.name, file)

    r = "found screenshot"
    response = app.response_class(
        response=json.dumps(r),
        status=200,
        mimetype='application/json'
    )
    return response


@app.route('/updatePatient', methods=['GET', 'POST'])
def updatePatient():
    data = request.json
    r = "patient Data"

    response = app.response_class(
        response=json.dumps(r),
        status=200,
        mimetype='application/json'
    )
    return response


@app.route("/sendQuestionnaire", methods=['POST'])
def sendQuestionnaire():
    data = request.json
    answers4cases=data["answers"];
    # fetch the latest questionnaire data
    folder = "Results/temp_questionnaire_data/"

    latest_folder = ""
    latest_date = None

    # we don't have access to the date of the latest experiment data in this function, so instead
    # find the folder with the latest experiment questionnaire data using the folder name
    for folder in os.listdir(folder):
        # remove condition text from folder name
        folder_date = folder.split("__")[1]
        # convert to date
        experiment_date = datetime.strptime(folder_date, '%d-%m-%Y_%H-%M')

        # keep track of the newest experiment data
        if latest_date is None:
            latest_date = experiment_date
            latest_folder = folder
        elif latest_date < experiment_date:
            latest_date = experiment_date
            latest_folder = folder

    # write the results to the csv in the folder with the other results
    file = 'Results/' + latest_folder.replace("__", "_") + '/QuestionnaireAnswers.csv'
    os.makedirs(os.path.dirname(file), exist_ok=True)
    with open(file, mode='a') as result_file:
        result_writer = csv.writer(result_file, delimiter=';', lineterminator='\n')
        for form in answers4cases:
            result_writer.writerow([form["agentID"], form["q1"], form["q2"], form["q3"], form["q4"], form["q4a"],
                                    form["q4b"]])
        #result_writer.writerow(["Likert scale", data["likertScale"]])

    r = "Hartelijk dank voor uw deelname. Klik hier voor de experiment-algemene vragenlijst"
    response = app.response_class(
        response=json.dumps(r),
        status=200,
        mimetype='application/json'
    )
    return response


@app.route('/')
@app.route('/start')
def start_view():
    """
    Route for the 'start' view which shows information about the current scenario, including links to all agents.

    Returns
    -------
    str
        The template for this view.

    """
    return render_template('start.html')


@app.route('/shutdown_visualizer', methods=['GET', 'POST'])
def shutdown():
    """ Shuts down the visualizer by stopping the Flask thread

    Returns
        True
    -------
    """
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Unable to shutdown visualizer server. Not running with the Werkzeug Server')
    func()
    print("Visualizer server shutting down...")
    return jsonify(True)


@app.route('/questionnaire')
def showQuestionnaire():
    # fetch the latest questionnaire data
    folder = "Results/temp_questionnaire_data/"
    # check it exists
    if not os.path.exists(folder):
        return jsonify("No questionnaire data found")

    latest_folder = ""
    latest_date = None

    # we don't have access to the date of the latest experiment data in this function, so instead
    # find the folder with the latest experiment questionnaire data using the folder name
    for folder in os.listdir(folder):
        # remove condition text from folder name
        folder_date = folder.split("__")[1]
        # convert to date
        experiment_date = datetime.strptime(folder_date, '%d-%m-%Y_%H-%M')

        # keep track of the newest experiment data folder
        if latest_date is None:
            latest_date = experiment_date
            latest_folder = folder
        elif latest_date < experiment_date:
            latest_date = experiment_date
            latest_folder = folder

    patients = []
    chosen_patient_indices = []
    file = "Results/temp_questionnaire_data/" + latest_folder + "/resultLog.csv"
    with open(file, 'r+', newline='') as csvFile:
        reader = csv.reader(csvFile, delimiter=',', quotechar='"')
        row_count = sum(1 for row in reader)

        if row_count < 4:
            raise Exception("Need atleast 4 decisions of the test subject to start the questionnaire.")

        for n in range(4):
            rowN = random.randint(1, row_count-1)
            while rowN in chosen_patient_indices:
                rowN = random.randint(0, row_count-1)
            chosen_patient_indices.append(rowN)
        patients = []

    with open(file, 'r', newline='') as csvFile:
        row_number = 0
        reader = csv.reader(csvFile, delimiter=',', quotechar='"')
        for row in reader:
            if row_number in chosen_patient_indices:
                patient = {}
                patient["id"] = row[2]
                patient["photo"] = "/fetch_external_media/Screenshots/" + \
                                   latest_folder.split("__")[1] + "/" + row[3]
                patients.append(patient)
            row_number   += 1
    isBaseline=latest_folder.__contains__("baseline")
    return render_template('questionnaire.html', patients=patients, isBaseline=isBaseline)


@app.route('/fetch_external_media/<path:filename>')
def external_media(filename):
    """ Facilitate the use of images in the visualization outside of the static folder

    Parameters
    ----------
    filename
        path to the image file in the external media folder of the user.

    Returns
    -------
        Returns the url (relative from the website root) to that file
    """
    return send_from_directory(ext_media_folder, filename, as_attachment=True)

@app.route('/set_moral_value', methods=['POST'])
def set_moral_value():
    data = request.json
    #pass moral values to RescueModel singleton
    RescueModel(data)

    prior_victim = RescueModel.get_prior_victim()
    permutations = RescueModel.get_permutations()

    response = app.response_class(
        response=json.dumps({
            "prior_victim": prior_victim,
            "permutations": permutations
        }),
        status=200,
        mimetype='application/json'
    )
    return response

#########################################################################
# Visualization Flask methods
#########################################################################

def flask_thread():
    """
    Starts the Flask server on localhost:3000
    """

    if not debug:
        log = logging.getLogger('werkzeug')
        log.setLevel(logging.ERROR)

    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)


def run_matrx_visualizer(verbose, media_folder):
    """
    Creates a seperate Python thread in which the visualization server (Flask) is started, serving the JS visualization
    :return: MATRX visualization Python thread
    """
    global debug, ext_media_folder, timeStamp
    debug = verbose
    ext_media_folder = media_folder

    print("Starting visualization server")
    print("Initialized app:", app)
    vis_thread = threading.Thread(target=flask_thread)
    vis_thread.start()
    return vis_thread


if __name__ == "__main__":
    run_matrx_visualizer()
