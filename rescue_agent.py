from matrx.agents.agent_utils.navigator import Navigator
from matrx.agents.agent_utils.state_tracker import StateTracker
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
        self.state_tracker = None
        self.target_location = None
        self.move_speed = config["rescue_robot"]["move_speed"]
        
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
        action = None
        if self.state_tracker is None:
            # Initialize this agent's state tracker and navigator, has to be done here and not in the initialize
            # function, as that doesn'twork for agents created during the experiment.
            self.state_tracker = StateTracker(agent_id=self.agent_id)
            self.navigator = Navigator(self.agent_id, self.action_set, Navigator.A_STAR_ALGORITHM)

        # for navigator update state tracker
        self.state_tracker.update(state)

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
            victim_location = state[most_priority_victim_id]["location"]
            assert isinstance(victim_location, tuple)
            self.navigator.reset_full()
            self.navigator.add_waypoint(victim_location)
            self.target_location = victim_location
            if not self.navigator.is_done and len(self.navigator.get_all_waypoints()) > 0:
                action = self.navigator.get_move_action(self.state_tracker)

        # move back (how to move with victim?)
        return action, {}