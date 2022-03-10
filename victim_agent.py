from matrx.agents import AgentBrain

class Victim(AgentBrain):
    def __init__(self):
        super().__init__()
    
    def filter_observations(self, state):
        print(dict(state))
        return super().filter_observations(state)
    
    def decide_on_action(self, state):
        print("into decide")
        return super().decide_on_action(state)
