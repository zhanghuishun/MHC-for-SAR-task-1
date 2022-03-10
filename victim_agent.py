from matrx.agents import AgentBrain

class Victim(AgentBrain):
    def __init__(self):
        super().__init__()
    
    def filter_observations(self, state):
        return state
    
    def decide_on_action(self, state):
        return None, {}
