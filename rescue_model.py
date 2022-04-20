import ast
import pandas as pd
import os
import json
from sortedcontainers import SortedDict
class Singleton(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]

#Python3
class RescueModel(metaclass=Singleton):
    #{"very_high":"older preferred","high":"male preferred","middle":"high level of injury","low":"difficulty","very_low":"distance"}
    moralValues = dict()
    moral_category_dict = {"older preferred" : "age", "younger preferred": "age", "male preferred": "gender", "female preferred": "gender", "high level of injury": "level_of_injury", "low level of injury": "level_of_injury", "low difficulty to rescue": "difficulty_to_rescue","high difficulty to rescue": "difficulty_to_rescue", "low difficulty to reach": "difficulty_to_reach", "high difficulty to reach": "difficulty_to_reach"}
    victims_data_file = os.path.join(os.path.realpath("victim_generator/victim_data_for_explanation.csv"))
    victim_data = pd.read_csv(victims_data_file, sep=';')
    
    @classmethod
    def __init__(cls, moralValues):
        assert type(moralValues) == str
        cls.moralValues = ast.literal_eval(moralValues)
    @classmethod
    def set_moral_values(cls, moralValues):
        cls.moralValues = ast.literal_eval(moralValues) 
    
    @classmethod
    def get_most_priority_victim_name(cls, moral_values, victims_info):
        priority_victim_id = None
        if(victims_info == None):
            raise RuntimeError("no victim currently")
        for value in moral_values:
            category = cls.moral_category_dict[value]
            if(category == "age"):
                victim_priority_by_age = cls.get_priority_by_age_or_gender(value, victims_info)
                if(victim_priority_by_age is None):
                    continue
                return cls.get_name_by_id(victim_priority_by_age, victims_info), category
            elif(category == "gender"):
                victim_priority_by_gender = cls.get_priority_by_age_or_gender(value, victims_info)
                if(victim_priority_by_gender is None):
                    continue
                return cls.get_name_by_id(victim_priority_by_gender, victims_info), category
            else:
                victim_priority_by_level = cls.get_priority_by_level(value, victims_info)
                if(victim_priority_by_level is None):
                    continue
                return cls.get_name_by_id(victim_priority_by_level, victims_info), category
            #for victim_info in victims_info:
        return None, None
    @classmethod
    def get_most_priority_victim_id(cls, victims_info):
        priority_victim_id = None
        if(victims_info == None):
            raise RuntimeError("no victim currently")
        for value in cls.moralValues.values():
            category = cls.moral_category_dict[value]
            if(category == "age"):
                victim_priority_by_age = cls.get_priority_by_age_or_gender(value, victims_info)
                if(victim_priority_by_age is None):
                    continue
                return victim_priority_by_age
            elif(category == "gender"):
                victim_priority_by_gender = cls.get_priority_by_age_or_gender(value, victims_info)
                if(victim_priority_by_gender is None):
                    continue
                return victim_priority_by_gender
            else:
                victim_priority_by_level = cls.get_priority_by_level(value, victims_info)
                if(victim_priority_by_level is None):
                    continue
                return victim_priority_by_level
            #for victim_info in victims_info:
        return None

    #get the only man/woman or the only youngest or oldest victim
    @classmethod
    def get_priority_by_age_or_gender(cls, moralvalue, victims_info):
        value_id_dict = SortedDict()
        idx = 0 if (moralvalue == "younger preferred" or moralvalue == "male preferred") else -1
        category = cls.moral_category_dict[moralvalue]
        #return the first value in a orderedDict, return None if there are two extremum
        for victim_info in victims_info:
            if(victim_info[category] not in value_id_dict):
                value_id_dict[victim_info[category]] = victim_info['obj_id']
            elif(victim_info[category] == list(value_id_dict.keys())[idx]):
                return None
        return list(value_id_dict.values())[idx]

    # if priority_level is high, we only can omit low and vice versa
    @classmethod
    def get_priority_by_level(cls, moralvalue, victims_info):
        priority_level = moralvalue.split(" ")[0]
        opposite_level = "low" if priority_level == "high" else "high"
        level_id_dict = {}
        level_num_dict = {}
        category = cls.moral_category_dict[moralvalue]
        for victim_info in victims_info:
            if(victim_info[category] == opposite_level):
                continue
            elif(victim_info[category] not in level_id_dict):
                level_id_dict[victim_info[category]] = victim_info['obj_id']
                level_num_dict[victim_info[category]] = 1
            #duplicate priority level keys
            elif(victim_info[category] == priority_level):
                return None
            #duplicate middle keys
            else:
                level_num_dict[victim_info[category]] = level_num_dict[victim_info[category]] + 1
        if(priority_level in level_num_dict and level_num_dict[priority_level] == 1):
            return level_id_dict[priority_level]
        elif(priority_level not in level_num_dict and "middle" in level_num_dict and level_num_dict["middle"] == 1):
            return level_id_dict["middle"]
        return None

    @classmethod
    def get_name_by_id(cls, id, victim_info):
        for victim in victim_info:
            if victim['obj_id'] == id:
                return victim['victim_name']
        return None
    @classmethod
    def get_explanations(cls, victims_info):
        res_dict = {}
        victim_name, category = cls.get_most_priority_victim_name(cls.moralValues.values(), victims_info)
        if victim_name is not None:
            res_dict['prior_victim'] = victim_name
            res_dict['category'] = category
        #change ranking to get another prior victim
        moral_values = list(cls.moralValues.values())
        #for i in range(0, len(moral_values)-1):
        temp_values = moral_values.copy()
        i = 0
        j = i + 1
        temp_values[i], temp_values[j] = temp_values[j], temp_values[i]
        temp_victim_name, temp_category = cls.get_most_priority_victim_name(temp_values, victims_info)
        if(temp_victim_name != victim_name):
            res_dict['the_other_victim'] = temp_victim_name
            res_dict['value1'] = cls.moral_category_dict[moral_values[j]]
            res_dict['value2'] = cls.moral_category_dict[moral_values[i]]
        return res_dict