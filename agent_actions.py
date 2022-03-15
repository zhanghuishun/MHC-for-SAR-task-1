from matrx.actions import Action, ActionResult


class BeRescued(Action):
    """ victim is rescued by the robot """

    def __init__(self):
        super().__init__()

    def is_possible(self, grid_world, agent_id, **kwargs):
        # success
        return RecueResult(RecueResult.ACTION_SUCCEEDED, True)

    def mutate(self, grid_world, agent_id, **kwargs):
        #grid_world.registered_agents[agent_id].change_property('visualize_opacity', 0)
        grid_world.registered_agents[agent_id].change_property('rescued', True)
        return RecueResult(RecueResult.ACTION_SUCCEEDED, True)

class RecueResult(ActionResult):
    ACTION_SUCCEEDED = "Victim is successfully rescued by the robot"
    def __init__(self, result, succeeded):
        super().__init__(result, succeeded)

class Rescue(Action):
    """ robot rescue the victim """

    def __init__(self):
        super().__init__()

    def is_possible(self, grid_world, agent_id, **kwargs):
        # success
        return RecueResult(RecueResult.ACTION_SUCCEEDED, True)

    def mutate(self, grid_world, agent_id, **kwargs):

        #grid_world.registered_agents[agent_id].change_property('img_name', "robot_loaded.png")
        grid_world.registered_agents[agent_id].change_property('victim_loaded_id', kwargs['victim_loaded_id'])
        return RecueResult(RecueResult.ACTION_SUCCEEDED, True)

class UnloadVictim(Action):
    """ robot unload the victim at the entrance """

    def __init__(self):
        super().__init__()

    def is_possible(self, grid_world, agent_id, **kwargs):
        # success
        return ActionResult(ActionResult.ACTION_SUCCEEDED, True)

    def mutate(self, grid_world, agent_id, **kwargs):
        victim_loaded_id = kwargs['victim_loaded_id']
        grid_world.remove_from_grid(victim_loaded_id)
        grid_world.registered_agents[agent_id].change_property('victim_loaded_id', None)
        return ActionResult(ActionResult.ACTION_SUCCEEDED, True)