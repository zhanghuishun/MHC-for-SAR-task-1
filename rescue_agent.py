import imp
from tkinter.tix import Tree
from matrx.agents.agent_utils.navigator import Navigator
from matrx.agents.agent_utils.state_tracker import StateTracker
from matrx.agents import AgentBrain
from rescue_model import RescueModel
from agent_actions import Rescue, UnloadVictim, Reach
from myUtils import Utils
import json
class RescueAgent(AgentBrain):

    def __init__(self, config):
        super().__init__()
        self.config = config
        self.ready_time_ticks = config["rescue_robot"]["ready_time_ticks"]
        self.all_victims_id = []
        self.victim_rescue_score = {}
        self.state_tracker = None
        self.target_location = None
        self.rescue_sign = False
        self.reach_sign = False
        self.entrance_loc = (config["entrance"]["column"], config["entrance"]["row"])
        self.victim_loaded = None
    def filter_observations(self, state):
        # process messages
        for message in self.received_messages.copy(): #message is a str
            if message.content == "robot_rescue_victim":
                self.victim_loaded = message.from_id
                self.rescue_sign = True
                self.received_messages.remove(message)
            if message.content == "robot_reach_victim":
                self.reach_sign = True
                self.received_messages.remove(message)
            
        
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
        action_kwargs = {}

        if self.state_tracker is None:
            # Initialize this agent's state tracker and navigator, has to be done here and not in the initialize
            # function, as that doesn'twork for agents created during the experiment.
            self.state_tracker = StateTracker(agent_id=self.agent_id)
            self.navigator = Navigator(self.agent_id, self.action_set, Navigator.A_STAR_ALGORITHM)
        # for navigator update state tracker
        self.state_tracker.update(state)

        if state['World']['nr_ticks'] >= self.ready_time_ticks and state[self.agent_id]["victim_loaded_id"] == None and len(self.all_victims_id) > 0:
            # select the most priority victim by calculating rescue score
            victims_info = state[{'name': "victim"}] if type(state[{'name': "victim"}]) is list else [state[{'name': "victim"}]]
            most_priority_victim_id = RescueModel.get_most_priority_victim_id(victims_info)
            # move to the most priority victim
            victim_location = state[most_priority_victim_id]["location"]
            assert isinstance(victim_location, tuple)
            self.navigator.reset_full()
            self.navigator.add_waypoint(victim_location)
            if not self.navigator.is_done and len(self.navigator.get_all_waypoints()) > 0:
                action = self.navigator.get_move_action(self.state_tracker)
        
        if self.reach_sign == True:
            action = Reach.__name__
            self.reach_sign = False
        
        if self.rescue_sign == True:
            action_kwargs['victim_loaded_id'] = self.victim_loaded
            action_kwargs['action_duration'] = Utils.get_rescue_ticks(state[self.victim_loaded]['difficulty_to_rescue'])
            action = Rescue.__name__
            self.rescue_sign = False
            return action, action_kwargs

        # Return back to the entrance
        if state[self.agent_id]["victim_loaded_id"] is not None:
            assert isinstance(self.entrance_loc, tuple)
            self.navigator.reset_full()
            self.navigator.add_waypoint(self.entrance_loc)
            if not self.navigator.is_done and len(self.navigator.get_all_waypoints()) > 0:
                action = self.navigator.get_move_action(self.state_tracker)

        
        # already back to the entrance and standby again
        if state[self.agent_id]["location"] == self.entrance_loc and state[self.agent_id]["victim_loaded_id"] is not None:
            action_kwargs['victim_loaded_id'] = self.victim_loaded
            action = UnloadVictim.__name__

        # move back (how to move with victim?)
        return action, action_kwargs