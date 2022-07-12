from unicodedata import category
from rescue_model import RescueModel
class Question:
    def question7(moral_values, victims_data):
        name, category = RescueModel.get_most_priority_victim_name(moral_values, victims_data)
        new_victim_data = []
        for victim in victims_data:
            if victim['victim_name'] != name:
                new_victim_data.append(victim)
        name, category = RescueModel.get_most_priority_victim_name(moral_values, new_victim_data)
        return category
    def question8(moral_values, victims_data):
        name, _ = RescueModel.get_most_priority_victim_name(moral_values, victims_data)
        return name
    def question10(moral_values, victims_data):
        name, category = RescueModel.get_most_priority_victim_name(moral_values, victims_data)
        return name, category
    def question13to15(moral_values, victims_data):
        name1, category = RescueModel.get_most_priority_victim_name(moral_values, victims_data)
        new_victim_data = []
        for victim in victims_data:
            if victim['victim_name'] != name1:
                new_victim_data.append(victim)
        name2, category = RescueModel.get_most_priority_victim_name(moral_values, new_victim_data)
        for victim in victims_data:
            if victim['victim_name'] != name1 and victim['victim_name'] != name2:
                name3 = victim['victim_name']
        return [name1,name2,name3]