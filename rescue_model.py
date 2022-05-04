import ast
from unicodedata import category
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
        possible_victims_info = victims_info
        if(victims_info == None):
            raise RuntimeError("no victim currently")
        for value in moral_values:
            category = cls.moral_category_dict[value]
            if(category == "age" or category == "gender"):
                info = cls.get_priority_by_age_or_gender(value, possible_victims_info)
                if(len(info) != 1):
                    possible_victims_info = info
                    continue
                return cls.get_name_by_info(info, possible_victims_info), category
            else:
                info = cls.get_priority_by_level(value, possible_victims_info)
                if(info == None):
                    continue
                if(len(info) != 1):
                    possible_victims_info = info
                    continue
                return cls.get_name_by_info(info, possible_victims_info), category
            #for victim_info in victims_info:
        return None, None
    @classmethod
    def get_most_priority_victim_id(cls, victims_info):
        priority_victim_id = None
        possible_victims_info = victims_info
        if(victims_info == None):
            raise RuntimeError("no victim currently")
        for value in cls.moralValues.values():
            category = cls.moral_category_dict[value]
            if(category == "age" or category == "gender"):
                info = cls.get_priority_by_age_or_gender(value, possible_victims_info)
                if(len(info) != 1):
                    possible_victims_info = info
                    continue
                return info[0]['obj_id']
            else:
                info = cls.get_priority_by_level(value, possible_victims_info)
                if(info == None):
                    continue
                if(len(info) != 1):
                    possible_victims_info = info
                    continue
                return info[0]['obj_id']
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
                value_id_dict[victim_info[category]] = [victim_info]
            elif(victim_info[category] == list(value_id_dict.keys())[idx]):
                value_id_dict[victim_info[category]].append(victim_info)
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
                level_id_dict[victim_info[category]] = [victim_info]
                level_num_dict[victim_info[category]] = 1
            #duplicate keys
            else:
                level_id_dict[victim_info[category]].append(victim_info)
                level_num_dict[victim_info[category]] += 1       
        if(priority_level in level_num_dict):
            return level_id_dict[priority_level]
        else:
            return None if "middle" not in level_id_dict else level_id_dict["middle"]

    @classmethod
    def get_name_by_info(cls, info, victim_info):
        for victim in victim_info:
            if victim['obj_id'] == info[0]['obj_id']:
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
        i = 0
        for j in range(1, len(moral_values)):
            temp_values = moral_values.copy()
            temp_values[i], temp_values[j] = temp_values[j], temp_values[i]
            temp_victim_name, temp_category = cls.get_most_priority_victim_name(temp_values, victims_info)
            if(temp_victim_name == victim_name):
                continue
            else:
                res_dict['the_other_victim'] = temp_victim_name
                res_dict['value1'] = cls.moral_category_dict[moral_values[i]]
                res_dict['value2'] = cls.moral_category_dict[moral_values[j]]
                break
        return res_dict