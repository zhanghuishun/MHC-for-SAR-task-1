import ast
import pandas as pd
import os
class Singleton(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]

#Python3
class RescueModel(metaclass=Singleton):
    #{"very_high":"older preferred","high":"male preferred","middle":"high vital sign","low":"difficulty","very_low":"distance"}
    moralValues = dict()
    moral_category_dict = {"older preferred" : "age", "younger preferred": "age", "male preferred": "gender", "female preferred": "gender", "high vital sign": "vital_sign", "low vital sign": "vital_sign", "difficulty to rescue": "difficulty to rescue", "difficulty to reach": "difficulty to reach"}
    victims_data_file = os.path.join(os.path.realpath("victim_generator/victim_data_for_explanation.csv"))
    victim_data = pd.read_csv(victims_data_file, sep=';')
    
    @classmethod
    def __init__(cls, moralValues):
        assert type(moralValues) == str
        cls.moralValues = ast.literal_eval(moralValues)
    @classmethod
    def get_prior_victim(cls, victimA, victimB):
        if(len(cls.moralValues) < 5):
            raise RuntimeError("moral value error")
        else:
            moral_value_list = list(cls.moralValues.values())
            victimA_score = cls.get_rescue_score(moral_value_list, victimA)
            victimB_score = cls.get_rescue_score(moral_value_list, victimB)
            if victimA_score > victimB_score:
                return "victimA"
            elif victimA_score < victimB_score:
                return "victimB"
            else:
                return "equal"
    @classmethod
    # return two permutated characteristics that can make robot to rescue the other victim
    def get_explanation_info(cls):
        moral_values = list(cls.moralValues.values())
        victim_num = cls.victim_data.shape[0]
        # permutate from high to low
        for i in range(len(moral_values)-1, -1, -1):
            temp_values = moral_values
            for j in range(i-1, -1, -1):
                temp_values[i], temp_values[j] = temp_values[j], temp_values[i]
                for k in range(0, victim_num):
                    for l in range(k+1, victim_num):
                        victimA = cls.victim_data.iloc[k]
                        victimB = cls.victim_data.iloc[l]
                        prior_victim = cls.get_prior_victim(victimA, victimB)
                        if(prior_victim == "equal"): continue
                        victimA_score = cls.get_rescue_score(temp_values, victimA)
                        victimB_score = cls.get_rescue_score(temp_values, victimB)
                        if (victimA_score > victimB_score and prior_victim == "victimB") or \
                                (victimA_score < victimB_score and prior_victim == "victimA"):
                            print({"prior_victim": prior_victim,"victimA": victimA.to_json(),"victimB": victimB.to_json(),"value1": moral_values[j], "value2": moral_values[i]})
                            return {"prior_victim": prior_victim,"victimA": victimA.to_json(),"victimB": victimB.to_json(),"value1": moral_values[j], "value2": moral_values[i]}

        return {"value1": "error", "value2": "error"}
    @classmethod
    #score range from -1 to 1
    def get_rescue_score(cls, moralvalues, victim):
        #percent from high to low: 30 25 20 15 10
        percent = 0.35
        score = 0

        assert type(moralvalues) == list
        if(len(moralvalues) < 5):
                raise RuntimeError("moral value error")
    
        for moral_value in moralvalues:            
            percent -= 0.05
            category = cls.moral_category_dict[moral_value]
            if category == "age":
                score += (percent * cls.age_score(moral_value, victim["age"]))
            elif category == "gender":
                score += (percent * cls.gender_score(moral_value, victim["gender"]))
            elif category == "distance":
                score += (percent * cls.distance_score(victim["distance"]))
            elif category == "difficulty":
                score += (percent * cls.difficulty_score(victim["difficulty"]))
            elif category == "vital_sign":
                score += (percent * cls.vital_sign_score(moral_value, victim["vital_sign"]))

        return score
    @classmethod
    def gender_score(cls, gender_moral_value, gender):
        gender_score = 0
        if gender == "Man":
            gender_score -1
        else:
            gender_score = 1
        return gender_score if gender_moral_value == "female preferred" else 0-gender_score
    @classmethod
    def age_score(cls, age_moral_value, age):
        age_score = 0
        try:
            if age > 0 and age <= 20:
                age_score = 1
            elif age >= 20 and age <= 40:
                age_score = 0.5
            elif age >= 40 and age <= 60:
                age_score = 0
            elif age >= 60 and age <= 80:
                age_score = -0.5
            elif age >= 80 and age <= 100:
                age_score = 0.5
            else:
                raise Exception("Age is not in the range of 0-100")
        except Exception as exc:
            print(exc)
        return age_score if age_moral_value == "younger preferred" else 0-age_score

    @classmethod
    def distance_score(cls, distance):
        if distance == "short":
            return 1
        elif distance == "middle":
            return 0
        else:
            return -1
    @classmethod
    def difficulty_score(cls, difficulty):
        if difficulty == "easy":
            return 1
        elif difficulty == "middle":
            return 0
        else:
            return -1
    @classmethod
    def vital_sign_score(cls, vital_sign_moral_value, vital_sign):
        vital_sign_score = 0
        if vital_sign == "low":
            vital_sign_score = -1
        elif vital_sign == "middle":
            vital_sign_score = 0
        else:
            vital_sign_score = 1
        return vital_sign_score if vital_sign_moral_value == "high vital sign" else 0-vital_sign_score
    