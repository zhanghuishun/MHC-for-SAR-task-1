from matrx.agents import AgentBrain
from matrx.messages import Message
from agent_actions import BeRescued

class Victim(AgentBrain):
    def __init__(self):
        super().__init__()
        self.is_rescued = False
        self.first_overlap = True
    
    def filter_observations(self, state):
        #print(dict(state))
        robot_loc = state[{"name" : "rescue robot"}]["location"]
        self_loc = self.agent_properties["location"]
        # TODO: the robot may just pass by the victim rather than save it
        if robot_loc == self_loc and self.first_overlap == True:
            self.is_rescued = True
        return state
    
    def decide_on_action(self, state):
        action = None
        if self.is_rescued == True:
            self.send_message(Message(content="robot_rescue_victim", from_id=self.agent_id,
                                          to_id=state[{"name" : "rescue robot"}]['obj_id']))
            action = BeRescued.__name__
            self.first_overlap = False
            self.is_rescued = False
        return action, {}
