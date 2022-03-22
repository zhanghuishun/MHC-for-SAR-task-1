import ast
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
    moral_category_dict = {"older preferred" : "age", "younger preferred": "age", "male preferred": "gender", "female preferred": "gender", "high vital sign": "vital_sign", "low vital sign": "vital_sign", "difficulty": "difficulty", "distance": "distance"}
    @classmethod
    def __init__(cls, moralValues):
        assert type(moralValues) == str
        cls.moralValues = ast.literal_eval(moralValues)
    @classmethod
    def get_prior_victim(cls):
        if(len(cls.moralValues) < 5):
            raise RuntimeError("moral value error")
        else:
            victimA_score = cls.init_rescue_score("female", 65, "short", "hard", "middle")
            victimB_score = cls.init_rescue_score("male", 44, "middle", "easy", "low")
            if victimA_score > victimB_score:
                return "victimA"
            elif victimA_score < victimB_score:
                return "victimB"
            else:
                return "equal"
    @classmethod
    #score range from -1 to 1
    def init_rescue_score(cls, gender, age, distance, difficulty, vital_sign):
        #percent from high to low: 30 25 20 15 10
        percent = 0.35
        score = 0

        assert type(cls.moralValues) == dict
        if(len(cls.moralValues) < 5):
                raise RuntimeError("moral value error")
    
        for moral_value in cls.moralValues.values():            
            percent -= 0.05
            category = cls.moral_category_dict[moral_value]
            if category == "age":
                score += (percent * cls.age_score(moral_value, age))
            elif category == "gender":
                score += (percent * cls.gender_score(moral_value, gender))
            elif category == "distance":
                score += (percent * cls.distance_score(distance))
            elif category == "difficulty":
                score += (percent * cls.difficulty_score(difficulty))
            elif category == "vital_sign":
                score += (percent * cls.vital_sign_score(moral_value, vital_sign))

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
        if difficulty == "low":
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
    