class Singleton(object):
    def __init__(self, cls):
        self._cls = cls
        self._instance = {}

    def __call__(self):
        if self._cls not in self._instance:
            self._instance[self._cls] = self._cls()
        return self._instance[self._cls]


@Singleton
class RescueModel():
    #{"very_high":"Older preferred","high":"Older preferred","middle":"Older preferred","low":"Older preferred","very_low":"Older preferred"}
    moralValues = None
    def __init__(self, moralValues) -> None:
        moralValues = moralValues
    def init_rescue_score():
    #     if moralValues not None:
        return 1