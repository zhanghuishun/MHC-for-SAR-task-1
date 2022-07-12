from rescue_model import RescueModel
from search_team import SearchTeam
from questions import Question
import csv
import json
import os
import pandas as pd
import numpy as np
import copy
from victim_agent import Victim


user_data_file = os.path.join(os.path.realpath('analysis/user_values.csv'))
#input process: num->list of values
user_data = pd.read_csv(user_data_file, sep=';', dtype=str)

num_value_dict = {'0': 'older preferred',
        '1': 'younger preferred',
        '2': 'male preferred',
        '3': 'female preferred',
        '4': 'high level of injury',
        '5': 'low level of injury',
        '6': 'high difficulty to rescue',
        '7': 'low difficulty to rescue',
        '8': 'high difficulty to reach',
        '9': 'low difficulty to reach',}
reach_time_dict = {
    'Aalt': '12-14',
    'Lucy': '6-8',
    'Wilhelmus': '9-11',
    'Jayden': '9-11'
}
rescue_time_dict = {
    'Aalt': '3-5',
    'Lucy': '9-11',
    'Wilhelmus': '6-8',
    'Jayden': '6-8'
}
all_time_dict = {
    'Robbie': '23',
    'Lena': '28',
    'Simone': '34'
}
#all user values
values1 = []
values2 = []
for index, row in user_data.iterrows():
    temp_value = []
    for num in row['values']:
        temp_value.append(num_value_dict[num])
    if(row['group'] == '1'):
        values1.append(temp_value)
    else:
        values2.append(temp_value)

rescue_model = RescueModel('{}')
# config_path = os.path.join(os.path.realpath('config/config.json'))
# config = json.load(open(config_path))
victims_data_file = os.path.join(os.path.realpath('victim_generator/victim_data.csv'))
victims_data = pd.read_csv(victims_data_file, sep=';')

processed_victims_data = []
for index, row in victims_data.iterrows():
    temp_data = {}
    temp_data['obj_id'] = index
    temp_data['victim_name'] = row['name']
    temp_data['gender'] = row['gender']
    temp_data['age'] = int(row['age'])
    temp_data['difficulty_to_reach'] = row['difficulty_to_reach']
    temp_data['difficulty_to_rescue'] = row['difficulty_to_rescue']
    temp_data['level_of_injury'] = row['level_of_injury']
    processed_victims_data.append(temp_data)

#get data of three rounds
first_round_data = processed_victims_data[:4]
second_round_data = processed_victims_data[4:8]
third_round_data = processed_victims_data[8:]

header = ['index', 'Q7', 'Q8','Q9', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15']

#get answers of question7-15
def get_result(values):
    csv_data = []
    for num in range(0,len(values)):
        temp_data = []
        temp_data.append(num)
        #Q7
        Question.question7(values[num], first_round_data)
        temp_data.append(Question.question7(values[num], first_round_data))
        #Q8 and Q9
        q8_name  = Question.question8(values[num], second_round_data)
        temp_data.append(reach_time_dict[q8_name])
        temp_data.append(rescue_time_dict[q8_name])
        #Q10 and Q11
        q10_name, q11_category = Question.question10(values[num], third_round_data)
        temp_data.append(q10_name)
        temp_data.append(q11_category)
        #Q12
        temp_data.append(all_time_dict[q10_name])
        #Q13
        q13_data = copy.deepcopy(third_round_data)
        q13_data[0]['level_of_injury'] = 'high'
        temp_data.append(Question.question13to15(values[num],q13_data))
        #Q14
        q14_data = copy.deepcopy(third_round_data)
        q14_data[1]['difficulty_to_rescue'] = 'low'
        temp_data.append(Question.question13to15(values[num],q14_data))
        #Q15
        q15_data = copy.deepcopy(third_round_data)
        q15_data[2]['level_of_injury'] = 'high'
        temp_data.append(Question.question13to15(values[num],q15_data))
        csv_data.append(temp_data)
    return csv_data

#write ideal answers of group 1 into files
with open('analysis/result_group1.csv', 'w', encoding='UTF8', newline='') as f:
    writer = csv.writer(f)

    # write the header
    writer.writerow(header)

    # write multiple rows
    writer.writerows(get_result(values1))

#write ideal answers of group2 into files
with open('analysis/result_group2.csv', 'w', encoding='UTF8', newline='') as f:
    writer = csv.writer(f)

    # write the header
    writer.writerow(header)

    # write multiple rows
    writer.writerows(get_result(values2))