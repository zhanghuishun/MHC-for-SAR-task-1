class Singleton(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]

#Python3
class RescueModel(metaclass=Singleton):
    #{"very_high":"Older preferred","high":"Older preferred","middle":"Older preferred","low":"Older preferred","very_low":"Older preferred"}
    moralValues = None
    def __init__(self, moralValues):
        moralValues = moralValues
    def init_rescue_score(self):
    #     if moralValues not None:
        return 1