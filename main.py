from matrx import WorldBuilder
from matrx.actions.move_actions import *
from matrx.agents import HumanAgentBrain
from customized_gui import visualization_server
from rescue_agent import RescueAgent
from  search_team import SearchTeam
from rescue_team_leader import RescueTeamLeader

import json
import os
import requests

def create_builder(config_file='config.json'):
    world_size = [29, 29]
    #import config
    config_path = os.path.join(os.path.realpath("config"), config_file)
    config = json.load(open(config_path))
    print("Loaded config file:", config_path)
    # Create our builder, here we specify the world size and a nice background image
    builder = WorldBuilder(shape=world_size, run_matrx_api=True, run_matrx_visualizer=False,
                           visualization_bg_img="", tick_duration=0.1)

    # Add the walls surrounding the redzone and the doors
    builder.add_room(top_left_location=[0, 0], width=29, height=29, name="Borders",
                       doors_open=True, door_locations=[(1,0),(2,0)])
    
    # Add the walls to our maze
    builder.add_line(start=[3, 10], end=[27, 10], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[3, 19], end=[27, 19], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[10, 4], end=[10, 7], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[21, 22], end=[21, 25], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[10, 22], end=[10, 25], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[22, 23], end=[27, 23], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[11, 25], end=[16, 25], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[11, 22], end=[16, 22], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[21, 13], end=[21, 16], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[10, 13], end=[10, 16], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[22, 14], end=[27, 14], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[11, 16], end=[16, 16], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[11, 13], end=[16, 13], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[11, 7], end=[16, 7], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[11, 4], end=[16, 4], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[21, 4], end=[21, 7], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[22, 5], end=[27, 5], name="Redzone wall", is_traversable=False, is_movable=False)
    builder.add_line(start=[3, 1], end=[27, 1], name="Redzone wall", is_traversable=False, is_movable=False)

    # Add extra object
    builder.add_object(location=[1,0], is_traversable=True, name="entrance arrow1",
                      img_name="arrow.png", visualize_size=0.8)
    builder.add_object(location=[2,0], is_traversable=True, name="entrance arrow2",
                      img_name="arrow.png", visualize_size=0.8)
    # Add a human controllable agent with certain controls and a GIF
    # key_action_map = {
    #     'w': MoveNorth.__name__,
    #     'd': MoveEast.__name__,·
    #     's': MoveSouth.__name__,
    #     'a': MoveWest.__name__,
    # }
    # brain = HumanAgentBrain()
    # builder.add_human_agent(location=[1, 1], agent=brain, name="Human",
    #                         key_action_map=key_action_map,
    #                         img_name="/static/images/agent.gif")

    # Return the builder
        #################################################################
    # Actors
    ################################################################

    # create the search team agent that spawns patients over time, as described in the config
    builder.add_agent(location=[0, 0], is_traversable=True, is_movable=False,
                      agent_brain=SearchTeam(config = config),
                      name="search team", visualize_size=0)
    # add the test subject: the rescue team leader
    builder.add_human_agent(location=[0,0], is_traversable=True, is_movable=False,
                            agent=RescueTeamLeader(), name="rescue team leader", visualize_size=0)
    # add the rescue robot agent that save the victim according to the moral value elicitation
    builder.add_agent(location=[1, 1], is_traversable=False, is_movable=True, agent_brain=RescueAgent(config = config),
                      name="rescue robot", visualize_size=1, img_name = "robot.png")
    return builder


if __name__ == "__main__":
    # Call our method that creates our builder
    builder = create_builder()
    media_folder = os.path.join(os.getcwd(), 'images')

    # Start the MATRX API we need for our visualisation
    builder.startup(media_folder=media_folder)

    print("Starting custom visualizer")
    vis_thread = visualization_server.run_matrx_visualizer(verbose=False, media_folder=media_folder)
 
    # run the world
    world = builder.get_world()
    world.run(builder.api_info)

    # stop the custom visualizer
    print("Shutting down custom visualizer")
    r = requests.get("http://localhost:" + str(visualization_server.port) + "/shutdown_visualizer")
    vis_thread.join()

    # stop MATRX scripts such as the api and visualizer (if used)
    builder.stop()