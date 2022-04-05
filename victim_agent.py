from matrx.agents import AgentBrain
from matrx.messages import Message
from matrx.agents.agent_utils.navigator import Navigator
from matrx.agents.agent_utils.state_tracker import StateTracker
from agent_actions import BeRescued,BeReached
from myUtils import Utils

class Victim(AgentBrain):
    def __init__(self):
        super().__init__()
        self.is_overlap = False
        self.rescue_check = False
        self.is_rescued = False
        self.first_overlap = True
        self.state_tracker = None
        self.move_tick = None
        self.assign_tick = False
    def filter_observations(self, state):
        #print(dict(state))
        robot_loc = state[{"name" : "rescue robot"}]["location"]
        self_loc = self.agent_properties["location"]
        # TODO: the robot may just pass by the victim rather than save it
        if robot_loc == self_loc and self.first_overlap == True:
            self.is_overlap = True
        if self.rescue_check == True:
            self.is_rescued = True
        return state
    
    def decide_on_action(self, state):
        action = None
        action_kwargs = {}
        if self.state_tracker is None:
            # Initialize this agent's state tracker and navigator, has to be done here and not in the initialize
            # function, as that doesn'twork for agents created during the experiment.
            self.state_tracker = StateTracker(agent_id=self.agent_id)
            self.navigator = Navigator(self.agent_id, self.action_set, Navigator.A_STAR_ALGORITHM)
        self.state_tracker.update(state)

        if self.is_overlap == True:
            action = BeReached.__name__
            self.send_message(Message(content="robot_reach_victim", from_id=self.agent_id,
                                          to_id=state[{"name" : "rescue robot"}]['obj_id']))
            self.first_overlap = False
            self.is_overlap = False
            self.rescue_check = True
        if self.is_rescued == True:
            #action_kwargs['action_duration'] = Utils.get_rescue_ticks(self.agent_properties["difficulty_to_rescue"])
            #action = BeRescued.__name__
            self.send_message(Message(content="robot_rescue_victim", from_id=self.agent_id,
                                          to_id=state[{"name" : "rescue robot"}]['obj_id']))
            self.is_rescued = False
            self.rescue_check = False
        # return back to the entrance with the robot
        if state[{"name" : "rescue robot"}]["victim_loaded_id"] == self.agent_id and self.assign_tick == False:   
            self.move_tick = state['World']['nr_ticks'] + 1
            self.assign_tick = True
        if self.move_tick is not None and self.move_tick <= state['World']['nr_ticks']:
            self.navigator.reset_full()
            self.navigator.add_waypoint((2,0))# the other entrance
            if not self.navigator.is_done and len(self.navigator.get_all_waypoints()) > 0:
                action = self.navigator.get_move_action(self.state_tracker)

        return action, action_kwargs
