class Utils:
    def get_rescue_ticks(difficulty_to_rescue_str):
        if difficulty_to_rescue_str == "low":
            return 10
        elif difficulty_to_rescue_str == "middle":
            return 20
        else:
            return 30