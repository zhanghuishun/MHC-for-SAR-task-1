from matrx.agents import AgentBrain
from rescue_model import RescueModel
class RescueAgent(AgentBrain):

    def __init__(self, config):
        super().__init__()
        self.config = config
        self.ready_time_ticks = config["rescue_robot"]["ready_time_ticks"]
        self.all_victims_id = []
        self.is_stand_by = True
        self.victim_rescue_score = {}

    def filter_observations(self, state):
        # select all victims
        victims = state[{"is_victim": True, 'rescued': False}]

        # make sure we are dealing with a list of victims
        if victims is not None:
            if not isinstance(victims, list):
                victims = [victims]
        else:
            victims = []
        
        self.all_victims_id = []
        for victim in victims:
            # add current victims
            self.all_victims_id.append(victim['obj_id'])
        return state
    
    def decide_on_action(self, state):
        if state['World']['nr_ticks'] >= self.ready_time_ticks and self.is_stand_by == True and len(self.all_victims_id) > 0:
            # select the most priority victim by calculating rescue score
            most_priority_victim_id =self.all_victims_id[0]
            highest_rescue_score = -1
            for victim_id in self.all_victims_id:
                if victim_id in self.victim_rescue_score.keys():
                    temp_score = self.victim_rescue_score[victim_id]
                else:
                    temp_victim = state[victim_id]
                    temp_score = RescueModel.init_rescue_score(temp_victim["gender"],temp_victim["age"],
                                    temp_victim["distance"],temp_victim["difficulty"],temp_victim["vital_sign"])
                    self.victim_rescue_score[victim_id] = temp_score
                
                if temp_score > highest_rescue_score:
                    most_priority_victim_id = victim_id
                    highest_rescue_score = temp_score
        # move to the most priority victim


        # move back (how to move with victim?)
        return None, {}