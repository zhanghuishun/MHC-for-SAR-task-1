import csv
import json
import os
import pandas as pd
import numpy as np

from matrx.actions import Action, ActionResult
from matrx.agents import AgentBrain, SenseCapability, np
from matrx.objects import AgentBody
import matrx.defaults as defaults
from rescue_model import RescueModel
from victim_agent import Victim

class SearchTeam(AgentBrain):
    def __init__(self, config):
        super().__init__()

        self.config = config
        self.victim_planning = config['victims']['victim_planning']

        # load the victim data file
        victims_data_file = os.path.join(os.path.realpath(self.config['victims']['victims_file']))

        self.victim_data = pd.read_csv(victims_data_file, sep=';')

        self.current_keypoint = None
        self.timestamp_next_victim_spawn = None

        # there might be a queue if the test subject is not triaging the victims quickly enough
        self.generated_victims = 0
        self.victim_spawn_queue = []
        self.spawned_victims = 0

    def initialize(self):
        pass

    def filter_observations(self, state):
        return state

    def decide_on_action(self, state):
        action = None
        action_kwargs = {}

        # current time since start of experiment in seconds
        second = state['World']['tick_duration'] * state['World']['nr_ticks']

        # check at what keypoint in the victim planning we are
        current_keypoint = None
        for keypoint in self.victim_planning:
            if second > keypoint['second']:
                current_keypoint = keypoint
        
        # check if we need to add a victim (to the queue) this tick
        if current_keypoint != None and (self.spawned_victims + len(self.victim_spawn_queue)) < \
                self.config['victims']['max_victims']:

            # replan when we need to spawn the next victim if we have a new victim_spawn_speed
            if current_keypoint != self.current_keypoint or second > self.timestamp_next_victim_spawn:
                self.current_keypoint = current_keypoint

                # add a victim to the queue
                body_args = self.get_next_victim()
                brain_args = {}
                action_kwargs = {"brain_args": brain_args, "body_args": body_args}
                # action = AddvictimAgent.__name__
                self.victim_spawn_queue.append(action_kwargs)
                # print("victim planner adding a new victim to the spawn queue")

                # plan when we need to spawn the next victim
                seconds_per_victim = 10000 if 'seconds_per_victim' not in current_keypoint else current_keypoint[
                    'seconds_per_victim']
                self.timestamp_next_victim_spawn = second + seconds_per_victim
                # print(f"Planned new victim for t {self.timestamp_next_victim_spawn}")
        if len(self.victim_spawn_queue) > 0:
            victims = state[{'is_victim': True}]
            if victims is None:
                victims = []
            elif not isinstance(victims, list):
                victims = [victims]
            action_kwargs = self.victim_spawn_queue.pop(0)
            action = AddVictimAgent.__name__
            time = state['World']['nr_ticks'] * state['World']['tick_duration']

            self.spawned_victims += 1

            print(f"Spawning victim at tick {state['World']['nr_ticks']}. Victim "
                    f"{self.spawned_victims} of max {self.config['victims']['max_victims']}")
        return action, action_kwargs  
            
    def get_next_victim(self):
        """ Generate a new victim """

        # get the data of this victim
        victim_number = self.spawned_victims + len(self.victim_spawn_queue)
        self.generated_victims += 1
        victim_data = self.victim_data.iloc[victim_number]
        # set a default victim image
        img = "victims/victim_unknown.png" if 'image' not in victim_data or victim_data['image'] == '' else \
            victim_data['image']
        #data = {"very_high":"older preferred","high":"male preferred","middle":"high vital sign","low":"difficulty","very_low":"distance"}
        #model = RescueModel(data)
        #victim_rescue_score = RescueModel.init_rescue_score(victim_data['gender'], int(victim_data['age']), victim_data['distance'], victim_data['difficulty'], victim_data['vital_sign'])
        # create the agent body with default properties and some custom victim properties
        body_args = {"possible_actions": defaults.AGENTBODY_POSSIBLE_ACTIONS,
                     "callback_create_context_menu_for_self": None,
                     "visualize_size": defaults.AGENTBODY_VIS_SIZE,
                     "visualize_shape": defaults.AGENTBODY_VIS_SHAPE,
                     "visualize_colour": defaults.AGENTBODY_VIS_COLOUR,
                     "visualize_opacity": defaults.AGENTBODY_VIS_OPACITY,
                     "visualize_when_busy": defaults.AGENTBODY_VIS_COLOUR,
                     "visualize_depth": defaults.AGENTBODY_VIS_DEPTH,
                     "team": None,
                     "is_movable": True,
                     "is_human_agent": False,

                     # custom properties for victim agent
                     "location": [int(victim_data['location_column']), int(victim_data['location_row'])],
                     "name": "victim",
                     "victim_name": victim_data['name'],
                     "number": self.generated_victims,
                     "is_traversable": True,
                     "img_name": img,
                     "customizable_properties": [
                                                 "is_traversable", "rescued", "img_name", "victim_photo"
                                                 ],

                     # victim data
                     "is_victim": True,
                     "gender": victim_data['gender'],
                     "age": int(victim_data['age']),
                     "difficulty_to_reach": victim_data['difficulty_to_reach'],
                     "difficulty_to_rescue": victim_data['difficulty_to_rescue'],
                     "location": [int(victim_data['location_column']), int(victim_data['location_row'])],
                     "vital_sign": victim_data['vital_sign'],
                     "victim_photo": img,
                     #"victim_rescue_score": victim_rescue_score,
                     "rescued": False,
                    }
        return body_args
class AddVictimAgent(Action):
    """ An action that can add a victim agent to the gridworld """

    def __init__(self, duration_in_ticks=0):
        super().__init__(duration_in_ticks)

    def is_possible(self, grid_world, agent_id, **kwargs):

        # check that we have all variables
        if 'brain_args' not in kwargs:
            return AddObjectResult(AddObjectResult.NO_AGENTBRAIN, False)

        if 'body_args' not in kwargs:
            return AddObjectResult(AddObjectResult.NO_AGENTBODY, False)

        # success
        return AddObjectResult(AddObjectResult.ACTION_SUCCEEDED, True)

    def mutate(self, grid_world, agent_id, **kwargs):
        # create the agent brain
        agentbrain = Victim(**kwargs['brain_args'])

        # these properties can't be sent via the kwargs because the API can't JSON serialize these objects and would
        # throw an error
        obj_body_args = {
            "sense_capability": SenseCapability({"*": np.inf}),
            "class_callable": Victim,
            "callback_agent_get_action": agentbrain._get_action,
            "callback_agent_set_action_result": agentbrain._set_action_result,
            "callback_agent_observe": agentbrain._fetch_state,
            "callback_agent_log": agentbrain._get_log_data,
            "callback_agent_get_messages": agentbrain._get_messages,
            "callback_agent_set_messages": agentbrain._set_messages,
            "callback_agent_initialize": agentbrain.initialize,
            "callback_create_context_menu_for_other": agentbrain.create_context_menu_for_other
        }

        # merge the two sets of agent body properties
        body_args = dict(kwargs['body_args'])
        body_args.update(obj_body_args)

        # create the agent_body
        agent_body = AgentBody(**body_args)

        # register the new agent
        grid_world._register_agent(agentbrain, agent_body)

        # register any new teams
        grid_world._register_teams()

        return AddObjectResult(AddObjectResult.ACTION_SUCCEEDED, True)


class AddObjectResult(ActionResult):
    """ Result when assignment failed """
    # failed
    NO_AGENTBRAIN = "No object passed under the `agentbrain` key in kwargs"
    NO_AGENTBODY = "No object passed under the `agentbody` key in kwargs"
    # success
    ACTION_SUCCEEDED = "Agent was succesfully added to the gridworld."

    def __init__(self, result, succeeded):
        super().__init__(result, succeeded)